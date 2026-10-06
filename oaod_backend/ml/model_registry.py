"""
OAOD Project — Model registry & shared detection logic
Lazily-loaded, cached YOLOv8(-OBB) models plus the per-image inference
routine shared by /predict and the Incidents (/incidents) scene-photo
endpoint. Extracted out of routers/predict.py so both routers reuse the
exact same model cache and detection logic instead of duplicating it.
"""

import os
import time
import math

import cv2
import numpy as np

from fastapi import HTTPException

# ── Model files ─────────────────────────────────────────────────────────────
# Reuses the models already trained/saved for the Flask app — no duplicate
# copies. Override with MODELS_DIR env var if the layout ever changes.
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.environ.get("MODELS_DIR", os.path.join(_PROJECT_ROOT, "website", "models"))

MODEL_FILES = {
    "standard": ("yolov8n.pt", "Standard YOLOv8"),
    "dota":     ("DOTA_Model.pt", "DOTA-OBB"),
    "hrsc":     ("HRSC_Model.pt", "HRSC-OBB"),
    "dota_fg":  ("DOTA_Model.pt", "DOTA-Fine-grained"),  # base model; FAIR1M model re-classifies crops
}
FAIR1M_FILE = "FAIR1M_Model.pt"

DOTA_VEHICLE_CLASSES = {9, 10}  # large-vehicle, small-vehicle indices in the DOTA model
FAIR1M_CLASSES = [
    "small-car", "van", "dump-truck", "cargo-truck",
    "other-vehicle", "bus", "excavator", "trailer",
    "truck-tractor", "tractor"
]
FINE_GRAINED_CONF = 0.01

DATASET_SOURCE_BY_MODE = {"standard": "standard", "dota": "dota", "hrsc": "hrsc", "dota_fg": "finetune"}

_MODELS = {}


def get_yolo_model(key: str):
    """Load a YOLO model once and cache it (lazy — avoids startup timeout)."""
    if key not in _MODELS:
        from ultralytics import YOLO
        filename = FAIR1M_FILE if key == "fair1m" else MODEL_FILES[key][0]
        path = os.path.join(MODELS_DIR, filename)
        if not os.path.exists(path):
            raise HTTPException(status_code=500, detail=f"Model not found: {path}")
        _MODELS[key] = YOLO(path)
    return _MODELS[key]


def _count_objects(result) -> int:
    if result.boxes is not None and len(result.boxes) > 0:
        return len(result.boxes)
    if getattr(result, "obb", None) is not None:
        return len(result.obb)
    return 0


def _extract_obb_detections(result) -> list[dict]:
    """Turn ultralytics OBB results into the flat dict shape crud.save_detections_bulk expects."""
    dets = []
    if result.obb is None or len(result.obb) == 0:
        return dets
    cls_ids = result.obb.cls.cpu().numpy().astype(int)
    confs = result.obb.conf.cpu().numpy()
    xywhr = result.obb.xywhr.cpu().numpy()
    names = result.names
    for i in range(len(cls_ids)):
        cx, cy, w, h, angle_rad = [float(x) for x in xywhr[i]]
        dets.append({
            "class_name": names.get(int(cls_ids[i]), f"class_{cls_ids[i]}"),
            "confidence": float(confs[i]),
            "cx": cx, "cy": cy, "w": w, "h": h,
            "angle_deg": math.degrees(angle_rad),
        })
    return dets


def _extract_box_detections(result) -> list[dict]:
    """Regular (non-oriented) boxes — used by the 'standard' mode. angle_deg is 0."""
    dets = []
    if result.boxes is None or len(result.boxes) == 0:
        return dets
    cls_ids = result.boxes.cls.cpu().numpy().astype(int)
    confs = result.boxes.conf.cpu().numpy()
    xywh = result.boxes.xywh.cpu().numpy()
    names = result.names
    for i in range(len(cls_ids)):
        cx, cy, w, h = [float(x) for x in xywh[i]]
        dets.append({
            "class_name": names.get(int(cls_ids[i]), f"class_{cls_ids[i]}"),
            "confidence": float(confs[i]),
            "cx": cx, "cy": cy, "w": w, "h": h,
            "angle_deg": 0.0,
        })
    return dets


def _run_fine_grained(img_array: np.ndarray, result):
    """DOTA detection + FAIR1M crop-reclassification, same approach as the Flask app."""
    img_draw = result.plot()
    if result.obb is None or len(result.obb) == 0:
        return img_draw

    H_img, W_img = img_draw.shape[:2]
    fair1m = get_yolo_model("fair1m")

    for box in result.obb:
        cls_id = int(box.cls[0].item())
        if cls_id not in DOTA_VEHICLE_CLASSES:
            continue

        xyxyxyxy = box.xyxyxyxy[0].cpu().numpy()
        x_coords, y_coords = xyxyxyxy[:, 0], xyxyxyxy[:, 1]
        x1, y1 = max(0, int(x_coords.min())), max(0, int(y_coords.min()))
        x2, y2 = min(W_img, int(x_coords.max())), min(H_img, int(y_coords.max()))
        if (x2 - x1) < 8 or (y2 - y1) < 8:
            continue

        crop = img_array[y1:y2, x1:x2]
        fg_results = fair1m(crop, verbose=False, conf=0.01)
        fg_result = fg_results[0]
        if fg_result.obb is None or len(fg_result.obb) == 0:
            continue

        best_conf = float(fg_result.obb.conf[0].item())
        best_cls = int(fg_result.obb.cls[0].item())
        if best_conf < FINE_GRAINED_CONF:
            continue

        fine_label = FAIR1M_CLASSES[best_cls] if best_cls < len(FAIR1M_CLASSES) else f"class_{best_cls}"
        cv2.putText(img_draw, f"{fine_label} {best_conf:.2f}", (x1, max(0, y1 - 6)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 128), 1, cv2.LINE_AA)
        cv2.rectangle(img_draw, (x1, y1), (x2, y2), (0, 255, 128), 2)

    return img_draw


def run_detection(model, img_array: np.ndarray, conf: float, mode: str):
    """
    Run one image through the given model (as returned by get_yolo_model) and
    produce the same (detections, annotated-image, stats) shape /predict has
    always returned — shared by /predict and the Incidents scene-photo
    endpoint so both stay in lockstep.

    Returns:
        dets: list[dict] — flat detection dicts (class_name, confidence, cx, cy, w, h, angle_deg)
        plotted: np.ndarray — annotated image (BGR, ready for cv2.imwrite)
        stats: dict — objects_found, inference_ms, dataset_source
    """
    start = time.time()
    results = model(img_array, conf=conf, verbose=False)
    inference_ms = round((time.time() - start) * 1000, 2)
    result = results[0]

    objects_found = _count_objects(result)
    dataset_source = DATASET_SOURCE_BY_MODE[mode]

    if mode == "dota_fg":
        plotted = _run_fine_grained(img_array, result)
    else:
        plotted = result.plot()

    # Extract from whichever output the model actually produced — some model
    # files (e.g. the "standard" one) are OBB-trained despite the mode name,
    # so trust the result shape over the nominal mode.
    dets = _extract_obb_detections(result) if result.obb is not None else _extract_box_detections(result)

    stats = {
        "objects_found": objects_found,
        "inference_ms": inference_ms,
        "dataset_source": dataset_source,
    }
    return dets, plotted, stats

"""
OAOD Project — Predict Router
The most important endpoint in the whole project.

POST /predict
  1. Receives one or more uploaded aerial images (+ a detection mode + confidence)
  2. Runs the matching YOLOv8(-OBB) model on each
  3. Draws boxes on the image (ultralytics' own plot(), same as the original
     Flask app — for the fine-grained mode, crops each DOTA vehicle box and
     re-classifies it with the FAIR1M model, same logic as app.py)
  4. Saves each image + its detections to the database
  5. Returns per-image stats/results plus batch averages
"""

import os
import time
import uuid
import math
from typing import List, Literal, Optional

import cv2
import numpy as np
from PIL import Image as PILImage

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database.session import get_db
from database.crud import create_image, update_image_result, save_detections_bulk, get_detections_by_image
from schemas import PredictBatchResponse, PredictItemResult, DetectionOut
from auth_utils import get_current_user_id_optional

router = APIRouter(prefix="/predict", tags=["Detection"])

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

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

DOTA_VEHICLE_CLASSES = {9, 10}  # large-vehicle, small-vehicle indices in the DOTA model
FAIR1M_CLASSES = [
    "small-car", "van", "dump-truck", "cargo-truck",
    "other-vehicle", "bus", "excavator", "trailer",
    "truck-tractor", "tractor"
]
FINE_GRAINED_CONF = 0.01

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


@router.post("", response_model=PredictBatchResponse)
async def predict(
    files: List[UploadFile] = File(...),
    mode: Literal["standard", "dota", "hrsc", "dota_fg"] = Form(default="standard"),
    conf: float = Form(default=0.25),
    source_type: str = Form(default="other"),
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(get_current_user_id_optional),
):
    """
    Upload one or more aerial images and run detection on each.
    Works without logging in (guest); results are attributed to the user
    when a valid token is present, matching the original public detection tool.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    _, model_name = MODEL_FILES[mode]
    model = get_yolo_model("dota" if mode == "dota_fg" else mode)

    results_out: list[PredictItemResult] = []
    total_time = 0.0
    total_objects = 0

    for upload in files:
        allowed = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}
        ext = os.path.splitext(upload.filename or "")[1].lower()
        if ext not in allowed:
            raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'.")

        unique_id = uuid.uuid4().hex[:8]
        stem = os.path.splitext(os.path.basename(upload.filename))[0]
        input_name = f"{stem}_{unique_id}{ext}"
        output_name = f"{stem}_{unique_id}_out.jpg"
        input_path = os.path.join(UPLOAD_DIR, input_name)
        output_path = os.path.join(UPLOAD_DIR, output_name)

        contents = await upload.read()
        with open(input_path, "wb") as f:
            f.write(contents)

        pil_img = PILImage.open(input_path).convert("RGB")
        img_array = np.array(pil_img)
        h, w = img_array.shape[:2]

        db_image = create_image(
            db, user_id=user_id, filename=upload.filename, file_path=input_path,
            source_type=source_type, width=w, height=h,
        )

        start = time.time()
        results = model(img_array, conf=conf, verbose=False)
        inference_ms = round((time.time() - start) * 1000, 2)
        result = results[0]

        objects_found = _count_objects(result)

        dataset_source = {"standard": "standard", "dota": "dota", "hrsc": "hrsc", "dota_fg": "finetune"}[mode]

        if mode == "dota_fg":
            plotted = _run_fine_grained(img_array, result)
        else:
            plotted = result.plot()

        # Extract from whichever output the model actually produced — some model
        # files (e.g. the "standard" one) are OBB-trained despite the mode name,
        # so trust the result shape over the nominal mode.
        dets = _extract_obb_detections(result) if result.obb is not None else _extract_box_detections(result)

        cv2.imwrite(output_path, plotted)

        pixels = w * h
        density = round(objects_found / (pixels / 1_000_000), 2) if pixels else 0.0
        fps = round(1000 / inference_ms, 2) if inference_ms > 0 else 0.0

        if dets:
            save_detections_bulk(db, db_image.id, dets, dataset_source=dataset_source)
        update_image_result(
            db, db_image.id, annotated_path=output_path,
            model_used=model_name, inference_ms=inference_ms, fps=fps, density=density,
        )

        saved_dets = get_detections_by_image(db, db_image.id)
        results_out.append(PredictItemResult(
            image_id=db_image.id,
            filename=upload.filename,
            model_used=model_name,
            objects_found=objects_found,
            inference_ms=inference_ms,
            fps=fps,
            width=w, height=h,
            density=density,
            input_image_url=f"/predict/result/{input_name}",
            annotated_image_url=f"/predict/result/{output_name}",
            detections=[DetectionOut.model_validate(d) for d in saved_dets],
        ))
        total_time += inference_ms
        total_objects += objects_found

    n = len(results_out)
    avg_time = round(total_time / n, 2) if n else 0.0
    avg_objects = round(total_objects / n, 2) if n else 0.0
    avg_fps = round(1000 / avg_time, 2) if avg_time > 0 else 0.0

    return PredictBatchResponse(
        total_images=n, avg_time_ms=avg_time, avg_objects=avg_objects, avg_fps=avg_fps,
        results=results_out,
    )


@router.get("/result/{filename}")
def get_annotated_image(filename: str):
    """Fetch an annotated (or original) image by filename from the uploads folder."""
    path = os.path.join(UPLOAD_DIR, os.path.basename(filename))
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Image not found or expired.")
    return FileResponse(path, media_type="image/jpeg")

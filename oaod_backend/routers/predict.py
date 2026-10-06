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
import uuid
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
from ml.model_registry import MODEL_FILES, get_yolo_model, run_detection

router = APIRouter(prefix="/predict", tags=["Detection"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


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

        dets, plotted, stats = run_detection(model, img_array, conf, mode)
        objects_found = stats["objects_found"]
        inference_ms = stats["inference_ms"]
        dataset_source = stats["dataset_source"]

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

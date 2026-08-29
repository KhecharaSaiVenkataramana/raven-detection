"""
OAOD Project — History Router
Lets a logged-in user view their past detection results.

GET /history          — all images the user has processed
GET /history/stats     — aggregate stats for the profile page
GET /history/{id}     — one specific image with all its detections
"""

import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.session import get_db
from database.crud import get_images_by_user, get_image_by_id, get_detections_by_image, get_user_stats
from schemas import HistoryResponse, ImageOut, DetectionOut, StatsResponse
from auth_utils import get_current_user_id

router = APIRouter(prefix="/history", tags=["History"])


@router.get("", response_model=HistoryResponse)
def get_history(
    limit: int = 20,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Get all images the current user has uploaded and processed.
    Returns a list sorted newest first, with detections included.
    """
    images = get_images_by_user(db, user_id, limit=limit)

    result = []
    for img in images:
        dets = get_detections_by_image(db, img.id)
        img_out = ImageOut.model_validate(img)
        if img.annotated_path:
            img_out.annotated_image_url = f"/predict/result/{os.path.basename(img.annotated_path)}"
        img_out.detections = [DetectionOut.model_validate(d) for d in dets]
        result.append(img_out)

    return HistoryResponse(total=len(result), images=result)


@router.get("/stats", response_model=StatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """Aggregate detection stats for the profile page."""
    return StatsResponse(**get_user_stats(db, user_id))


@router.get("/{image_id}", response_model=ImageOut)
def get_single_result(
    image_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Get one specific image result by its ID.
    Only returns the image if it belongs to the current user.
    """
    image = get_image_by_id(db, image_id)

    if not image:
        raise HTTPException(status_code=404, detail="Image not found.")

    if image.user_id != user_id:
        raise HTTPException(status_code=403, detail="You don't have access to this image.")

    dets = get_detections_by_image(db, image.id)
    img_out = ImageOut.model_validate(image)
    if image.annotated_path:
        img_out.annotated_image_url = f"/predict/result/{os.path.basename(image.annotated_path)}"
    img_out.detections = [DetectionOut.model_validate(d) for d in dets]
    return img_out

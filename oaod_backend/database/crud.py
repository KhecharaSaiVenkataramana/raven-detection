"""
OAOD Project — CRUD helpers
Clean functions for creating and querying users, images, detections.
"""

from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session
from .models import User, Image, Detection


# ── Users ─────────────────────────────────────────────────────────────────────

def create_user(db: Session, email: str, hashed_password: str, full_name: str = None) -> User:
    user = User(email=email, hashed_password=hashed_password, full_name=full_name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def update_last_login(db: Session, user_id: int):
    db.query(User).filter(User.id == user_id).update({"last_login": datetime.utcnow()})
    db.commit()


# ── Images ────────────────────────────────────────────────────────────────────

def create_image(
    db: Session,
    user_id: int,
    filename: str,
    file_path: str,
    source_type: str = "other",
    width: int = None,
    height: int = None,
) -> Image:
    image = Image(
        user_id=user_id,
        filename=filename,
        file_path=file_path,
        source_type=source_type,
        width=width,
        height=height,
        status="pending",
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


def update_image_status(db: Session, image_id: int, status: str) -> Image:
    image = db.query(Image).filter(Image.id == image_id).first()
    if image:
        image.status = status
        db.commit()
        db.refresh(image)
    return image


def update_image_result(
    db: Session,
    image_id: int,
    annotated_path: str,
    model_used: str,
    inference_ms: float,
    fps: float,
    density: float,
) -> Image:
    """Save the per-run stats produced by a detection pass onto its image row."""
    image = db.query(Image).filter(Image.id == image_id).first()
    if image:
        image.annotated_path = annotated_path
        image.model_used = model_used
        image.inference_ms = inference_ms
        image.fps = fps
        image.density = density
        image.status = "done"
        db.commit()
        db.refresh(image)
    return image


def get_user_stats(db: Session, user_id: int) -> dict:
    """Aggregate stats for the profile page: total runs, total objects, avg inference time."""
    total_objects = (
        db.query(func.count(Detection.id))
        .join(Image, Detection.image_id == Image.id)
        .filter(Image.user_id == user_id)
        .scalar()
    ) or 0
    row = (
        db.query(func.count(Image.id), func.avg(Image.inference_ms))
        .filter(Image.user_id == user_id, Image.status == "done")
        .first()
    )
    total_images, avg_ms = row if row else (0, None)
    return {
        "total": total_images or 0,
        "total_objects": total_objects,
        "avg_ms": round(avg_ms, 2) if avg_ms is not None else 0,
    }


def get_images_by_user(db: Session, user_id: int, limit: int = 50) -> list[Image]:
    return (
        db.query(Image)
        .filter(Image.user_id == user_id)
        .order_by(Image.uploaded_at.desc())
        .limit(limit)
        .all()
    )


def get_image_by_id(db: Session, image_id: int) -> Image | None:
    return db.query(Image).filter(Image.id == image_id).first()


# ── Detections ────────────────────────────────────────────────────────────────

def create_detection(
    db: Session,
    image_id: int,
    class_name: str,
    confidence: float,
    cx: float, cy: float,
    w: float, h: float,
    angle_deg: float,
    dataset_source: str = "dota",
) -> Detection:
    det = Detection(
        image_id=image_id,
        class_name=class_name,
        confidence=confidence,
        cx=cx, cy=cy,
        w=w, h=h,
        angle_deg=angle_deg,
        dataset_source=dataset_source,
    )
    db.add(det)
    db.commit()
    db.refresh(det)
    return det


def save_detections_bulk(db: Session, image_id: int, detections: list[dict], dataset_source: str = "dota"):
    """
    Save a list of detection dicts in one commit.
    Each dict must have: class_name, confidence, cx, cy, w, h, angle_deg
    """
    objects = [
        Detection(
            image_id=image_id,
            class_name=d["class_name"],
            confidence=d["confidence"],
            cx=d["cx"], cy=d["cy"],
            w=d["w"], h=d["h"],
            angle_deg=d["angle_deg"],
            dataset_source=dataset_source,
        )
        for d in detections
    ]
    db.bulk_save_objects(objects)
    db.commit()


def get_detections_by_image(db: Session, image_id: int) -> list[Detection]:
    return (
        db.query(Detection)
        .filter(Detection.image_id == image_id)
        .order_by(Detection.confidence.desc())
        .all()
    )


def get_detections_by_user(db: Session, user_id: int, limit: int = 200) -> list[Detection]:
    """Get all detections across all images belonging to a user."""
    return (
        db.query(Detection)
        .join(Image, Detection.image_id == Image.id)
        .filter(Image.user_id == user_id)
        .order_by(Detection.image_id.desc())
        .limit(limit)
        .all()
    )

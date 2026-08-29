"""
OAOD Project — Pydantic Schemas
Defines the exact shape of data going IN and OUT of every endpoint.
Think of these as contracts — the API promises to always return this shape.
"""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


# ── Auth schemas ──────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    """What the user sends when signing up."""
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    """What the user sends when logging in."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """What we send back after successful login."""
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str


class UserOut(BaseModel):
    """Safe user info we can return (no password!)."""
    id: int
    email: str
    full_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Detection schemas ─────────────────────────────────────────────────────────

class DetectionOut(BaseModel):
    """One detected object — returned after inference."""
    id: int
    class_name: str
    confidence: float
    cx: float
    cy: float
    w: float
    h: float
    angle_deg: float
    dataset_source: str

    class Config:
        from_attributes = True


# ── Image schemas ─────────────────────────────────────────────────────────────

class ImageOut(BaseModel):
    """Image record returned to the client."""
    id: int
    filename: str
    source_type: str
    width: Optional[int]
    height: Optional[int]
    uploaded_at: datetime
    status: str
    model_used: Optional[str] = None
    inference_ms: Optional[float] = None
    fps: Optional[float] = None
    density: Optional[float] = None
    annotated_image_url: Optional[str] = None
    detections: list[DetectionOut] = []

    class Config:
        from_attributes = True


class PredictItemResult(BaseModel):
    """Result for one image in a batch detection run."""
    image_id: int
    filename: str
    model_used: str
    objects_found: int
    inference_ms: float
    fps: float
    width: int
    height: int
    density: float
    input_image_url: str
    annotated_image_url: str
    detections: list[DetectionOut]


class PredictBatchResponse(BaseModel):
    """Full response after running detection on a batch of uploaded images."""
    total_images: int
    avg_time_ms: float
    avg_objects: float
    avg_fps: float
    results: list[PredictItemResult]


class HistoryResponse(BaseModel):
    """List of past images for a user."""
    total: int
    images: list[ImageOut]


class StatsResponse(BaseModel):
    """Aggregate stats for the profile page."""
    total: int
    total_objects: int
    avg_ms: float

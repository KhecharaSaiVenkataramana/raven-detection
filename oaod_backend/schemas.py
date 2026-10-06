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


# ── Accident Scene Analysis (Incidents) ───────────────────────────────────────
# Phase 1 is documentation only: vehicle positions + headings detected in a
# single photo, reusing the existing DOTA-OBB model. No speed, trajectory, or
# fault claims are made anywhere — this disclaimer is the single source of
# truth for that framing and must appear on every incident-related PDF page
# and frontend view. NOTE TO REVIEWER: exact wording needs explicit human
# sign-off before shipping — adapt freely, keep the substance.
INCIDENT_DISCLAIMER = (
    "This report documents vehicle positions and headings detected in the uploaded "
    "photo. It is an assistive aid, not a validated forensic determination — it makes "
    "no claims about vehicle speed, fault, or the sequence of events."
)


class IncidentCreate(BaseModel):
    """What the user sends when opening a new incident."""
    title: str
    reference_code: Optional[str] = None
    notes: Optional[str] = None


class EvidenceOut(BaseModel):
    """One piece of evidence (photo/video) attached to an incident."""
    id: int
    incident_id: int
    evidence_type: str
    image_id: Optional[int] = None
    video_id: Optional[int] = None
    label: Optional[str] = None
    uploaded_at: datetime
    annotated_image_url: Optional[str] = None

    class Config:
        from_attributes = True


class IncidentOut(BaseModel):
    """Incident record returned to the client."""
    id: int
    title: str
    reference_code: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    notes: Optional[str]
    evidence: list[EvidenceOut] = []
    disclaimer: str = INCIDENT_DISCLAIMER

    class Config:
        from_attributes = True


class IncidentListResponse(BaseModel):
    """List of incidents belonging to the current user."""
    total: int
    incidents: list[IncidentOut]

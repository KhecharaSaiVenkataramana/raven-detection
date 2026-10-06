"""
OAOD Project — SQLAlchemy ORM Models
Tables: users, images, detections
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime,
    ForeignKey, Enum, Text
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id               = Column(Integer, primary_key=True, index=True)
    email            = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password  = Column(String(255), nullable=False)
    full_name        = Column(String(255), nullable=True)
    created_at       = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login       = Column(DateTime, nullable=True)

    # Relationships
    images = relationship("Image", back_populates="user", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="user")

    def __repr__(self):
        return f"<User id={self.id} email={self.email}>"


class Image(Base):
    __tablename__ = "images"

    id             = Column(Integer, primary_key=True, index=True)
    # Nullable — detection works for guests too, matching the public /detection flow.
    user_id        = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    filename       = Column(String(255), nullable=False)          # original uploaded filename
    file_path      = Column(String(512), nullable=False)          # path on disk / storage key
    annotated_path = Column(String(512), nullable=True)           # path to the annotated result image
    source_type    = Column(
        Enum("drone", "satellite", "uav", "other", name="source_type_enum"),
        default="other",
        nullable=False
    )
    width          = Column(Integer, nullable=True)               # image width in pixels
    height         = Column(Integer, nullable=True)               # image height in pixels
    uploaded_at    = Column(DateTime, default=datetime.utcnow, nullable=False)
    status         = Column(
        Enum("pending", "processing", "done", "failed", name="status_enum"),
        default="pending",
        nullable=False
    )

    # Per-run stats — flattened onto the image row (one detection run = one image),
    # shown on the history/profile pages.
    model_used     = Column(String(50), nullable=True)
    inference_ms   = Column(Float, nullable=True)
    fps            = Column(Float, nullable=True)
    density        = Column(Float, nullable=True)                 # objects per megapixel

    # Relationships
    user            = relationship("User", back_populates="images")
    detections      = relationship("Detection", back_populates="image", cascade="all, delete-orphan")
    evidence        = relationship("Evidence", back_populates="image")
    damage_findings = relationship("DamageFinding", back_populates="image", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Image id={self.id} filename={self.filename} status={self.status}>"


class Detection(Base):
    __tablename__ = "detections"

    id             = Column(Integer, primary_key=True, index=True)
    image_id       = Column(Integer, ForeignKey("images.id", ondelete="CASCADE"), nullable=False, index=True)

    # Detection info
    class_name     = Column(String(100), nullable=False)       # e.g. "ship", "plane"
    confidence     = Column(Float, nullable=False)             # 0.0 – 1.0

    # Oriented bounding box parameters (pixel coordinates)
    cx             = Column(Float, nullable=False)             # center x
    cy             = Column(Float, nullable=False)             # center y
    w              = Column(Float, nullable=False)             # box width
    h              = Column(Float, nullable=False)             # box height
    angle_deg      = Column(Float, nullable=False)             # rotation angle in degrees

    # Which model/dataset produced this detection
    dataset_source = Column(
        Enum("standard", "hrsc", "dota", "finetune", name="dataset_source_enum"),
        default="dota",
        nullable=False
    )

    # Relationships
    image = relationship("Image", back_populates="detections")

    def __repr__(self):
        return (
            f"<Detection id={self.id} class={self.class_name} "
            f"conf={self.confidence:.2f} image_id={self.image_id}>"
        )


# ── Accident Scene Analysis — Phase 0 groundwork ─────────────────────────────
# Additive tables for the Incidents feature (documentation now; damage/speed
# estimation are future phases — DamageFinding and SpeedEstimate are created
# here but nothing populates them yet).

class Incident(Base):
    __tablename__ = "incidents"

    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title          = Column(String(255), nullable=False)
    reference_code = Column(String(100), unique=True, nullable=True, index=True)
    status         = Column(
        Enum("open", "documented", "analyzed", "closed", name="incident_status_enum"),
        default="open",
        nullable=False,
    )
    created_at     = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at     = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    notes          = Column(Text, nullable=True)

    # Relationships
    user            = relationship("User", back_populates="incidents")
    evidence        = relationship("Evidence", back_populates="incident", cascade="all, delete-orphan")
    speed_estimates = relationship("SpeedEstimate", back_populates="incident", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Incident id={self.id} title={self.title} status={self.status}>"


class Video(Base):
    __tablename__ = "videos"

    id              = Column(Integer, primary_key=True, index=True)
    filename        = Column(String(255), nullable=False)
    file_path       = Column(String(512), nullable=False)
    fps_source      = Column(Float, nullable=True)
    duration_s      = Column(Float, nullable=True)
    width           = Column(Integer, nullable=True)
    height          = Column(Integer, nullable=True)
    status          = Column(
        Enum("pending", "processing", "done", "failed", name="video_status_enum"),
        default="pending",
        nullable=False,
    )
    uploaded_at     = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Reserved for future Phase 3 camera calibration — unused until then.
    ref_pixel_length   = Column(Float, nullable=True)
    ref_real_length_m  = Column(Float, nullable=True)
    focal_length_mm    = Column(Float, nullable=True)
    sensor_width_mm    = Column(Float, nullable=True)
    altitude_m         = Column(Float, nullable=True)
    pixels_per_meter   = Column(Float, nullable=True)

    # Relationships
    evidence = relationship("Evidence", back_populates="video")

    def __repr__(self):
        return f"<Video id={self.id} filename={self.filename} status={self.status}>"


class Evidence(Base):
    __tablename__ = "evidence"

    id            = Column(Integer, primary_key=True, index=True)
    incident_id   = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    evidence_type = Column(
        Enum("scene_photo", "damage_photo", "video_clip", name="evidence_type_enum"),
        nullable=False,
    )
    image_id      = Column(Integer, ForeignKey("images.id", ondelete="SET NULL"), nullable=True, index=True)
    video_id      = Column(Integer, ForeignKey("videos.id", ondelete="SET NULL"), nullable=True, index=True)
    label         = Column(String(255), nullable=True)
    uploaded_at   = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    incident = relationship("Incident", back_populates="evidence")
    image    = relationship("Image", back_populates="evidence")
    video    = relationship("Video", back_populates="evidence")

    def __repr__(self):
        return f"<Evidence id={self.id} type={self.evidence_type} incident_id={self.incident_id}>"


class DamageFinding(Base):
    """Reserved for future Phase 2 (damage-based speed estimation) — unused for now."""
    __tablename__ = "damage_findings"

    id             = Column(Integer, primary_key=True, index=True)
    image_id       = Column(Integer, ForeignKey("images.id", ondelete="CASCADE"), nullable=False, index=True)
    class_name     = Column(String(100), nullable=False)
    confidence     = Column(Float, nullable=False)
    cx             = Column(Float, nullable=False)
    cy             = Column(Float, nullable=False)
    w              = Column(Float, nullable=False)
    h              = Column(Float, nullable=False)
    severity_score = Column(Float, nullable=True)

    # Relationships
    image = relationship("Image", back_populates="damage_findings")

    def __repr__(self):
        return f"<DamageFinding id={self.id} class={self.class_name} image_id={self.image_id}>"


class SpeedEstimate(Base):
    """Reserved for future Phase 2/3 (damage- and tracking-based speed estimation) — unused for now."""
    __tablename__ = "speed_estimates"

    id                 = Column(Integer, primary_key=True, index=True)
    incident_id        = Column(Integer, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    method             = Column(
        Enum("damage_based", "tracking_based", name="speed_estimate_method_enum"),
        nullable=False,
    )
    vehicle_ref        = Column(String(100), nullable=True)
    value_low          = Column(Float, nullable=True)
    value_high         = Column(Float, nullable=True)
    unit               = Column(String(20), default="km/h", nullable=False)
    coefficient_source = Column(String(255), nullable=True)
    computed_at        = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    incident = relationship("Incident", back_populates="speed_estimates")

    def __repr__(self):
        return f"<SpeedEstimate id={self.id} incident_id={self.incident_id} method={self.method}>"

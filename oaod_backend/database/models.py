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
    user       = relationship("User", back_populates="images")
    detections = relationship("Detection", back_populates="image", cascade="all, delete-orphan")

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

"""
OAOD Project — Database connection
Defaults to a local SQLite file so the backend runs with zero config.
Set DATABASE_URL to point at MySQL/Postgres in production.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./oaod.db")

# ── Engine ────────────────────────────────────────────────────────────────────
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,       # checks connection is alive before using it
        pool_recycle=280,         # recycle connections every 4.5 mins (some managed DBs drop idle ones after 5)
        connect_args={
            "connect_timeout": 10
        }
    )

# ── Session factory ───────────────────────────────────────────────────────────
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_tables():
    """Create all tables in the cloud database."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency — yields a DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
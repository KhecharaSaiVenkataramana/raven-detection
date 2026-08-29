"""
OAOD Project — FastAPI Main Entry Point
This is the file you run to start the server.

Run with:
    uvicorn main:app --reload --port 8000

Then open in browser:
    http://localhost:8000/docs   ← Interactive API documentation
"""

import sys
import os

# Make sure Python can find the database/ folder
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.session import create_tables
from routers import auth, predict, history, reports, contact

# ── Create the FastAPI app ────────────────────────────────────────────────────
app = FastAPI(
    title="OAOD — Orientation-Aware Object Detection API",
    description="""
Upload aerial images (drone or satellite) and detect oriented objects using YOLOv8-OBB.

## Features
- **Upload** a drone or satellite image (works as a guest, or logged in to keep history)
- **Detect** objects with oriented bounding boxes (OBB) across 4 modes
- **View history** of all your past detections when logged in
- **Export** results as CSV, PDF, or a ZIP of annotated images
""",
    version="1.0.0"
)

# ── CORS — allows the Next.js frontend (running on a different port) to call this API ─
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register all routers ──────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(predict.router)
app.include_router(history.router)
app.include_router(reports.router)
app.include_router(contact.router)

# ── Create DB tables on startup (safe to call multiple times) ─────────────────
@app.on_event("startup")
def on_startup():
    create_tables()
    print("=" * 50)
    print("OAOD API is running!")
    print("Docs: http://localhost:8000/docs")
    print("=" * 50)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "status": "running",
        "message": "OAOD API is live. Visit /docs for full documentation."
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}

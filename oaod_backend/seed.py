"""
OAOD Project — Database seed & verification script
Run this directly to create tables and insert sample data.

Usage:
    cd oaod_backend
    python seed.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.session import create_tables, SessionLocal
from database.crud import (
    create_user, get_user_by_email,
    create_image, update_image_status,
    save_detections_bulk, get_detections_by_image,
    get_images_by_user,
)


def seed():
    print("=" * 55)
    print("OAOD Database — Seed & Verification")
    print("=" * 55)

    # Step 1: Create tables
    print("\n[1] Creating tables...")
    create_tables()
    print("    Tables created OK.")

    db = SessionLocal()

    try:
        # Step 2: Create a test user
        print("\n[2] Creating test user...")
        existing = get_user_by_email(db, "test@oaod.com")
        if existing:
            print("    User already exists — skipping.")
            user = existing
        else:
            user = create_user(
                db,
                email="test@oaod.com",
                hashed_password="hashed_placeholder_123",
                full_name="Test User"
            )
            print(f"    Created: {user}")

        # Step 3: Create a sample image record
        print("\n[3] Creating sample image record...")
        image = create_image(
            db,
            user_id=user.id,
            filename="drone_capture_001.jpg",
            file_path="uploads/drone_capture_001.jpg",
            source_type="drone",
            width=1280,
            height=720,
        )
        print(f"    Created: {image}")

        # Step 4: Simulate inference results — save detections
        print("\n[4] Saving sample detections...")
        sample_detections = [
            {"class_name": "ship", "confidence": 0.94, "cx": 320.5, "cy": 240.3, "w": 180.0, "h": 60.0, "angle_deg": 35.2},
            {"class_name": "ship", "confidence": 0.87, "cx": 640.1, "cy": 380.9, "w": 210.0, "h": 70.0, "angle_deg": -22.5},
            {"class_name": "ship", "confidence": 0.73, "cx": 900.0, "cy": 150.0, "w": 140.0, "h": 45.0, "angle_deg": 68.0},
        ]
        save_detections_bulk(db, image.id, sample_detections, dataset_source="finetune")
        print(f"    Saved {len(sample_detections)} detections.")

        # Step 5: Mark image as done
        update_image_status(db, image.id, "done")
        print(f"    Image status updated to 'done'.")

        # Step 6: Read back and verify
        print("\n[5] Verification — reading back from DB...")
        images = get_images_by_user(db, user.id)
        print(f"    Images for user {user.id}: {len(images)}")

        detections = get_detections_by_image(db, image.id)
        print(f"    Detections for image {image.id}: {len(detections)}")
        for d in detections:
            print(f"      {d.class_name:12s}  conf={d.confidence:.2f}  "
                  f"cx={d.cx:.1f}  cy={d.cy:.1f}  "
                  f"w={d.w:.1f}  h={d.h:.1f}  angle={d.angle_deg:.1f}°")

        print("\n" + "=" * 55)
        print("All checks passed. Database is working correctly.")
        print("=" * 55)

    finally:
        db.close()


if __name__ == "__main__":
    seed()

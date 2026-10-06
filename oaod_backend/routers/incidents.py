"""
OAOD Project — Incidents Router (Accident Scene Analysis, Phase 1)

Scene documentation only: given a single aerial/drone photo of a
post-accident scene, reuse the existing DOTA-OBB detection (dota mode) to
report vehicle positions and headings. This is explicitly NOT a
reconstruction — no speed, trajectory, or fault claims. See
schemas.INCIDENT_DISCLAIMER, which is baked into the PDF report footer and
returned on every incident response for the frontend to display.

POST /incidents                                  — create an incident
GET  /incidents                                  — list the current user's incidents
GET  /incidents/{id}                             — one incident + its evidence
POST /incidents/{id}/evidence/scene-photo        — upload + detect a scene photo
GET  /incidents/{id}/report.pdf                  — generate the scene report PDF
"""

import io
import os
import uuid
import tempfile
from datetime import datetime
from typing import Optional

import cv2
import numpy as np
from PIL import Image as PILImage

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database.session import get_db
from database.crud import (
    create_incident, get_incident_by_id, get_incidents_by_user, update_incident_status,
    add_evidence, get_evidence_by_incident,
    create_image, update_image_result, save_detections_bulk, get_detections_by_image, get_image_by_id,
)
from schemas import (
    IncidentCreate, IncidentOut, EvidenceOut, IncidentListResponse,
    PredictItemResult, DetectionOut, INCIDENT_DISCLAIMER,
)
from auth_utils import get_current_user_id
from ml.model_registry import MODEL_FILES, get_yolo_model, run_detection
from routers.predict import UPLOAD_DIR

router = APIRouter(prefix="/incidents", tags=["Incidents"])

SCENE_PHOTO_MODE = "dota"  # fixed — Phase 1 reuses the existing DOTA-OBB model only


def _require_owned_incident(db: Session, incident_id: int, user_id: int):
    incident = get_incident_by_id(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")
    if incident.user_id != user_id:
        raise HTTPException(status_code=403, detail="You don't have access to this incident.")
    return incident


def _evidence_out(ev) -> EvidenceOut:
    annotated_url = None
    if ev.image is not None and ev.image.annotated_path:
        annotated_url = f"/predict/result/{os.path.basename(ev.image.annotated_path)}"
    return EvidenceOut(
        id=ev.id,
        incident_id=ev.incident_id,
        evidence_type=ev.evidence_type,
        image_id=ev.image_id,
        video_id=ev.video_id,
        label=ev.label,
        uploaded_at=ev.uploaded_at,
        annotated_image_url=annotated_url,
    )


def _incident_out(incident, evidence_list) -> IncidentOut:
    return IncidentOut(
        id=incident.id,
        title=incident.title,
        reference_code=incident.reference_code,
        status=incident.status,
        created_at=incident.created_at,
        updated_at=incident.updated_at,
        notes=incident.notes,
        evidence=[_evidence_out(ev) for ev in evidence_list],
    )


@router.post("", response_model=IncidentOut)
def create_new_incident(
    body: IncidentCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Open a new incident to document a post-accident scene."""
    incident = create_incident(
        db, user_id=user_id, title=body.title,
        reference_code=body.reference_code, notes=body.notes,
    )
    return _incident_out(incident, [])


@router.get("", response_model=IncidentListResponse)
def list_incidents(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """List all incidents belonging to the current user, newest first."""
    incidents = get_incidents_by_user(db, user_id)
    out = [_incident_out(inc, get_evidence_by_incident(db, inc.id)) for inc in incidents]
    return IncidentListResponse(total=len(out), incidents=out)


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Get one incident, with its attached evidence."""
    incident = _require_owned_incident(db, incident_id, user_id)
    evidence_list = get_evidence_by_incident(db, incident.id)
    return _incident_out(incident, evidence_list)


@router.post("/{incident_id}/evidence/scene-photo", response_model=PredictItemResult)
async def upload_scene_photo(
    incident_id: int,
    file: UploadFile = File(...),
    conf: float = Form(default=0.25),
    label: Optional[str] = Form(default=None),
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Upload one aerial photo of a post-accident scene. Runs the existing
    DOTA-OBB detector on it (same model/logic as /predict's "dota" mode) and
    attaches the result to the incident as scene_photo evidence.

    Positions + headings only — this documents what the detector found in
    the photo, not how the accident happened. See INCIDENT_DISCLAIMER.
    """
    incident = _require_owned_incident(db, incident_id, user_id)

    allowed = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'.")

    unique_id = uuid.uuid4().hex[:8]
    stem = os.path.splitext(os.path.basename(file.filename))[0]
    input_name = f"{stem}_{unique_id}{ext}"
    output_name = f"{stem}_{unique_id}_out.jpg"
    input_path = os.path.join(UPLOAD_DIR, input_name)
    output_path = os.path.join(UPLOAD_DIR, output_name)

    contents = await file.read()
    with open(input_path, "wb") as f:
        f.write(contents)

    pil_img = PILImage.open(input_path).convert("RGB")
    img_array = np.array(pil_img)
    h, w = img_array.shape[:2]

    db_image = create_image(
        db, user_id=user_id, filename=file.filename, file_path=input_path,
        source_type="drone", width=w, height=h,
    )

    _, model_name = MODEL_FILES[SCENE_PHOTO_MODE]
    model = get_yolo_model(SCENE_PHOTO_MODE)
    dets, plotted, stats = run_detection(model, img_array, conf, SCENE_PHOTO_MODE)
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

    add_evidence(db, incident_id=incident.id, evidence_type="scene_photo", image_id=db_image.id, label=label)
    if incident.status == "open":
        update_incident_status(db, incident.id, "documented")

    saved_dets = get_detections_by_image(db, db_image.id)
    return PredictItemResult(
        image_id=db_image.id,
        filename=file.filename,
        model_used=model_name,
        objects_found=objects_found,
        inference_ms=inference_ms,
        fps=fps,
        width=w, height=h,
        density=density,
        input_image_url=f"/predict/result/{input_name}",
        annotated_image_url=f"/predict/result/{output_name}",
        detections=[DetectionOut.model_validate(d) for d in saved_dets],
    )


@router.get("/{incident_id}/report.pdf")
def get_incident_report_pdf(
    incident_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Generate the scene documentation PDF: incident details, each scene
    photo's annotated image, and a table of detected vehicle positions +
    headings. The disclaimer footer (INCIDENT_DISCLAIMER) is drawn on every
    page via the canvas page hooks, not just a cover page.
    """
    incident = _require_owned_incident(db, incident_id, user_id)
    evidence_list = get_evidence_by_incident(db, incident.id)
    scene_photos = [ev for ev in evidence_list if ev.evidence_type == "scene_photo" and ev.image_id]

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import cm
        from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer,
                                         Table, TableStyle, Image as RLImage, HRFlowable)
        from reportlab.lib.styles import ParagraphStyle
        from reportlab.lib.enums import TA_CENTER
        from PIL import Image as PILImage
    except ImportError:
        raise HTTPException(status_code=500, detail="reportlab is not installed on the server.")

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=2 * cm, bottomMargin=2.6 * cm,
                             leftMargin=2 * cm, rightMargin=2 * cm)

    title_s = ParagraphStyle("T", fontSize=26, fontName="Helvetica-Bold",
                              textColor=colors.HexColor("#00cfff"), alignment=TA_CENTER, spaceAfter=6)
    sub_s = ParagraphStyle("S", fontSize=11, fontName="Helvetica",
                            textColor=colors.HexColor("#8877cc"), alignment=TA_CENTER, spaceAfter=4)
    sec_s = ParagraphStyle("H", fontSize=14, fontName="Helvetica-Bold",
                            textColor=colors.HexColor("#6644ff"), spaceBefore=18, spaceAfter=8)
    body_s = ParagraphStyle("B", fontSize=10, fontName="Helvetica",
                             textColor=colors.HexColor("#cccccc"), spaceAfter=4)
    warn_s = ParagraphStyle("W", fontSize=9.5, fontName="Helvetica-Oblique",
                             textColor=colors.HexColor("#ffb43c"), spaceAfter=4)

    story = [
        Spacer(1, 1.2 * cm),
        Paragraph("RAVEN", title_s),
        Paragraph("Accident Scene Documentation Report", sub_s),
        Paragraph("Vehicle positions and headings detected in a single photo", sub_s),
        Spacer(1, 0.4 * cm),
        HRFlowable(width="100%", thickness=1, color=colors.HexColor("#6644ff"), spaceAfter=12),
        Paragraph(f"Incident: {incident.title}", sub_s),
        Paragraph(f"Reference: {incident.reference_code or '—'}", sub_s),
        Paragraph("Generated: " + datetime.now().strftime("%d %B %Y, %H:%M"), sub_s),
        Spacer(1, 0.4 * cm),
        Paragraph(INCIDENT_DISCLAIMER, warn_s),
        Spacer(1, 0.6 * cm),
    ]

    if incident.notes:
        story.append(Paragraph("Notes", sec_s))
        story.append(Paragraph(incident.notes, body_s))

    story.append(Paragraph("Scene Photos", sec_s))

    img_added = 0
    tmp_paths = []  # cleaned up only after doc.build() — RLImage reads lazily at build time
    try:
        for ev in scene_photos:
            image = get_image_by_id(db, ev.image_id)
            if not image or not image.annotated_path or not os.path.exists(image.annotated_path):
                continue
            try:
                story.append(Paragraph(ev.label or image.filename, body_s))
                with PILImage.open(image.annotated_path) as pil_img:
                    pil_img = pil_img.convert("RGB")
                    max_w = 800
                    if pil_img.width > max_w:
                        ratio = max_w / pil_img.width
                        pil_img = pil_img.resize((max_w, int(pil_img.height * ratio)), PILImage.LANCZOS)
                    tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
                    pil_img.save(tmp.name, "JPEG", quality=60, optimize=True)
                    tmp.close()
                    tmp_paths.append(tmp.name)
                    story.append(RLImage(tmp.name, width=16 * cm, height=10 * cm, kind="proportional"))
                story.append(Spacer(1, 0.3 * cm))

                dets = get_detections_by_image(db, image.id)
                if dets:
                    tdata = [["Class", "Position (cx, cy)", "Heading (deg)", "Confidence"]]
                    for d in dets:
                        tdata.append([
                            d.class_name,
                            f"{d.cx:.0f}, {d.cy:.0f}",
                            f"{d.angle_deg:.1f}",
                            f"{d.confidence:.2f}",
                        ])
                    tbl = Table(tdata, repeatRows=1, colWidths=[4 * cm, 4.5 * cm, 3.5 * cm, 3 * cm])
                    tbl.setStyle(TableStyle([
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6644ff")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, -1), 8),
                        ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#cccccc")),
                        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#0d0b22"), colors.HexColor("#100e28")]),
                        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#6644ff44")),
                        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ]))
                    story.append(tbl)
                else:
                    story.append(Paragraph("No vehicles detected in this photo.", body_s))
                story.append(Spacer(1, 0.6 * cm))
                img_added += 1
            except Exception:
                pass

        if img_added == 0:
            story.append(Paragraph("No scene photos available for this incident yet.", body_s))

        story.append(Spacer(1, 0.6 * cm))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#6644ff44"), spaceAfter=8))
        story.append(Paragraph("RAVEN - Detection that never blinks.", sub_s))

        def dark_bg_with_disclaimer(canvas, doc_):
            canvas.saveState()
            canvas.setFillColor(colors.HexColor("#07051a"))
            canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
            canvas.restoreState()

            canvas.saveState()
            canvas.setFont("Helvetica-Oblique", 7.2)
            canvas.setFillColor(colors.HexColor("#ffb43c"))
            footer_width = A4[0] - 2.4 * cm
            wrapped = _wrap_footer_text(canvas, INCIDENT_DISCLAIMER, footer_width, "Helvetica-Oblique", 7.2)
            y = 1.1 * cm + (len(wrapped) - 1) * 9
            for line in wrapped:
                canvas.drawCentredString(A4[0] / 2, y, line)
                y -= 9
            canvas.restoreState()

        doc.build(story, onFirstPage=dark_bg_with_disclaimer, onLaterPages=dark_bg_with_disclaimer)
    finally:
        for p in tmp_paths:
            try:
                os.unlink(p)
            except OSError:
                pass
    buf.seek(0)
    safe_title = "".join(c if c.isalnum() else "_" for c in incident.title)[:40] or "incident"
    return StreamingResponse(
        buf, media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=raven_scene_report_{safe_title}.pdf"},
    )


def _wrap_footer_text(canvas, text: str, max_width: float, font_name: str, font_size: float) -> list[str]:
    """Word-wrap the disclaimer to fit the page width so it reads cleanly in the footer."""
    words = text.split()
    lines = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if canvas.stringWidth(candidate, font_name, font_size) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines

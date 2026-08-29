"""
OAOD Project — Reports Router
Export detection results as CSV, a branded PDF report, or a ZIP of annotated
images. Ported from the Flask app's download_report_csv/pdf/download_zip
routes, adapted to read stats from the database instead of client-supplied
query params.
"""

import csv
import io
import os
import zipfile
import tempfile
from datetime import datetime

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from fastapi import Depends

from database.session import get_db
from database.crud import get_image_by_id

router = APIRouter(prefix="/reports", tags=["Reports"])


def _parse_ids(image_ids: str) -> list[int]:
    ids = []
    for part in image_ids.split(","):
        part = part.strip()
        if part.isdigit():
            ids.append(int(part))
    if not ids:
        raise HTTPException(status_code=400, detail="No valid image_ids provided.")
    return ids


def _fetch_images(db: Session, image_ids: str):
    images = [get_image_by_id(db, i) for i in _parse_ids(image_ids)]
    return [img for img in images if img is not None]


@router.get("/csv")
def download_report_csv(image_ids: str, db: Session = Depends(get_db)):
    images = _fetch_images(db, image_ids)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["#", "Filename", "Model", "Resolution", "Objects", "Density", "Time(ms)", "FPS"])
    for i, img in enumerate(images, 1):
        size = f"{img.width} x {img.height}" if img.width and img.height else ""
        writer.writerow([i, img.filename, img.model_used or "", size,
                          len(img.detections), img.density or "", img.inference_ms or "", img.fps or ""])
    output.seek(0)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=raven_report.csv"},
    )


@router.get("/pdf")
def download_report_pdf(image_ids: str, db: Session = Depends(get_db)):
    images = _fetch_images(db, image_ids)

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
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm,
                             leftMargin=2 * cm, rightMargin=2 * cm)

    title_s = ParagraphStyle("T", fontSize=28, fontName="Helvetica-Bold",
                              textColor=colors.HexColor("#00cfff"), alignment=TA_CENTER, spaceAfter=6)
    sub_s = ParagraphStyle("S", fontSize=11, fontName="Helvetica",
                            textColor=colors.HexColor("#8877cc"), alignment=TA_CENTER, spaceAfter=4)
    sec_s = ParagraphStyle("H", fontSize=14, fontName="Helvetica-Bold",
                            textColor=colors.HexColor("#6644ff"), spaceBefore=18, spaceAfter=8)
    body_s = ParagraphStyle("B", fontSize=10, fontName="Helvetica",
                             textColor=colors.HexColor("#cccccc"), spaceAfter=4)

    story = [
        Spacer(1, 1.5 * cm),
        Paragraph("RAVEN", title_s),
        Paragraph("Detection Analysis Report", sub_s),
        Paragraph("Rotated-Annotation Vehicle and Entity Network", sub_s),
        Spacer(1, 0.4 * cm),
        HRFlowable(width="100%", thickness=1, color=colors.HexColor("#6644ff"), spaceAfter=12),
        Paragraph("Generated: " + datetime.now().strftime("%d %B %Y, %H:%M"), sub_s),
        Paragraph("Total images: " + str(len(images)), sub_s),
        Spacer(1, 0.8 * cm),
        Paragraph("Detection Results", sec_s),
    ]

    if images:
        tdata = [["Filename", "Model", "Objects", "Time(ms)", "FPS", "Size"]]
        for img in images:
            size = f"{img.width}x{img.height}" if img.width and img.height else ""
            tdata.append([
                str(img.filename)[:22], str(img.model_used or ""), str(len(img.detections)),
                str(round(img.inference_ms, 1)) if img.inference_ms else "",
                str(round(img.fps, 2)) if img.fps else "", size,
            ])
        tbl = Table(tdata, repeatRows=1, colWidths=[4.5 * cm, 3.5 * cm, 2 * cm, 2.5 * cm, 2 * cm, 3 * cm])
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6644ff")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#cccccc")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#0d0b22"), colors.HexColor("#100e28")]),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#6644ff44")),
            ("ALIGN", (2, 0), (-1, -1), "CENTER"),
            ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(tbl)
    else:
        story.append(Paragraph("No records found for the requested images.", body_s))

    story.append(Spacer(1, 0.8 * cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#6644ff44"), spaceAfter=8))
    story.append(Paragraph("Output Images", sec_s))

    img_added = 0
    tmp_paths = []  # cleaned up only after doc.build() — RLImage reads lazily at build time
    try:
        for img in images:
            if not img.annotated_path or not os.path.exists(img.annotated_path):
                continue
            try:
                story.append(Paragraph(img.filename, body_s))
                with PILImage.open(img.annotated_path) as pil_img:
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
                story.append(Spacer(1, 0.5 * cm))
                img_added += 1
            except Exception:
                pass

        if img_added == 0:
            story.append(Paragraph("Output images not found (they may have expired).", body_s))

        story.append(Spacer(1, 1 * cm))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#6644ff44"), spaceAfter=8))
        story.append(Paragraph("RAVEN - Detection that never blinks.", sub_s))

        def dark_bg(canvas, doc_):
            canvas.saveState()
            canvas.setFillColor(colors.HexColor("#07051a"))
            canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
            canvas.restoreState()

        doc.build(story, onFirstPage=dark_bg, onLaterPages=dark_bg)
    finally:
        for p in tmp_paths:
            try:
                os.unlink(p)
            except OSError:
                pass
    buf.seek(0)
    return StreamingResponse(
        buf, media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=raven_report.pdf"},
    )


@router.get("/zip")
def download_zip(image_ids: str, db: Session = Depends(get_db)):
    images = _fetch_images(db, image_ids)

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for img in images:
            if img.annotated_path and os.path.exists(img.annotated_path):
                zf.write(img.annotated_path, os.path.basename(img.annotated_path))
    zip_buffer.seek(0)

    return StreamingResponse(
        zip_buffer, media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=detection_results.zip"},
    )

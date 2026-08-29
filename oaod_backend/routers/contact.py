"""
OAOD Project — Contact Router
Ported from the Flask app's /send-suggestion route. Sends a suggestion/bug
report email via SMTP; falls back to just logging it if SMTP isn't configured.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import APIRouter, Form
from pydantic import BaseModel

router = APIRouter(prefix="/contact", tags=["Contact"])


class SuggestionResponse(BaseModel):
    status: str
    msg: str


@router.post("", response_model=SuggestionResponse)
def send_suggestion(
    category: str = Form(default="General"),
    message: str = Form(...),
    sender_email: str = Form(default="Anonymous"),
):
    message = message.strip()
    if not message:
        return SuggestionResponse(status="error", msg="Message cannot be empty")

    smtp_user = os.environ.get("SMTP_USER", "PLACEHOLDER_EMAIL")
    smtp_password = os.environ.get("SMTP_PASSWORD", "")
    team_email = os.environ.get("TEAM_EMAIL", "team.ravendetections@gmail.com")

    if smtp_user == "PLACEHOLDER_EMAIL" or not smtp_password:
        print(f"[SUGGESTION] From: {sender_email} | Cat: {category} | Msg: {message}")
        return SuggestionResponse(status="ok", msg="Suggestion received!")

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[RAVEN] {category} from {sender_email}"
        msg["From"] = smtp_user
        msg["To"] = team_email
        msg["Reply-To"] = sender_email
        body = (
            "<html><body><h2>New RAVEN Suggestion</h2>"
            f"<p><b>From:</b> {sender_email}</p>"
            f"<p><b>Category:</b> {category}</p>"
            f"<p><b>Message:</b> {message}</p>"
            "</body></html>"
        )
        msg.attach(MIMEText(body, "html"))
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, team_email, msg.as_string())
        return SuggestionResponse(status="ok", msg="Suggestion sent!")
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return SuggestionResponse(status="error", msg="Failed to send. Try again later.")

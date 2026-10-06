// Persistent, non-dismissible disclaimer — shown at the top of every page
// under /incidents. Mirrors oaod_backend/schemas.py's INCIDENT_DISCLAIMER;
// NOTE: exact wording needs explicit human sign-off, keep the two in sync.
const DISCLAIMER_TEXT =
  "This is an assistive documentation aid, not a validated forensic reconstruction. " +
  "It shows vehicle positions and headings detected in a single uploaded photo and " +
  "makes no claims about vehicle speed, fault, or the sequence of events.";

export default function IncidentDisclaimerBanner() {
  return (
    <div
      role="note"
      style={{
        padding: "12px 16px",
        borderRadius: 10,
        background: "rgba(255,180,60,0.08)",
        border: "1px solid rgba(255,180,60,0.35)",
        marginBottom: 20,
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: 16, lineHeight: "20px" }}>⚠️</span>
      <p style={{ fontSize: 12.5, color: "#ffb43c", lineHeight: 1.5, margin: 0 }}>
        <strong>Documentation, not reconstruction.</strong> {DISCLAIMER_TEXT}
      </p>
    </div>
  );
}

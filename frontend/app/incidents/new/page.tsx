"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import IncidentDisclaimerBanner from "@/components/IncidentDisclaimerBanner";

export default function NewIncidentPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [referenceCode, setReferenceCode] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          reference_code: referenceCode.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create incident.");
        return;
      }
      router.push(`/incidents/${data.id}`);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: "40px 60px 80px", maxWidth: 640 }}>
      <IncidentDisclaimerBanner />
      <h1 className="text-2xl font-bold mb-4">New Incident</h1>

      <form onSubmit={onSubmit} className="card" style={{ padding: 28 }}>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Intersection collision, Main St & 5th"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Reference code</label>
          <input
            value={referenceCode}
            onChange={(e) => setReferenceCode(e.target.value)}
            placeholder="e.g. police report / case number"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Any context worth recording (optional)"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        {error && <p style={{ color: "#ff8080", fontSize: 13, marginBottom: 14 }}>{error}</p>}

        <button type="submit" className="btn-primary justify-center" style={{ width: "100%" }} disabled={busy}>
          {busy ? "Creating..." : "Create Incident"}
        </button>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 8 };
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--bg-panel)",
  color: "var(--text)",
  fontSize: 13,
  fontFamily: "inherit",
};

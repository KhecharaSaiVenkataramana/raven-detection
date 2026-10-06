"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ZoomImage from "@/components/ZoomImage";
import { useLoadingOverlay } from "@/components/LoadingOverlay";
import type { Incident, PredictItemResult } from "@/lib/types";

export default function IncidentWorkspace({ incident }: { incident: Incident }) {
  const router = useRouter();
  const { show, hide } = useLoadingOverlay();

  const [file, setFile] = useState<File | null>(null);
  const [conf, setConf] = useState(0.25);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PredictItemResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a scene photo first.");
      return;
    }
    setError(null);
    setBusy(true);
    show();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("conf", String(conf));

    try {
      const res = await fetch(`/api/incidents/${incident.id}/scene-photo`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Detection failed.");
      } else {
        setResults((prev) => [data as PredictItemResult, ...prev]);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        router.refresh();
      }
    } catch {
      setError("Could not reach the detection server.");
    } finally {
      setBusy(false);
      hide();
    }
  }

  const priorEvidence = incident.evidence.filter(
    (ev) => ev.evidence_type === "scene_photo" && !results.some((r) => r.annotated_image_url === ev.annotated_image_url)
  );

  return (
    <div>
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 className="text-2xl font-bold mb-1">{incident.title}</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Reference: {incident.reference_code ?? "—"} &nbsp;·&nbsp; Status:{" "}
              <span style={{ color: "var(--cyan)" }}>{incident.status}</span>
            </p>
            {incident.notes && (
              <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 8, maxWidth: 560 }}>{incident.notes}</p>
            )}
          </div>
          <a
            className="btn-secondary"
            style={{ padding: "8px 16px", fontSize: 13, whiteSpace: "nowrap" }}
            href={`/api/incidents/${incident.id}/report.pdf`}
          >
            Download Scene Report (PDF)
          </a>
        </div>
      </div>

      <form onSubmit={onSubmit} className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h2 className="text-lg font-semibold mb-4">Upload Scene Photo</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.tif,.tiff"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          style={fileInputStyle}
        />
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
          Runs the existing DOTA-OBB detector — positions and headings only.
        </p>

        <div style={{ marginTop: 18 }}>
          <label style={labelStyle}>
            Confidence Threshold: <span style={{ color: "var(--cyan)" }}>{conf.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={conf}
            onChange={(e) => setConf(parseFloat(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        {error && <p style={{ color: "#ff8080", fontSize: 13, marginTop: 14 }}>{error}</p>}

        <button type="submit" className="btn-primary justify-center" style={{ width: "100%", marginTop: 18 }} disabled={busy}>
          {busy ? "Running..." : "Run Detection"}
        </button>
      </form>

      {results.map((r) => (
        <div key={r.image_id} className="card" style={{ padding: 16, marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{r.filename}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Input</p>
              <ZoomImage src={`/backend${r.input_image_url}`} alt={`${r.filename} input`} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Output</p>
              <ZoomImage src={`/backend${r.annotated_image_url}`} alt={`${r.filename} output`} />
            </div>
          </div>

          {r.detections.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No vehicles detected in this photo.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
                  <th style={th}>Class</th>
                  <th style={th}>Position (cx, cy)</th>
                  <th style={th}>Heading (deg)</th>
                  <th style={th}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {r.detections.map((d) => (
                  <tr key={d.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={td}>{d.class_name}</td>
                    <td style={td}>{d.cx.toFixed(0)}, {d.cy.toFixed(0)}</td>
                    <td style={td}>{d.angle_deg.toFixed(1)}</td>
                    <td style={td}>{d.confidence.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      {priorEvidence.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <h2 className="text-lg font-semibold mb-4">Previously Uploaded Evidence</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 14 }}>
            {priorEvidence.map((ev) => (
              <div key={ev.id}>
                {ev.annotated_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/backend${ev.annotated_image_url}`}
                    alt={ev.label ?? "scene photo"}
                    style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 8 }}
                  />
                ) : (
                  <div style={{ width: "100%", height: 90, borderRadius: 8, background: "var(--bg-panel)" }} />
                )}
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                  {ev.label || `Evidence #${ev.id}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 8 };
const fileInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--bg-panel)",
  color: "var(--text)",
  fontSize: 13,
};
const th: React.CSSProperties = { padding: "8px 10px", fontWeight: 600 };
const td: React.CSSProperties = { padding: "8px 10px" };

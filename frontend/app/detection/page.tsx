"use client";

import { useEffect, useRef, useState } from "react";
import ZoomImage from "@/components/ZoomImage";
import { useLoadingOverlay } from "@/components/LoadingOverlay";
import type { DetectionMode, PredictBatchResponse } from "@/lib/types";

const MODE_LABELS: Record<DetectionMode, string> = {
  standard: "Standard YOLOv8",
  dota: "DOTA-OBB",
  hrsc: "HRSC-OBB",
  dota_fg: "DOTA Fine-grained",
};

const TIME_ESTIMATE_S: Record<DetectionMode, number> = {
  standard: 2,
  dota: 3,
  hrsc: 3,
  dota_fg: 5,
};

const LARGE_BATCH_THRESHOLD = 12;

export default function DetectionPage() {
  const { show, hide } = useLoadingOverlay();

  const [tab, setTab] = useState<"images" | "folder">("images");
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<DetectionMode>("standard");
  const [conf, setConf] = useState(0.25);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictBatchResponse | null>(null);
  const [confirmedLargeBatch, setConfirmedLargeBatch] = useState(false);

  const imagesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute("webkitdirectory", "true");
      folderInputRef.current.setAttribute("directory", "true");
    }
  }, []);

  function onPickFiles(list: FileList | null) {
    setConfirmedLargeBatch(false);
    setFiles(list ? Array.from(list) : []);
  }

  const showLargeBatchWarning = files.length > LARGE_BATCH_THRESHOLD && !confirmedLargeBatch;
  const estimatedSeconds = files.length * TIME_ESTIMATE_S[mode];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) {
      setError("Choose at least one image.");
      return;
    }
    if (showLargeBatchWarning) return;

    setError(null);
    setBusy(true);
    show();

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("mode", mode);
    formData.append("conf", String(conf));

    try {
      const res = await fetch("/api/predict", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Detection failed.");
      } else {
        setResult(data as PredictBatchResponse);
      }
    } catch {
      setError("Could not reach the detection server.");
    } finally {
      setBusy(false);
      hide();
    }
  }

  const imageIds = result?.results.map((r) => r.image_id).join(",") ?? "";

  return (
    <div style={{ padding: "40px 60px 80px" }}>
      <div className="grid" style={{ display: "grid", gridTemplateColumns: "550px 1fr", gap: 32, alignItems: "start" }}>
        {/* ── Control panel ── */}
        <form onSubmit={onSubmit} className="card" style={{ padding: 28 }}>
          <h2 className="text-lg font-semibold mb-4">Run Detection</h2>

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <TabButton active={tab === "images"} onClick={() => setTab("images")}>Images</TabButton>
            <TabButton active={tab === "folder"} onClick={() => setTab("folder")}>Folder</TabButton>
          </div>

          {tab === "images" ? (
            <input
              ref={imagesInputRef}
              type="file"
              multiple
              accept="image/*,.tif,.tiff"
              onChange={(e) => onPickFiles(e.target.files)}
              style={fileInputStyle}
            />
          ) : (
            <input
              ref={folderInputRef}
              type="file"
              multiple
              onChange={(e) => onPickFiles(e.target.files)}
              style={fileInputStyle}
            />
          )}

          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
            {files.length > 0 ? `${files.length} file(s) selected` : "No files selected"}
          </p>

          {showLargeBatchWarning && (
            <div
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 10,
                background: "rgba(255,180,60,0.08)",
                border: "1px solid rgba(255,180,60,0.35)",
              }}
            >
              <p style={{ fontSize: 13, color: "#ffb43c", fontWeight: 600, marginBottom: 4 }}>
                Large batch detected — {files.length} images
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
                Estimated processing time: ~{estimatedSeconds}s at this mode&apos;s typical speed.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="btn-secondary" style={{ padding: "6px 16px", fontSize: 13 }}
                  onClick={() => setConfirmedLargeBatch(true)}>
                  Proceed
                </button>
                <button type="button" className="btn-secondary" style={{ padding: "6px 16px", fontSize: 13 }}
                  onClick={() => { setFiles([]); setConfirmedLargeBatch(false); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
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

          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Detection Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value as DetectionMode)} style={fileInputStyle}>
              {(Object.keys(MODE_LABELS) as DetectionMode[]).map((m) => (
                <option key={m} value={m}>{MODE_LABELS[m]}</option>
              ))}
            </select>
          </div>

          {error && (
            <p style={{ color: "#ff8080", fontSize: 13, marginTop: 14 }}>{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary justify-center"
            style={{ width: "100%", marginTop: 22 }}
            disabled={busy || showLargeBatchWarning}
          >
            {busy ? "Running..." : "Run Detection"}
          </button>
        </form>

        {/* ── Viewer panel ── */}
        <div>
          {!result ? (
            <div className="card" style={{ padding: 60, textAlign: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ui/upload.svg" alt="" style={{ width: 96, opacity: 0.6, margin: "0 auto 20px" }} />
              <h3 style={{ letterSpacing: 2, fontSize: 14, color: "var(--text-muted)" }}>UPLOAD IMAGE</h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
                Choose one or more aerial images and run detection to see results here.
              </p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                Supported: JPG, PNG, BMP, TIFF
              </p>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 className="text-lg font-semibold">Detection Results</h2>
                <div style={{ display: "flex", gap: 10 }}>
                  <a className="btn-secondary" style={btnSmall} href={`/backend/reports/csv?image_ids=${imageIds}`}>
                    Export CSV
                  </a>
                  <a className="btn-secondary" style={btnSmall} href={`/backend/reports/pdf?image_ids=${imageIds}`}>
                    PDF Report
                  </a>
                  {result.results.length > 1 && (
                    <a className="btn-secondary" style={btnSmall} href={`/backend/reports/zip?image_ids=${imageIds}`}>
                      Download All ({result.results.length})
                    </a>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                {result.results.map((r) => (
                  <div key={r.image_id} className="card" style={{ padding: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{r.filename}</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Input</p>
                        <ZoomImage src={`/backend${r.input_image_url}`} alt={`${r.filename} input`} />
                      </div>
                      <div>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Output</p>
                        <ZoomImage src={`/backend${r.annotated_image_url}`} alt={`${r.filename} output`} />
                      </div>
                    </div>
                    <a
                      href={`/backend${r.annotated_image_url}`}
                      download
                      style={{ fontSize: 12, color: "var(--cyan)", marginTop: 10, display: "inline-block" }}
                    >
                      Download Result →
                    </a>
                  </div>
                ))}
              </div>

              <div className="card" style={{ padding: 20, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
                      <th style={th}>Image</th>
                      <th style={th}>Resolution</th>
                      <th style={th}>Objects</th>
                      <th style={th}>Density</th>
                      <th style={th}>Time (ms)</th>
                      <th style={th}>FPS</th>
                      <th style={th}>Model</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((r) => (
                      <tr key={r.image_id} style={{ borderTop: "1px solid var(--border)" }}>
                        <td style={td}>{r.filename}</td>
                        <td style={td}>{r.width} x {r.height}</td>
                        <td style={td}>{r.objects_found}</td>
                        <td style={td}>{r.density}</td>
                        <td style={td}>{r.inference_ms}</td>
                        <td style={td}>{r.fps}</td>
                        <td style={td}>{r.model_used}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: "flex", gap: 40, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                  <Stat label="Average Time" value={`${result.avg_time_ms} ms`} />
                  <Stat label="Average Objects" value={String(result.avg_objects)} />
                  <Stat label="Estimated FPS" value={String(result.avg_fps)} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 18px",
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: active ? "var(--purple)" : "transparent",
        color: active ? "#fff" : "var(--text-muted)",
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 700, color: "var(--cyan)" }}>{value}</p>
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
const btnSmall: React.CSSProperties = { padding: "8px 16px", fontSize: 13 };
const th: React.CSSProperties = { padding: "8px 10px", fontWeight: 600 };
const td: React.CSSProperties = { padding: "8px 10px" };

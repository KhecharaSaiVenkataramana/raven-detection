"use client";

import { useEffect, useState } from "react";
import type { ImageOut } from "@/lib/types";

function modelPillColor(modelUsed: string | null): string {
  if (!modelUsed) return "var(--cyan)";
  if (modelUsed.includes("DOTA")) return "var(--purple)";
  if (modelUsed.includes("HRSC")) return "#16c9a8";
  return "var(--cyan)";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) +
    ", " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function HistoryTable({ images }: { images: ImageOut[] }) {
  const [modalSrc, setModalSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!modalSrc) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setModalSrc(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalSrc]);

  return (
    <>
      <div className="card" style={{ overflowX: "auto", padding: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 900 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
              <th style={th}>#</th>
              <th style={th}>Output</th>
              <th style={th}>Filename</th>
              <th style={th}>Model</th>
              <th style={th}>Objects</th>
              <th style={th}>Time (ms)</th>
              <th style={th}>FPS</th>
              <th style={th}>Size</th>
              <th style={th}>Detected at</th>
              <th style={th}>Download</th>
            </tr>
          </thead>
          <tbody>
            {images.map((img) => (
              <tr key={img.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={td}>{img.id}</td>
                <td style={td}>
                  {img.annotated_image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`/backend${img.annotated_image_url}`}
                      alt=""
                      style={{ width: 56, height: 40, objectFit: "cover", borderRadius: 6, cursor: "pointer" }}
                      onClick={() => setModalSrc(`/backend${img.annotated_image_url}`)}
                    />
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Expired</span>
                  )}
                </td>
                <td style={td}>{img.filename}</td>
                <td style={td}>
                  <span
                    style={{
                      padding: "2px 10px",
                      borderRadius: 12,
                      fontSize: 11,
                      background: `color-mix(in srgb, ${modelPillColor(img.model_used)} 15%, transparent)`,
                      color: modelPillColor(img.model_used),
                    }}
                  >
                    {img.model_used ?? "—"}
                  </span>
                </td>
                <td style={td}>
                  <span style={{ color: "#4ade80" }}>{img.detections.length}</span>
                </td>
                <td style={td}>{img.inference_ms?.toFixed(1) ?? "—"}</td>
                <td style={td}>{img.fps?.toFixed(2) ?? "—"}</td>
                <td style={td}>{img.width && img.height ? `${img.width} x ${img.height}` : "—"}</td>
                <td style={td}>{formatDate(img.uploaded_at)}</td>
                <td style={td}>
                  {img.annotated_image_url && (
                    <a href={`/backend${img.annotated_image_url}`} download style={{ color: "var(--cyan)" }}>
                      Download
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalSrc && (
        <div
          onClick={() => setModalSrc(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(3,2,12,0.9)", zIndex: 2000,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={modalSrc} alt="" style={{ maxWidth: "88vw", maxHeight: "88vh", borderRadius: 10 }} />
        </div>
      )}
    </>
  );
}

const th: React.CSSProperties = { padding: "10px 12px", fontWeight: 600, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 12px", whiteSpace: "nowrap" };

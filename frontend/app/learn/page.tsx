"use client";

import { useMemo, useState } from "react";
import FaqAccordion from "@/components/FaqAccordion";

const SECTIONS = [
  {
    id: "obb",
    icon: "📦",
    title: "Horizontal (HBB) vs. Oriented (OBB)",
    body:
      "A horizontal bounding box (HBB) is the axis-aligned rectangle you're used to seeing in most " +
      "detectors. For rotated objects — a ship at an angle, a vehicle on a diagonal road — an HBB has " +
      "to grow to cover the whole rotated shape, pulling in a lot of background pixels. This causes two " +
      "problems in dense aerial scenes: background contamination (the extra area confuses the classifier) " +
      "and NMS conflict (overlapping HBBs for nearby rotated objects get incorrectly suppressed as duplicates). " +
      "An oriented bounding box (OBB) instead rotates to hug the object's true footprint.",
    boxes: [
      { title: "Background Contamination", text: "Extra background area inside a loose HBB dilutes the features the classifier sees." },
      { title: "NMS Conflict", text: "Overlapping HBBs on closely packed rotated objects get wrongly merged or suppressed." },
    ],
  },
  {
    id: "math",
    icon: "📐",
    title: "The 5-Parameter Prediction Model",
    body:
      "An OBB model predicts five numbers per object instead of four: center x, center y, width, height, " +
      "and a rotation angle θ. The box is drawn axis-aligned in its own local frame, then rotated by θ around " +
      "its center to land on the object.",
    specs: ["x — center x coordinate", "y — center y coordinate", "w — box width", "h — box height", "θ — rotation angle (radians or degrees)"],
  },
  {
    id: "iou",
    icon: "🔄",
    title: "Rotated Intersection over Union (RIoU)",
    body:
      "Standard IoU compares two axis-aligned rectangles. For rotated boxes, RIoU treats each box as a " +
      "polygon and computes the intersection area via polygon clipping (e.g. the Sutherland–Hodgman algorithm), " +
      "then divides by the union area. This is what RAVEN's loss function and NMS step both rely on during training and inference.",
  },
  {
    id: "challenges",
    icon: "⚠️",
    title: "Aerial Challenges",
    body: "Aerial imagery brings its own set of difficulties beyond just rotation.",
    challenges: [
      { title: "Scale Variation", text: "The same object class (e.g. 'vehicle') can range from a few pixels to hundreds, depending on altitude and zoom." },
      { title: "Perspective Ambiguity", text: "Top-down views remove depth cues, making similarly-shaped objects (buses vs. trucks) harder to tell apart." },
    ],
  },
];

const FAQS = [
  { q: "Why not just rotate the whole image?", a: "Rotating the input doesn't help — objects at many different angles can appear in the same image, so the model needs to predict angle per-object, not globally." },
  { q: "Does RAVEN support all rotation angles?", a: "Yes — the angle parameter θ is continuous, so the model can represent any orientation from 0° to 360°." },
];

export default function LearnPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return SECTIONS;
    const q = query.toLowerCase();
    return SECTIONS.filter((s) => (s.title + " " + s.body).toLowerCase().includes(q));
  }, [query]);

  return (
    <div style={{ padding: "60px 80px 100px" }}>
      <h1 className="gradient-text" style={{ fontSize: 40, fontWeight: 800, marginBottom: 8 }}>
        Aerial Intelligence Academy
      </h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 24 }}>
        The concepts behind oriented object detection, explained.
      </p>
      <input
        placeholder="Search concepts..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%", maxWidth: 420, padding: "10px 16px", borderRadius: 24,
          border: "1px solid var(--border)", background: "var(--bg-panel)", color: "var(--text)",
          marginBottom: 40, fontSize: 14,
        }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 48 }}>
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="card" style={{ padding: 18, textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <p style={{ fontSize: 13, fontWeight: 600 }}>{s.title.split(" — ")[0].split("(")[0].trim()}</p>
          </a>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: "var(--text-muted)" }}>No concepts match &quot;{query}&quot;.</p>
      )}

      {filtered.map((s) => (
        <section key={s.id} id={s.id} className="card concept" style={{ padding: 32, marginBottom: 24 }}>
          <span className="section-badge">{s.icon} {s.id.toUpperCase()}</span>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "10px 0 14px" }}>{s.title}</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>{s.body}</p>

          {s.boxes && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {s.boxes.map((b) => (
                <div key={b.title} style={{ background: "var(--bg-panel)", padding: 16, borderRadius: 10 }}>
                  <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: "var(--cyan)" }}>{b.title}</p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{b.text}</p>
                </div>
              ))}
            </div>
          )}

          {s.specs && (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {s.specs.map((sp) => (
                <li key={sp} style={{ fontSize: 13, color: "var(--text-muted)", padding: "6px 0", borderTop: "1px solid var(--border)" }}>
                  {sp}
                </li>
              ))}
            </ul>
          )}

          {s.challenges && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {s.challenges.map((c) => (
                <div key={c.title} style={{ background: "var(--bg-panel)", padding: 16, borderRadius: 10 }}>
                  <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: "var(--purple)" }}>{c.title}</p>
                  <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{c.text}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      <section style={{ marginTop: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Frequently asked</h2>
        <div className="card" style={{ padding: "8px 24px" }}>
          <FaqAccordion items={FAQS} />
        </div>
      </section>
    </div>
  );
}

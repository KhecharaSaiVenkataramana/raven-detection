const STEPS = [
  {
    n: 1, title: "Upload Image", icon: "📤",
    body: "Go to the Detection page and choose one or more aerial images, or switch to the Folder tab to upload a whole directory at once.",
    tip: "Clear, well-lit images work best — heavy compression or blur can reduce detection accuracy.",
  },
  {
    n: 2, title: "Adjust Confidence Threshold", icon: "🎚️",
    body: "The confidence slider controls how certain the model must be before it reports a detection.",
    bullets: ["Lower threshold → more detections, including weaker/uncertain ones", "Higher threshold → fewer, more confident detections"],
  },
  {
    n: 3, title: "Select Detection Mode", icon: "🧭",
    body: "Choose the mode that matches your imagery and goal.",
    bullets: ["Standard — general object detection", "DOTA-OBB / HRSC-OBB — orientation-aware detection for aerial/maritime scenes", "DOTA Fine-grained — classifies detected vehicles into precise subtypes"],
  },
  {
    n: 4, title: "Run Detection", icon: "▶️",
    body: "Click Run Detection and the RAVEN scanning animation will play while your image(s) are processed.",
    warning: "Processing time depends on image resolution, batch size, and detection mode — large batches in Fine-grained mode take the longest.",
  },
  {
    n: 5, title: "Analyze Results", icon: "📊",
    body: "Once processing finishes, you'll see input/output image pairs, a performance table, and summary stats.",
    bullets: ["Objects — how many detections were found", "Inference time — how long the model took", "FPS — frames per second equivalent", "Density — objects per megapixel"],
  },
  {
    n: 6, title: "Interpret Metrics", icon: "🔍",
    body: "Use the metrics to judge both the scene and the model's performance.",
    bullets: [
      "Objects — raw detection count",
      "Density — how crowded the scene is, normalized by image size",
      "Time — total inference latency in milliseconds",
      "FPS — throughput; higher is faster",
    ],
    tip: "Higher FPS combined with lower time per image generally means faster, more efficient inference.",
  },
];

export default function TutorialsPage() {
  return (
    <div style={{ padding: "60px 80px 100px", maxWidth: 900, margin: "0 auto" }}>
      <h1 className="gradient-text" style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>
        Using the Detection Tool
      </h1>
      <p style={{ color: "var(--text-dim)", marginBottom: 24 }}>
        Follow this step-by-step guide to run aerial object detection.
      </p>

      <div className="card" style={{ padding: 16, marginBottom: 40, fontSize: 13, color: "var(--text-muted)" }}>
        Looking for the concepts behind detection (OBB, angles, IoU)? Visit the{" "}
        <a href="/learn" style={{ color: "var(--cyan)" }}>Learn page</a> instead.
      </div>

      {STEPS.map((step) => (
        <div key={step.n} style={{ display: "flex", gap: 24, marginBottom: 36 }}>
          <div
            style={{
              flexShrink: 0, width: 44, height: 44, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--purple), var(--cyan))",
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff",
            }}
          >
            {step.n}
          </div>
          <div className="card" style={{ padding: 24, flex: 1 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{step.icon} {step.title}</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7, margin: "8px 0 12px" }}>{step.body}</p>

            {step.bullets && (
              <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-muted)", fontSize: 13, lineHeight: 1.9 }}>
                {step.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            )}

            {step.tip && (
              <p style={{ marginTop: 12, padding: "10px 14px", borderLeft: "3px solid #4ade80", background: "rgba(74,222,128,0.06)", fontSize: 13, color: "#8fe3a8" }}>
                💡 Tip: {step.tip}
              </p>
            )}
            {step.warning && (
              <p style={{ marginTop: 12, padding: "10px 14px", borderLeft: "3px solid #ffb43c", background: "rgba(255,180,60,0.06)", fontSize: 13, color: "#ffcf8c" }}>
                ⚠️ {step.warning}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

import Reveal from "@/components/Reveal";
import FaqAccordion from "@/components/FaqAccordion";
import { HbbDiagram, ObbDiagram } from "@/components/ObbDiagram";

const CAPABILITIES = [
  { icon: "🧠", title: "Multi-Model Detection", text: "Four detection modes, each backed by a purpose-trained YOLOv8-OBB model." },
  { icon: "📦", title: "Batch Processing", text: "Upload multiple images or a whole folder in one go." },
  { icon: "📈", title: "Performance Analytics", text: "Per-image and aggregate stats — time, FPS, density, object counts." },
  { icon: "👤", title: "User Accounts", text: "Optional login to save history; guest uploads auto-expire after 48h." },
  { icon: "☁️", title: "Cloud History", text: "Detection records persisted per account for later review." },
  { icon: "🔬", title: "Fine-Grained Classification", text: "Crops detected vehicles and re-classifies them via a FAIR1M-trained model." },
];

const USE_CASES = [
  { icon: "🚦", title: "Traffic & Urban Monitoring", text: "Count and classify vehicles across road networks from aerial imagery." },
  { icon: "🚢", title: "Port & Maritime Surveillance", text: "Track ships and vessel types in harbor and coastal imagery." },
  { icon: "🛰️", title: "Defense & Intelligence", text: "Identify oriented assets in satellite reconnaissance imagery." },
  { icon: "🌪️", title: "Disaster Assessment", text: "Rapidly survey affected areas and infrastructure after events." },
  { icon: "🏙️", title: "Urban & Infrastructure Planning", text: "Inventory buildings, courts, and facilities at scale." },
  { icon: "🎓", title: "Research & Academic Use", text: "A reference implementation for oriented object detection coursework." },
];

const TECH = ["YOLOv8 OBB", "Next.js", "FastAPI", "PyTorch", "OpenCV", "SQLAlchemy", "Python", "DOTA Dataset", "HRSC2016", "FAIR1M", "NumPy", "TypeScript"];

const TEAM = [
  { name: "Anudeep Gonuguntla", role: "Frontend & Deployment" },
  { name: "Khechara Sai Venkata Ramana Boppudi", role: "Deep Learning & Model Training" },
  { name: "Dhanoosh Reddy Devalapalle", role: "Testing & Database" },
  { name: "Nitya Sri Santoshini Nandanavanam", role: "Contributor" },
];

const FAQS = [
  { q: "What does RAVEN stand for?", a: "Rotated-Annotation Vehicle and Entity Network." },
  { q: "Which YOLO version does RAVEN use?", a: "YOLOv8 with an oriented bounding box (OBB) head, trained separately per dataset." },
  { q: "Do I need an account to use detection?", a: "No — detection works as a guest. Logging in additionally saves your history." },
  { q: "How long are guest uploads kept?", a: "Detection output images are retained for 48 hours before automatic cleanup." },
  { q: "What's the difference between DOTA-OBB and DOTA Fine-grained?", a: "Fine-grained mode runs a second FAIR1M-trained model on each detected vehicle crop to identify its precise subtype." },
  { q: "Can I export results?", a: "Yes — CSV, a branded PDF report, and a ZIP of annotated images are all available from the Detection page." },
  { q: "Is the model accurate on any aerial image?", a: "Accuracy depends on how close the input resembles the training distribution (altitude, resolution, object types)." },
  { q: "What is mAP50?", a: "Mean Average Precision at an IoU threshold of 0.5 — a standard detection accuracy metric." },
  { q: "Is this project open source?", a: "Built as an academic capstone project; check with the team for licensing details." },
  { q: "How do I report a bug?", a: "Use the suggestion form on the Discuss page." },
];

export default function AboutPage() {
  return (
    <div style={{ padding: "60px 80px 100px" }}>
      <Reveal>
        <span className="section-badge">ABOUT RAVEN</span>
        <h1 className="gradient-text" style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>
          Detection that never blinks.
        </h1>
        <p style={{ color: "var(--text-dim)", maxWidth: 700, marginBottom: 48, lineHeight: 1.7 }}>
          RAVEN is an orientation-aware object detection platform for aerial and satellite imagery,
          built on an enhanced YOLOv8-OBB framework and trained across DOTA, HRSC2016, and FAIR1M.
        </p>
      </Reveal>

      <Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 60 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 10 }}>What is RAVEN</h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>
              A web platform that lets you upload aerial imagery and detect objects with rotation-aware
              bounding boxes, across four purpose-built model modes.
            </p>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 10 }}>The Mission</h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>
              Make oriented object detection accessible and explainable — precise localization,
              transparent metrics, and results you can export and act on.
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>OBB vs HBB — why rotation matters</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <HbbDiagram />
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 10 }}>
              Horizontal boxes must grow to cover a rotated object, pulling in background pixels.
            </p>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <ObbDiagram />
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 10 }}>
              Oriented boxes rotate to match the object&apos;s true footprint — tighter, cleaner localization.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 60, flexWrap: "wrap" }}>
          <MiniStat val="~68%" label="HBB waste" />
          <MiniStat val="~8%" label="OBB waste" />
          <MiniStat val="8x" label="Tighter localization" />
          <MiniStat val="+θ" label="Rotation angle" />
        </div>
      </Reveal>

      <Reveal>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Platform Capabilities</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 60 }}>
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
              <h4 style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>{c.title}</h4>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{c.text}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Model Performance</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 60 }}>
          <PerfCard title="DOTA" val="0.657" note="15-class aerial detection, mAP50" />
          <PerfCard title="HRSC" val="0.983" note="Fine-tuned ship detection, mAP50" />
          <PerfCard title="FAIR1M" val="0.165" note="10-class vehicle fine-grained, mAP50" />
        </div>
      </Reveal>

      <Reveal>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Real-world use cases</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 60 }}>
          {USE_CASES.map((u) => (
            <div key={u.title} className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{u.icon}</div>
              <h4 style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>{u.title}</h4>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{u.text}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Built with</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 60 }}>
          {TECH.map((t, i) => (
            <span
              key={t}
              style={{
                fontSize: 12, padding: "6px 16px", borderRadius: 20,
                background: i % 2 === 0 ? "rgba(0,207,255,0.08)" : "rgba(102,68,255,0.1)",
                color: i % 2 === 0 ? "var(--cyan)" : "var(--purple)",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Built by</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 60 }}>
          {TEAM.map((m) => (
            <div key={m.name} className="card" style={{ padding: 20, textAlign: "center" }}>
              <div
                style={{
                  width: 52, height: 52, borderRadius: "50%", margin: "0 auto 12px",
                  background: "linear-gradient(135deg, var(--purple), var(--cyan))",
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff",
                }}
              >
                {m.name[0]}
              </div>
              <p style={{ fontWeight: 700, fontSize: 13 }}>{m.name}</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{m.role}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Frequently asked</h2>
        <div className="card" style={{ padding: "8px 24px" }}>
          <FaqAccordion items={FAQS} singleOpen />
        </div>
      </Reveal>
    </div>
  );
}

function MiniStat({ val, label }: { val: string; label: string }) {
  return (
    <div className="card" style={{ padding: "12px 20px", textAlign: "center" }}>
      <p style={{ fontWeight: 700, color: "var(--cyan)" }}>{val}</p>
      <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</p>
    </div>
  );
}

function PerfCard({ title, val, note }: { title: string; val: string; note: string }) {
  return (
    <div className="card" style={{ padding: 24, textAlign: "center" }}>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>{title}</p>
      <p style={{ fontSize: 34, fontWeight: 800, color: "var(--cyan)" }}>{val}</p>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>{note}</p>
    </div>
  );
}

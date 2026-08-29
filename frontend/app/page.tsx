import Link from "next/link";
import Reveal from "@/components/Reveal";

const FEATURES = [
  { icon: "🎯", title: "Object Detection", desc: "Run YOLOv8-OBB across 4 modes on your own aerial imagery.", href: "/detection" },
  { icon: "🗂️", title: "Datasets", desc: "Explore DOTA, HRSC2016, and FAIR1M — the data behind RAVEN.", href: "/datasets" },
  { icon: "🕓", title: "Detection History", desc: "Every run is saved to your account — revisit results anytime.", href: "/history" },
  { icon: "ℹ️", title: "About RAVEN", desc: "The mission, the models, and the team behind the project.", href: "/about" },
];

const STEPS = [
  { n: 1, title: "Upload Imagery", desc: "Drop in one or more aerial images, or a whole folder.", chips: ["JPG", "PNG", "TIFF", "Folder"] },
  { n: 2, title: "Choose a Model", desc: "Pick the detection mode that matches your imagery.", chips: ["Standard", "DOTA-OBB", "HRSC-OBB", "Fine-grained"] },
  { n: 3, title: "Download Results", desc: "Export annotated images, reports, or the raw data.", chips: ["Annotated PNG", "PDF Report", "CSV Export", "ZIP Archive"] },
];

export default function HomePage() {
  return (
    <div>
      {/* ── HERO ── */}
      <section
        className="hero-section"
        style={{
          minHeight: 620,
          background: "linear-gradient(rgba(3,2,12,0.55), rgba(3,2,12,0.75)), url('/ui/aerial.jpg') center/cover no-repeat",
          display: "flex",
          alignItems: "center",
          padding: "0 80px",
          position: "relative",
        }}
      >
        <div style={{ maxWidth: 640 }}>
          <span className="section-badge">RAVEN — AERIAL OBJECT DETECTION</span>
          <h1 className="gradient-text" style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, margin: "10px 0 20px" }}>
            Detection that never blinks.
          </h1>
          <p style={{ color: "var(--text-dim)", fontSize: 16, lineHeight: 1.7, marginBottom: 28 }}>
            RAVEN — Rotated-Annotation Vehicle and Entity Network — detects oriented objects in
            aerial and satellite imagery using an enhanced YOLOv8-OBB framework, trained on DOTA
            and HRSC2016.
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            <Link href="/detection" className="btn-primary">Run Detection →</Link>
            <Link href="/datasets" className="btn-secondary">Explore Datasets</Link>
          </div>
        </div>

        <div
          className="card hero-stats-panel"
          style={{
            position: "absolute", right: 60, bottom: -40, padding: 20,
            display: "flex", gap: 24, background: "rgba(13,11,34,0.85)", backdropFilter: "blur(10px)",
          }}
        >
          <HeroStat val="0.983" label="HRSC mAP50" />
          <HeroStat val="0.657" label="DOTA mAP50" />
          <HeroStat val="4" label="Detection Modes" />
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section style={{ background: "var(--bg-dark)", padding: "80px 80px 60px", display: "flex", justifyContent: "space-around", textAlign: "center", flexWrap: "wrap", gap: 20 }}>
        <StatBand val="72,453" label="Vehicle Annotations" />
        <StatBand val="15" label="DOTA Classes" />
        <StatBand val="1,732" label="FAIR1M Images" />
        <StatBand val="OBB" label="Oriented Bounding Box" />
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "80px", background: "var(--bg-dark)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={((i % 4) + 1) as 1 | 2 | 3 | 4}>
              <Link href={f.href} className="card" style={{ display: "block", padding: 24, height: "100%" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>{f.desc}</p>
                <span style={{ fontSize: 13, color: "var(--cyan)" }}>Learn more →</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "80px" }}>
        <Reveal>
          <h2 style={{ fontSize: 30, fontWeight: 700, textAlign: "center", marginBottom: 48 }}>How it works</h2>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, position: "relative" }}>
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={((i % 4) + 1) as 1 | 2 | 3 | 4}>
              <div className="card" style={{ padding: 28, textAlign: "center", height: "100%" }}>
                <div
                  style={{
                    width: 44, height: 44, borderRadius: "50%", margin: "0 auto 16px",
                    background: "linear-gradient(135deg, var(--purple), var(--cyan))",
                    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff",
                  }}
                >
                  {s.n}
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>{s.desc}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                  {s.chips.map((c) => (
                    <span key={c} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 12, background: "var(--bg-panel)", color: "var(--text-muted)" }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section
        style={{
          margin: "40px 80px 100px", padding: "60px 40px", borderRadius: 24, textAlign: "center",
          background: "linear-gradient(135deg, var(--purple-dark), var(--purple))",
        }}
      >
        <h2 style={{ fontSize: 30, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Ready to detect?</h2>
        <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: 28 }}>
          Upload an aerial image and see oriented object detection in action.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <Link href="/detection" className="btn-primary" style={{ background: "#fff", color: "var(--purple-dark)" }}>
            Start Detection →
          </Link>
          <Link href="/register" className="btn-secondary" style={{ borderColor: "rgba(255,255,255,0.5)", color: "#fff" }}>
            Create Free Account
          </Link>
        </div>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 16 }}>No credit card • Free forever</p>
      </section>
    </div>
  );
}

function HeroStat({ val, label }: { val: string; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: 20, fontWeight: 700, color: "var(--cyan)" }}>{val}</p>
      <p style={{ fontSize: 10, color: "var(--text-muted)" }}>{label}</p>
    </div>
  );
}

function StatBand({ val, label }: { val: string; label: string }) {
  return (
    <div>
      <p style={{ fontSize: 30, fontWeight: 800, color: "var(--cyan)", fontFamily: "var(--font-mono-brand)" }}>{val}</p>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{label}</p>
    </div>
  );
}

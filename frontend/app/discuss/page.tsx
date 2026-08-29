"use client";

import { useState } from "react";

const TEAM = [
  { name: "Anudeep Gonuguntla", role: "Frontend & Deployment", accent: "var(--cyan)" },
  { name: "Khechara Sai Venkata Ramana Boppudi", role: "Deep Learning & Model Training", accent: "var(--purple)" },
  { name: "Dhanoosh Reddy Devalapalle", role: "Testing & Database", accent: "var(--cyan)" },
  { name: "Nitya Sri Santoshini Nandanavanam", role: "Contributor", accent: "var(--purple)" },
];

const ROADMAP = [
  { title: "Real-time video detection", tag: "PLANNED" },
  { title: "Full FAIR1M dataset training", tag: "PLANNED" },
  { title: "Heatmap & density visualisation", tag: "SUGGESTION" },
  { title: "Analytics dashboard", tag: "PLANNED" },
  { title: "API access", tag: "SUGGESTION" },
  { title: "Custom model upload", tag: "SUGGESTION" },
];

const CATEGORIES = [
  { key: "Bug Report", icon: "🐛" },
  { key: "Feature Request", icon: "💡" },
  { key: "Collaborate", icon: "🤝" },
];

export default function DiscussPage() {
  const [category, setCategory] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  async function submit() {
    if (!message.trim()) {
      setStatus("error");
      setStatusMsg("Please write a message first.");
      return;
    }
    setStatus("sending");
    const formData = new FormData();
    formData.append("category", category ?? "General");
    formData.append("message", message);
    const res = await fetch("/api/contact", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({ status: "error", msg: "Failed to send." }));
    if (data.status === "ok") {
      setStatus("sent");
    } else {
      setStatus("error");
      setStatusMsg(data.msg || "Failed to send. Try again later.");
    }
  }

  function reset() {
    setStatus("idle");
    setMessage("");
    setCategory(null);
  }

  return (
    <div style={{ padding: "60px 80px 100px" }}>
      <span className="section-badge">DISCUSS</span>
      <h1 className="gradient-text" style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>
        Talk to the team.
      </h1>
      <p style={{ color: "var(--text-dim)", maxWidth: 700, marginBottom: 48, lineHeight: 1.7 }}>
        Questions, bug reports, or ideas for RAVEN — reach out below or send a suggestion directly.
      </p>

      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Contact the team</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 60 }}>
        {TEAM.map((m) => (
          <div key={m.name} className="card" style={{ padding: 20, textAlign: "center" }}>
            <div
              style={{
                width: 48, height: 48, borderRadius: "50%", margin: "0 auto 10px",
                background: `linear-gradient(135deg, var(--purple), ${m.accent})`,
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff",
              }}
            >
              {m.name[0]}
            </div>
            <p style={{ fontWeight: 700, fontSize: 13 }}>{m.name}</p>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>{m.role}</p>
            <p style={{ fontSize: 11, color: m.accent }}>team.ravendetections@gmail.com</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Roadmap</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 60 }}>
        {ROADMAP.map((r) => (
          <div key={r.title} className="card" style={{ padding: 20 }}>
            <span
              style={{
                fontSize: 10, padding: "3px 10px", borderRadius: 12,
                background: r.tag === "PLANNED" ? "rgba(0,207,255,0.1)" : "rgba(74,222,128,0.1)",
                color: r.tag === "PLANNED" ? "var(--cyan)" : "#4ade80",
              }}
            >
              {r.tag}
            </span>
            <p style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>{r.title}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Send a suggestion</h2>

      <div className="card" style={{ padding: 32, maxWidth: 600 }}>
        {status === "sent" ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>✅</p>
            <p style={{ fontWeight: 700, marginBottom: 6 }}>Suggestion sent!</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Thanks for helping improve RAVEN.</p>
            <button onClick={reset} className="btn-secondary">Send another</button>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  style={{
                    padding: "16px 8px", borderRadius: 10, textAlign: "center", cursor: "pointer",
                    border: category === c.key ? "1px solid var(--border-hover)" : "1px solid var(--border)",
                    background: category === c.key ? "rgba(102,68,255,0.1)" : "var(--bg-panel)",
                    color: "var(--text)",
                  }}
                >
                  <div style={{ fontSize: 20 }}>{c.icon}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>{c.key}</div>
                </button>
              ))}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's on your mind?"
              rows={5}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)",
                background: "var(--bg-panel)", color: "var(--text)", fontSize: 14, resize: "vertical", marginBottom: 10,
              }}
            />

            {status === "error" && <p style={{ color: "#ff8080", fontSize: 13, marginBottom: 10 }}>{statusMsg}</p>}

            <button onClick={submit} disabled={status === "sending"} className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              {status === "sending" ? "Sending..." : "Send Suggestion →"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

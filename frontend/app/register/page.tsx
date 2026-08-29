"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name: fullName || null }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not create account.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 90px)" }}>
      <div className="card" style={{ maxWidth: 420, width: "100%", padding: 40 }}>
        <h1 className="text-2xl font-bold mb-1">Create account</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
          Join RAVEN — your detections stay private
        </p>

        {error && (
          <div
            style={{
              background: "rgba(255,80,80,0.1)",
              border: "1px solid rgba(255,80,80,0.3)",
              color: "#ff8080",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Full name">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Email">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Password (min 6 chars)">
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Confirm password">
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inputStyle} />
          </Field>
          <button type="submit" className="btn-primary justify-center" disabled={busy}>
            {busy ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
          Already have an account? <Link href="/login" style={{ color: "var(--cyan)" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--bg-panel)",
  color: "var(--text)",
  fontSize: 14,
  outline: "none",
};

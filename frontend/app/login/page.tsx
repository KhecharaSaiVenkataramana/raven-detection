"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Invalid email or password.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 90px)" }}>
      <div className="card" style={{ maxWidth: 420, width: "100%", padding: 40 }}>
        <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
          Sign in to your RAVEN account
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
          <div>
            <label className="block text-sm mb-1" style={{ color: "var(--text-muted)" }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: "var(--text-muted)" }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              style={inputStyle}
            />
          </div>
          <button type="submit" className="btn-primary justify-center" disabled={busy}>
            {busy ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
          Don&apos;t have an account? <Link href="/register" style={{ color: "var(--cyan)" }}>Register</Link>
        </p>
      </div>
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

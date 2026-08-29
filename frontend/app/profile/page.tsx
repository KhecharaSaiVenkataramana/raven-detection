import Link from "next/link";
import { apiJson } from "@/lib/api";
import type { StatsResponse, UserOut } from "@/lib/types";

export default async function ProfilePage() {
  const [user, stats] = await Promise.all([
    apiJson<UserOut>("/auth/me"),
    apiJson<StatsResponse>("/history/stats"),
  ]);

  if (!user) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <p>Session expired. <Link href="/login" style={{ color: "var(--cyan)" }}>Log in again</Link></p>
      </div>
    );
  }

  const initial = (user.full_name || user.email)[0].toUpperCase();

  return (
    <div style={{ padding: "40px 60px 80px", maxWidth: 720, margin: "0 auto" }}>
      <div className="card" style={{ padding: 32, display: "flex", alignItems: "center", gap: 24, marginBottom: 24 }}>
        <div
          style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--purple), var(--cyan))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 700, color: "#fff",
          }}
        >
          {initial}
        </div>
        <div>
          <h1 className="text-xl font-bold">{user.full_name || user.email}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>{user.email}</p>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            Joined {new Date(user.created_at).toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatTile label="Total detections" value={String(stats?.total ?? 0)} />
        <StatTile label="Objects found" value={String(stats?.total_objects ?? 0)} />
        <StatTile label="Avg inference" value={`${Math.round(stats?.avg_ms ?? 0)}ms`} />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/history" className="btn-secondary">View my history</Link>
        <Link href="/detection" className="btn-primary">Run new detection</Link>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ padding: 20, textAlign: "center" }}>
      <p style={{ fontSize: 26, fontWeight: 700, color: "var(--cyan)" }}>{value}</p>
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{label}</p>
    </div>
  );
}

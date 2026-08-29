import Link from "next/link";
import { apiJson } from "@/lib/api";
import type { HistoryResponse } from "@/lib/types";
import HistoryTable from "@/components/HistoryTable";

export default async function HistoryPage() {
  const data = await apiJson<HistoryResponse>("/history?limit=50");
  const loggedIn = data !== null;

  return (
    <div style={{ padding: "40px 60px 80px" }}>
      <h1 className="text-2xl font-bold mb-1">Detection History</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
        {loggedIn
          ? "All images processed — saved to your account. Showing the last 50 results."
          : "Login or register to see your personal detection history."}
      </p>

      {!loggedIn && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <p style={{ marginBottom: 12 }}>Sign in to view your saved detection history.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/login" className="btn-primary">Login</Link>
            <Link href="/register" className="btn-secondary">Register</Link>
          </div>
        </div>
      )}

      {loggedIn && data.images.length === 0 && (
        <div className="card" style={{ padding: 24 }}>
          <p>No detections yet. <Link href="/detection" style={{ color: "var(--cyan)" }}>Run your first detection →</Link></p>
        </div>
      )}

      {loggedIn && data.images.length > 0 && <HistoryTable images={data.images} />}
    </div>
  );
}

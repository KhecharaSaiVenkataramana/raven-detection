import Link from "next/link";
import { apiJson } from "@/lib/api";
import type { IncidentListResponse } from "@/lib/types";
import IncidentDisclaimerBanner from "@/components/IncidentDisclaimerBanner";

export default async function IncidentsPage() {
  const data = await apiJson<IncidentListResponse>("/incidents");
  const loggedIn = data !== null;

  return (
    <div style={{ padding: "40px 60px 80px" }}>
      <IncidentDisclaimerBanner />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h1 className="text-2xl font-bold">Incidents</h1>
        {loggedIn && (
          <Link href="/incidents/new" className="btn-primary" style={{ padding: "8px 18px", fontSize: 13 }}>
            New Incident
          </Link>
        )}
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
        {loggedIn
          ? "Scene documentation for post-accident aerial photos — positions and headings only."
          : "Login to create and manage incidents."}
      </p>

      {!loggedIn && (
        <div className="card" style={{ padding: 24 }}>
          <p style={{ marginBottom: 12 }}>Sign in to view or create incidents.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/login" className="btn-primary">Login</Link>
            <Link href="/register" className="btn-secondary">Register</Link>
          </div>
        </div>
      )}

      {loggedIn && data.incidents.length === 0 && (
        <div className="card" style={{ padding: 24 }}>
          <p>
            No incidents yet.{" "}
            <Link href="/incidents/new" style={{ color: "var(--cyan)" }}>Start your first incident →</Link>
          </p>
        </div>
      )}

      {loggedIn && data.incidents.length > 0 && (
        <div className="card" style={{ overflowX: "auto", padding: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 700 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--text-muted)" }}>
                <th style={th}>Title</th>
                <th style={th}>Reference</th>
                <th style={th}>Status</th>
                <th style={th}>Evidence</th>
                <th style={th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.incidents.map((inc) => (
                <tr key={inc.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={td}>
                    <Link href={`/incidents/${inc.id}`} style={{ color: "var(--cyan)" }}>
                      {inc.title}
                    </Link>
                  </td>
                  <td style={td}>{inc.reference_code ?? "—"}</td>
                  <td style={td}>
                    <span style={statusPill(inc.status)}>{inc.status}</span>
                  </td>
                  <td style={td}>{inc.evidence.length}</td>
                  <td style={td}>{new Date(inc.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function statusPill(status: string): React.CSSProperties {
  const colorByStatus: Record<string, string> = {
    open: "var(--cyan)",
    documented: "var(--purple)",
    analyzed: "#16c9a8",
    closed: "var(--text-muted)",
  };
  const color = colorByStatus[status] ?? "var(--cyan)";
  return {
    padding: "2px 10px",
    borderRadius: 12,
    fontSize: 11,
    background: `color-mix(in srgb, ${color} 15%, transparent)`,
    color,
  };
}

const th: React.CSSProperties = { padding: "10px 12px", fontWeight: 600, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "10px 12px", whiteSpace: "nowrap" };

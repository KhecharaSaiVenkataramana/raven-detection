import { getAuthToken } from "@/lib/auth";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

// The backend report.pdf endpoint requires auth (Bearer token), so a plain
// <a href="/backend/..."> can't reach it — the browser navigation wouldn't
// carry the httpOnly cookie as an Authorization header. This route proxies
// the download server-side, attaching the token the same way apiFetch does.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getAuthToken();

  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/incidents/${id}/report.pdf`, { headers });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: "Could not generate report." }));
    return Response.json({ error: data.detail || "Could not generate report." }, { status: res.status });
  }

  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": res.headers.get("Content-Disposition") || "attachment; filename=raven_scene_report.pdf",
    },
  });
}

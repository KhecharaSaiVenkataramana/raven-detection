import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await request.formData();
  const token = await getAuthToken();

  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/incidents/${id}/evidence/scene-photo`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await res.json().catch(() => ({ detail: "Scene photo detection failed." }));
  if (!res.ok) {
    return NextResponse.json({ error: data.detail || "Scene photo detection failed." }, { status: res.status });
  }
  return NextResponse.json(data);
}

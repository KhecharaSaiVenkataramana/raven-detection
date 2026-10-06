import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

export async function POST(request: Request) {
  const body = await request.json();
  const token = await getAuthToken();

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/incidents`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({ detail: "Could not create incident." }));
  if (!res.ok) {
    return NextResponse.json({ error: data.detail || "Could not create incident." }, { status: res.status });
  }
  return NextResponse.json(data);
}

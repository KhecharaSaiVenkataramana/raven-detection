import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/auth";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

export async function POST(request: Request) {
  const formData = await request.formData();
  const token = await getAuthToken();

  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await res.json().catch(() => ({ detail: "Detection failed." }));
  if (!res.ok) {
    return NextResponse.json({ error: data.detail || "Detection failed." }, { status: res.status });
  }
  return NextResponse.json(data);
}

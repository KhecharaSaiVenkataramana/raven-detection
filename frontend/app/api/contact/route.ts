import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

export async function POST(request: Request) {
  const formData = await request.formData();

  const res = await fetch(`${API_BASE_URL}/contact`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json().catch(() => ({ status: "error", msg: "Failed to send. Try again later." }));
  return NextResponse.json(data, { status: res.ok ? 200 : res.status });
}

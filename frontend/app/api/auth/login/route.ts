import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

export async function POST(request: Request) {
  const body = await request.json();

  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Invalid username or password." }));
    return NextResponse.json({ error: err.detail || "Login failed." }, { status: res.status });
  }

  const data = await res.json();
  const response = NextResponse.json({ email: data.email, user_id: data.user_id });
  response.cookies.set(AUTH_COOKIE, data.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 24h, matches the backend token expiry
  });
  return response;
}

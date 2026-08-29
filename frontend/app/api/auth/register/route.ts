import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

export async function POST(request: Request) {
  const body = await request.json();

  const registerRes = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!registerRes.ok) {
    const err = await registerRes.json().catch(() => ({ detail: "Could not create account." }));
    return NextResponse.json({ error: err.detail || "Registration failed." }, { status: registerRes.status });
  }

  // Registration succeeded — log the user in immediately, same as the Flask app did.
  const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password }),
  });
  if (!loginRes.ok) {
    return NextResponse.json({ error: "Account created — please log in." }, { status: 200 });
  }

  const data = await loginRes.json();
  const response = NextResponse.json({ email: data.email, user_id: data.user_id });
  response.cookies.set(AUTH_COOKIE, data.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}

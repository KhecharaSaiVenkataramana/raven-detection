import { getAuthToken } from "./auth";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

/** Server-side fetch to the FastAPI backend, forwarding the JWT from the httpOnly cookie. */
export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = await getAuthToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${API_BASE_URL}${path}`, { ...init, headers, cache: "no-store" });
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  const res = await apiFetch(path, init);
  if (!res.ok) return null;
  return (await res.json()) as T;
}

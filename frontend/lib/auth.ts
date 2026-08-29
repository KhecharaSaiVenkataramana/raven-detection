import { cookies } from "next/headers";

export const AUTH_COOKIE = "raven_token";

/** Server-side only — reads the JWT from the httpOnly cookie. Never exposed to client JS. */
export async function getAuthToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE)?.value ?? null;
}

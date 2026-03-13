import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "admin_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "change-me-in-production";

export function signSession(username: string): string {
  return createHmac("sha256", SESSION_SECRET).update(username).digest("hex");
}

export function verifySession(token: string, username: string): boolean {
  const expected = signSession(username);
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export async function getAdminSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const usernameCookie = cookieStore.get(COOKIE_NAME + "_user")?.value;
  if (!token || !usernameCookie) return null;
  const username = decodeURIComponent(usernameCookie);
  if (!verifySession(token, username)) return null;
  return username;
}

export async function setAdminSession(username: string): Promise<void> {
  const cookieStore = await cookies();
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  };
  cookieStore.set(COOKIE_NAME, signSession(username), opts);
  cookieStore.set(COOKIE_NAME + "_user", encodeURIComponent(username), opts);
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(COOKIE_NAME + "_user");
}

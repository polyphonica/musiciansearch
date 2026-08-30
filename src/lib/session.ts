import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "session";

function sign(userId: string): string {
  const hmac = createHmac("sha256", process.env.SESSION_SECRET!)
    .update(userId)
    .digest("base64url");
  return `${userId}.${hmac}`;
}

function verify(token: string): string | null {
  const [userId, signature] = token.split(".");
  if (!userId || !signature) return null;
  const expected = createHmac("sha256", process.env.SESSION_SECRET!)
    .update(userId)
    .digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return userId;
}

export async function createSession(userId: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, sign(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verify(token);
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

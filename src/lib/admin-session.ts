import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "admin_session";
const MAX_AGE = 60 * 5; // 5 minutes

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "Missing or invalid ADMIN_SESSION_SECRET (min 16 chars). Add to .env or .env.local."
    );
  }
  return secret;
}

function sign(payload: string): string {
  const secret = getSecret();
  const hmac = createHmac("sha256", secret);
  hmac.update(payload);
  return hmac.digest("base64url");
}

export type AdminSessionPayload = {
  username: string;
  role: string;
  exp: number;
};

export function createSessionToken(payload: AdminSessionPayload): string {
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr, "utf8").toString("base64url");
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string): AdminSessionPayload | null {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return null;
    const expectedSig = sign(payloadB64);
    if (
      expectedSig.length !== signature.length ||
      !timingSafeEqual(Buffer.from(expectedSig), Buffer.from(signature))
    ) {
      return null;
    }
    const payloadStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(payloadStr) as AdminSessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) {
      return null;
    }
    if (typeof payload.username !== "string" || typeof payload.role !== "string") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function setAdminSession(payload: Omit<AdminSessionPayload, "exp">) {
  const cookieStore = await cookies();
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const token = createSessionToken({ ...payload, exp });
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

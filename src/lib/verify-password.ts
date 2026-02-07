import { compare, hash } from "bcryptjs";
import { timingSafeEqual } from "crypto";

const BCRYPT_PREFIX = "$2";
const SALT_ROUNDS = 10;

/**
 * Verify plain password against stored value.
 * Supports bcrypt hashes (recommended) or plain text (legacy; timing-safe compare).
 */
export async function verifyPassword(
  plain: string,
  stored: string
): Promise<boolean> {
  if (stored.startsWith(BCRYPT_PREFIX)) {
    return compare(plain, stored);
  }
  if (plain.length !== stored.length) return false;
  try {
    const a = Buffer.from(plain, "utf8");
    const b = Buffer.from(stored, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Hash a plain password for storage. Use this when creating or updating credentials.
 */
export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, SALT_ROUNDS);
}

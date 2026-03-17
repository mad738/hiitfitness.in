const DETAIL_FIELDS = ["message", "error", "error_description", "details", "hint", "statusText"] as const;
const CODE_FIELDS = ["status", "code"] as const;

function collectDetails(source: Record<string, unknown>, skip: Set<string>): string[] {
  const chunks: string[] = [];
  for (const field of DETAIL_FIELDS) {
    if (skip.has(field)) continue;
    const value = source[field];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) chunks.push(trimmed);
    }
  }
  for (const field of CODE_FIELDS) {
    if (skip.has(field)) continue;
    const value = source[field];
    if (value === null || value === undefined) continue;
    const trimmed = String(value).trim();
    if (trimmed) {
      chunks.push(`${field}: ${trimmed}`);
    }
  }
  return chunks;
}

function ensureObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Builds a human-friendly explanation for an unknown error so UI copy can surface meaningful details.
 */
export function explainError(error: unknown, fallback: string): string {
  if (!error && error !== 0) return fallback;

  if (error instanceof Error) {
    const base = typeof error.message === "string" ? error.message.trim() : "";
    const extras = collectDetails(error as Record<string, unknown>, new Set(base ? ["message"] : []));
    const parts = [base, ...extras].filter((part) => part && part.length > 0);
    return parts.length > 0 ? parts.join(" ") : fallback;
  }

  if (typeof error === "string") {
    const trimmed = error.trim();
    return trimmed || fallback;
  }

  if (ensureObject(error)) {
    const parts = collectDetails(error, new Set());
    return parts.length > 0 ? parts.join(" ") : fallback;
  }

  return fallback;
}

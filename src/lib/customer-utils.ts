/** Normalize mobile for uniqueness: trim and remove spaces. Empty string for null/blank. */
export function normalizeMobile(m: string | null | undefined): string {
  if (m == null) return "";
  return (m + "").trim().replace(/\s/g, "") || "";
}

/** One entry per unique mobile (keep most recent by start_date then created_at). Rows with empty mobile are kept as-is. */
export function dedupeByMobile<
  T extends { id?: string; mobile?: string | null; start_date?: string | null; created_at?: string }
>(rows: T[]): T[] {
  const byMobile = new Map<string, T>();
  let emptyIndex = 0;
  for (const row of rows) {
    const key = normalizeMobile(row.mobile);
    if (!key) {
      byMobile.set(`__empty_${row.id ?? emptyIndex++}`, row);
      continue;
    }
    const existing = byMobile.get(key);
    if (!existing) {
      byMobile.set(key, row);
      continue;
    }
    const rowStart = row.start_date ?? row.created_at ?? "";
    const existingStart = existing.start_date ?? existing.created_at ?? "";
    
    const rowStartMs = parseDateToMs(rowStart);
    const existingStartMs = parseDateToMs(existingStart);

    if (rowStartMs > existingStartMs) byMobile.set(key, row);
  }
  return Array.from(byMobile.values());
}

function parseDateToMs(dStr: string): number {
  if (!dStr) return 0;
  if (dStr.includes("/")) {
    const [d, m, y] = dStr.split("/").map(Number);
    return new Date(y, m - 1, d).getTime();
  }
  return new Date(dStr).getTime() || 0;
}

/** True if today is within [start, end] (inclusive). */
export function isPlanCurrentlyRunning(startDate: string | null, endDate: string | null): boolean {
  if (!startDate || !endDate) return false;
  try {
    const startMs = parseDateToMs(startDate);
    const endMs = parseDateToMs(endDate);
    if (!startMs || !endMs) return false;

    const start = new Date(startMs);
    const end = new Date(endMs);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return today >= start && today <= end;
  } catch {
    return false;
  }
}

export function parseFlexibleDate(value: string): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) year += year < 50 ? 2000 : 1900;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

export function normalizeDateForStorage(value: string, label?: string): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  const iso = parseFlexibleDate(trimmed);
  if (!iso) {
    const field = label ?? "Date";
    throw new Error(`${field} must be in YYYY-MM-DD or DD/MM/YYYY format (received "${value}").`);
  }
  return iso;
}

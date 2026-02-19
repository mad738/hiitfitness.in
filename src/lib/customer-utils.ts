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
    if (rowStart > existingStart) byMobile.set(key, row);
  }
  return Array.from(byMobile.values());
}

/** True if today is within [start, end] (inclusive). */
export function isPlanCurrentlyRunning(startDate: string | null, endDate: string | null): boolean {
  if (!startDate || !endDate) return false;
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return today >= start && today <= end;
  } catch {
    return false;
  }
}

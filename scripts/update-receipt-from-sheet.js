/**
 * Update customers.receipt from the "false" column in TRAIL TRACKER.xlsx.
 * Uses same client resolution as import (merged Client Name, latest row by End Date).
 * Run: node scripts/update-receipt-from-sheet.js "b:\Downloads\TRAIL TRACKER.xlsx"
 */
const path = require("path");
const fs = require("fs");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const XLSX = require("xlsx");
const { createClient } = require("@supabase/supabase-js");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const excelPath = process.argv[2] || path.join(__dirname, "..", "TRAIL TRACKER.xlsx");
if (!fs.existsSync(excelPath)) {
  console.error("File not found:", excelPath);
  process.exit(1);
}

function toBool(val) {
  if (val == null || val === "") return false;
  const s = String(val).toLowerCase().trim();
  if (s === "true" || s === "1" || s === "yes") return true;
  if (s === "false" || s === "0" || s === "no") return false;
  return Boolean(val);
}

function getMergedCellValue(ws, sheetRow, colIndex) {
  const merges = ws["!merges"] || [];
  for (const m of merges) {
    if (sheetRow >= m.s.r && sheetRow <= m.e.r && colIndex >= m.s.c && colIndex <= m.e.c) {
      const topLeft = ws[XLSX.utils.encode_cell(m.s)];
      if (topLeft && topLeft.v != null && String(topLeft.v).trim() !== "") return topLeft.v;
      return undefined;
    }
  }
  const cell = ws[XLSX.utils.encode_cell({ r: sheetRow, c: colIndex })];
  return cell && cell.v != null ? cell.v : undefined;
}

function toStr(val) {
  if (val == null || val === "") return null;
  const s = String(val).trim();
  return s === "" ? null : s;
}

async function main() {
  const wb = XLSX.readFile(excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const headers = (rows[0] || []).map((h) => (h != null ? String(h).trim() : ""));

  const col = (name) => headers.indexOf(name);
  const falseCol = col("false");
  if (falseCol < 0) {
    console.error('Column "false" not found. Headers:', headers.slice(0, 25));
    process.exit(1);
  }

  const clientIdCol = col("Client ID");
  const clientNameCol = col("Client Name");
  const endDateCol = col("End Date");

  const clientToReceipt = new Map(); // customer name (as in DB) -> receipt boolean

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rawName = getMergedCellValue(ws, i, clientNameCol) ?? row[clientNameCol];
    const clientName = toStr(rawName);
    const clientId = toStr(row[clientIdCol]);
    const endDateRaw = row[endDateCol];
    const endDateNum = endDateRaw != null && typeof endDateRaw === "number" ? endDateRaw : null;
    const receipt = toBool(row[falseCol]);

    if (!clientName && !clientId) continue;

    const name = clientName || clientId;
    const key = (clientId || "") + "|" + (clientName || "");
    const existing = clientToReceipt.get(key);
    const useThis =
      existing === undefined ||
      (endDateNum != null && (existing.endDateNum == null || endDateNum >= existing.endDateNum));
    if (useThis) {
      clientToReceipt.set(key, { name, receipt, endDateNum });
    }
  }

  // Array of receipt in same order as import (Map iteration order = one per customer)
  const sheetReceipts = [];
  for (const [, v] of clientToReceipt) {
    sheetReceipts.push(v.receipt);
  }

  console.log("Sheet client rows (same order as import):", sheetReceipts.length);
  const supabase = createClient(url, serviceKey);

  // Customers in insertion order (created_at asc) to match import order. Fetch all (Supabase default limit is 1000).
  const custList = [];
  const PAGE = 1000;
  let from = 0;
  for (;;) {
    const { data: page, error: listError } = await supabase
      .from("customers")
      .select("id, name, created_at")
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (listError) {
      console.error("List customers error:", listError.message);
      process.exit(1);
    }
    if (!page?.length) break;
    custList.push(...page);
    if (page.length < PAGE) break;
    from += PAGE;
  }
  if (custList.length !== sheetReceipts.length) {
    console.warn(
      "Count mismatch: sheet has",
      sheetReceipts.length,
      "clients, DB has",
      custList.length,
      "customers."
    );
  }

  const BATCH = 100;
  let updated = 0;
  for (let i = 0; i < custList.length; i += BATCH) {
    const batch = custList.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((c, j) => {
        const receipt = i + j < sheetReceipts.length ? sheetReceipts[i + j] : (sheetReceipts[sheetReceipts.length - 1] ?? false);
        return supabase.from("customers").update({ receipt }).eq("id", c.id);
      })
    );
    const errors = results.filter((r) => r.error);
    if (errors.length) errors.forEach((r) => console.error(r.error?.message));
    updated += batch.length;
    console.log("Updated", updated, "/", custList.length);
  }
  console.log("Done. Updated receipt for", updated, "customers.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

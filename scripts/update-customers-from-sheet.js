/**
 * Update all customers columns from TRAIL TRACKER.xlsx.
 * Uses same client resolution as import (merged Client Name, latest row by End Date).
 * Run: node scripts/update-customers-from-sheet.js "b:\Downloads\TRAIL TRACKER.xlsx"
 */
const path = require("path");
const fs = require("fs");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const XLSX = require("xlsx");
const { createClient } = require("@supabase/supabase-js");
const { SHEET_TO_CUSTOMERS, DATE_COLS, NUM_COLS, BOOL_COLS } = require("./sheet-column-map.js");

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

function excelDateToISO(val) {
  if (val == null || val === "") return null;
  const n = Number(val);
  if (Number.isNaN(n)) return null;
  const date = new Date((n - 25569) * 86400 * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function toNum(val) {
  if (val == null || val === "") return null;
  const n = Number(val);
  return Number.isNaN(n) ? null : n;
}

function toStr(val) {
  if (val == null || val === "") return null;
  const s = String(val).trim();
  return s === "" ? null : s;
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

/** Build customer payload from sheet row using all mapped columns */
function rowToCustomerPayload(row, headers, ws, rowIndex, trainerIdByName) {
  const payload = {};
  const plan = toStr(row[headers.indexOf("Plan")]) || "GT";
  const trainerName = toStr(row[headers.indexOf("Trainer Name")]);
  if (plan === "PT" && trainerName && trainerIdByName[trainerName]) {
    payload.trainer_id = trainerIdByName[trainerName];
  } else {
    payload.trainer_id = null;
  }

  for (const [sheetHeader, dbCol] of Object.entries(SHEET_TO_CUSTOMERS)) {
    if (dbCol == null) continue;
    const ci = headers.indexOf(sheetHeader);
    if (ci < 0) continue;
    let raw = row[ci];
    if (dbCol === "name" && (raw == null || String(raw).trim() === "")) {
      const clientNameCol = headers.indexOf("Client Name");
      if (clientNameCol >= 0 && ws) raw = getMergedCellValue(ws, rowIndex, clientNameCol) ?? row[clientNameCol];
    }
    if (DATE_COLS.includes(dbCol)) {
      payload[dbCol] = excelDateToISO(raw);
    } else if (NUM_COLS.includes(dbCol)) {
      const n = toNum(raw);
      payload[dbCol] = n != null ? n : (dbCol === "balance" ? 0 : 0);
    } else if (BOOL_COLS.includes(dbCol)) {
      payload[dbCol] = toBool(raw);
    } else {
      payload[dbCol] = toStr(raw);
    }
  }

  if (payload.name == null || payload.name === "") {
    const clientId = toStr(row[headers.indexOf("Client ID")]);
    payload.name = clientId || "Unknown";
  }
  if (payload.plan == null) payload.plan = "GT";
  if (payload.total_fee == null) payload.total_fee = 0;
  if (payload.paid_fee == null) payload.paid_fee = 0;
  if (payload.balance == null) payload.balance = 0;

  return payload;
}

async function main() {
  const wb = XLSX.readFile(excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const headers = (rows[0] || []).map((h) => (h != null ? String(h).trim() : ""));

  const clientIdCol = headers.indexOf("Client ID");
  const clientNameCol = headers.indexOf("Client Name");
  const endDateCol = headers.indexOf("End Date");

  const clientRows = new Map();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rawName = getMergedCellValue(ws, i, clientNameCol) ?? row[clientNameCol];
    const clientName = toStr(rawName);
    const clientId = toStr(row[clientIdCol]);
    const endDateRaw = row[endDateCol];
    const endDateNum = endDateRaw != null && typeof endDateRaw === "number" ? endDateRaw : null;

    if (!clientName && !clientId) continue;

    const key = (clientId || "") + "|" + (clientName || "");
    const existing = clientRows.get(key);
    const useThis =
      !existing || (endDateNum != null && (existing.endDateNum == null || endDateNum >= existing.endDateNum));
    if (useThis) {
      clientRows.set(key, { rowIndex: i, row, endDateNum });
    }
  }

  const supabase = createClient(url, serviceKey);

  const { data: trainers } = await supabase.from("trainers").select("id, name");
  const trainerIdByName = {};
  (trainers || []).forEach((r) => (trainerIdByName[r.name] = r.id));

  const sheetPayloads = [];
  for (const [, info] of clientRows) {
    const payload = rowToCustomerPayload(info.row, headers, ws, info.rowIndex, trainerIdByName);
    sheetPayloads.push(payload);
  }

  const PAGE_SIZE = 1000;
  const custList = [];
  let offset = 0;
  let page;
  do {
    const { data, error: listError } = await supabase
      .from("customers")
      .select("id, name, created_at")
      .order("created_at", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (listError) {
      console.error("List customers error:", listError.message);
      process.exit(1);
    }
    page = data || [];
    custList.push(...page);
    offset += PAGE_SIZE;
  } while (page.length === PAGE_SIZE);
  if (custList.length !== sheetPayloads.length) {
    console.warn(
      "Count mismatch: sheet has",
      sheetPayloads.length,
      "clients, DB has",
      custList.length,
      "customers."
    );
  }

  const BATCH = 50;
  let updated = 0;
  for (let i = 0; i < custList.length; i += BATCH) {
    const batch = custList.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((c, j) => {
        const payload = sheetPayloads[i + j] ?? sheetPayloads[sheetPayloads.length - 1];
        if (!payload) return { error: null };
        return supabase.from("customers").update(payload).eq("id", c.id);
      })
    );
    const errors = results.filter((r) => r.error);
    if (errors.length) errors.forEach((r) => console.error(r.error?.message));
    updated += batch.length;
    console.log("Updated", updated, "/", custList.length);
  }
  console.log("Done. Updated all columns for", updated, "customers.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

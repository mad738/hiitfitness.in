/**
 * Import TRAIL TRACKER.xlsx into trainers and customers tables.
 * Run: node scripts/import-trail-tracker-to-customers-trainers.js "b:\Downloads\TRAIL TRACKER.xlsx"
 * Requires: .env with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
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

async function main() {
  const wb = XLSX.readFile(excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const headers = (rows[0] || []).map((h) => (h != null ? String(h).trim() : ""));

  const col = (name) => headers.indexOf(name);
  const clientIdCol = col("Client ID");
  const clientNameCol = col("Client Name");
  const trainerNameCol = col("Trainer Name");
  const endDateCol = col("End Date");

  const trainersSet = new Set();
  const clientRows = new Map(); // key: "clientId|clientName" -> { rowIndex, row, endDateNum }

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rawName = getMergedCellValue(ws, i, clientNameCol) ?? row[clientNameCol];
    const clientName = toStr(rawName);
    const clientId = toStr(row[clientIdCol]);
    const trainerName = toStr(row[trainerNameCol]);
    const endDateRaw = row[endDateCol];
    const endDateNum = endDateRaw != null && typeof endDateRaw === "number" ? endDateRaw : null;

    if (trainerName) trainersSet.add(trainerName);

    if (!clientName && !clientId) continue;

    const key = (clientId || "") + "|" + (clientName || "");
    const existing = clientRows.get(key);
    const useThis = !existing || (endDateNum != null && (existing.endDateNum == null || endDateNum >= existing.endDateNum));
    if (useThis) {
      clientRows.set(key, { rowIndex: i, row, endDateNum });
    }
  }

  const trainerNames = Array.from(trainersSet).sort();
  console.log("Unique trainers:", trainerNames.length);
  console.log("Unique clients:", clientRows.size);

  const supabase = createClient(url, serviceKey);

  const trainerIdByName = {};
  const { data: existingTrainers } = await supabase.from("trainers").select("id, name");
  (existingTrainers || []).forEach((r) => (trainerIdByName[r.name] = r.id));

  const BATCH = 50;
  const toInsert = trainerNames.filter((name) => !trainerIdByName[name]);
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH).map((name) => ({ name }));
    const { data, error } = await supabase.from("trainers").insert(batch).select("id, name");
    if (error) {
      console.error("Trainers insert error:", error.message);
      process.exit(1);
    }
    (data || []).forEach((r) => (trainerIdByName[r.name] = r.id));
    console.log(`Inserted trainers ${Math.min(i + BATCH, toInsert.length)}/${toInsert.length}`);
  }
  console.log("Trainers in DB:", Object.keys(trainerIdByName).length);

  /** Build customer object from sheet row using all mapped columns */
  function rowToCustomer(row, rowIndex) {
    const payload = {};
    const plan = toStr(row[col("Plan")]) || "GT";
    const trainerName = toStr(row[trainerNameCol]);
    payload.trainer_id = plan === "PT" && trainerName && trainerIdByName[trainerName] ? trainerIdByName[trainerName] : null;

    for (const [sheetHeader, dbCol] of Object.entries(SHEET_TO_CUSTOMERS)) {
      if (dbCol == null) continue;
      const ci = headers.indexOf(sheetHeader);
      if (ci < 0) continue;
      let raw = row[ci];
      if (dbCol === "name" && (raw == null || String(raw).trim() === ""))
        raw = getMergedCellValue(ws, rowIndex, clientNameCol) ?? row[clientNameCol];
      if (DATE_COLS.includes(dbCol)) payload[dbCol] = excelDateToISO(raw);
      else if (NUM_COLS.includes(dbCol)) payload[dbCol] = toNum(raw) ?? (dbCol === "balance" ? 0 : 0);
      else if (BOOL_COLS.includes(dbCol)) payload[dbCol] = toBool(raw);
      else payload[dbCol] = toStr(raw);
    }
    const clientName = toStr(getMergedCellValue(ws, rowIndex, clientNameCol) ?? row[clientNameCol]);
    const clientId = toStr(row[clientIdCol]);
    payload.name = clientName || clientId || "Unknown";
    if (payload.plan == null) payload.plan = "GT";
    if (payload.total_fee == null) payload.total_fee = 0;
    if (payload.paid_fee == null) payload.paid_fee = 0;
    if (payload.balance == null) payload.balance = 0;
    payload.image = null;
    payload.receipt = payload.receipt ?? false;
    return payload;
  }

  const customers = [];
  for (const [, info] of clientRows) {
    customers.push(rowToCustomer(info.row, info.rowIndex));
  }

  let inserted = 0;
  for (let i = 0; i < customers.length; i += BATCH) {
    const batch = customers.slice(i, i + BATCH);
    const { data, error } = await supabase.from("customers").insert(batch).select("id");
    if (error) {
      console.error("Customers insert error:", error.message);
      console.error("Batch start index:", i, "sample:", JSON.stringify(batch[0], null, 2));
      process.exit(1);
    }
    inserted += (data || []).length;
    console.log(`Inserted customers ${inserted}/${customers.length}`);
  }

  console.log("Done. Trainers:", trainerNames.length, "Customers:", inserted);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

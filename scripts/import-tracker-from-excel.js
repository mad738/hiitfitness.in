/**
 * Import Tracker - 2026.xlsx into the tracker table.
 * Run: node scripts/import-tracker-from-excel.js "b:\Downloads\Tracker - 2026.xlsx"
 * Requires: .env with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
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

const excelPath = process.argv[2] || path.join(__dirname, "..", "Tracker - 2026.xlsx");
if (!fs.existsSync(excelPath)) {
  console.error("File not found:", excelPath);
  process.exit(1);
}

// Excel serial date to ISO date string (YYYY-MM-DD)
function excelDateToISO(val) {
  if (val == null || val === "") return null;
  const n = Number(val);
  if (Number.isNaN(n)) return null;
  // Excel serial: days since 1899-12-30 (Excel epoch)
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
  if (val == null || val === "") return null;
  const s = String(val).toLowerCase();
  if (s === "true" || s === "1" || s === "yes") return true;
  if (s === "false" || s === "0" || s === "no") return false;
  return null;
}

// Excel header -> tracker column
const COL_MAP = {
  "Client ID": "client_id",
  "Client Name": "client_name",
  Plan: "plan",
  Frequency: "frequency",
  "Trainer Name": "trainer_name",
  "Start Date": "start_date",
  "End Date": "end_date",
  "Total Fee": "total_fee",
  "Paid Fee": "paid_fee",
  "Due Fee": "due_fee",
  Mobile: "mobile",
  "Pay Date": "pay_date",
  "Payment Mode": "payment_mode",
  "Paid to": "paid_to",
  false: "paid_flag",
  Remarks: "remarks",
  Status: "status",
};

const DATE_COLS = ["start_date", "end_date", "pay_date"];
const NUM_COLS = ["total_fee", "paid_fee", "due_fee"];
const BOOL_COLS = ["paid_flag"];

function rowToTracker(row, headers) {
  const out = {};
  headers.forEach((h, i) => {
    const col = COL_MAP[h];
    if (!col) return;
    const raw = row[i];
    if (DATE_COLS.includes(col)) {
      out[col] = excelDateToISO(raw);
    } else if (NUM_COLS.includes(col)) {
      out[col] = toNum(raw);
    } else if (BOOL_COLS.includes(col)) {
      out[col] = toBool(raw);
    } else {
      out[col] = toStr(raw);
    }
  });
  return out;
}

async function main() {
  const wb = XLSX.readFile(excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const headers = (rows[0] || []).map((h) => (h != null ? String(h).trim() : ""));
  const dataRows = rows.slice(1).filter((row) => row.some((c) => c != null && String(c).trim() !== ""));

  const records = dataRows.map((row) => rowToTracker(row, headers)).filter((r) => Object.keys(r).length > 0);

  if (records.length === 0) {
    console.log("No data rows to import.");
    return;
  }

  const supabase = createClient(url, serviceKey);
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const { data, error } = await supabase.from("tracker").insert(batch).select("id");
    if (error) {
      console.error("Insert error:", error.message);
      console.error("Batch starting at row", i + 2, ":", JSON.stringify(batch[0], null, 2));
      process.exit(1);
    }
    inserted += (data || []).length;
    console.log(`Inserted ${inserted}/${records.length} rows...`);
  }
  console.log(`Done. Imported ${inserted} rows into tracker.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

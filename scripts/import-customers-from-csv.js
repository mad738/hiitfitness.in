/**
 * Delete all data in customers and trainers, then import b:\Downloads\customers_rows.csv.
 * Run: node scripts/import-customers-from-csv.js
 * Or:   node scripts/import-customers-from-csv.js "path/to/customers_rows.csv"
 * Requires: .env with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */
const path = require("path");
const fs = require("fs");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const { createClient } = require("@supabase/supabase-js");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const csvPath = process.argv[2] || path.join("b:", "Downloads", "customers_rows.csv");
if (!fs.existsSync(csvPath)) {
  console.error("File not found:", csvPath);
  process.exit(1);
}

/** Parse CSV line handling quoted fields (optional). Returns array of cell values. */
function parseCSVLine(line) {
  const out = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let cell = "";
      i++;
      while (i < line.length && line[i] !== '"') {
        if (line[i] === "\\") i++;
        cell += line[i++];
      }
      if (line[i] === '"') i++;
      out.push(cell.trim());
    } else {
      let end = line.indexOf(",", i);
      if (end === -1) end = line.length;
      out.push(line.slice(i, end).trim());
      i = end + 1;
    }
  }
  return out;
}

/** Parse date string like "05-Aug-24" or "22-Jul-24" to YYYY-MM-DD */
function parseDate(val) {
  if (val == null || String(val).trim() === "") return null;
  const s = String(val).trim();
  const m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
  if (!m) return null;
  const months = "JanFebMarAprMayJunJulAugSepOctNovDec";
  const mi = months.indexOf(m[2].slice(0, 1).toUpperCase() + m[2].slice(1).toLowerCase());
  if (mi === -1) return null;
  const month = Math.floor(mi / 3) + 1;
  let year = parseInt(m[3], 10);
  if (year < 100) year += year < 50 ? 2000 : 1900;
  const day = parseInt(m[1], 10);
  const d = new Date(year, month - 1, day);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function toNum(val) {
  if (val == null || val === "") return null;
  const n = Number(String(val).replace(/,/g, ""));
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

async function main() {
  const content = fs.readFileSync(csvPath, "utf8");
  const lines = content.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) {
    console.error("CSV has no data rows");
    process.exit(1);
  }

  const headers = parseCSVLine(lines[0]);
  const col = (name) => headers.indexOf(name);
  const clientIdCol = col("Client ID");
  const clientNameCol = col("Client Name");
  const planCol = col("Plan");
  const durationCol = col("Frequency");
  const trainerNameCol = col("Trainer Name");
  const startDateCol = col("Start Date");
  const endDateCol = col("End Date");
  const totalFeeCol = col("Total Fee");
  const paidFeeCol = col("Paid Fee");
  const dueFeeCol = col("Due Fee");
  const mobileCol = col("Mobile");
  const payDateCol = col("Pay Date");
  const paymentModeCol = col("Payment Mode");
  const paidToCol = col("Paid to");
  const receiptCol = col("FALSE") >= 0 ? col("FALSE") : col("false");
  const remarksCol = col("Remarks");
  const feedbackCol = col("Feedback");
  const slotTimingCol = col("Slot timing");
  const statusCol = col("Status");

  if (clientNameCol < 0 || planCol < 0) {
    console.error("Required columns not found. Headers:", headers.slice(0, 20));
    process.exit(1);
  }

  const trainersSet = new Set();
  const rows = [];

  let lastClientId = "";
  let lastClientName = "";

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    const get = (idx) => (idx >= 0 && idx < cells.length ? cells[idx] : "");

    let clientId = toStr(get(clientIdCol));
    let clientName = toStr(get(clientNameCol));
    if (clientId) lastClientId = clientId;
    if (clientName) lastClientName = clientName;
    clientId = clientId || lastClientId;
    clientName = clientName || lastClientName;

    const plan = toStr(get(planCol)) || "GT";
    const trainerName = toStr(get(trainerNameCol));
    if (trainerName) trainersSet.add(trainerName);

    if (!clientName && !clientId) continue;

    const startDate = parseDate(get(startDateCol));
    const endDate = parseDate(get(endDateCol));
    const payDate = parseDate(get(payDateCol));
    const totalFee = toNum(get(totalFeeCol)) ?? 0;
    const paidFee = toNum(get(paidFeeCol)) ?? 0;
    const balance = toNum(get(dueFeeCol)) ?? 0;

    rows.push({
      clientId,
      clientName: clientName || clientId || "Unknown",
      plan,
      duration: toStr(get(durationCol)),
      trainerName,
      start_date: startDate,
      end_date: endDate,
      pay_date: payDate,
      total_fee: totalFee,
      paid_fee: paidFee,
      balance,
      mobile: toStr(get(mobileCol)),
      payment_mode: toStr(get(paymentModeCol)),
      paid_to: toStr(get(paidToCol)),
      receipt: toBool(get(receiptCol)),
      remarks: toStr(get(remarksCol)),
      feedback: toStr(get(feedbackCol)),
      slot_timing: toStr(get(slotTimingCol)),
      status: toStr(get(statusCol)),
    });
  }

  console.log("CSV rows (data):", rows.length);
  console.log("Unique trainers:", trainersSet.size);

  const supabase = createClient(url, serviceKey);

  // 1) Delete all customers (FK: customers.trainer_id -> trainers.id). Fetch first page repeatedly until empty.
  const pageSize = 500;
  let custDeleted = 0;
  for (;;) {
    const { data: custIds } = await supabase.from("customers").select("id").limit(pageSize);
    const ids = (custIds || []).map((r) => r.id);
    if (ids.length === 0) break;
    const { error: delCustErr } = await supabase.from("customers").delete().in("id", ids);
    if (delCustErr) {
      console.error("Delete customers error:", delCustErr.message);
      process.exit(1);
    }
    custDeleted += ids.length;
    console.log("Deleted customers batch:", custDeleted);
  }
  console.log("Deleted all customers:", custDeleted);

  // 2) Delete all trainers. Fetch first page repeatedly until empty.
  let trainDeleted = 0;
  for (;;) {
    const { data: trainIds } = await supabase.from("trainers").select("id").limit(pageSize);
    const ids = (trainIds || []).map((r) => r.id);
    if (ids.length === 0) break;
    const { error: delTrainErr } = await supabase.from("trainers").delete().in("id", ids);
    if (delTrainErr) {
      console.error("Delete trainers error:", delTrainErr.message);
      process.exit(1);
    }
    trainDeleted += ids.length;
    console.log("Deleted trainers batch:", trainDeleted);
  }
  console.log("Deleted all trainers:", trainDeleted);

  // 3) Insert trainers
  const trainerNames = Array.from(trainersSet).filter(Boolean).sort();
  const trainerIdByName = {};
  const BATCH = 50;
  for (let i = 0; i < trainerNames.length; i += BATCH) {
    const batch = trainerNames.slice(i, i + BATCH).map((name) => ({ name }));
    const { data, error } = await supabase.from("trainers").insert(batch).select("id, name");
    if (error) {
      console.error("Trainers insert error:", error.message);
      process.exit(1);
    }
    (data || []).forEach((r) => (trainerIdByName[r.name] = r.id));
    console.log(`Inserted trainers ${Math.min(i + BATCH, trainerNames.length)}/${trainerNames.length}`);
  }

  // 4) Insert customers
  const customerRows = rows.map((r) => {
    const payload = {
      name: r.clientName,
      image: null,
      plan: r.plan,
      total_fee: r.total_fee,
      paid_fee: r.paid_fee,
      balance: r.balance,
      trainer_id: r.plan === "PT" && r.trainerName && trainerIdByName[r.trainerName] ? trainerIdByName[r.trainerName] : null,
      start_date: r.start_date,
      end_date: r.end_date,
      pay_date: r.pay_date,
      payment_mode: r.payment_mode,
      paid_to: r.paid_to,
      remarks: r.remarks,
      feedback: r.feedback,
      mobile: r.mobile,
      duration: r.duration,
      status: r.status,
      slot_timing: r.slot_timing,
      receipt: r.receipt ?? false,
    };
    return payload;
  });

  let inserted = 0;
  for (let i = 0; i < customerRows.length; i += BATCH) {
    const batch = customerRows.slice(i, i + BATCH);
    const { data, error } = await supabase.from("customers").insert(batch).select("id");
    if (error) {
      console.error("Customers insert error:", error.message);
      console.error("Batch index:", i, "sample:", JSON.stringify(batch[0], null, 2));
      process.exit(1);
    }
    inserted += (data || []).length;
    console.log(`Inserted customers ${inserted}/${customerRows.length}`);
  }

  console.log("Done. Trainers:", trainerNames.length, "Customers:", inserted);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

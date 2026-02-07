const XLSX = require("xlsx");
const path = process.argv[2] || "b:\\Downloads\\Tracker - 2026.xlsx";
const wb = XLSX.readFile(path);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
const headers = (rows[0] || []).map((h) => (h == null ? "" : String(h).trim()));
const dataRows = rows.slice(1);

const distinct = {};
headers.forEach((h, i) => {
  const set = new Set();
  dataRows.forEach((row) => {
    const v = row[i];
    if (v !== undefined && v !== null && String(v).trim() !== "") set.add(String(v).trim());
  });
  distinct[h] = Array.from(set).sort();
});

console.log(JSON.stringify(distinct, null, 2));

const XLSX = require("xlsx");
const path = process.argv[2] || "b:\\Downloads\\Tracker - 2026.xlsx";
const wb = XLSX.readFile(path);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
const headers = (data[0] || []).map((h) => (h == null ? "" : String(h).trim()));
console.log(JSON.stringify(headers, null, 2));

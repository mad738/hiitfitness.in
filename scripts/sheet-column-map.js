/**
 * Shared mapping: TRAIL TRACKER sheet header names -> customers table columns.
 * All non-empty headers from TRAIL TRACKER.xlsx are included.
 */
module.exports = {
  // Sheet header (exact) -> DB column name
  SHEET_TO_CUSTOMERS: {
    "Client ID": null, // used for keying only, not a DB column
    "Client Name": "name",
    Plan: "plan",
    Frequency: "duration",
    "Trainer Name": null, // resolved to trainer_id separately
    "Start Date": "start_date",
    "End Date": "end_date",
    "Total Fee": "total_fee",
    "Paid Fee": "paid_fee",
    "Due Fee": "balance",
    Mobile: "mobile",
    "Pay Date": "pay_date",
    "Payment Mode": "payment_mode",
    "Paid to": "paid_to",
    "false": "receipt", // column literally named "false" in sheet
    Remarks: "remarks",
    Feedback: "feedback",
    "Slot timing": "slot_timing",
    Status: "status",
  },
  DATE_COLS: ["start_date", "end_date", "pay_date"],
  NUM_COLS: ["total_fee", "paid_fee", "balance"],
  BOOL_COLS: ["receipt"],
};

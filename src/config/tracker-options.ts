/**
 * Category options for Tracker - match PostgreSQL enums and poster fee structure.
 * Plan/frequency options aligned with src/data/plans.ts.
 */
import { PLAN_CATEGORIES, PLAN_FREQUENCIES } from "@/data/plans";

export const TRACKER_PLAN_OPTIONS = PLAN_CATEGORIES;
export const TRACKER_FREQUENCY_OPTIONS = PLAN_FREQUENCIES;

export const TRACKER_TRAINER_OPTIONS = [
  "Bike Accident",
  "Dec 01st start",
  "Exams",
  "Infmd 28oct - NR",
  "Manoj",
  "NR",
  "NR - call cut",
  "Naren update",
  "Narendra",
  "Not reachable",
  "Renewal",
  "Sandeep",
  "closed transfer to vijaya",
  "msg delivered",
  "switched off",
] as const;

export const TRACKER_PAYMENT_MODE_OPTIONS = [
  "12k-Bablu UPI",
  "3k-Roht Swipe",
  "Bablu UPI",
  "Cash",
  "Chec Manoj",
  "IDBI swipe",
  "Manoj UPI",
  "Rohit",
  "Rohit Swipe",
  "Rohit UPI",
  "SS UPI",
  "Tarun UPI",
] as const;

export const TRACKER_PAID_TO_OPTIONS = ["Close", "Inac", "R", "don call"] as const;

export const TRACKER_PAID_FLAG_OPTIONS = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
] as const;

export const TRACKER_STATUS_OPTIONS = ["Active"] as const;

/** Fields that use dropdowns (category variables) */
export const TRACKER_DROPDOWN_FIELDS = [
  "plan",
  "frequency",
  "trainer_name",
  "payment_mode",
  "paid_to",
  "paid_flag",
  "status",
] as const;

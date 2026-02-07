/**
 * HIIT Fitness fee structure (poster). Single source for landing plan cards,
 * membership_plan seed data, and tracker dropdown options.
 */

import type { MembershipPlan } from "@/models/membership_plan";

const now = new Date().toISOString();

/** Plan category for tracker: GT = General, PT = Personal, FT = Functional */
export const PLAN_CATEGORIES = ["GT", "PT", "FT"] as const;
export type PlanCategory = (typeof PLAN_CATEGORIES)[number];

/** Frequency for tracker dropdown */
export const PLAN_FREQUENCIES = [
  "1M",
  "3M",
  "6M",
  "12M",
  "12M + 1M",
  "FC", // Functional Class
  "GC", // Group Class (3 Members)
] as const;
export type PlanFrequency = (typeof PLAN_FREQUENCIES)[number];

export type PlanOption = {
  plan: PlanCategory;
  frequency: PlanFrequency;
  label: string;
  totalFee: number;
  durationDays: number;
};

/** All plan options for tracker add-entry dropdown (plan + frequency + fee) */
export const PLAN_OPTIONS: PlanOption[] = [
  // General Membership
  { plan: "GT", frequency: "1M", label: "General 1 Month", totalFee: 4000, durationDays: 30 },
  { plan: "GT", frequency: "3M", label: "General 3 Months", totalFee: 8000, durationDays: 90 },
  { plan: "GT", frequency: "6M", label: "General 6 Months", totalFee: 13000, durationDays: 180 },
  { plan: "GT", frequency: "12M", label: "General 12 Months", totalFee: 18000, durationDays: 365 },
  // Personal Training
  { plan: "PT", frequency: "1M", label: "Personal 1 Month", totalFee: 6000, durationDays: 30 },
  { plan: "PT", frequency: "3M", label: "Personal 3 Months", totalFee: 15000, durationDays: 90 },
  { plan: "PT", frequency: "6M", label: "Personal 6 Months", totalFee: 30000, durationDays: 180 },
  { plan: "PT", frequency: "12M", label: "Personal 12 Months", totalFee: 50000, durationDays: 365 },
  // Functional Training
  { plan: "FT", frequency: "FC", label: "Functional Classes", totalFee: 5000, durationDays: 30 },
  { plan: "FT", frequency: "GC", label: "Group Classes (3 Members)", totalFee: 13000, durationDays: 30 },
];

/** Build membership_plan records for landing cards and DB seed */
export function getMembershipPlansForDisplay(): MembershipPlan[] {
  const plans: MembershipPlan[] = [];
  let id = 0;
  for (const opt of PLAN_OPTIONS) {
    const priceMonthly = Math.round(opt.totalFee / (opt.durationDays / 30));
    const durationLabel =
      opt.durationDays >= 365
        ? "12 months"
        : opt.durationDays >= 180
          ? "6 months"
          : opt.durationDays >= 90
            ? "3 months"
            : opt.frequency === "FC"
              ? "Functional classes"
              : opt.frequency === "GC"
                ? "Group (3 members)"
                : "1 month";
    plans.push({
      id: `plan-${++id}`,
      name: opt.label,
      description: `₹${opt.totalFee.toLocaleString("en-IN")} total · ${durationLabel}`,
      price_monthly: priceMonthly,
      duration_days: opt.durationDays,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
  }
  return plans;
}

/** Seeded plans used when DB has no plans (matches poster) */
export function getSeededPlans(): MembershipPlan[] {
  return getMembershipPlansForDisplay();
}

/** Display labels for plan groups on landing */
export const PLAN_GROUP_LABELS: Record<PlanCategory, string> = {
  GT: "General Membership",
  PT: "Personal Training",
  FT: "Functional Training",
};

/** Group key from plan name (for grouping fetched plans) */
export function getPlanGroup(name: string): PlanCategory {
  if (name.startsWith("General")) return "GT";
  if (name.startsWith("Personal")) return "PT";
  return "FT";
}

/** Feature lists for pricing cards (what's included per category) */
export const PLAN_GROUP_FEATURES: Record<PlanCategory, string[]> = {
  GT: [
    "Full gym access",
    "HIIT group classes",
    "Locker & changing room",
    "Morning & evening slots",
    "No long-term lock-in",
  ],
  PT: [
    "1-on-1 trainer sessions",
    "Custom workout program",
    "Form correction & progress tracking",
    "Flexible scheduling",
    "Nutrition guidance support",
  ],
  FT: [
    "Functional movement classes",
    "Small group sessions",
    "Equipment training",
    "Core & mobility focus",
    "Drop-in or package",
  ],
};

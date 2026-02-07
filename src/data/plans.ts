/**
 * Plan categories, frequencies, and grouping for landing/tracker.
 * Plan rows come from Supabase membership_plans table only.
 */

import type { MembershipPlan } from "@/models/membership_plan";

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

/** Derive tracker plan + frequency from a membership plan (from Supabase) */
export function planToTrackerOption(plan: MembershipPlan): {
  plan: PlanCategory;
  frequency: PlanFrequency;
  totalFee: number;
} {
  const category = getPlanGroup(plan.name);
  const days = plan.duration_days;
  const totalFee = plan.total_fee ?? Math.round(plan.price_monthly * (days / 30));
  let frequency: PlanFrequency = "1M";
  if (plan.name.includes("Functional") && !plan.name.includes("Group")) frequency = "FC";
  else if (plan.name.includes("Group")) frequency = "GC";
  else if (days >= 365) frequency = "12M";
  else if (days >= 180) frequency = "6M";
  else if (days >= 90) frequency = "3M";
  else if (days >= 30) frequency = "1M";
  return { plan: category, frequency, totalFee };
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

import * as planRepo from "@/repositories/membership_plan_repository";
import type { MembershipPlan } from "@/models/membership_plan";

const seededPlans: MembershipPlan[] = [
  {
    id: "seed-starter",
    name: "Starter – Sweat & Go",
    description:
      "Perfect if you’re just getting back into training. Full gym access + a simple weekly HIIT program to build momentum.",
    price_monthly: 2999,
    duration_days: 30,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "seed-core",
    name: "Core – Strength & Conditioning",
    description:
      "Most popular. Unlimited HIIT classes, strength zone access, and monthly progress check-ins to keep you honest.",
    price_monthly: 6999,
    duration_days: 30,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "seed-elite",
    name: "Elite – Athlete Mode",
    description:
      "For gym rats chasing performance. Priority class slots, recovery zone access, and personalized programming support.",
    price_monthly: 9999,
    duration_days: 30,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function getPublicPlans(): Promise<MembershipPlan[]> {
  try {
    const plans = await planRepo.listActivePlans();
    return plans.length > 0 ? plans : seededPlans;
  } catch {
    return seededPlans;
  }
}

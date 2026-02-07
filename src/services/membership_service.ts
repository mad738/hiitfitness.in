import * as planRepo from "@/repositories/membership_plan_repository";
import { getSeededPlans } from "@/data/plans";

export async function getPublicPlans() {
  try {
    const plans = await planRepo.listActivePlans();
    return plans.length > 0 ? plans : getSeededPlans();
  } catch {
    return getSeededPlans();
  }
}

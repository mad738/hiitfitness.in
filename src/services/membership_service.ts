import { unstable_noStore as noStore } from "next/cache";
import * as planRepo from "@/repositories/membership_plan_repository";

/** Plans from Supabase membership_plans table only. Returns [] when empty or on error. */
export async function getPublicPlans() {
  noStore();
  try {
    return await planRepo.listActivePlans();
  } catch {
    return [];
  }
}

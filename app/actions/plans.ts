"use server";

import { getPublicPlans } from "@/services/membership_service";

export async function fetchPublicPlans() {
  return getPublicPlans();
}

"use server";

import { revalidatePath } from "next/cache";
import { getPublicPlans } from "@/services/membership_service";
import * as planRepo from "@/repositories/membership_plan_repository";
import type { MembershipPlanInsert, MembershipPlanUpdate } from "@/models/membership_plan";
import { explainError } from "@/lib/error-message";

export async function fetchPublicPlans() {
  return getPublicPlans();
}

export type CreatePlanInput = {
  name: string;
  description?: string | null;
  price_monthly: number;
  duration_days: number;
  total_fee?: number | null;
  is_active?: boolean;
};

export type UpdatePlanInput = {
  name?: string;
  description?: string | null;
  price_monthly?: number;
  duration_days?: number;
  total_fee?: number | null;
  is_active?: boolean;
};

export async function createPlan(input: CreatePlanInput): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const id = `plan-${Date.now()}`;
    const row: MembershipPlanInsert = {
      id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      price_monthly: input.price_monthly,
      duration_days: input.duration_days,
      total_fee: input.total_fee ?? undefined,
      is_active: input.is_active ?? true,
    };
    await planRepo.insertPlan(row);
    revalidatePath("/admin/plans");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    const message = explainError(e, "Unable to create plan. Please review the inputs and try again.");
    return { ok: false, error: message };
  }
}

export async function updatePlan(id: string, input: UpdatePlanInput): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const updates: MembershipPlanUpdate = {};
    if (input.name !== undefined) updates.name = input.name.trim();
    if (input.description !== undefined) updates.description = input.description?.trim() || null;
    if (input.price_monthly !== undefined) updates.price_monthly = input.price_monthly;
    if (input.duration_days !== undefined) updates.duration_days = input.duration_days;
    if (input.total_fee !== undefined) updates.total_fee = input.total_fee ?? undefined;
    if (input.is_active !== undefined) updates.is_active = input.is_active;
    await planRepo.updatePlan(id, updates);
    revalidatePath("/admin/plans");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    const message = explainError(e, "Unable to update plan. Please review the inputs and try again.");
    return { ok: false, error: message };
  }
}

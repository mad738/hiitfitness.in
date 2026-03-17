"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@app/actions/auth";
import type { PaymentInsert, PaymentUpdate } from "@/models/payment";
import * as paymentRepo from "@/repositories/payment_repository";

const CUSTOMERS_PATH = "/admin/customers";

export async function listPlanPayments(planId: string) {
  await requireAdminSession();
  return paymentRepo.listPlanPayments(planId);
}

export async function createPlanPayment(payload: PaymentInsert) {
  try {
    await requireAdminSession();
    await paymentRepo.createPlanPayment(payload);
    revalidatePath(CUSTOMERS_PATH);
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to add payment.",
    };
  }
}

export async function updatePlanPayment(id: string, payload: PaymentUpdate) {
  try {
    await requireAdminSession();
    await paymentRepo.updatePlanPayment(id, payload);
    revalidatePath(CUSTOMERS_PATH);
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to update payment.",
    };
  }
}

export async function deletePlanPayment(id: string) {
  try {
    await requireAdminSession();
    await paymentRepo.deletePlanPayment(id);
    revalidatePath(CUSTOMERS_PATH);
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Failed to delete payment.",
    };
  }
}

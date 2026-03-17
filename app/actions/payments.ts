"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@app/actions/auth";
import type { PaymentInsert, PaymentUpdate } from "@/models/payment";
import * as paymentRepo from "@/repositories/payment_repository";
import { explainError } from "@/lib/error-message";

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
      error: explainError(error, "Unable to add payment. Please verify the values and try again."),
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
      error: explainError(error, "Unable to update payment. Please verify the values and try again."),
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
      error: explainError(error, "Unable to delete payment. Please try again."),
    };
  }
}

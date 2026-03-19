"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@app/actions/auth";
import * as customerRepo from "@/repositories/customer_repository";
import type { Customer, CustomerInsert, CustomerUpdate } from "@/models/customer";
import { explainError } from "@/lib/error-message";

const CUSTOMERS_PATH = "/admin/customers";

export async function listCustomers() {
  await requireAdminSession();
  return customerRepo.listCustomers();
}

export async function createCustomer(data: CustomerInsert) {
  try {
    await requireAdminSession();
    const created = await customerRepo.insertCustomer(data);
    revalidatePath(CUSTOMERS_PATH);
    return { ok: true as const, customer: created };
  } catch (e) {
    return {
      ok: false as const,
      error: explainError(e, "Unable to add customer. Please review the form and try again."),
    } satisfies { ok: false; error: string };
  }
}

export async function updateCustomer(id: string, data: CustomerUpdate) {
  try {
    await requireAdminSession();
    await customerRepo.updateCustomer(id, data);
    revalidatePath(CUSTOMERS_PATH);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: explainError(e, "Unable to update customer. Please review the changes and try again.") };
  }
}

export async function deleteCustomer(id: string) {
  try {
    await requireAdminSession();
    await customerRepo.deleteCustomer(id);
    revalidatePath(CUSTOMERS_PATH);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: explainError(e, "Unable to delete customer. Please try again.") };
  }
}

export async function deleteCustomerCascade(customerId: string) {
  try {
    await requireAdminSession();
    await customerRepo.deleteCustomerCascade(customerId);
    revalidatePath(CUSTOMERS_PATH);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: explainError(e, "Unable to delete this customer group. Please try again.") };
  }
}

export async function holdCustomerPlan(planId: string) {
  try {
    await requireAdminSession();
    await customerRepo.placePlanOnHold(planId);
    revalidatePath(CUSTOMERS_PATH);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: explainError(e, "Unable to place this plan on hold. Please try again.") };
  }
}

export async function resumeCustomerPlan(planId: string) {
  try {
    await requireAdminSession();
    await customerRepo.resumePlanFromHold(planId);
    revalidatePath(CUSTOMERS_PATH);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: explainError(e, "Unable to resume this plan. Please try again.") };
  }
}

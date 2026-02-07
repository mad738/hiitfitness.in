"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@app/actions/auth";
import * as customerRepo from "@/repositories/customer_repository";
import type { CustomerInsert, CustomerUpdate } from "@/models/customer";

const CUSTOMERS_PATH = "/admin/customers";

export async function listCustomers() {
  await requireAdminSession();
  return customerRepo.listCustomers();
}

export async function createCustomer(data: CustomerInsert) {
  try {
    await requireAdminSession();
    await customerRepo.insertCustomer(data);
    revalidatePath(CUSTOMERS_PATH);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to add customer." };
  }
}

export async function updateCustomer(id: string, data: CustomerUpdate) {
  try {
    await requireAdminSession();
    await customerRepo.updateCustomer(id, data);
    revalidatePath(CUSTOMERS_PATH);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to update customer." };
  }
}

export async function deleteCustomer(id: string) {
  try {
    await requireAdminSession();
    await customerRepo.deleteCustomer(id);
    revalidatePath(CUSTOMERS_PATH);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to delete customer." };
  }
}

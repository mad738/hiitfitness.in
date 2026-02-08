import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Customer, CustomerInsert, CustomerUpdate } from "@/models/customer";

const TABLE = "customers";
const COLS =
  "id, name, image, plan, total_fee, paid_fee, balance, trainer_id, start_date, end_date, pay_date, payment_mode, paid_to, remarks, feedback, mobile, duration, status, slot_timing, receipt, created_at, updated_at";

const PAGE_SIZE = 1000;

export async function listCustomers(): Promise<Customer[]> {
  const supabase = await createServiceRoleClient();
  const all: Customer[] = [];
  let offset = 0;
  let page: Customer[];
  do {
    const { data, error } = await supabase
      .from(TABLE)
      .select(COLS)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    page = (data ?? []) as Customer[];
    all.push(...page);
    offset += PAGE_SIZE;
  } while (page.length === PAGE_SIZE);
  return all;
}

export async function findCustomerById(id: string): Promise<Customer | null> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLS)
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data as Customer | null;
}

export async function insertCustomer(row: CustomerInsert): Promise<Customer> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as Customer;
}

export async function updateCustomer(
  id: string,
  updates: CustomerUpdate
): Promise<Customer> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq("id", id)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as Customer;
}

export async function deleteCustomer(id: string): Promise<void> {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

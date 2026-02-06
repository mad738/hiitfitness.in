import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Customer, CustomerInsert, CustomerUpdate } from "@/models/customer";

const TABLE = "customers";
const COLS = "id, email, full_name, phone, created_at, updated_at";

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

export async function listCustomers(): Promise<Customer[]> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Customer[];
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

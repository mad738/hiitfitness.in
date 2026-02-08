import { createServiceRoleClient } from "@/lib/supabase/server";
import type {
  MembershipPlan,
  MembershipPlanInsert,
  MembershipPlanUpdate,
} from "@/models/membership_plan";

const TABLE = "membership_plans";
const COLS =
  "id, name, description, price_monthly, duration_days, total_fee, is_active, created_at, updated_at";
const PAGE_SIZE = 1000;

export async function findPlanById(id: string): Promise<MembershipPlan | null> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLS)
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data as MembershipPlan | null;
}

export async function listActivePlans(): Promise<MembershipPlan[]> {
  const supabase = await createServiceRoleClient();
  const all: MembershipPlan[] = [];
  let offset = 0;
  let page: MembershipPlan[];
  do {
    const { data, error } = await supabase
      .from(TABLE)
      .select(COLS)
      .eq("is_active", true)
      .order("price_monthly", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    page = (data ?? []) as MembershipPlan[];
    all.push(...page);
    offset += PAGE_SIZE;
  } while (page.length === PAGE_SIZE);
  return all;
}

export async function listAllPlans(): Promise<MembershipPlan[]> {
  const supabase = await createServiceRoleClient();
  const all: MembershipPlan[] = [];
  let offset = 0;
  let page: MembershipPlan[];
  do {
    const { data, error } = await supabase
      .from(TABLE)
      .select(COLS)
      .order("price_monthly", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    page = (data ?? []) as MembershipPlan[];
    all.push(...page);
    offset += PAGE_SIZE;
  } while (page.length === PAGE_SIZE);
  return all;
}

export async function insertPlan(
  row: MembershipPlanInsert
): Promise<MembershipPlan> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as MembershipPlan;
}

export async function updatePlan(
  id: string,
  updates: MembershipPlanUpdate
): Promise<MembershipPlan> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq("id", id)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as MembershipPlan;
}

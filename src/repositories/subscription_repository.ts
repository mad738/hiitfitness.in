import { createServiceRoleClient } from "@/lib/supabase/server";
import type {
  Subscription,
  SubscriptionInsert,
  SubscriptionUpdate,
} from "@/models/subscription";

const TABLE = "subscriptions";
const COLS =
  "id, customer_id, plan_id, status, started_at, ends_at, created_at, updated_at";
const PAGE_SIZE = 1000;

export async function findSubscriptionById(
  id: string
): Promise<Subscription | null> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLS)
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data as Subscription | null;
}

export async function listSubscriptionsByCustomerId(
  customerId: string
): Promise<Subscription[]> {
  const supabase = await createServiceRoleClient();
  const all: Subscription[] = [];
  let offset = 0;
  let page: Subscription[];
  do {
    const { data, error } = await supabase
      .from(TABLE)
      .select(COLS)
      .eq("customer_id", customerId)
      .order("started_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    page = (data ?? []) as Subscription[];
    all.push(...page);
    offset += PAGE_SIZE;
  } while (page.length === PAGE_SIZE);
  return all;
}

export async function listSubscriptions(): Promise<Subscription[]> {
  const supabase = await createServiceRoleClient();
  const all: Subscription[] = [];
  let offset = 0;
  let page: Subscription[];
  do {
    const { data, error } = await supabase
      .from(TABLE)
      .select(COLS)
      .order("started_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    page = (data ?? []) as Subscription[];
    all.push(...page);
    offset += PAGE_SIZE;
  } while (page.length === PAGE_SIZE);
  return all;
}

export async function insertSubscription(
  row: SubscriptionInsert
): Promise<Subscription> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as Subscription;
}

export async function updateSubscription(
  id: string,
  updates: SubscriptionUpdate
): Promise<Subscription> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq("id", id)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as Subscription;
}

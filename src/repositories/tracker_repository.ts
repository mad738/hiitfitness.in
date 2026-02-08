import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Tracker, TrackerInsert, TrackerUpdate } from "@/models/tracker";

const TABLE = "tracker";
const COLS =
  "id, client_id, client_name, plan, frequency, trainer_name, start_date, end_date, total_fee, paid_fee, due_fee, mobile, pay_date, payment_mode, paid_to, paid_flag, remarks, status, created_at, updated_at";

export type TrackerFilters = {
  plan?: string | null;
  trainer?: string | null;
  clientSearch?: string | null;
  trainerSearch?: string | null;
};

const PAGE_SIZE = 1000;

export async function listTracker(): Promise<Tracker[]> {
  const supabase = await createServiceRoleClient();
  const all: Tracker[] = [];
  let offset = 0;
  let page: Tracker[];
  do {
    const { data, error } = await supabase
      .from(TABLE)
      .select(COLS)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    page = (data ?? []) as Tracker[];
    all.push(...page);
    offset += PAGE_SIZE;
  } while (page.length === PAGE_SIZE);
  return all;
}

export async function listTrackerFiltered(
  filters: TrackerFilters
): Promise<Tracker[]> {
  const supabase = await createServiceRoleClient();
  const all: Tracker[] = [];
  let offset = 0;
  let page: Tracker[];
  do {
    let q = supabase
      .from(TABLE)
      .select(COLS)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (filters.plan != null && filters.plan !== "") {
      q = q.eq("plan", filters.plan);
    }
    if (filters.trainer != null && filters.trainer !== "") {
      q = q.eq("trainer_name", filters.trainer);
    }
    if (filters.clientSearch != null && filters.clientSearch.trim() !== "") {
      q = q.ilike("client_name", `%${filters.clientSearch.trim()}%`);
    }
    if (filters.trainerSearch != null && filters.trainerSearch.trim() !== "") {
      q = q.ilike("trainer_name", `%${filters.trainerSearch.trim()}%`);
    }

    const { data, error } = await q;
    if (error) throw error;
    page = (data ?? []) as Tracker[];
    all.push(...page);
    offset += PAGE_SIZE;
  } while (page.length === PAGE_SIZE);
  return all;
}

export async function findTrackerById(id: string): Promise<Tracker | null> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLS)
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data as Tracker | null;
}

export async function insertTracker(row: TrackerInsert): Promise<Tracker> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as Tracker;
}

export async function updateTracker(
  id: string,
  updates: TrackerUpdate
): Promise<Tracker> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq("id", id)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as Tracker;
}

export async function deleteTracker(id: string): Promise<void> {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

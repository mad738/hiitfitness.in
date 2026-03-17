import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Trainer, TrainerInsert, TrainerUpdate } from "@/models/trainer";

const TABLE = "trainers";
const COLS = "id, name, image, phone_number, address, created_at, updated_at";

const PAGE_SIZE = 1000;

export async function listTrainers(): Promise<Trainer[]> {
  const supabase = await createServiceRoleClient();
  const all: Trainer[] = [];
  let offset = 0;
  let page: Trainer[];
  do {
    const { data, error } = await supabase
      .from(TABLE)
      .select(COLS)
      .order("name", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    page = (data ?? []) as Trainer[];
    all.push(...page);
    offset += PAGE_SIZE;
  } while (page.length === PAGE_SIZE);
  return all;
}

/** Only trainers assigned to at least one customer (hides sheet-import junk names). */
export async function listTrainersInUse(): Promise<Trainer[]> {
  const supabase = await createServiceRoleClient();
  const allIds: string[] = [];
  let offset = 0;
  const pageSize = 1000;
  let page: { trainer_id: string }[];
  do {
    const { data, error } = await supabase
      .from("customer_plans")
      .select("trainer_id")
      .not("trainer_id", "is", null)
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    page = data ?? [];
    const ids = page.map((r) => r.trainer_id).filter(Boolean);
    allIds.push(...ids);
    offset += pageSize;
  } while (page.length === pageSize);
  const uniqueIds = [...new Set(allIds)];
  if (uniqueIds.length === 0) return [];
  const trainers: Trainer[] = [];
  for (let i = 0; i < uniqueIds.length; i += 100) {
    const chunk = uniqueIds.slice(i, i + 100);
    const { data: rows, error: err } = await supabase.from(TABLE).select(COLS).in("id", chunk);
    if (err) throw err;
    trainers.push(...(rows ?? []));
  }
  trainers.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
  return trainers as Trainer[];
}

export async function findTrainerById(id: string): Promise<Trainer | null> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLS)
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data as Trainer | null;
}

export async function insertTrainer(row: TrainerInsert): Promise<Trainer> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .insert(row)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as Trainer;
}

export async function updateTrainer(
  id: string,
  updates: TrainerUpdate
): Promise<Trainer> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq("id", id)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as Trainer;
}

export async function deleteTrainer(id: string): Promise<void> {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

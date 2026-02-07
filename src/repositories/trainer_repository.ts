import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Trainer, TrainerInsert, TrainerUpdate } from "@/models/trainer";

const TABLE = "trainers";
const COLS = "id, name, image, phone_number, address, created_at, updated_at";

export async function listTrainers(): Promise<Trainer[]> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLS)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Trainer[];
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

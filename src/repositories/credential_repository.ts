import { createServiceRoleClient } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/verify-password";
import type {
  Credential,
  CredentialInsert,
  CredentialUpdate,
} from "@/models/credential";

const TABLE = "credentials";
const COLS = "id, username, pass, role, created_at, updated_at";

export async function listCredentials(): Promise<Credential[]> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLS)
    .order("username", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Credential[];
}

export async function findCredentialByUsername(
  username: string
): Promise<Credential | null> {
  const supabase = await createServiceRoleClient();
  const trimmed = username.trim().toLowerCase();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLS)
    .ilike("username", trimmed)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Credential | null;
}

export async function findCredentialById(id: string): Promise<Credential | null> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Credential | null;
}

export async function deleteCredential(id: string): Promise<void> {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export async function insertCredential(
  row: CredentialInsert
): Promise<Credential> {
  const supabase = await createServiceRoleClient();
  const passHash = await hashPassword(row.pass);
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...row, pass: passHash })
    .select(COLS)
    .single();
  if (error) throw error;
  return data as Credential;
}

export async function updateCredential(
  id: string,
  updates: CredentialUpdate
): Promise<Credential> {
  const supabase = await createServiceRoleClient();
  const payload: CredentialUpdate = { ...updates };
  if (updates.pass != null && updates.pass !== "") {
    payload.pass = await hashPassword(updates.pass);
  }
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select(COLS)
    .single();
  if (error) throw error;
  return data as Credential;
}

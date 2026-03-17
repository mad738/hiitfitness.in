import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Payment, PaymentInsert, PaymentUpdate } from "@/models/payment";

const PAYMENT_TABLE = "payments";
const DEFAULT_DATE = () => new Date().toISOString().slice(0, 10);

export async function listPlanPayments(planId: string): Promise<Payment[]> {
  const supabase = await createServiceRoleClient();
  const { data, error } = await supabase
    .from(PAYMENT_TABLE)
    .select("*")
    .eq("customer_plan_id", planId)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Payment[];
}

export async function createPlanPayment(payload: PaymentInsert): Promise<Payment> {
  const supabase = await createServiceRoleClient();
  const insertPayload = normalizeInsertPayload(payload);
  const { data, error } = await supabase
    .from(PAYMENT_TABLE)
    .insert(insertPayload)
    .select("*")
    .single();
  if (error) throw error;
  return data as Payment;
}

export async function updatePlanPayment(id: string, updates: PaymentUpdate): Promise<Payment> {
  const supabase = await createServiceRoleClient();
  const updatePayload = buildUpdatePayload(updates);
  const { data, error } = await supabase
    .from(PAYMENT_TABLE)
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Payment;
}

export async function deletePlanPayment(id: string): Promise<void> {
  const supabase = await createServiceRoleClient();
  const { error } = await supabase.from(PAYMENT_TABLE).delete().eq("id", id);
  if (error) throw error;
}

function normalizeInsertPayload(row: PaymentInsert) {
  if (!row.customer_plan_id) {
    throw new Error("customer_plan_id is required for a payment");
  }
  return {
    customer_plan_id: row.customer_plan_id,
    amount: sanitizeNumber(row.amount),
    payment_date: sanitizeDate(row.payment_date) ?? DEFAULT_DATE(),
    payment_mode: sanitizeText(row.payment_mode),
    paid_to: sanitizeText(row.paid_to),
    receipt_issued: row.receipt_issued ?? false,
  };
}

function buildUpdatePayload(row: PaymentUpdate) {
  const payload: Record<string, unknown> = {};
  if (row.amount !== undefined) payload.amount = sanitizeNumber(row.amount);
  if (row.payment_date !== undefined) payload.payment_date = sanitizeDate(row.payment_date) ?? DEFAULT_DATE();
  if (row.payment_mode !== undefined) payload.payment_mode = sanitizeText(row.payment_mode);
  if (row.paid_to !== undefined) payload.paid_to = sanitizeText(row.paid_to);
  if (row.receipt_issued !== undefined) payload.receipt_issued = row.receipt_issued ?? false;
  if (row.customer_plan_id !== undefined) payload.customer_plan_id = row.customer_plan_id;
  return payload;
}

function sanitizeNumber(value: number | null | undefined): number {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function sanitizeDate(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function sanitizeText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Payment, PaymentInsert, PaymentUpdate } from "@/models/payment";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseFlexibleDate } from "@/lib/customer-utils";

const PAYMENT_TABLE = "payments";
const PLAN_TABLE = "customer_plans";
const CUSTOMER_TABLE = "customers";
const DEFAULT_DATE = () => new Date().toISOString().slice(0, 10);
const ANALYTICS_PAGE_SIZE = 1000;

export type AnalyticsPayment = {
  customer_plan_id: string;
  amount: number;
  payment_date: string;
};

export type PaymentHistoryTransaction = {
  payment_id: string;
  customer_plan_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_mobile: string | null;
  plan_start_date: string | null;
  plan_end_date: string | null;
  amount: number;
  payment_date: string;
  payment_mode: string | null;
};

export async function listAnalyticsPayments(): Promise<AnalyticsPayment[]> {
  const supabase = await createServiceRoleClient();
  const all: AnalyticsPayment[] = [];
  let offset = 0;
  let pageLength = 0;

  do {
    const { data, error } = await supabase
      .from(PAYMENT_TABLE)
      .select("customer_plan_id, amount, payment_date")
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + ANALYTICS_PAGE_SIZE - 1);
    if (error) throw error;

    const page = (data ?? []) as Array<{
      customer_plan_id: string | null;
      amount: number | null;
      payment_date: string | null;
    }>;
    const mapped = page
      .filter((row): row is { customer_plan_id: string; amount: number; payment_date: string } =>
        Boolean(row.customer_plan_id && row.payment_date)
      )
      .map((row) => ({
        customer_plan_id: row.customer_plan_id,
        amount: sanitizeNumber(row.amount),
        payment_date: row.payment_date,
      }));

    all.push(...mapped);
    pageLength = page.length;
    offset += ANALYTICS_PAGE_SIZE;
  } while (pageLength === ANALYTICS_PAGE_SIZE);

  return all;
}

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

export async function listPaymentHistoryTransactions(
  startDate: string,
  endDate: string
): Promise<PaymentHistoryTransaction[]> {
  const supabase = await createServiceRoleClient();
  const { data: paymentRows, error: paymentError } = await supabase
    .from(PAYMENT_TABLE)
    .select("id, customer_plan_id, amount, payment_date, payment_mode, created_at")
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (paymentError) throw paymentError;

  const payments = (paymentRows ?? []) as Array<{
    id: string;
    customer_plan_id: string | null;
    amount: number | null;
    payment_date: string | null;
    payment_mode: string | null;
  }>;

  const validPayments = payments.filter(
    (row): row is {
      id: string;
      customer_plan_id: string;
      amount: number | null;
      payment_date: string;
      payment_mode: string | null;
    } => Boolean(row.customer_plan_id && row.payment_date)
  );

  const normalizedStartDate = parseFlexibleDate(startDate) ?? null;
  const normalizedEndDate = parseFlexibleDate(endDate) ?? null;
  const startMs = normalizedStartDate ? Date.parse(normalizedStartDate) : NaN;
  const endMs = normalizedEndDate ? Date.parse(normalizedEndDate) : NaN;
  const filteredPayments = validPayments.filter((row) => {
    const normalizedDate = parseFlexibleDate(row.payment_date);
    if (!normalizedDate) return false;
    const paymentMs = Date.parse(normalizedDate);
    if (Number.isNaN(paymentMs) || Number.isNaN(startMs) || Number.isNaN(endMs)) return false;
    return paymentMs >= startMs && paymentMs <= endMs;
  });

  if (filteredPayments.length === 0) {
    return [];
  }

  const planIds = Array.from(new Set(filteredPayments.map((row) => row.customer_plan_id)));
  const { data: planRows, error: planError } = await supabase
    .from(PLAN_TABLE)
    .select("id, customer_id, start_date, end_date")
    .in("id", planIds);
  if (planError) throw planError;

  const plans = (planRows ?? []) as Array<{
    id: string;
    customer_id: string | null;
    start_date: string | null;
    end_date: string | null;
  }>;
  const planMap = new Map(plans.map((row) => [row.id, row]));

  const customerIds = Array.from(
    new Set(
      plans
        .map((row) => row.customer_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  let customerMap = new Map<
    string,
    { id: string; name: string | null; mobile: string | null }
  >();
  if (customerIds.length > 0) {
    const { data: customerRows, error: customerError } = await supabase
      .from(CUSTOMER_TABLE)
      .select("id, name, mobile")
      .in("id", customerIds);
    if (customerError) throw customerError;
    customerMap = new Map(
      ((customerRows ?? []) as Array<{ id: string; name: string | null; mobile: string | null }>).map(
        (row) => [row.id, row]
      )
    );
  }

  return filteredPayments.map((row) => {
    const plan = planMap.get(row.customer_plan_id);
    const customer = plan?.customer_id ? customerMap.get(plan.customer_id) : null;
    return {
      payment_id: row.id,
      customer_plan_id: row.customer_plan_id,
      customer_id: plan?.customer_id ?? null,
      customer_name: customer?.name ?? "—",
      customer_mobile: customer?.mobile ?? null,
      plan_start_date: plan?.start_date ?? null,
      plan_end_date: plan?.end_date ?? null,
      amount: sanitizeNumber(row.amount),
      payment_date: row.payment_date,
      payment_mode: sanitizeText(row.payment_mode),
    };
  });
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
  const record = data as Payment;
  await recalcPlanFinancials(supabase, record.customer_plan_id);
  return record;
}

export async function updatePlanPayment(id: string, updates: PaymentUpdate): Promise<Payment> {
  const supabase = await createServiceRoleClient();
  const { data: existing, error: fetchError } = await supabase
    .from(PAYMENT_TABLE)
    .select("customer_plan_id")
    .eq("id", id)
    .maybeSingle();
  if (fetchError && fetchError.code !== "PGRST116") throw fetchError;
  const updatePayload = buildUpdatePayload(updates);
  const { data, error } = await supabase
    .from(PAYMENT_TABLE)
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  const record = data as Payment;
  const affectedPlans = new Set<string>();
  if (existing?.customer_plan_id) affectedPlans.add(existing.customer_plan_id);
  if (record.customer_plan_id) affectedPlans.add(record.customer_plan_id);
  await Promise.all(Array.from(affectedPlans).map((planId) => recalcPlanFinancials(supabase, planId)));
  return record;
}

export async function deletePlanPayment(id: string): Promise<void> {
  const supabase = await createServiceRoleClient();
  const { data: existing, error: fetchError } = await supabase
    .from(PAYMENT_TABLE)
    .select("customer_plan_id")
    .eq("id", id)
    .maybeSingle();
  if (fetchError && fetchError.code !== "PGRST116") throw fetchError;
  const { error } = await supabase.from(PAYMENT_TABLE).delete().eq("id", id);
  if (error) throw error;
  if (existing?.customer_plan_id) {
    await recalcPlanFinancials(supabase, existing.customer_plan_id);
  }
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
    remarks: sanitizeText(row.remarks),
    receipt_issued: row.receipt_issued ?? false,
  };
}

function buildUpdatePayload(row: PaymentUpdate) {
  const payload: Record<string, unknown> = {};
  if (row.amount !== undefined) payload.amount = sanitizeNumber(row.amount);
  if (row.payment_date !== undefined) payload.payment_date = sanitizeDate(row.payment_date) ?? DEFAULT_DATE();
  if (row.payment_mode !== undefined) payload.payment_mode = sanitizeText(row.payment_mode);
  if (row.paid_to !== undefined) payload.paid_to = sanitizeText(row.paid_to);
  if (row.remarks !== undefined) payload.remarks = sanitizeText(row.remarks);
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

async function recalcPlanFinancials(supabase: SupabaseClient, planId: string | null | undefined) {
  if (!planId) return;
  const { data: planExists, error: planError } = await supabase
    .from(PLAN_TABLE)
    .select("id")
    .eq("id", planId)
    .maybeSingle();
  if (planError && planError.code !== "PGRST116") throw planError;
  if (!planExists) return;

  const { data: paymentRows, error: paymentError } = await supabase
    .from(PAYMENT_TABLE)
    .select("amount")
    .eq("customer_plan_id", planId);
  if (paymentError) throw paymentError;

  const paidAmount = (paymentRows ?? []).reduce((sum, row) => sum + sanitizeNumber(row.amount), 0);

  const { error: updateError } = await supabase
    .from(PLAN_TABLE)
    .update({ paid_amount: paidAmount })
    .eq("id", planId);
  if (updateError) throw updateError;
}

import { createServiceRoleClient } from "@/lib/supabase/server";
import { normalizeMobile } from "@/lib/customer-utils";
import type { Customer, CustomerInsert, CustomerUpdate } from "@/models/customer";
import type { CustomerProfile } from "@/models/customer_profile";
import type { CustomerPlan } from "@/models/customer_plan";
import type { Payment } from "@/models/payment";
import type { SupabaseClient } from "@supabase/supabase-js";

const CUSTOMER_TABLE = "customers";
const PLAN_TABLE = "customer_plans";
const PAYMENT_TABLE = "payments";
const PAGE_SIZE = 1000;

const PROFILE_COLS =
  "id, name, image, status, mobile, active_plans_count, created_at, updated_at";

const PLAN_SELECT = `
  id,
  customer_id,
  plan_id,
  trainer_id,
  start_date,
  end_date,
  total_fee,
  paid_amount,
  balance,
  status,
  slot_timing,
  created_at,
  updated_at,
  customer:customers (
    ${PROFILE_COLS}
  ),
  payments:payments (
    id,
    amount,
    payment_date,
    payment_mode,
    paid_to,
    receipt_issued,
    created_at,
    updated_at
  )
`;

type CustomerPlanRow = CustomerPlan & {
  customer: CustomerProfile | null;
  payments: Payment[] | null;
};

export async function listCustomers(): Promise<Customer[]> {
  const supabase = await createServiceRoleClient();
  const all: Customer[] = [];
  let offset = 0;
  let pageLength = 0;
  do {
    const { data, error } = await supabase
      .from(PLAN_TABLE)
      .select(PLAN_SELECT)
      .order("created_at", { ascending: false })
      .order("payment_date", { ascending: false, foreignTable: PAYMENT_TABLE })
      .limit(1, { foreignTable: PAYMENT_TABLE })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = ((data ?? []) as unknown) as CustomerPlanRow[];
    const mapped = rows.map(mapPlanRowToCustomer);
    all.push(...mapped);
    pageLength = rows.length;
    offset += PAGE_SIZE;
  } while (pageLength === PAGE_SIZE);
  return all;
}

export async function findCustomerById(id: string): Promise<Customer | null> {
  const supabase = await createServiceRoleClient();
  return fetchPlanById(supabase, id);
}

export async function insertCustomer(row: CustomerInsert): Promise<Customer> {
  const supabase = await createServiceRoleClient();
  const profile = await resolveCustomerProfile(supabase, row);
  const planPayload = buildPlanInsertPayload(profile.id, row);
  const { data: planRow, error } = await supabase
    .from(PLAN_TABLE)
    .insert(planPayload)
    .select("id")
    .single();
  if (error) throw error;
  const planId = planRow.id as string;

  const paymentAmount = sanitizeNumber(row.paid_fee);
  await syncPaymentSnapshot(supabase, planId, {
    amount: paymentAmount,
    payment_date: sanitizeDate(row.pay_date),
    payment_mode: sanitizeText(row.payment_mode),
    paid_to: sanitizeText(row.paid_to),
    receipt: row.receipt ?? false,
    fallbackDate: sanitizeDate(row.start_date) ?? sanitizeDate(row.end_date),
  });

  return (await fetchPlanById(supabase, planId))!;
}

export async function updateCustomer(
  id: string,
  updates: CustomerUpdate
): Promise<Customer> {
  const supabase = await createServiceRoleClient();
  const existing = await fetchPlanById(supabase, id);
  if (!existing) throw new Error("Customer plan not found");

  await updateCustomerProfileRecord(supabase, existing.customer_id, updates, existing);

  const planUpdates = buildPlanUpdatePayload(updates);
  if (Object.keys(planUpdates).length > 0) {
    const { error: planError } = await supabase
      .from(PLAN_TABLE)
      .update(planUpdates)
      .eq("id", id);
    if (planError) throw planError;
  }

  const targetPaidAmount =
    typeof updates.paid_fee === "number" ? updates.paid_fee : existing.paid_fee;

  await syncPaymentSnapshot(supabase, id, {
    amount: targetPaidAmount,
    payment_date: sanitizeDate(updates.pay_date) ?? existing.pay_date,
    payment_mode: sanitizeText(updates.payment_mode) ?? existing.payment_mode,
    paid_to: sanitizeText(updates.paid_to) ?? existing.paid_to,
    receipt: updates.receipt ?? existing.receipt ?? false,
    fallbackDate: sanitizeDate(updates.start_date) ?? existing.start_date ?? existing.end_date,
  });

  return (await fetchPlanById(supabase, id))!;
}

export async function deleteCustomer(id: string): Promise<void> {
  const supabase = await createServiceRoleClient();
  const existing = await fetchPlanById(supabase, id);
  if (!existing) return;

  const { error } = await supabase.from(PLAN_TABLE).delete().eq("id", id);
  if (error) throw error;

  const { count, error: countError } = await supabase
    .from(PLAN_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("customer_id", existing.customer_id);
  if (countError) throw countError;
  if (!count) {
    await supabase.from(CUSTOMER_TABLE).delete().eq("id", existing.customer_id);
  }
}

async function fetchPlanById(
  supabase: SupabaseClient,
  planId: string
): Promise<Customer | null> {
  const { data, error } = await supabase
    .from(PLAN_TABLE)
    .select(PLAN_SELECT)
    .eq("id", planId)
    .order("payment_date", { ascending: false, foreignTable: PAYMENT_TABLE })
    .limit(1, { foreignTable: PAYMENT_TABLE })
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  if (!data) return null;
  return mapPlanRowToCustomer((data as unknown) as CustomerPlanRow);
}

async function resolveCustomerProfile(
  supabase: SupabaseClient,
  row: CustomerInsert
): Promise<CustomerProfile> {
  if (row.customer_id) {
    const { data, error } = await supabase
      .from(CUSTOMER_TABLE)
      .select(PROFILE_COLS)
      .eq("id", row.customer_id)
      .maybeSingle();
    if (error && error.code !== "PGRST116") throw error;
    if (data) return data as CustomerProfile;
  }

  const existing = await findProfileByContact(supabase, row);
  if (existing) {
    await updateCustomerProfileRecord(supabase, existing.id, row, existing);
    return existing;
  }

  const insertPayload = {
    name: row.name.trim(),
    image: row.image ?? null,
    status: row.status ?? null,
    mobile: sanitizeMobile(row.mobile),
  };
  const { data, error } = await supabase
    .from(CUSTOMER_TABLE)
    .insert(insertPayload)
    .select(PROFILE_COLS)
    .single();
  if (error) throw error;
  return data as CustomerProfile;
}

async function findProfileByContact(
  supabase: SupabaseClient,
  row: CustomerInsert
): Promise<CustomerProfile | null> {
  const normalizedMobile = sanitizeMobile(row.mobile);
  const rawMobile = row.mobile?.trim() || null;
  const mobileFilters = [normalizedMobile, rawMobile]
    .filter((val, idx, arr) => val && arr.indexOf(val) === idx)
    .map((val) => `mobile.eq.${val}`)
    .join(",");

  if (mobileFilters) {
    const { data, error } = await supabase
      .from(CUSTOMER_TABLE)
      .select(PROFILE_COLS)
      .or(mobileFilters)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error && error.code !== "PGRST116") throw error;
    if (data) return data as CustomerProfile;
  }

  const trimmedName = row.name?.trim();
  if (trimmedName) {
    const { data, error } = await supabase
      .from(CUSTOMER_TABLE)
      .select(PROFILE_COLS)
      .ilike("name", trimmedName)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error && error.code !== "PGRST116") throw error;
    if (data) return data as CustomerProfile;
  }

  return null;
}

type CustomerProfileSnapshot = Pick<CustomerProfile, "name" | "image" | "mobile" | "status">;

async function updateCustomerProfileRecord(
  supabase: SupabaseClient,
  customerId: string,
  updates: CustomerUpdate | CustomerInsert,
  fallback: CustomerProfileSnapshot
): Promise<void> {
  const profileUpdates: Record<string, unknown> = {};
  if (typeof updates.name === "string" && updates.name.trim() && updates.name.trim() !== fallback.name) {
    profileUpdates.name = updates.name.trim();
  }
  if (updates.image !== undefined && updates.image !== fallback.image) {
    profileUpdates.image = updates.image ?? null;
  }
  const mobileCandidate = updates.mobile ?? fallback.mobile;
  const mobile = sanitizeMobile(mobileCandidate);
  if (mobile !== sanitizeMobile(fallback.mobile)) {
    profileUpdates.mobile = mobile;
  }
  if (updates.status !== undefined && updates.status !== fallback.status) {
    profileUpdates.status = updates.status ?? null;
  }
  if (Object.keys(profileUpdates).length === 0) return;
  const { error } = await supabase
    .from(CUSTOMER_TABLE)
    .update(profileUpdates)
    .eq("id", customerId);
  if (error) throw error;
}

function buildPlanInsertPayload(customerId: string, row: CustomerInsert) {
  return {
    customer_id: customerId,
    plan_id: row.plan,
    trainer_id: row.trainer_id ?? null,
    start_date: sanitizeDate(row.start_date),
    end_date: sanitizeDate(row.end_date),
    total_fee: sanitizeNumber(row.total_fee),
    paid_amount: sanitizeNumber(row.paid_fee),
    status: row.status ?? "active",
    slot_timing: sanitizeText(row.slot_timing),
  };
}

function buildPlanUpdatePayload(row: CustomerUpdate): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (row.plan !== undefined) payload.plan_id = row.plan;
  if (row.trainer_id !== undefined) payload.trainer_id = row.trainer_id ?? null;
  if (row.start_date !== undefined) payload.start_date = sanitizeDate(row.start_date);
  if (row.end_date !== undefined) payload.end_date = sanitizeDate(row.end_date);
  if (row.total_fee !== undefined) payload.total_fee = sanitizeNumber(row.total_fee);
  if (row.paid_fee !== undefined) payload.paid_amount = sanitizeNumber(row.paid_fee);
  if (row.status !== undefined) payload.status = row.status ?? null;
  if (row.slot_timing !== undefined) payload.slot_timing = sanitizeText(row.slot_timing);
  return payload;
}

type PaymentSnapshot = {
  amount: number;
  payment_date?: string | null;
  payment_mode?: string | null;
  paid_to?: string | null;
  receipt?: boolean | null;
  fallbackDate?: string | null;
};

async function syncPaymentSnapshot(
  supabase: SupabaseClient,
  planId: string,
  snapshot: PaymentSnapshot
): Promise<void> {
  const amount = sanitizeNumber(snapshot.amount);
  const { data: existing, error } = await supabase
    .from(PAYMENT_TABLE)
    .select("id")
    .eq("customer_plan_id", planId)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  const payments = existing ?? [];

  if (amount <= 0) {
    if (payments.length > 0) {
      const ids = payments.map((p) => p.id);
      await supabase.from(PAYMENT_TABLE).delete().in("id", ids);
    }
    return;
  }

  const paymentDate =
    sanitizeDate(snapshot.payment_date) ??
    sanitizeDate(snapshot.fallbackDate) ??
    new Date().toISOString().slice(0, 10);

  const payload = {
    amount,
    payment_date: paymentDate,
    payment_mode: snapshot.payment_mode ?? null,
    paid_to: snapshot.paid_to ?? null,
    receipt_issued: snapshot.receipt ?? false,
  };

  const primary = payments[0];
  if (primary) {
    const { error: updateError } = await supabase
      .from(PAYMENT_TABLE)
      .update(payload)
      .eq("id", primary.id);
    if (updateError) throw updateError;
    if (payments.length > 1) {
      const extraIds = payments.slice(1).map((p) => p.id);
      await supabase.from(PAYMENT_TABLE).delete().in("id", extraIds);
    }
  } else {
    const insertPayload = { customer_plan_id: planId, ...payload };
    const { error: insertError } = await supabase.from(PAYMENT_TABLE).insert(insertPayload);
    if (insertError) throw insertError;
  }
}

function mapPlanRowToCustomer(row: CustomerPlanRow): Customer {
  const customer = row.customer;
  const payment = row.payments?.[0] ?? null;
  const paidAmount = sanitizeNumber(row.paid_amount);
  const totalFee = sanitizeNumber(row.total_fee);
  return {
    id: row.id,
    customer_id: row.customer_id,
    name: customer?.name ?? "",
    image: customer?.image ?? null,
    plan: row.plan_id,
    total_fee: totalFee,
    paid_fee: paidAmount,
    balance: sanitizeNumber(row.balance ?? totalFee - paidAmount),
    trainer_id: row.trainer_id ?? null,
    start_date: row.start_date,
    end_date: row.end_date,
    pay_date: payment?.payment_date ?? null,
    payment_mode: payment?.payment_mode ?? null,
    paid_to: payment?.paid_to ?? null,
    remarks: null,
    feedback: null,
    mobile: customer?.mobile ?? null,
    duration: deriveDuration(row.start_date, row.end_date),
    status: row.status ?? customer?.status ?? null,
    slot_timing: row.slot_timing ?? null,
    receipt: payment?.receipt_issued ?? false,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function deriveDuration(startDate: string | null, endDate: string | null): string | null {
  if (!startDate || !endDate) return null;
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return `${days} days`;
}

function sanitizeDate(date: string | null | undefined): string | null {
  if (!date) return null;
  const trimmed = date.trim();
  return trimmed === "" ? null : trimmed;
}

function sanitizeText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function sanitizeNumber(value: number | null | undefined): number {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function sanitizeMobile(value: string | null | undefined): string | null {
  const normalized = normalizeMobile(value ?? "");
  return normalized || null;
}

import { createServiceRoleClient } from "@/lib/supabase/server";
import { normalizeMobile } from "@/lib/customer-utils";
import { PlanOverlapError } from "@/lib/plan-overlap-error";
import type { Customer, CustomerInsert, CustomerUpdate } from "@/models/customer";
import type { CustomerProfile } from "@/models/customer_profile";
import type { CustomerPlan } from "@/models/customer_plan";
import type { PlanHold } from "@/models/plan_hold";
import type { Payment } from "@/models/payment";
import type { SupabaseClient } from "@supabase/supabase-js";

const CUSTOMER_TABLE = "customers";
const PLAN_TABLE = "customer_plans";
const PAYMENT_TABLE = "payments";
const FRIEND_TABLE = "friends";
const PLAN_HOLD_TABLE = "plan_holds";
const PAGE_SIZE = 1000;
const OVERLAP_RESTRICTED_PLAN_IDS = new Set(["PT", "GT"]);

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
  remarks,
  plan_months,
  monthly_value,
  commission_rate,
  trainer_commission,
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
  ),
  plan_holds:plan_holds!fk_plan_holds_customer_plan (
    id,
    customer_plan_id,
    hold_start_date,
    hold_end_date,
    created_at
  )
`;

type CustomerPlanRow = CustomerPlan & {
  customer: CustomerProfile | null;
  payments: Payment[] | null;
  plan_holds: PlanHold[] | null;
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
  const customerIds = Array.from(
    new Set(
      all
        .map((customer) => customer.customer_id)
        .filter((id): id is string => Boolean(id))
    )
  );
  if (customerIds.length === 0) {
    return all.map((customer) => ({ ...customer, friend_ids: [] }));
  }
  const friendMap = await fetchFriendMap(supabase, customerIds);
  return all.map((customer) => ({
    ...customer,
    friend_ids: customer.customer_id ? friendMap.get(customer.customer_id) ?? [] : [],
  }));
}

export async function findCustomerById(id: string): Promise<Customer | null> {
  const supabase = await createServiceRoleClient();
  return fetchPlanById(supabase, id);
}

export async function insertCustomer(row: CustomerInsert): Promise<Customer> {
  const supabase = await createServiceRoleClient();
  const profile = await resolveCustomerProfile(supabase, row);
  const planPayload = buildPlanInsertPayload(profile.id, row);
  await assertNoOverlappingActivePlan(supabase, {
    customerId: profile.id,
    planId: typeof planPayload.plan_id === "string" ? planPayload.plan_id : null,
    startDate: typeof planPayload.start_date === "string" ? planPayload.start_date : null,
    endDate: typeof planPayload.end_date === "string" ? planPayload.end_date : null,
    status: typeof planPayload.status === "string" ? planPayload.status : null,
  });
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

  if (row.friend_ids !== undefined) {
    const requestedFriendIds = sanitizeFriendIdsInput(row.friend_ids, profile.id);
    await syncCustomerFriends(supabase, profile.id, requestedFriendIds);
  }

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

  const hasPlanWindowUpdate =
    updates.plan !== undefined ||
    updates.start_date !== undefined ||
    updates.end_date !== undefined ||
    updates.status !== undefined;
  if (hasPlanWindowUpdate) {
    await assertNoOverlappingActivePlan(supabase, {
      customerId: existing.customer_id,
      planId: updates.plan ?? existing.plan,
      startDate:
        updates.start_date !== undefined
          ? sanitizeDate(updates.start_date)
          : sanitizeDate(existing.start_date),
      endDate:
        updates.end_date !== undefined
          ? sanitizeDate(updates.end_date)
          : sanitizeDate(existing.end_date),
      status:
        updates.status !== undefined
          ? sanitizeText(updates.status)
          : sanitizeText(existing.status),
      excludePlanId: id,
    });
  }

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

  if (updates.friend_ids !== undefined) {
    const requestedFriendIds = sanitizeFriendIdsInput(updates.friend_ids, existing.customer_id);
    await syncCustomerFriends(supabase, existing.customer_id, requestedFriendIds);
  }

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

export async function deleteCustomerCascade(customerId: string): Promise<void> {
  const supabase = await createServiceRoleClient();
  const trimmedId = customerId?.trim();
  if (!trimmedId) return;

  const { data: planRows, error } = await supabase
    .from(PLAN_TABLE)
    .select("id")
    .eq("customer_id", trimmedId);
  if (error) throw error;

  const planIds = (planRows ?? []).map((row) => row.id as string).filter(Boolean);
  if (planIds.length > 0) {
    const { error: deletePlansError } = await supabase.from(PLAN_TABLE).delete().in("id", planIds);
    if (deletePlansError) throw deletePlansError;
  }

  const { error: deleteProfileError } = await supabase.from(CUSTOMER_TABLE).delete().eq("id", trimmedId);
  if (deleteProfileError) throw deleteProfileError;
}

export async function placePlanOnHold(planId: string, holdStartDate?: string): Promise<void> {
  const supabase = await createServiceRoleClient();
  const normalizedDate = sanitizeDate(holdStartDate) ?? todayIsoDate();
  const { data: existing, error: existingError } = await supabase
    .from(PLAN_HOLD_TABLE)
    .select("id")
    .eq("customer_plan_id", planId)
    .is("hold_end_date", null)
    .maybeSingle();
  if (existingError && existingError.code !== "PGRST116") throw existingError;
  if (existing) {
    throw new Error("This plan already has an active hold.");
  }
  const { error } = await supabase
    .from(PLAN_HOLD_TABLE)
    .insert({ customer_plan_id: planId, hold_start_date: normalizedDate });
  if (error) throw error;
}

export async function resumePlanFromHold(planId: string, holdEndDate?: string): Promise<void> {
  const supabase = await createServiceRoleClient();
  const normalizedDate = sanitizeDate(holdEndDate) ?? todayIsoDate();
  const { data: activeHold, error } = await supabase
    .from(PLAN_HOLD_TABLE)
    .select("id")
    .eq("customer_plan_id", planId)
    .is("hold_end_date", null)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  if (!activeHold) {
    throw new Error("No active hold found for this plan.");
  }
  const { error: updateError } = await supabase
    .from(PLAN_HOLD_TABLE)
    .update({ hold_end_date: normalizedDate })
    .eq("id", (activeHold as { id: string }).id);
  if (updateError) throw updateError;
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

function sanitizeFriendIdsInput(input: unknown, selfId: string): string[] {
  if (!Array.isArray(input)) return [];
  const unique = new Set<string>();
  for (const value of input) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed || trimmed === selfId) continue;
    unique.add(trimmed);
  }
  return Array.from(unique);
}

async function fetchFriendMap(
  supabase: SupabaseClient,
  customerIds: string[]
): Promise<Map<string, string[]>> {
  if (customerIds.length === 0) return new Map();
  const accumulator = new Map<string, Set<string>>();

  const { data: asCustomer, error: asCustomerError } = await supabase
    .from(FRIEND_TABLE)
    .select("customer_id, friend_id")
    .in("customer_id", customerIds);
  if (asCustomerError) throw asCustomerError;

  const { data: asFriend, error: asFriendError } = await supabase
    .from(FRIEND_TABLE)
    .select("customer_id, friend_id")
    .in("friend_id", customerIds);
  if (asFriendError) throw asFriendError;

  const rows = [...(asCustomer ?? []), ...(asFriend ?? [])];
  for (const row of rows) {
    const customerId = (row as { customer_id: string | null }).customer_id;
    const friendId = (row as { friend_id: string | null }).friend_id;
    if (!customerId || !friendId) continue;
    addFriendEdge(accumulator, customerId, friendId);
    addFriendEdge(accumulator, friendId, customerId);
  }

  return new Map(
    Array.from(accumulator.entries()).map(([key, value]) => [key, Array.from(value)])
  );
}

function addFriendEdge(target: Map<string, Set<string>>, key: string, friendId: string) {
  if (!target.has(key)) {
    target.set(key, new Set());
  }
  target.get(key)!.add(friendId);
}

function makeFriendPairKey(a: string, b: string): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

async function syncCustomerFriends(
  supabase: SupabaseClient,
  primaryCustomerId: string,
  nextFriendIds: string[]
): Promise<void> {
  const desiredFriends = Array.from(
    new Set(nextFriendIds.filter((id) => id && id !== primaryCustomerId))
  );
  const { data, error } = await supabase
    .from(FRIEND_TABLE)
    .select("id, customer_id, friend_id")
    .or(`customer_id.eq.${primaryCustomerId},friend_id.eq.${primaryCustomerId}`);
  if (error) throw error;

  const existingMap = new Map<string, string>();
  for (const row of data ?? []) {
    const customerId = (row as { customer_id: string | null }).customer_id;
    const friendId = (row as { friend_id: string | null }).friend_id;
    const rowId = (row as { id: string | null }).id;
    if (!customerId || !friendId || !rowId) continue;
    existingMap.set(makeFriendPairKey(customerId, friendId), rowId);
  }

  const desiredKeys = new Set(desiredFriends.map((friendId) => makeFriendPairKey(primaryCustomerId, friendId)));

  const deleteIds = Array.from(existingMap.entries())
    .filter(([key]) => !desiredKeys.has(key))
    .map(([, rowId]) => rowId);
  if (deleteIds.length > 0) {
    const { error: deleteError } = await supabase.from(FRIEND_TABLE).delete().in("id", deleteIds);
    if (deleteError) throw deleteError;
  }

  const inserts = desiredFriends
    .filter((friendId) => !existingMap.has(makeFriendPairKey(primaryCustomerId, friendId)))
    .map((friendId) => {
      const [first, second] = primaryCustomerId < friendId
        ? [primaryCustomerId, friendId]
        : [friendId, primaryCustomerId];
      return { customer_id: first, friend_id: second };
    });

  if (inserts.length > 0) {
    const { error: insertError } = await supabase.from(FRIEND_TABLE).insert(inserts);
    if (insertError) throw insertError;
  }
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
    remarks: sanitizeText(row.remarks),
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
  if (row.remarks !== undefined) payload.remarks = sanitizeText(row.remarks);
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

type PlanOverlapCheckInput = {
  customerId: string;
  planId: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string | null;
  excludePlanId?: string;
};

async function assertNoOverlappingActivePlan(
  supabase: SupabaseClient,
  input: PlanOverlapCheckInput
): Promise<void> {
  const normalizedPlanId = normalizePlanId(input.planId);
  const normalizedStatus = normalizePlanStatus(input.status);
  if (
    !input.customerId ||
    !normalizedPlanId ||
    !OVERLAP_RESTRICTED_PLAN_IDS.has(normalizedPlanId) ||
    normalizedStatus !== "active"
  ) {
    return;
  }

  const startDate = sanitizeDate(input.startDate);
  const endDate = sanitizeDate(input.endDate);
  if (!startDate || !endDate) return;

  if (startDate > endDate) {
    throw new Error(`Start date cannot be after end date for ${normalizedPlanId}.`);
  }

  let query = supabase
    .from(PLAN_TABLE)
    .select("id, customer_id, plan_id, start_date, end_date")
    .eq("customer_id", input.customerId)
    .eq("plan_id", normalizedPlanId)
    .eq("status", "active")
    .not("start_date", "is", null)
    .not("end_date", "is", null)
    .lte("start_date", endDate)
    .gte("end_date", startDate)
    .order("start_date", { ascending: true })
    .limit(1);

  if (input.excludePlanId) {
    query = query.neq("id", input.excludePlanId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const conflict = data?.[0];
  if (!conflict) return;
  if (!conflict.id || !conflict.start_date || !conflict.end_date) return;

  throw new PlanOverlapError({
    existingPlanId: conflict.id as string,
    customerId: input.customerId,
    planId: normalizedPlanId,
    startDate: conflict.start_date as string,
    endDate: conflict.end_date as string,
  });
}

function mapPlanRowToCustomer(row: CustomerPlanRow): Customer {
  const customer = row.customer;
  const payment = row.payments?.[0] ?? null;
  const paidAmount = sanitizeNumber(row.paid_amount);
  const totalFee = sanitizeNumber(row.total_fee);
  const planMonths = sanitizeOptionalNumber(row.plan_months);
  const monthlyValue = sanitizeOptionalNumber(row.monthly_value);
  const commissionRate = sanitizeOptionalNumber(row.commission_rate);
  const trainerCommission = sanitizeOptionalNumber(row.trainer_commission);
  const normalizedHolds = normalizePlanHolds(row.plan_holds);
  const activeHold = normalizedHolds.find((hold) => !hold.hold_end_date) ?? null;
  const holdHistory = activeHold
    ? normalizedHolds.filter((hold) => hold.id !== activeHold.id)
    : normalizedHolds;
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
    remarks: row.remarks ?? null,
    feedback: null,
    mobile: customer?.mobile ?? null,
    duration: deriveDuration(row.start_date, row.end_date),
    status: row.status ?? customer?.status ?? null,
    slot_timing: row.slot_timing ?? null,
    receipt: payment?.receipt_issued ?? false,
    created_at: row.created_at,
    updated_at: row.updated_at,
    plan_months: planMonths,
    monthly_value: monthlyValue,
    commission_rate: commissionRate,
    trainer_commission: trainerCommission,
    friend_ids: [],
    active_hold: activeHold ?? null,
    hold_history: holdHistory,
  };
}

function normalizePlanHolds(rawHolds: PlanHold[] | null | undefined): PlanHold[] {
  if (!rawHolds) return [];
  return rawHolds
    .map((hold) => {
      if (!hold || !hold.id || !hold.customer_plan_id || !hold.hold_start_date || !hold.created_at) {
        return null;
      }
      return {
        id: hold.id,
        customer_plan_id: hold.customer_plan_id,
        hold_start_date: hold.hold_start_date,
        hold_end_date: hold.hold_end_date ?? null,
        created_at: hold.created_at,
      } satisfies PlanHold;
    })
    .filter((hold): hold is PlanHold => Boolean(hold))
    .sort((a, b) => compareDatesDesc(a.hold_start_date, b.hold_start_date));
}

function compareDatesDesc(aDate: string, bDate: string): number {
  const aTime = Date.parse(aDate);
  const bTime = Date.parse(bDate);
  const aValid = !Number.isNaN(aTime);
  const bValid = !Number.isNaN(bTime);
  if (aValid && bValid) return bTime - aTime;
  if (aValid) return -1;
  if (bValid) return 1;
  return bDate.localeCompare(aDate);
}

function deriveDuration(startDate: string | null, endDate: string | null): string | null {
  if (!startDate || !endDate) return null;
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return `${days} days`;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
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

function sanitizeOptionalNumber(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizePlanId(value: string | null | undefined): string {
  return (value ?? "").trim().toUpperCase();
}

function normalizePlanStatus(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

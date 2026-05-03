"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { AdminDatePicker } from "@/components/ui/admin-date-picker";
import { listPaymentHistoryTransactions, listPlanPayments, createPlanPayment, updatePlanPayment, deletePlanPayment } from "@app/actions/payments";
import type { Customer } from "@/models/customer";
import type { Trainer } from "@/models/trainer";
import type { Payment } from "@/models/payment";
import { CustomerReportModal } from "@/features/admin/CustomerReportModal";
import { PlanPaymentsModal, PaymentFormState } from "@/features/admin/PlanPaymentsModal";
import { normalizeMobile, parseFlexibleDate } from "@/lib/customer-utils";

type Props = { initialCustomers: Customer[]; initialTrainers: Trainer[] };

type PaymentHistoryFilter = "recent" | "today" | "yesterday" | "custom";

type PaymentHistoryTransaction = Awaited<ReturnType<typeof listPaymentHistoryTransactions>>[number];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPromptDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return value;
}

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayIsoDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function getLast30IsoDate(): string {
  const date = new Date();
  // include today and the previous 29 days -> 30-day window
  date.setDate(date.getDate() - 29);
  return date.toISOString().slice(0, 10);
}

export function PaymentHistoryView({ initialCustomers, initialTrainers }: Props) {
  const [paymentHistoryFilter, setPaymentHistoryFilter] = useState<PaymentHistoryFilter>("recent");
  const [paymentHistoryStartDate, setPaymentHistoryStartDate] = useState(getLast30IsoDate());
  const [paymentHistoryEndDate, setPaymentHistoryEndDate] = useState(getTodayIsoDate());
  const [paymentHistoryRows, setPaymentHistoryRows] = useState<PaymentHistoryTransaction[]>([]);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);
  const [paymentHistoryError, setPaymentHistoryError] = useState<string | null>(null);
  const [paymentHistoryDetail, setPaymentHistoryDetail] = useState<PaymentHistoryTransaction | null>(null);
  const [historyPlanPayments, setHistoryPlanPayments] = useState<Payment[]>([]);
  const [historyPlanLoading, setHistoryPlanLoading] = useState(false);
  const [historyPlanError, setHistoryPlanError] = useState<string | null>(null);
  const [combinedModalOpen, setCombinedModalOpen] = useState(false);
  const [combinedTab, setCombinedTab] = useState<"customer" | "plan">("customer");
  const [paymentsSaving, setPaymentsSaving] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  const selectedDetailPlan = useMemo(() => {
    if (!paymentHistoryDetail) return null;
    const byPlanId = initialCustomers.find((customer) => customer.id === paymentHistoryDetail.customer_plan_id) ?? null;
    if (byPlanId) return byPlanId;

    const byCustomerId = paymentHistoryDetail.customer_id
      ? initialCustomers.find((customer) => customer.customer_id === paymentHistoryDetail.customer_id) ?? null
      : null;
    if (byCustomerId) return byCustomerId;

    return paymentHistoryDetail.customer_mobile
      ? initialCustomers.find((customer) => normalizeMobile(customer.mobile) === normalizeMobile(paymentHistoryDetail.customer_mobile)) ?? null
      : null;
  }, [initialCustomers, paymentHistoryDetail]);

  const selectedDetailTrainer = useMemo(() => {
    if (!selectedDetailPlan?.trainer_id) return null;
    return initialTrainers.find((trainer) => trainer.id === selectedDetailPlan.trainer_id) ?? null;
  }, [initialTrainers, selectedDetailPlan]);

  function formatPlanTypeRaw(raw: unknown): string {
    if (!raw) return "—";
    const s = String(raw).toLowerCase();
    if (s.includes("gt") || s.includes("group") || s.includes("general")) return "GT";
    if (s.includes("pt") || s.includes("personal") || s.includes("one-to-one") || s.includes("one to one")) return "PT";
    return String(raw).toUpperCase();
  }

  function resolveRowPlanType(row: PaymentHistoryTransaction): string {
    const byPlanId = initialCustomers.find((customer) => customer.id === row.customer_plan_id) ?? null;
    if (byPlanId) return formatPlanTypeRaw((byPlanId as any).plan_type ?? (byPlanId as any).type ?? (byPlanId as any).plan);

    const byCustomerId = row.customer_id
      ? initialCustomers.find((customer) => customer.customer_id === row.customer_id) ?? null
      : null;
    if (byCustomerId) return formatPlanTypeRaw((byCustomerId as any).plan_type ?? (byCustomerId as any).type ?? (byCustomerId as any).plan);

    if (row.customer_mobile) {
      const byMobile = initialCustomers.find((customer) => normalizeMobile(customer.mobile) === normalizeMobile(row.customer_mobile)) ?? null;
      if (byMobile) return formatPlanTypeRaw((byMobile as any).plan_type ?? (byMobile as any).type ?? (byMobile as any).plan);
    }

    return formatPlanTypeRaw((row as any).plan_type ?? (row as any).plan ?? null);
  }

  function resolveRowBalance(row: PaymentHistoryTransaction): string {
    const byPlanId = initialCustomers.find((customer) => customer.id === row.customer_plan_id) ?? null;
    if (byPlanId) return formatCurrency((byPlanId as any).balance ?? 0);

    const byCustomerId = row.customer_id
      ? initialCustomers.find((customer) => customer.customer_id === row.customer_id) ?? null
      : null;
    if (byCustomerId) return formatCurrency((byCustomerId as any).balance ?? 0);

    if (row.customer_mobile) {
      const byMobile = initialCustomers.find((customer) => normalizeMobile(customer.mobile) === normalizeMobile(row.customer_mobile)) ?? null;
      if (byMobile) return formatCurrency((byMobile as any).balance ?? 0);
    }

    return "—";
  }

  function getRowBalanceNumber(row: PaymentHistoryTransaction): number {
    const byPlanId = initialCustomers.find((customer) => customer.id === row.customer_plan_id) ?? null;
    if (byPlanId) return (byPlanId as any).balance ?? NaN;

    const byCustomerId = row.customer_id
      ? initialCustomers.find((customer) => customer.customer_id === row.customer_id) ?? null
      : null;
    if (byCustomerId) return (byCustomerId as any).balance ?? NaN;

    if (row.customer_mobile) {
      const byMobile = initialCustomers.find((customer) => normalizeMobile(customer.mobile) === normalizeMobile(row.customer_mobile)) ?? null;
      if (byMobile) return (byMobile as any).balance ?? NaN;
    }

    return NaN;
  }

  function balanceClassForNumber(bal: number): string {
    if (!Number.isFinite(bal)) return "text-stone-300";
    if (bal > 0) return "text-amber-300 font-semibold";
    if (bal < 0) return "text-emerald-300 font-semibold";
    return "text-stone-300";
  }

  function planTypeClassFor(type: string): string {
    if (type === "GT") return "text-indigo-300 font-semibold";
    if (type === "PT") return "text-rose-300 font-semibold";
    return "text-stone-300";
  }

  function planTypeCellClassFor(type: string): string {
    if (type === "GT") return "bg-indigo-900/30 text-indigo-300 font-semibold rounded-md";
    if (type === "PT") return "bg-rose-900/30 text-rose-300 font-semibold rounded-md";
    return "text-stone-300";
  }

  function paidAmountClass(amount: number): string {
    if (!Number.isFinite(amount) || amount === 0) return "text-stone-300 font-medium";
    return "text-emerald-300 font-semibold";
  }

  useEffect(() => {
    if (paymentHistoryFilter === "recent") {
      const start = getLast30IsoDate();
      const end = getTodayIsoDate();
      setPaymentHistoryStartDate(start);
      setPaymentHistoryEndDate(end);
      return;
    }
    if (paymentHistoryFilter === "today") {
      const today = getTodayIsoDate();
      setPaymentHistoryStartDate(today);
      setPaymentHistoryEndDate(today);
      return;
    }
    if (paymentHistoryFilter === "yesterday") {
      const yesterday = getYesterdayIsoDate();
      setPaymentHistoryStartDate(yesterday);
      setPaymentHistoryEndDate(yesterday);
    }
  }, [paymentHistoryFilter]);

  useEffect(() => {
    let disposed = false;
    const startDate = parseFlexibleDate(paymentHistoryStartDate);
    const endDate = parseFlexibleDate(paymentHistoryEndDate);
    if (!startDate || !endDate) return;
    if (Date.parse(startDate) > Date.parse(endDate)) {
      setPaymentHistoryRows([]);
      setPaymentHistoryError("Start date cannot be after end date.");
      return;
    }
    setPaymentHistoryError(null);
    const load = async () => {
      setPaymentHistoryLoading(true);
      try {
        const rows = await listPaymentHistoryTransactions(startDate, endDate);
        if (disposed) return;
        setPaymentHistoryRows(rows);
      } catch (err) {
        if (disposed) return;
        setPaymentHistoryRows([]);
        setPaymentHistoryError((err as Error)?.message ?? "Unable to load payment history.");
      } finally {
        if (!disposed) setPaymentHistoryLoading(false);
      }
    };
    void load();
    return () => {
      disposed = true;
    };
  }, [paymentHistoryStartDate, paymentHistoryEndDate]);

  const refreshHistoryPlanPayments = useCallback(async (planId: string) => {
    const data = await listPlanPayments(planId);
    setHistoryPlanPayments(data);
  }, []);

  const openPaymentHistoryDetail = useCallback(async (row: PaymentHistoryTransaction) => {
    // open combined modal (customer report + plan payments) for this row
    setPaymentHistoryDetail(row);
    setHistoryPlanPayments([]);
    setHistoryPlanError(null);
    setCombinedTab("customer");
    setCombinedModalOpen(true);
    if (!row.customer_plan_id) return;
    setHistoryPlanLoading(true);
    try {
      await refreshHistoryPlanPayments(row.customer_plan_id);
    } catch (err) {
      setHistoryPlanError((err as Error)?.message ?? "Failed to load plan payments.");
    } finally {
      setHistoryPlanLoading(false);
    }
  }, [refreshHistoryPlanPayments]);

  const closePaymentHistoryDetail = useCallback(() => {
    setPaymentHistoryDetail(null);
    setHistoryPlanPayments([]);
    setHistoryPlanLoading(false);
    setHistoryPlanError(null);
  }, []);

  async function handlePlanPaymentSubmit(form: PaymentFormState) {
    if (!paymentHistoryDetail) return { ok: false, error: "No plan selected" };
    const planId = paymentHistoryDetail.customer_plan_id;
    if (!planId) return { ok: false, error: "Plan ID missing" };
    setPaymentsError(null);
    setPaymentsSaving(true);
    try {
      if (form.paymentId) {
        const payload = {
          amount: parseFloat(form.amount || "0"),
          payment_date: form.paymentDate,
          payment_mode: form.paymentMode || null,
          paid_to: form.paidTo || null,
          remarks: form.remarks || null,
          receipt_issued: Boolean(form.receipt),
        } as any;
        const res = await updatePlanPayment(form.paymentId, payload);
        await refreshHistoryPlanPayments(planId);
        return res;
      } else {
        const payload = {
          customer_plan_id: planId,
          amount: parseFloat(form.amount || "0"),
          payment_date: form.paymentDate,
          payment_mode: form.paymentMode || null,
          paid_to: form.paidTo || null,
          remarks: form.remarks || null,
          receipt_issued: Boolean(form.receipt),
        } as any;
        const res = await createPlanPayment(payload);
        await refreshHistoryPlanPayments(planId);
        return res;
      }
    } catch (err) {
      const message = (err as Error)?.message ?? "Save failed";
      setPaymentsError(message);
      return { ok: false, error: message };
    } finally {
      setPaymentsSaving(false);
    }
  }

  async function handleDeletePlanPayment(payment: Payment) {
    if (!payment?.id) return;
    setPaymentsError(null);
    setPaymentsSaving(true);
    try {
      await deletePlanPayment(payment.id);
      if (paymentHistoryDetail?.customer_plan_id) {
        await refreshHistoryPlanPayments(paymentHistoryDetail.customer_plan_id);
      }
    } catch (err) {
      setPaymentsError((err as Error)?.message ?? "Delete failed");
    } finally {
      setPaymentsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-stone-100 mb-1 tracking-tight">Payment history</h1>
        <p className="text-stone-400 text-sm">Daily transactions across customers and plans.</p>
      </section>

      <div className="rounded-2xl border border-white/10 bg-stone-900/30 p-5">
        <div className="flex flex-wrap gap-3 items-center mb-4">
          {(["today", "yesterday", "custom"] as PaymentHistoryFilter[]).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setPaymentHistoryFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${paymentHistoryFilter === filter ? "border-brand-red/60 bg-brand-red/15 text-white" : "border-white/15 text-stone-300 hover:border-brand-red/40 hover:text-white"}`}
            >
              {filter === "today" ? "Today" : filter === "yesterday" ? "Yesterday" : "Custom Date Range"}
            </button>
          ))}
        </div>

        {paymentHistoryFilter === "custom" && (
          <div className="grid gap-3 sm:grid-cols-2 max-w-2xl mb-4">
            <div>
              <label className="block text-sm text-stone-400 mb-1.5">Start date</label>
              <AdminDatePicker value={paymentHistoryStartDate} onChange={setPaymentHistoryStartDate} className="w-full px-3 py-2.5 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm text-stone-400 mb-1.5">End date</label>
              <AdminDatePicker value={paymentHistoryEndDate} onChange={setPaymentHistoryEndDate} className="w-full px-3 py-2.5 rounded-xl" />
            </div>
          </div>
        )}

        <div>
          {paymentHistoryError && (
            <p className="mb-4 text-sm text-brand-red bg-brand-red/15 px-3 py-2 rounded-xl">{paymentHistoryError}</p>
          )}
          {paymentHistoryLoading ? (
            <p className="text-stone-400 text-sm">Loading transactions…</p>
          ) : paymentHistoryRows.length === 0 ? (
            <p className="text-stone-500 text-sm">No transactions found for the selected dates.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="border-b border-white/10 bg-white/[0.04]">
                      <th className="py-3 px-4 text-stone-400 font-medium text-left">Date</th>
                      <th className="py-3 px-4 text-stone-400 font-medium text-left">Customer Name</th>
                      <th className="py-3 px-4 text-stone-400 font-medium text-left">Phone Number</th>
                      <th className="py-3 px-4 text-stone-400 font-medium text-left">Plan Type</th>
                      <th className="py-3 px-4 text-stone-400 font-medium text-left">Plan Start Date</th>
                      <th className="py-3 px-4 text-stone-400 font-medium text-left">Plan End Date</th>
                      <th className="py-3 px-4 text-stone-400 font-medium text-right">Payment Amount</th>
                      <th className="py-3 px-4 text-stone-400 font-medium text-left">Balance</th>
                      <th className="py-3 px-4 text-stone-400 font-medium text-left">Payment Mode</th>
                    </tr>
                </thead>
                <tbody>
                  {paymentHistoryRows.map((row) => (
                    <tr
                      key={row.payment_id}
                      onClick={() => void openPaymentHistoryDetail(row)}
                      className="border-b border-white/5 hover:bg-white/[0.04] cursor-pointer"
                    >
                      <td className="py-2.5 px-4 text-stone-200 whitespace-nowrap">{formatPromptDate(row.payment_date)}</td>
                      <td className="py-2.5 px-4 text-stone-100 font-medium">{row.customer_name}</td>
                      <td className="py-2.5 px-4 text-stone-300">{row.customer_mobile ?? "—"}</td>
                      <td className={`py-2.5 px-4 ${planTypeCellClassFor(resolveRowPlanType(row))}`}>{resolveRowPlanType(row)}</td>
                      <td className="py-2.5 px-4 text-stone-300 whitespace-nowrap">{formatPromptDate(row.plan_start_date)}</td>
                      <td className="py-2.5 px-4 text-stone-300 whitespace-nowrap">{formatPromptDate(row.plan_end_date)}</td>
                      <td className={`py-2.5 px-4 text-right tabular-nums ${paidAmountClass(row.amount)}`}>{formatCurrency(row.amount)}</td>
                      <td className={`py-2.5 px-4 ${balanceClassForNumber(getRowBalanceNumber(row))}`}>{Number.isFinite(getRowBalanceNumber(row)) ? formatCurrency(getRowBalanceNumber(row)) : "—"}</td>
                      <td className="py-2.5 px-4 text-stone-300">{row.payment_mode ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {paymentHistoryDetail && (
        <div className="rounded-2xl border border-white/10 bg-stone-900/40 p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-500">Selected transaction</p>
              <h2 className="text-lg font-semibold text-stone-100">{paymentHistoryDetail.customer_name}</h2>
              <p className="text-sm text-stone-400">
                {formatPromptDate(paymentHistoryDetail.payment_date)} · {formatCurrency(paymentHistoryDetail.amount)} · {paymentHistoryDetail.payment_mode ?? "—"}
              </p>
            </div>
            <button
              type="button"
              onClick={closePaymentHistoryDetail}
              className="px-3 py-1.5 rounded-lg border border-white/20 text-stone-300 hover:bg-white/5 text-sm"
            >
              Close details
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs uppercase tracking-wider text-stone-500">Customer</p>
              <p className="text-stone-100 font-semibold">{paymentHistoryDetail.customer_name}</p>
              <p className="text-stone-400 text-xs">{paymentHistoryDetail.customer_mobile ?? "—"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs uppercase tracking-wider text-stone-500">Plan window</p>
              <p className="text-stone-100 font-semibold">{formatPromptDate(paymentHistoryDetail.plan_start_date)} → {formatPromptDate(paymentHistoryDetail.plan_end_date)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs uppercase tracking-wider text-stone-500">Plan</p>
              <p className="text-stone-100 font-semibold">{selectedDetailPlan?.plan ?? "—"}</p>
              <p className="text-stone-400 text-xs">{selectedDetailTrainer?.name ?? selectedDetailPlan?.trainer_id ?? "—"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs uppercase tracking-wider text-stone-500">Customer id</p>
              <p className="text-stone-100 font-semibold">{paymentHistoryDetail.customer_id ?? "—"}</p>
              <p className="text-stone-400 text-xs">{paymentHistoryDetail.customer_plan_id ?? "—"}</p>
            </div>
          </div>

          {historyPlanError && (
            <p className="text-sm text-brand-red bg-brand-red/15 px-3 py-2 rounded-xl">{historyPlanError}</p>
          )}

          {historyPlanLoading ? (
            <p className="text-stone-400 text-sm">Loading plan payments…</p>
          ) : historyPlanPayments.length === 0 ? (
            <p className="text-stone-500 text-sm">No plan payments were found for this transaction.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.04]">
                    <th className="py-3 px-4 text-stone-400 font-medium text-left">Date</th>
                    <th className="py-3 px-4 text-stone-400 font-medium text-right">Amount</th>
                    <th className="py-3 px-4 text-stone-400 font-medium text-left">Mode</th>
                    <th className="py-3 px-4 text-stone-400 font-medium text-left">Paid to</th>
                    <th className="py-3 px-4 text-stone-400 font-medium text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {historyPlanPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-white/5">
                      <td className="py-2.5 px-4 text-stone-200 whitespace-nowrap">{formatPromptDate(payment.payment_date)}</td>
                      <td className="py-2.5 px-4 text-right text-emerald-200 font-semibold tabular-nums">{formatCurrency(payment.amount)}</td>
                      <td className="py-2.5 px-4 text-stone-300">{payment.payment_mode ?? "—"}</td>
                      <td className="py-2.5 px-4 text-stone-300">{payment.paid_to ?? "—"}</td>
                      <td className="py-2.5 px-4 text-stone-300">{payment.remarks ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Combined modal tab header (portal) */}
      {combinedModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-x-0 top-8 z-[240] flex justify-center pointer-events-none">
          <div className="inline-flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => setCombinedTab("customer")}
              className={`px-4 py-2 rounded-t-xl text-sm font-semibold transition ${combinedTab === "customer" ? "bg-brand-red/20 text-white ring-2 ring-brand-red/30 shadow-lg" : "bg-black/30 text-stone-300 hover:bg-white/5"}`}
            >
              Customer report
            </button>
            <button
              type="button"
              onClick={async () => {
                setCombinedTab("plan");
                if (paymentHistoryDetail?.customer_plan_id) {
                  setHistoryPlanLoading(true);
                  try {
                    await refreshHistoryPlanPayments(paymentHistoryDetail.customer_plan_id);
                  } finally {
                    setHistoryPlanLoading(false);
                  }
                }
              }}
              className={`px-4 py-2 rounded-t-xl text-sm font-semibold transition ${combinedTab === "plan" ? "bg-brand-red/20 text-white ring-2 ring-brand-red/30 shadow-lg" : "bg-black/30 text-stone-300 hover:bg-white/5"}`}
            >
              Plan report
            </button>
            <button
              type="button"
              onClick={() => { setCombinedModalOpen(false); setPaymentHistoryDetail(null); }}
              className="px-3 py-2 rounded-t-xl text-sm text-stone-300 bg-black/30 hover:bg-white/5"
            >
              Close
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Combined modals (render only the active tab's modal) */}
      {combinedModalOpen && paymentHistoryDetail && (
        <>
          {combinedTab === "customer" && (
            <CustomerReportModal
              customer={selectedDetailPlan ?? ({} as Customer)}
              customers={initialCustomers}
              trainers={initialTrainers}
              formatCurrency={formatCurrency}
              onClose={() => { setCombinedModalOpen(false); setPaymentHistoryDetail(null); }}
              showActions
              onViewPayments={(plan) => {
                setCombinedTab("plan");
                void (async () => {
                  setHistoryPlanLoading(true);
                  try {
                    await refreshHistoryPlanPayments(plan.id);
                  } finally {
                    setHistoryPlanLoading(false);
                  }
                })();
              }}
            />
          )}

          {combinedTab === "plan" && (
            <PlanPaymentsModal
              plan={selectedDetailPlan}
              open={true}
              payments={historyPlanPayments}
              loading={historyPlanLoading}
              saving={paymentsSaving}
              error={paymentsError ?? historyPlanError}
              formatCurrency={formatCurrency}
              onClose={() => { setCombinedModalOpen(false); setPaymentHistoryDetail(null); }}
              onSubmit={handlePlanPaymentSubmit}
              onDeleteRequest={handleDeletePlanPayment}
              allowManage={true}
            />
          )}
        </>
      )}
    </div>
  );
}

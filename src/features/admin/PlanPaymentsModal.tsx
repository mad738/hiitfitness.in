"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Customer } from "@/models/customer";
import type { Payment } from "@/models/payment";
import { TRACKER_PAYMENT_MODE_OPTIONS } from "@/config/tracker-options";
import { AdminDatePicker } from "@/components/ui/admin-date-picker";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDateForInput } from "@/lib/customer-utils";

export type PaymentFormState = {
  paymentId?: string | null;
  amount: string;
  paymentDate: string;
  paymentMode: string;
  paidTo: string;
  remarks: string;
  receipt: boolean;
};

type Props = {
  plan: Customer | null;
  payments: Payment[];
  open: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  formatCurrency: (n: number) => string;
  onClose: () => void;
  onSubmit: (form: PaymentFormState) => Promise<{ ok: boolean; error?: string }>;
  onDeleteRequest: (payment: Payment) => void;
  allowManage?: boolean;
};

const emptyForm: PaymentFormState = {
  paymentId: null,
  amount: "",
  paymentDate: "",
  paymentMode: "",
  paidTo: "",
  remarks: "",
  receipt: false,
};

function formatDateShort(value: string | null): string {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export function PlanPaymentsModal({
  plan,
  payments,
  open,
  loading,
  saving,
  error,
  formatCurrency,
  onClose,
  onSubmit,
  onDeleteRequest,
  allowManage = true,
}: Props) {
  const [form, setForm] = useState<PaymentFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [paymentFormVisible, setPaymentFormVisible] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    setFormError(null);
    setPaymentFormVisible(false);
  }, [open, plan?.id]);

  useEffect(() => {
    if (!form.paymentId) return;
    if (!payments.some((payment) => payment.id === form.paymentId)) {
      setForm(emptyForm);
      setFormError(null);
    }
  }, [payments, form.paymentId]);

  const sortedPayments = useMemo(
    () =>
      payments
        .slice()
        .sort((a, b) => {
          const aDate = a.payment_date ? Date.parse(a.payment_date) : 0;
          const bDate = b.payment_date ? Date.parse(b.payment_date) : 0;
          return bDate - aDate || Date.parse(b.created_at) - Date.parse(a.created_at);
        }),
    [payments]
  );

  const holdEntries = useMemo(() => {
    if (!plan) return [] as NonNullable<Customer["hold_history"]>;
    const history = plan.hold_history ?? [];
    const entries = history.slice();
    if (plan.active_hold) {
      entries.push(plan.active_hold);
    }
    return entries.sort((a, b) => {
      const aTime = a.hold_start_date ? Date.parse(a.hold_start_date) : 0;
      const bTime = b.hold_start_date ? Date.parse(b.hold_start_date) : 0;
      return bTime - aTime;
    });
  }, [plan]);

  function togglePaymentFormVisibility() {
    setForm(emptyForm);
    setFormError(null);
    setPaymentFormVisible((visible) => !visible);
  }

  if (!open || !plan || typeof document === "undefined") return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    const result = await onSubmit(form);
    if (result.ok) {
      setForm(emptyForm);
    } else if (result.error) {
      setFormError(result.error);
    }
  }

  function handleEdit(payment: Payment) {
    setForm({
      paymentId: payment.id,
      amount: payment.amount != null ? String(payment.amount) : "",
      paymentDate: formatDateForInput(payment.payment_date),
      paymentMode: payment.payment_mode ?? "",
      paidTo: payment.paid_to ?? "",
      remarks: payment.remarks ?? "",
      receipt: Boolean(payment.receipt_issued),
    });
    setFormError(null);
    setPaymentFormVisible(true);
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="liquid-glass rounded-2xl border border-white/10 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <p className="text-sm uppercase text-stone-400 tracking-wider">Plan payments</p>
            <p className="text-lg font-semibold text-stone-100">{plan.name} · {plan.plan}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-white/10"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div className="grid grid-cols-1 gap-4 text-sm text-stone-300 lg:grid-cols-2">
            <div>
              <p className="text-stone-500 uppercase text-xs tracking-wider">Plan window</p>
              <p className="font-medium">{formatDateShort(plan.start_date)} → {formatDateShort(plan.end_date)}</p>
            </div>
            <div>
              <p className="text-stone-500 uppercase text-xs tracking-wider">Totals</p>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {[
                  { label: "Total", value: plan.total_fee, accent: "text-stone-100 border-white/15" },
                  { label: "Paid", value: plan.paid_fee, accent: "text-emerald-200 border-emerald-300/30" },
                  { label: "Balance", value: plan.balance, accent: "text-amber-200 border-amber-300/30" },
                ].map((chip) => (
                  <div
                    key={chip.label}
                    className={`rounded-2xl bg-stone-950/60 px-3 py-2 border text-left ${chip.accent}`}
                  >
                    <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400">{chip.label}</p>
                    <p className="text-base font-semibold">{formatCurrency(chip.value)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-300">Transactions</h3>
              {allowManage && (
                <button
                  type="button"
                  onClick={togglePaymentFormVisibility}
                  className="px-3 py-1.5 rounded-lg border border-white/20 text-xs font-semibold tracking-wide uppercase text-stone-200 hover:border-brand-red/60 hover:text-white transition"
                >
                  {paymentFormVisible ? "Hide form" : "Add payment"}
                </button>
              )}
            </div>
            {allowManage && (
              <>
                {saving && <p className="text-xs text-stone-500 italic">Saving…</p>}
                {paymentFormVisible ? (
                  <>
                    {formError && <p className="text-sm text-brand-red bg-brand-red/10 px-3 py-2 rounded">{formError}</p>}
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1">Amount (₹)</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          value={form.amount}
                          onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                          onWheel={(event) => event.currentTarget.blur()}
                          className="w-full px-3 py-2 rounded-xl bg-stone-900/80 border border-white/10 text-stone-100"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1">Payment date <span className="text-brand-red">*</span></label>
                        <AdminDatePicker
                          value={form.paymentDate}
                          onChange={(value) => setForm((prev) => ({ ...prev, paymentDate: value }))}
                          className="w-full px-3 py-2 rounded-xl bg-stone-900/80 border border-white/10 text-stone-100"
                          aria-label="Payment date"
                          popoverPlacement="above"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1">Payment mode <span className="text-brand-red">*</span></label>
                        <select
                          name="payment_mode"
                          value={form.paymentMode}
                          onChange={(e) => setForm((prev) => ({ ...prev, paymentMode: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-stone-900/80 border border-white/10 text-stone-100"
                          required
                        >
                          <option value="">— Select —</option>
                          {TRACKER_PAYMENT_MODE_OPTIONS.map((mode) => (
                            <option key={mode} value={mode}>{mode}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1">Paid to</label>
                        <input
                          type="text"
                          value={form.paidTo}
                          onChange={(e) => setForm((prev) => ({ ...prev, paidTo: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-stone-900/80 border border-white/10 text-stone-100"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs uppercase tracking-wider text-stone-400 mb-1">Remarks</label>
                        <textarea
                          value={form.remarks}
                          onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-stone-900/80 border border-white/10 text-stone-100 min-h-[72px]"
                          placeholder="Optional notes about this payment"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          id="payment-receipt"
                          type="checkbox"
                          checked={form.receipt}
                          onChange={(e) => setForm((prev) => ({ ...prev, receipt: e.target.checked }))}
                          className="w-4 h-4 rounded border-white/20 bg-stone-900/80 text-brand-red focus:ring-brand-red focus:ring-offset-0"
                        />
                        <label htmlFor="payment-receipt" className="text-sm text-stone-300">Receipt issued</label>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-2.5 rounded-xl bg-brand-red text-white font-semibold text-sm disabled:opacity-50"
                        >
                          {saving ? "Saving…" : form.paymentId ? "Update" : "Add payment"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setForm(emptyForm); setFormError(null); }}
                          className="px-4 py-2.5 rounded-xl border border-white/20 text-stone-400 hover:bg-white/5 text-sm"
                        >
                          Clear
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <p className="text-sm text-stone-500">
                    Click “Add payment” above to log a new transaction or edit an existing entry.
                  </p>
                )}
              </>
            )}
            {error && (
              <p className="text-sm text-brand-red bg-brand-red/10 px-3 py-2 rounded">{error}</p>
            )}
            {loading ? (
              <LoadingSpinner label="Loading payments…" size="sm" className="py-6" />
            ) : sortedPayments.length === 0 ? (
              <p className="text-stone-500 text-sm">No payments recorded yet.</p>
            ) : (
              <div className="overflow-x-auto border border-white/10 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-stone-400 uppercase text-xs">
                    <tr>
                      <th className="text-left py-2 px-3">Date</th>
                      <th className="text-right py-2 px-3">Amount</th>
                      <th className="text-left py-2 px-3">Mode</th>
                      <th className="text-left py-2 px-3">Paid to</th>
                      <th className="text-left py-2 px-3">Remarks</th>
                      <th className="text-center py-2 px-3">Receipt</th>
                      {allowManage && <th className="text-center py-2 px-3">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPayments.map((payment) => (
                      <tr key={payment.id} className="border-t border-white/10">
                        <td className="py-2 px-3 text-stone-200">{formatDateShort(payment.payment_date)}</td>
                        <td className="py-2 px-3 text-right text-emerald-200 font-semibold">{formatCurrency(payment.amount)}</td>
                        <td className="py-2 px-3 text-stone-300">{payment.payment_mode ?? "—"}</td>
                        <td className="py-2 px-3 text-stone-300">{payment.paid_to ?? "—"}</td>
                        <td className="py-2 px-3 text-stone-300 max-w-xs truncate" title={payment.remarks ?? undefined}>{payment.remarks ?? "—"}</td>
                        <td className="py-2 px-3 text-center text-stone-300">{payment.receipt_issued ? "Yes" : "—"}</td>
                        {allowManage && (
                          <td className="py-2 px-3 text-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(payment)}
                              className="px-2 py-1 rounded-lg text-xs text-stone-200 border border-white/10 hover:border-brand-red/50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteRequest(payment)}
                              className="px-2 py-1 rounded-lg text-xs text-brand-red border border-brand-red/30 hover:bg-brand-red/10"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stone-300">Hold history</h3>
              {plan.active_hold && (
                <span className="text-xs text-amber-300 font-semibold">Currently on hold</span>
              )}
            </div>
            {holdEntries.length === 0 ? (
              <p className="text-stone-500 text-sm">No hold periods recorded for this plan.</p>
            ) : (
              <div className="overflow-x-auto border border-white/10 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-stone-400 uppercase text-xs">
                    <tr>
                      <th className="text-left py-2 px-3">Hold start</th>
                      <th className="text-left py-2 px-3">Hold end</th>
                      <th className="text-left py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdEntries.map((hold) => {
                      const isActive = !hold.hold_end_date;
                      return (
                        <tr key={hold.id} className="border-t border-white/10">
                          <td className="py-2 px-3 text-stone-200">{formatDateShort(hold.hold_start_date)}</td>
                          <td className="py-2 px-3 text-stone-300">{isActive ? "—" : formatDateShort(hold.hold_end_date)}</td>
                          <td className={`py-2 px-3 text-xs font-semibold uppercase tracking-wide ${isActive ? "text-amber-300" : "text-stone-400"}`}>
                            {isActive ? "Active hold" : "Completed"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}

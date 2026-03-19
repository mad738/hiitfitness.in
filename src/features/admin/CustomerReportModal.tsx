"use client";

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { Customer } from "@/models/customer";
import type { Trainer } from "@/models/trainer";
import { normalizeMobile, isPlanCurrentlyRunning } from "@/lib/customer-utils";
import { getPlanStatusMeta } from "@/lib/status-styles";
import { useHorizontalScrollTable } from "@/hooks/useHorizontalScrollTable";

function formatDateShort(s: string | null): string {
  if (!s) return "—";
  try {
    let d = new Date(s);
    if (s.includes("/")) {
      const [day, month, year] = s.split("/").map(Number);
      d = new Date(year, month - 1, day);
    }
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

function parseDateToMs(dStr: string | null | undefined): number {
  if (!dStr) return 0;
  if (dStr.includes("/")) {
    const [d, m, y] = dStr.split("/").map(Number);
    return new Date(y, m - 1, d).getTime();
  }
  return new Date(dStr).getTime() || 0;
}

type Props = {
  customer: Customer;
  customers: Customer[];
  trainers: Trainer[];
  formatCurrency: (n: number) => string;
  onClose: () => void;
  /** Show Add entry / Edit buttons (e.g. false when opened from dashboard). */
  showActions?: boolean;
  /** When provided, "Add entry" calls this instead of linking to customers. */
  onAddEntry?: (customer: Customer) => void;
  /** When provided, "Edit current entry" calls this instead of linking to customers. */
  onEditEntry?: (customer: Customer) => void;
  /** When provided, "Delete" calls this. */
  onDeleteEntry?: (customer: Customer) => void;
  /** When provided, clicking Payments opens plan payments manager. */
  onViewPayments?: (plan: Customer) => void;
};

export function CustomerReportModal({
  customer,
  customers,
  trainers,
  formatCurrency,
  onClose,
  showActions = true,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  onViewPayments,
}: Props) {
  const mobileKey = normalizeMobile(customer.mobile);
  const nameKey = (customer.name ?? "").trim();
  const history = useMemo(
    () =>
      customers
        .filter((c) => {
          if (mobileKey) return normalizeMobile(c.mobile) === mobileKey;
          return (c.name ?? "").trim() === nameKey;
        })
        .sort((a, b) => {
          const aStartMs = parseDateToMs(a.start_date ?? a.created_at);
          const bStartMs = parseDateToMs(b.start_date ?? b.created_at);
          return bStartMs - aStartMs;
        }),
    [customers, mobileKey, nameKey]
  );
  const totalPaidAllTime = history.reduce((sum, c) => sum + Number(c.paid_fee ?? 0), 0);
  const totalEntries = history.length;

  const reportScroll = useHorizontalScrollTable([history.length], { wheelOnBody: false });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-report-title"
    >
      <div
        className="liquid-glass rounded-2xl border border-white/10 shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
          <h2 id="customer-report-title" className="text-lg font-bold text-stone-100">
            Customer report – all history
          </h2>
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
        <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-6">
          <div className="flex gap-4 flex-wrap">

            <div className="min-w-0">
              <p className="text-xl font-bold text-stone-100">{customer.name}</p>
              <p className="text-stone-400 text-sm">{customer.mobile ?? "—"}</p>
              <p className="text-stone-500 text-sm mt-1">
                {totalEntries} entr{totalEntries === 1 ? "y" : "ies"} · Total paid (all time): {formatCurrency(totalPaidAllTime)}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-stone-300 font-semibold text-sm uppercase tracking-wider mb-1">
              All entries & renewals
            </h3>
            <p className="text-stone-500 text-xs mb-3">
              Rows highlighted in green are active plans, while red rows are inactive. Mobile is the unique identifier for this client.
            </p>
            <div className="flex flex-col rounded-xl border border-white/10 overflow-hidden">
              <div
                ref={reportScroll.topScrollRef}
                className="overflow-x-auto overflow-y-hidden flex-shrink-0 scrollbar-horizontal-top border-b border-white/10 bg-stone-900/50 py-1.5 px-1"
                aria-hidden
              >
                <div className="min-w-[900px] h-2" />
              </div>
              <div
                ref={reportScroll.tableScrollRef}
                className="overflow-x-auto overflow-y-visible scrollbar-theme scrollbar-horizontal-bottom"
              >
                <table className="w-full text-sm border-collapse min-w-[900px]">
                  <thead ref={reportScroll.headerRef} className="select-none cursor-ew-resize">
                    <tr className="border-b border-white/10 bg-white/[0.04]">
                      <th className="text-left py-2.5 px-3 font-medium text-stone-400">#</th>
                      <th className="text-left py-2.5 px-3 font-medium text-stone-400">Plan</th>
                      <th className="text-left py-2.5 px-3 font-medium text-stone-400">Start</th>
                      <th className="text-left py-2.5 px-3 font-medium text-stone-400">End</th>
                      <th className="text-left py-2.5 px-3 font-medium text-stone-400">Duration</th>
                      <th className="text-right py-2.5 px-3 font-medium text-stone-400">Total</th>
                      <th className="text-right py-2.5 px-3 font-medium text-stone-400">Paid</th>
                      <th className="text-right py-2.5 px-3 font-medium text-stone-400">Balance</th>

                      <th className="text-left py-2.5 px-3 font-medium text-stone-400">Trainer</th>
                      <th className="text-left py-2.5 px-3 font-medium text-stone-400">Status</th>
                      <th className="text-center py-2.5 px-3 font-medium text-stone-400 max-w-[120px]">Slot</th>
                      <th className="text-center py-2.5 px-3 font-medium text-stone-400 max-w-[120px]">Remarks</th>
                      <th className="text-center py-2.5 px-3 font-medium text-stone-400">Receipt</th>
                      {showActions && <th className="text-center py-2.5 px-3 font-medium text-stone-400">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((entry, idx) => {
                      const trainer = entry.trainer_id ? trainers.find((t) => t.id === entry.trainer_id) : null;
                      const isCurrentlyRunning = isPlanCurrentlyRunning(entry.start_date, entry.end_date);
                      const statusMeta = getPlanStatusMeta(entry.status);
                      const rowClickable = Boolean(onViewPayments);
                      const rowHighlightClass = statusMeta?.isActive
                        ? "bg-emerald-950/50 ring-1 ring-inset ring-emerald-500/40"
                        : statusMeta?.isInactive
                          ? "bg-rose-950/40 ring-1 ring-inset ring-rose-500/30"
                          : isCurrentlyRunning
                            ? "bg-emerald-950/50 ring-1 ring-inset ring-emerald-500/40"
                            : "";
                      const rowTitle = statusMeta?.isInactive
                        ? "Inactive plan"
                        : isCurrentlyRunning
                          ? "Currently active (today within start–end dates)"
                          : undefined;
                      return (
                        <tr
                          key={`${entry.id}-${idx}`}
                          onClick={rowClickable ? () => onViewPayments?.(entry) : undefined}
                          className={`border-b border-white/5 ${rowHighlightClass} ${rowClickable ? "cursor-pointer hover:bg-white/5" : ""}`}
                          title={rowTitle}
                        >
                          <td className="py-2 px-3 text-stone-400">{totalEntries - idx}</td>
                          <td className="py-2 px-3 text-stone-200 font-medium">
                            <span className="inline-flex items-center gap-1.5">
                              {entry.plan}
                              {isCurrentlyRunning && (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-600/80 text-white uppercase">Active</span>
                              )}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-stone-300 whitespace-nowrap">{formatDateShort(entry.start_date)}</td>
                          <td className="py-2 px-3 text-stone-300 whitespace-nowrap">{formatDateShort(entry.end_date)}</td>
                          <td className="py-2 px-3 text-stone-300">{entry.duration ?? "—"}</td>
                          <td className="py-2 px-3 text-right text-stone-300 tabular-nums">{formatCurrency(entry.total_fee)}</td>
                          <td className="py-2 px-3 text-right text-stone-300 tabular-nums">{formatCurrency(entry.paid_fee)}</td>
                          <td className="py-2 px-3 text-right tabular-nums">
                            <span className={entry.balance !== 0 ? "text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded" : "text-stone-300"}>
                              {formatCurrency(entry.balance)}
                            </span>
                          </td>

                          <td className="py-2 px-3 text-stone-300">{entry.plan === "PT" ? (trainer?.name ?? "—") : "—"}</td>
                          <td className="py-2 px-3">
                            {statusMeta ? (
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusMeta.className}`}>
                                {statusMeta.label}
                              </span>
                            ) : (
                              <span className="text-stone-500">—</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-stone-300 max-w-[120px] truncate">{entry.slot_timing ?? "—"}</td>
                          <td className="py-2 px-3 text-stone-300 max-w-[120px] truncate" title={entry.remarks ?? undefined}>{entry.remarks ?? "—"}</td>
                          <td className="py-2 px-3 text-center text-stone-300">{entry.receipt ? "Yes" : "—"}</td>
                          {showActions && (
                            <td className="py-2 px-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onEditEntry?.(entry); onClose(); }}
                                className="p-1 rounded text-stone-500 hover:text-brand-red hover:bg-brand-red/10 transition mr-2"
                                title="Edit this entry"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onDeleteEntry?.(entry); }}
                                className="p-1 rounded text-stone-500 hover:text-brand-red hover:bg-brand-red/10 transition"
                                title="Delete this entry"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>

                </table>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 flex flex-wrap gap-2">
            {showActions ? (
              <>
                {onAddEntry ? (
                  <button
                    type="button"
                    onClick={() => onAddEntry(customer)}
                    className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm"
                  >
                    Add new plan
                  </button>
                ) : (
                  <Link
                    href="/admin/customers"
                    className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm"
                  >
                    Add a New Customer
                  </Link>
                )}
                {onEditEntry ? (
                  <button
                    type="button"
                    onClick={() => { onEditEntry(customer); onClose(); }}
                    className="px-4 py-2.5 rounded-xl bg-brand-red hover:opacity-90 text-white font-semibold text-sm"
                  >
                    Edit current Plan
                  </button>
                ) : (
                  <Link
                    href="/admin/customers"
                    className="px-4 py-2.5 rounded-xl bg-brand-red hover:opacity-90 text-white font-semibold text-sm"
                  >
                    Edit Customer Details
                  </Link>
                )}
              </>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/20 text-stone-400 hover:bg-white/5 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

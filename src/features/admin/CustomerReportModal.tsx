"use client";

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { Customer } from "@/models/customer";
import type { Trainer } from "@/models/trainer";
import { normalizeMobile, isPlanCurrentlyRunning } from "@/lib/customer-utils";
import { useHorizontalScrollTable } from "@/hooks/useHorizontalScrollTable";

function formatDateShort(s: string | null): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s;
  }
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
          const aStart = a.start_date ?? a.created_at ?? "";
          const bStart = b.start_date ?? b.created_at ?? "";
          return bStart.localeCompare(aStart);
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
            <img
              src={customer.image ?? "/images/profile placeholder.jpg"}
              alt=""
              className="w-20 h-20 rounded-xl object-cover border border-white/10 shrink-0"
            />
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
              Rows highlighted in green are currently active (today is between start and end date). Mobile is the unique identifier for this client.
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
                      <th className="text-left py-2.5 px-3 font-medium text-stone-400">Pay date</th>
                      <th className="text-left py-2.5 px-3 font-medium text-stone-400">Payment</th>
                      <th className="text-left py-2.5 px-3 font-medium text-stone-400">Trainer</th>
                      <th className="text-left py-2.5 px-3 font-medium text-stone-400">Status</th>
                      <th className="text-left py-2.5 px-3 font-medium text-stone-400">Slot</th>
                      <th className="text-left py-2.5 px-3 font-medium text-stone-400 max-w-[120px]">Remarks</th>
                      <th className="text-center py-2.5 px-3 font-medium text-stone-400">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((entry, idx) => {
                      const trainer = entry.trainer_id ? trainers.find((t) => t.id === entry.trainer_id) : null;
                      const isCurrentlyRunning = isPlanCurrentlyRunning(entry.start_date, entry.end_date);
                      return (
                        <tr
                          key={`${entry.id}-${idx}`}
                          className={`border-b border-white/5 ${isCurrentlyRunning ? "bg-emerald-950/50 ring-1 ring-inset ring-emerald-500/40" : ""}`}
                          title={isCurrentlyRunning ? "Currently active (today within start–end dates)" : undefined}
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
                          <td className="py-2 px-3 text-right tabular-nums">{formatCurrency(entry.balance)}</td>
                          <td className="py-2 px-3 text-stone-300 whitespace-nowrap">{formatDateShort(entry.pay_date)}</td>
                          <td className="py-2 px-3 text-stone-300">{entry.payment_mode ?? "—"}</td>
                          <td className="py-2 px-3 text-stone-300">{entry.plan === "PT" ? (trainer?.name ?? "—") : "—"}</td>
                          <td className="py-2 px-3 text-stone-300">{entry.status ?? "—"}</td>
                          <td className="py-2 px-3 text-stone-300">{entry.slot_timing ?? "—"}</td>
                          <td className="py-2 px-3 text-stone-300 max-w-[120px] truncate" title={entry.remarks ?? undefined}>{entry.remarks ?? "—"}</td>
                          <td className="py-2 px-3 text-center text-stone-300">{entry.receipt ? "Yes" : "—"}</td>
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
                    Add entry
                  </button>
                ) : (
                  <Link
                    href="/admin/customers"
                    className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm"
                  >
                    Add entry (Customers)
                  </Link>
                )}
                {onEditEntry ? (
                  <button
                    type="button"
                    onClick={() => { onEditEntry(customer); onClose(); }}
                    className="px-4 py-2.5 rounded-xl bg-brand-red hover:opacity-90 text-white font-semibold text-sm"
                  >
                    Edit current entry
                  </button>
                ) : (
                  <Link
                    href="/admin/customers"
                    className="px-4 py-2.5 rounded-xl bg-brand-red hover:opacity-90 text-white font-semibold text-sm"
                  >
                    Edit (Customers)
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

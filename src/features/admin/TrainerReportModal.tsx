"use client";

import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import type { Customer } from "@/models/customer";
import { useHorizontalScrollTable } from "@/hooks/useHorizontalScrollTable";
import { isPlanCurrentlyRunning } from "@/lib/customer-utils";
import type { TrainerReport } from "./trainer-report-types";

function formatDateShort(value: string | null, fallback: (value: string | null) => string): string {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return fallback(value);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return fallback(value);
  }
}

function formatSlot(plan: Customer): string {
  return plan.slot_timing ? plan.slot_timing : "—";
}

function calculatePlanDuration(startDate: string | null, endDate: string | null): string {
  if (!startDate || !endDate) return "—";
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "—";
    
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return "—";
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const months = Math.floor(diffDays / 30);
    const years = Math.floor(diffDays / 365);
    
    if (years > 0) return `${years}y`;
    if (months > 0) return `${months}mo`;
    if (weeks > 0) return `${weeks}w`;
    return `${diffDays}d`;
  } catch {
    return "—";
  }
}

type Props = {
  report: TrainerReport;
  formatCurrency: (n: number) => string;
  formatDate: (value: string | null) => string;
  onClose: () => void;
  onOpenPlanPayments: (plan: Customer) => void;
  onOpenCustomerReport: (customer: Customer) => void;
};

export function TrainerReportModal({
  report,
  formatCurrency,
  formatDate,
  onClose,
  onOpenPlanPayments,
  onOpenCustomerReport,
}: Props) {
  const stats = useMemo(() => {
    // Calculate current month date range
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const isPaymentInCurrentMonth = (payDate: string | null): boolean => {
      if (!payDate) return false;
      try {
        const date = new Date(payDate + "T12:00:00");
        return date >= currentMonthStart && date <= currentMonthEnd;
      } catch {
        return false;
      }
    };

    const totals = report.plans.reduce(
      (acc, entry) => {
        // Only count paid_fee if payment was in current month
        const paidInCurrentMonth = isPaymentInCurrentMonth(entry.plan.pay_date) ? Number(entry.plan.paid_fee ?? 0) : 0;
        acc.totalPaid += paidInCurrentMonth;
        acc.totalBalance += Number(entry.plan.balance ?? 0);
        if (isPlanCurrentlyRunning(entry.plan.start_date, entry.plan.end_date)) {
          acc.active += 1;
        }
        if (entry.commissionAmount > 0) {
          acc.commissionPlans += 1;
        }
        return acc;
      },
      { totalPaid: 0, totalBalance: 0, active: 0, commissionPlans: 0 }
    );
    return totals;
  }, [report]);

  const tableScroll = useHorizontalScrollTable([report.plans.length], { wheelOnBody: false });

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trainer-report-title"
    >
      <div
        className="liquid-glass rounded-2xl border border-white/10 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <p className="text-xs uppercase tracking-widest text-stone-400">Trainer report</p>
            <h2 id="trainer-report-title" className="text-xl font-bold text-stone-100">
              {report.name}
            </h2>
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

        <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-white/10 rounded-2xl px-4 py-3 bg-stone-900/40">
              <p className="text-xs uppercase text-stone-400 tracking-wider">Total commission</p>
              <p className="text-2xl font-semibold text-emerald-300">{formatCurrency(report.totalCommission)}</p>
            </div>
            <div className="border border-white/10 rounded-2xl px-4 py-3 bg-stone-900/40">
              <p className="text-xs uppercase text-stone-400 tracking-wider">Active clients</p>
              <p className="text-2xl font-semibold text-stone-100">{stats.active}</p>
            </div>
            <div className="border border-white/10 rounded-2xl px-4 py-3 bg-stone-900/40">
              <p className="text-xs uppercase text-stone-400 tracking-wider">Clients contributing</p>
              <p className="text-2xl font-semibold text-emerald-200">{stats.commissionPlans}</p>
            </div>
            <div className="border border-white/10 rounded-2xl px-4 py-3 bg-stone-900/40">
              <p className="text-xs uppercase text-stone-400 tracking-wider">Outstanding balance</p>
              <p className="text-2xl font-semibold text-amber-200">{formatCurrency(stats.totalBalance)}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-stone-200 font-semibold">Trainer plans</h3>
                <p className="text-stone-500 text-xs">Click a row to view detailed payments for that plan.</p>
              </div>
              <p className="text-sm text-stone-400">This month: {formatCurrency(stats.totalPaid)}</p>
            </div>
            <div className="flex flex-col rounded-2xl border border-white/10 overflow-hidden">
              <div
                ref={tableScroll.topScrollRef}
                className="overflow-x-auto overflow-y-hidden flex-shrink-0 scrollbar-horizontal-top border-b border-white/10 bg-stone-900/50 py-1.5 px-1"
                aria-hidden
              >
                <div className="min-w-[1000px] h-2" />
              </div>
              <div
                ref={tableScroll.tableScrollRef}
                className="overflow-x-auto overflow-y-visible scrollbar-theme scrollbar-horizontal-bottom"
              >
                <table className="w-full text-sm border-collapse min-w-[1000px]">
                  <thead ref={tableScroll.headerRef} className="select-none cursor-ew-resize">
                    <tr className="border-b border-white/10 bg-white/[0.04]">
                      <th className="text-left py-2.5 px-3 font-medium text-stone-400">Customer</th>
                      <th className="text-left py-2.5 px-3 font-medium text-stone-400">Plan</th>
                      <th className="text-right py-2.5 px-3 font-medium text-stone-400">Total</th>
                      <th className="text-right py-2.5 px-3 font-medium text-stone-400">Paid</th>
                      <th className="text-right py-2.5 px-3 font-medium text-stone-400">Balance</th>
                      <th className="text-left py-2.5 px-3 font-medium text-stone-400">Slot</th>
                      <th className="text-left py-2.5 px-3 font-medium text-stone-400">Duration</th>
                      <th className="text-left py-2.5 px-3 font-medium text-stone-400">Start</th>
                      <th className="text-left py-2.5 px-3 font-medium text-stone-400">End</th>
                      <th className="text-right py-2.5 px-3 font-medium text-stone-400">Commission</th>
                      <th className="text-center py-2.5 px-3 font-medium text-stone-400">Customer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.plans.map((entry) => {
                      const plan = entry.plan;
                      const contributes = entry.commissionAmount > 0;
                      const active = isPlanCurrentlyRunning(plan.start_date, plan.end_date);
                      
                      // Color hierarchy: Green (active + commissioned) > Yellow (active only) > Red (inactive)
                      let rowHighlightClass = "";
                      if (!active) {
                        // Inactive - Red
                        rowHighlightClass = "bg-rose-950/30 ring-1 ring-inset ring-rose-500/25";
                      } else if (contributes) {
                        // Active + Commissioned - Green
                        rowHighlightClass = "bg-emerald-950/40 ring-1 ring-inset ring-emerald-500/30";
                      } else {
                        // Active but not commissioned - Bright Yellow
                        rowHighlightClass = "bg-yellow-900/40 ring-1 ring-inset ring-yellow-400/40";
                      }
                      
                      return (
                        <tr
                          key={plan.id}
                          onClick={() => onOpenPlanPayments(plan)}
                          className={`border-b border-white/5 transition-colors cursor-pointer ${rowHighlightClass} ${
                            rowHighlightClass ? "" : "hover:bg-white/5"
                          }`}
                          title={!active ? "Inactive plan – click to view payment history" : contributes ? "Active with commission – click to view payment history" : "Active but no commission – click to view payment history"}
                        >
                          <td className="py-2.5 px-3 text-stone-200 font-medium">
                            <span className="inline-flex flex-col">
                              <span>{plan.name ?? "—"}</span>
                              <span className="text-xs text-stone-500">{plan.mobile ?? "—"}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-stone-300">
                            <span className="inline-flex items-center gap-2">
                              {plan.plan ?? "PT"}
                              {(() => {
                                if (!active) {
                                  // Inactive - Red
                                  return (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-rose-400/20 text-rose-200">
                                      Inactive
                                    </span>
                                  );
                                } else if (contributes) {
                                  // Active + Commissioned - Green
                                  return (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-emerald-400/20 text-emerald-200">
                                      Active • Commission
                                    </span>
                                  );
                                } else {
                                  // Active but not commissioned - Bright Yellow
                                  return (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-yellow-400/30 text-yellow-100">
                                      Active
                                    </span>
                                  );
                                }
                              })()}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-stone-200 tabular-nums">{formatCurrency(Number(plan.total_fee ?? 0))}</td>
                          <td className="py-2.5 px-3 text-right text-emerald-200 tabular-nums font-semibold">{formatCurrency(Number(plan.paid_fee ?? 0))}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums">
                            <span className={Number(plan.balance ?? 0) !== 0 ? "text-amber-300 font-semibold" : "text-stone-300"}>
                              {formatCurrency(Number(plan.balance ?? 0))}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-stone-300">{formatSlot(plan)}</td>
                          <td className="py-2.5 px-3 text-stone-300 whitespace-nowrap font-medium">
                            {calculatePlanDuration(plan.start_date, plan.end_date)}
                          </td>
                          <td className="py-2.5 px-3 text-stone-300 whitespace-nowrap">
                            {formatDateShort(plan.start_date, formatDate)}
                          </td>
                          <td className="py-2.5 px-3 text-stone-300 whitespace-nowrap">
                            {formatDateShort(plan.end_date, formatDate)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-emerald-200 font-semibold tabular-nums">
                            {formatCurrency(entry.commissionAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-center" onClick={(event) => event.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => onOpenCustomerReport(plan)}
                              className="px-3 py-1.5 rounded-lg border border-white/15 text-xs font-semibold text-stone-200 hover:border-brand-red/60 hover:text-white"
                            >
                              View plans
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/20 text-stone-400 hover:bg-white/5 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

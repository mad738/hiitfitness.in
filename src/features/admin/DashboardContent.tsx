"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useHorizontalScrollTable } from "@/hooks/useHorizontalScrollTable";
import type { Customer } from "@/models/customer";
import type { Trainer } from "@/models/trainer";
import type { Payment } from "@/models/payment";
import { dedupeByMobile, normalizeMobile, isPlanCurrentlyRunning } from "@/lib/customer-utils";
import { RevenueChart, type RevenueChartRow } from "./DashboardCharts";
import { CustomerReportModal } from "./CustomerReportModal";
import { PlanPaymentsModal, type PaymentFormState } from "./PlanPaymentsModal";
import { TrainerReportModal } from "./TrainerReportModal";
import type { TrainerReport, TrainerReportPlan } from "./trainer-report-types";
import { listPlanPayments } from "@app/actions/payments";

/** Format number as Indian Rupees (e.g. ₹1,47,800) */
function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);
}

/** Format date for display (e.g. 15 Jan 2026) */
function formatDate(s: string | null): string {
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



function parseDashboardDate(dStr: string | null | undefined): Date | null {
  if (!dStr) return null;
  if (dStr.includes("/")) {
    const [d, m, y] = dStr.split("/").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }
  const dt = new Date(dStr + "T12:00:00");
  return isNaN(dt.getTime()) ? null : dt;
}

function parseDashboardDateMs(dStr: string | null | undefined): number {
  const d = parseDashboardDate(dStr);
  return d ? d.getTime() : 0;
}

/** Sort key for "recent first": start_date > end_date > created_at */
function getSortDateMs(e: Customer): number {
  const created =
    "created_at" in e && typeof (e as { created_at: string }).created_at === "string"
      ? (e as { created_at: string }).created_at
      : "";
  return parseDashboardDateMs(e.start_date) || parseDashboardDateMs(e.end_date) || parseDashboardDateMs(created) || 0;
}

/** One customer (by mobile) with total amount paid in a period. */
export type CustomerWithAmount = { customer: Customer; amountInPeriod: number };

type Props = {
  customers: Customer[];
  trainers: Trainer[];
  adminCount: number;
};

/** Business month: starts on 6th, ends on 5th of next month. */
function getBusinessMonthStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (x.getDate() >= 6) {
    x.setDate(6);
  } else {
    x.setMonth(x.getMonth() - 1);
    x.setDate(6);
  }
  return x;
}

/** End of business month (5th of next month at 23:59:59.999). */
function getBusinessMonthEnd(d: Date): Date {
  const start = getBusinessMonthStart(d);
  return new Date(start.getFullYear(), start.getMonth() + 1, 5, 23, 59, 59, 999);
}

/** Parse duration string to number of months (e.g. "3 months" -> 3, "1 year" -> 12). Returns 1 if unparseable to avoid div by zero. */
function durationToMonths(duration: string | null): number {
  if (!duration || typeof duration !== "string") return 1;
  const s = duration.trim().toLowerCase();
  const num = parseFloat(s);
  if (!Number.isNaN(num)) {
    if (s.includes("year")) return Math.max(1, num * 12);
    if (s.includes("month")) return Math.max(0.5, num);
    if (s.includes("week")) return Math.max(0.5, (num * 7) / 30);
    if (s.includes("day")) return Math.max(0.25, num / 30);
    return Math.max(0.5, num);
  }
  if (s.includes("year")) {
    const n = parseFloat(s.replace("year", "").trim());
    return Number.isNaN(n) ? 12 : Math.max(1, n * 12);
  }
  if (s.includes("month")) {
    const n = parseFloat(s.replace("month", "").replace("s", "").trim());
    return Number.isNaN(n) ? 1 : Math.max(0.5, n);
  }
  if (s.includes("week")) {
    const n = parseFloat(s.replace("week", "").replace("s", "").trim());
    return Number.isNaN(n) ? 0.5 : Math.max(0.5, (n * 7) / 30);
  }
  if (s.includes("day")) {
    const n = parseFloat(s.replace("day", "").replace("s", "").trim());
    return Number.isNaN(n) ? 0.25 : Math.max(0.25, n / 30);
  }
  return 1;
}

/** Week starts Saturday, ends Friday (business week). */
function getWeekStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  const offset = -((day + 1) % 7);
  x.setDate(x.getDate() + offset);
  return x;
}

/** Customers who paid in [periodStart, periodEnd], deduped by mobile, with sum of paid_fee in period. */
function getCustomersInPeriod(
  customers: Customer[],
  periodStart: Date,
  periodEnd: Date
): CustomerWithAmount[] {
  const inPeriod = customers.filter((c) => {
    const pd = parseDashboardDate(c.pay_date);
    return pd && pd >= periodStart && pd <= periodEnd;
  });
  const byMobile = new Map<string, { customer: Customer; total: number }>();
  for (const c of inPeriod) {
    const key = normalizeMobile(c.mobile) || (c.name ?? "").trim() || c.id;
    const existing = byMobile.get(key);
    const fee = Number(c.paid_fee ?? 0);
    if (!existing) {
      byMobile.set(key, { customer: c, total: fee });
    } else {
      existing.total += fee;
      const cStart = parseDashboardDateMs(c.start_date ?? c.created_at);
      const exStart = parseDashboardDateMs(existing.customer.start_date ?? existing.customer.created_at);
      if (cStart > exStart) existing.customer = c;
    }
  }
  return Array.from(byMobile.values()).map(({ customer, total }) => ({
    customer,
    amountInPeriod: total,
  }));
}

export function DashboardContent({
  customers,
  trainers,
  adminCount,
}: Props) {
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerReport | null>(
    null
  );
  /** Which analytics period's customer list is shown (click chip to open). */
  const [analyticsPanel, setAnalyticsPanel] = useState<"daily" | "weekly" | "monthly" | null>(null);
  /** Chart bar clicked: show customer list for that bar's period. */
  const [chartClickedPeriod, setChartClickedPeriod] = useState<{ type: "daily" | "weekly" | "monthly"; index: number } | null>(null);
  /** Customer selected from analytics to show full report modal. */
  const [reportCustomer, setReportCustomer] = useState<Customer | null>(null);
  const [paymentsPlan, setPaymentsPlan] = useState<Customer | null>(null);
  const [planPayments, setPlanPayments] = useState<Payment[]>([]);
  const [paymentsModalOpen, setPaymentsModalOpen] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const customerPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartClickedPeriod !== null && customerPanelRef.current) {
      customerPanelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [chartClickedPeriod]);

  // Lock body scroll only when a modal overlay is open (not when inline customer profiles panel is open)
  useEffect(() => {
    if (!selectedTrainer && !reportCustomer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selectedTrainer, reportCustomer]);

  const customerCount = useMemo(() => dedupeByMobile(customers).length, [customers]);
  const byPlan = useMemo(
    () =>
      customers.reduce(
        (acc, c) => {
          const p = c.plan ?? "—";
          acc[p] = (acc[p] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    [customers]
  );
  const gtCount = byPlan["GT"] ?? 0;
  const ptCount = byPlan["PT"] ?? 0;

  const refreshPlanPayments = useCallback(async (planId: string) => {
    const data = await listPlanPayments(planId);
    setPlanPayments(data);
  }, []);

  const openPlanPaymentsPanel = useCallback(async (plan: Customer) => {
    setPaymentsPlan(plan);
    setPlanPayments([]);
    setPaymentsError(null);
    setPaymentsModalOpen(true);
    setPaymentsLoading(true);
    try {
      await refreshPlanPayments(plan.id);
    } catch (err) {
      setPaymentsError((err as Error)?.message ?? "Failed to load payments.");
    } finally {
      setPaymentsLoading(false);
    }
  }, [refreshPlanPayments]);

  const closePaymentsModal = useCallback(() => {
    setPaymentsModalOpen(false);
    setPaymentsPlan(null);
    setPlanPayments([]);
    setPaymentsError(null);
    setPaymentsLoading(false);
  }, []);

  const handleReadOnlyPaymentSubmit = useCallback(async (_form: PaymentFormState) => ({
    ok: false as const,
    error: "Payments can only be managed from the Customers screen.",
  }), []);

  const handleReadOnlyDelete = useCallback((_payment: Payment) => undefined, []);

  const { dailySummary, dailyChartData, dailyCustomers, dailyCustomersByBar, weeklySummary, weeklyChartData, weeklyCustomers, weeklyCustomersByBar, monthlySummary, monthlyChartData, monthlyCustomers, monthlyCustomersByBar, trainerReports } = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Daily summary = today only (for chip)
    const dailyTotal = customers
      .filter((c) => {
        const pd = parseDashboardDate(c.pay_date);
        return pd && pd >= todayStart && pd <= todayEnd;
      })
      .reduce((s, c) => s + Number(c.paid_fee ?? 0), 0);
    // Daily graph = last 7 completed days only (no today) + per-bar customer list for chart click
    const dailyRows: RevenueChartRow[] = [];
    const dailyCustomersByBar: CustomerWithAmount[][] = [];
    for (let i = 7; i >= 1; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      const revenue = customers
        .filter((c) => {
          const pd = parseDashboardDate(c.pay_date);
          return pd && pd >= d && pd <= dayEnd;
        })
        .reduce((s, c) => s + Number(c.paid_fee ?? 0), 0);
      dailyRows.push({ label, revenue });
      dailyCustomersByBar.push(getCustomersInPeriod(customers, d, dayEnd));
    }

    // Weekly summary = last complete week only (for chip)
    const currentWeekStart = getWeekStart(now);
    const lastCompleteWeekStart = new Date(currentWeekStart);
    lastCompleteWeekStart.setDate(lastCompleteWeekStart.getDate() - 7);
    const lastCompleteWeekEnd = new Date(lastCompleteWeekStart);
    lastCompleteWeekEnd.setDate(lastCompleteWeekEnd.getDate() + 6);
    lastCompleteWeekEnd.setHours(23, 59, 59, 999);
    const weeklyTotal = customers
      .filter((c) => {
        const pd = parseDashboardDate(c.pay_date);
        return pd && pd >= lastCompleteWeekStart && pd <= lastCompleteWeekEnd;
      })
      .reduce((s, c) => s + Number(c.paid_fee ?? 0), 0);
    // Weekly graph = last 4 completed weeks only (Sat–Fri each) + per-bar customer list
    const weeks: RevenueChartRow[] = [];
    const weeklyCustomersByBar: CustomerWithAmount[][] = [];
    for (let w = 4; w >= 1; w--) {
      const weekCurr = new Date(currentWeekStart);
      weekCurr.setDate(weekCurr.getDate() - w * 7);
      const weekEnd = new Date(weekCurr);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      const label = `${weekCurr.getDate()}–${weekEnd.getDate()} ${weekEnd.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}`;
      const revenue = customers
        .filter((c) => {
          const pd = parseDashboardDate(c.pay_date);
          return pd && pd >= weekCurr && pd <= weekEnd;
        })
        .reduce((s, c) => s + Number(c.paid_fee ?? 0), 0);
      weeks.push({ label, revenue });
      weeklyCustomersByBar.push(getCustomersInPeriod(customers, weekCurr, weekEnd));
    }

    // Monthly summary = last complete business month only (for chip)
    const lastCompleteMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 6);
    const lastCompleteMonthEnd = new Date(now.getFullYear(), now.getMonth(), 5, 23, 59, 59, 999);
    const monthlyTotal = customers
      .filter((c) => {
        const pd = parseDashboardDate(c.pay_date);
        return pd && pd >= lastCompleteMonthStart && pd <= lastCompleteMonthEnd;
      })
      .reduce((s, c) => s + Number(c.paid_fee ?? 0), 0);
    // Monthly graph = last 6 completed business months only (6th–5th each) + per-bar customer list
    const months: RevenueChartRow[] = [];
    const monthlyCustomersByBar: CustomerWithAmount[][] = [];
    for (let m = 6; m >= 1; m--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - m, 6);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 5, 23, 59, 59, 999);
      const label = `6 ${monthStart.toLocaleDateString("en-IN", { month: "short" })} – 5 ${monthEnd.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })}`;
      const revenue = customers
        .filter((c) => {
          const pd = parseDashboardDate(c.pay_date);
          return pd && pd >= monthStart && pd <= monthEnd;
        })
        .reduce((s, c) => s + Number(c.paid_fee ?? 0), 0);
      months.push({ label, revenue });
      monthlyCustomersByBar.push(getCustomersInPeriod(customers, monthStart, monthEnd));
    }
    const trainerById = new Map<string, Trainer>(
      trainers.map((t) => [t.id, t])
    );
    // PT only, and only active (today between start_date and end_date)
    const allPtActive = customers.filter(
      (c) =>
        c.plan === "PT" &&
        c.trainer_id &&
        isPlanCurrentlyRunning(c.start_date, c.end_date)
    );
    const byTrainer: Record<string, Customer[]> = {};
    for (const c of allPtActive) {
      const trainerName = trainerById.get(c.trainer_id!)?.name ?? "Unknown trainer";
      if (!byTrainer[trainerName]) byTrainer[trainerName] = [];
      byTrainer[trainerName].push(c);
    }
    const dedupeByNameKeepRecent = (entries: Customer[]): Customer[] => {
      const byName = new Map<string, Customer>();
      for (const c of entries) {
        const name = c.name ?? "";
        const existing = byName.get(name);
        const cStart = parseDashboardDateMs(c.start_date);
        const existingStart = parseDashboardDateMs(existing?.start_date);
        if (!existing || cStart > existingStart) byName.set(name, c);
      }
      return Array.from(byName.values()).sort((a, b) =>
        getSortDateMs(b) - getSortDateMs(a)
      );
    };
    // Current business month (6th–5th) for "this month" commission
    const currentMonthStart = getBusinessMonthStart(now);
    const currentMonthEnd = getBusinessMonthEnd(now);
    const isStartInCurrentMonth = (startDate: string | null): boolean => {
      if (!startDate) return false;
      const d = parseDashboardDate(startDate);
      return d ? (d >= currentMonthStart && d <= currentMonthEnd) : false;
    };
    // Commission = entries starting this (business) month, using Supabase-calculated trainer_commission with fallbacks
    const trainerReportsList: TrainerReport[] = Object.entries(byTrainer)
      .map(([name, entries]) => {
        const deduped = dedupeByNameKeepRecent(entries);
        const plans: TrainerReportPlan[] = deduped.map((plan) => {
          const total = Number(plan.total_fee ?? 0);
          const hasStoredMonths = typeof plan.plan_months === "number" && plan.plan_months > 0;
          const months = hasStoredMonths ? plan.plan_months! : durationToMonths(plan.duration);
          const storedMonthlyValue = typeof plan.monthly_value === "number" && plan.monthly_value > 0 ? plan.monthly_value : null;
          const monthlyValue = storedMonthlyValue ?? (months > 0 ? total / months : 0);
          const storedRate = typeof plan.commission_rate === "number" && plan.commission_rate > 0 ? plan.commission_rate : null;
          const commissionRate = storedRate ?? 0.3;
          const storedCommission = typeof plan.trainer_commission === "number" ? plan.trainer_commission : null;
          const computedCommission = storedCommission ?? monthlyValue * commissionRate;
          const commissionAmount = isStartInCurrentMonth(plan.start_date) ? computedCommission : 0;
          return {
            plan,
            commissionAmount,
          };
        });
        const totalCommission = plans.reduce((sum, entry) => sum + entry.commissionAmount, 0);
        return {
          name,
          plans,
          totalCommission,
        } satisfies TrainerReport;
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    // Customer profiles per period (same boundaries: today, last complete week, last complete month)
    const dailyCustomers = getCustomersInPeriod(customers, todayStart, todayEnd);
    const weeklyCustomers = getCustomersInPeriod(customers, lastCompleteWeekStart, lastCompleteWeekEnd);
    const monthlyCustomers = getCustomersInPeriod(customers, lastCompleteMonthStart, lastCompleteMonthEnd);

    return {
      dailySummary: dailyTotal,
      dailyChartData: dailyRows,
      dailyCustomers,
      dailyCustomersByBar,
      weeklySummary: weeklyTotal,
      weeklyChartData: weeks,
      weeklyCustomers,
      weeklyCustomersByBar,
      monthlySummary: monthlyTotal,
      monthlyChartData: months,
      monthlyCustomers,
      monthlyCustomersByBar,
      trainerReports: trainerReportsList,
    };
  }, [customers, trainers]);

  const cards = [
    {
      title: "Customers",
      count: customerCount,
      href: "/admin/customers",
      description: "All members with plan, fees, dates, and trainer (PT only).",
      meta: (
        <span className="text-base font-normal text-stone-500">
          GT: {gtCount} · PT: {ptCount}
        </span>
      ),
    },
    {
      title: "Admin users",
      count: adminCount,
      href: "/admin/credentials",
      description: "Usernames and roles.",
      meta: null,
    },
  ];

  const reports = trainerReports;

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-stone-100 mb-1 tracking-tight">
          Dashboard
        </h1>
        <p className="text-stone-400 text-sm sm:text-base">
          Overview of HIIT Fitness admin data (customers, trainers, plans).
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="liquid-glass block p-6 rounded-2xl min-h-[140px] transition-all duration-300 ease-out hover:scale-[1.02] hover:border-brand-red/40 hover:shadow-[0_0_32px_rgba(238,42,36,0.15)] focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 focus:ring-offset-black"
          >
            <p className="text-stone-400 text-sm font-medium mb-1">
              {card.title}
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-stone-100">
              {card.count}
              {card.meta != null && <span className="ml-2">{card.meta}</span>}
            </p>
            <p className="text-stone-500 text-sm mt-2 line-clamp-2">
              {card.description}
            </p>
            <span className="inline-block mt-3 text-brand-red text-sm font-semibold">
              Open →
            </span>
          </Link>
        ))}
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-stone-100 mb-1 tracking-tight">
          Analytics
        </h2>
        <p className="text-stone-400 text-sm">
          Revenue by pay date — today; last complete week (Sat–Fri); last complete month (6th–5th). Current week/month not included until finished. Click a chip or a graph point to see customers for that period.
        </p>

        {/* Three summary chips in one row – click to see customer profiles for that period */}
        <div className="grid grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setAnalyticsPanel((p) => (p === "daily" ? null : "daily"))}
            className="liquid-glass p-4 sm:p-5 rounded-2xl border border-white/10 text-left transition-all duration-200 hover:border-brand-red/40 hover:shadow-[0_0_20px_rgba(238,42,36,0.1)] focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 focus:ring-offset-black"
          >
            <p className="text-stone-400 text-sm font-medium mb-1">Today</p>
            <p className="text-xl sm:text-2xl font-bold text-stone-100">{formatINR(dailySummary)}</p>
            <p className="text-stone-500 text-xs mt-1">Click to see customer profiles</p>
          </button>
          <button
            type="button"
            onClick={() => setAnalyticsPanel((p) => (p === "weekly" ? null : "weekly"))}
            className="liquid-glass p-4 sm:p-5 rounded-2xl border border-white/10 text-left transition-all duration-200 hover:border-brand-red/40 hover:shadow-[0_0_20px_rgba(238,42,36,0.1)] focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 focus:ring-offset-black"
          >
            <p className="text-stone-400 text-sm font-medium mb-1">Last week (Sat–Fri)</p>
            <p className="text-xl sm:text-2xl font-bold text-stone-100">{formatINR(weeklySummary)}</p>
            <p className="text-stone-500 text-xs mt-1">Click to see customer profiles</p>
          </button>
          <button
            type="button"
            onClick={() => setAnalyticsPanel((p) => (p === "monthly" ? null : "monthly"))}
            className="liquid-glass p-4 sm:p-5 rounded-2xl border border-white/10 text-left transition-all duration-200 hover:border-brand-red/40 hover:shadow-[0_0_20px_rgba(238,42,36,0.1)] focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 focus:ring-offset-black"
          >
            <p className="text-stone-400 text-sm font-medium mb-1">Last month (6th–5th)</p>
            <p className="text-xl sm:text-2xl font-bold text-stone-100">{formatINR(monthlySummary)}</p>
            <p className="text-stone-500 text-xs mt-1">Click to see customer profiles</p>
          </button>
        </div>

        {/* Customer profiles for selected period – from chip or from chart bar click; click a profile to open full report */}
        {(analyticsPanel || chartClickedPeriod) && (() => {
          const fromChart = chartClickedPeriod !== null;
          const label = fromChart
            ? (chartClickedPeriod!.type === "daily"
              ? dailyChartData[chartClickedPeriod!.index]?.label
              : chartClickedPeriod!.type === "weekly"
                ? weeklyChartData[chartClickedPeriod!.index]?.label
                : monthlyChartData[chartClickedPeriod!.index]?.label) ?? "Period"
            : analyticsPanel === "daily"
              ? "Today"
              : analyticsPanel === "weekly"
                ? "Last week (Sat–Fri)"
                : "Last month (6th–5th)";
          const list = fromChart
            ? (chartClickedPeriod!.type === "daily"
              ? dailyCustomersByBar[chartClickedPeriod!.index]
              : chartClickedPeriod!.type === "weekly"
                ? weeklyCustomersByBar[chartClickedPeriod!.index]
                : monthlyCustomersByBar[chartClickedPeriod!.index]) ?? []
            : analyticsPanel === "daily"
              ? dailyCustomers
              : analyticsPanel === "weekly"
                ? weeklyCustomers
                : monthlyCustomers;
          return (
            <div ref={customerPanelRef} className="liquid-glass p-4 sm:p-5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-stone-200 font-semibold">
                  Customer profiles — {label}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setAnalyticsPanel(null);
                    setChartClickedPeriod(null);
                  }}
                  className="text-stone-400 hover:text-stone-100 text-sm font-medium"
                >
                  Close
                </button>
              </div>
              {list.length === 0 ? (
                <p className="text-stone-500 text-sm">No payments in this period.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[320px] overflow-y-auto scrollbar-theme">
                  {list.map(({ customer, amountInPeriod }) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => setReportCustomer(customer)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-white/10 text-left hover:bg-white/5 hover:border-brand-red/30 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 focus:ring-offset-stone-900"
                    >

                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-stone-100 truncate">{customer.name}</p>
                        <p className="text-stone-500 text-xs truncate">{customer.mobile ?? "—"}</p>
                        <p className="text-brand-red text-sm font-semibold mt-0.5">{formatINR(amountInPeriod)} in period</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Two graphs: completed days only, completed weeks only. Click a point to see customers for that period. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <RevenueChart
            data={dailyChartData}
            title="Revenue by day (last 7 completed days)"
            formatINR={formatINR}
            gradientId="revenue-daily"
            onBarClick={(index) => setChartClickedPeriod({ type: "daily", index })}
          />
          <RevenueChart
            data={weeklyChartData}
            title="Revenue by week (last 4 completed weeks, Sat–Fri)"
            formatINR={formatINR}
            gradientId="revenue-weekly"
            onBarClick={(index) => setChartClickedPeriod({ type: "weekly", index })}
          />
        </div>

        {/* Completed months only. Click a point to see customers for that month. */}
        <div>
          <RevenueChart
            data={monthlyChartData}
            title="Revenue by month (last 6 completed months, 6th–5th)"
            formatINR={formatINR}
            gradientId="revenue-monthly"
            onBarClick={(index) => setChartClickedPeriod({ type: "monthly", index })}
          />
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-stone-100 mb-1 tracking-tight">
          Trainer-wise reports (PT)
        </h2>
        <p className="text-stone-400 text-sm mb-4">
          Active PT clients only (plan running today). Commission uses Supabase-calculated trainer values for plans that started this business month (6th to 5th). Highlighted = contributed to commission.
        </p>
        {reports.length === 0 ? (
          <div className="liquid-glass p-6 sm:p-8 rounded-2xl text-center">
            <p className="text-stone-500 text-sm">
              No active PT customers. Add PT customers with current plan dates and assign a trainer.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <button
                key={report.name}
                type="button"
                onClick={() => setSelectedTrainer(report)}
                className="liquid-glass p-5 rounded-2xl border border-white/10 min-h-[180px] flex flex-col text-left transition-all duration-300 ease-out hover:scale-[1.02] hover:border-brand-red/50 hover:shadow-[0_0_28px_rgba(238,42,36,0.15)] focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 focus:ring-offset-black bg-stone-900/95"
              >
                <p className="text-brand-red font-semibold mb-1 truncate">
                  {report.name}
                </p>
                <p className="text-stone-400 text-sm font-medium mb-1">
                  Commission: {formatINR(report.totalCommission)}
                </p>
                <p className="text-stone-500 text-xs mb-2">
                  {report.plans.length} active client
                  {report.plans.length !== 1 ? "s" : ""} · Click for details
                </p>
                <ul className="text-stone-300 text-sm space-y-1 max-h-40 overflow-y-auto pr-1 scrollbar-theme">
                  {report.plans.slice(0, 8).map(({ plan, commissionAmount }) => {
                    const name = plan.name ?? "—";
                    if (name === "—") return null;
                    const contributes = commissionAmount > 0;
                    return (
                      <li
                        key={plan.id}
                        className={`truncate pl-0 ${contributes ? "bg-emerald-950/50 text-emerald-200 font-medium rounded px-1.5 py-0.5 -mx-1.5" : ""}`}
                      >
                        {name}
                        {contributes && (
                          <span className="ml-1 text-[10px] text-emerald-400 font-normal">(commission)</span>
                        )}
                      </li>
                    );
                  })}
                  {report.plans.length > 8 && (
                    <li className="text-stone-500 text-xs">+ more</li>
                  )}
                </ul>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedTrainer && (
        <TrainerReportModal
          report={selectedTrainer}
          formatCurrency={formatINR}
          formatDate={formatDate}
          onClose={() => setSelectedTrainer(null)}
          onOpenPlanPayments={openPlanPaymentsPanel}
          onOpenCustomerReport={(customer) => {
            setSelectedTrainer(null);
            setReportCustomer(customer);
          }}
        />
      )}

      {reportCustomer && (
        <CustomerReportModal
          customer={reportCustomer}
          customers={customers}
          trainers={trainers}
          formatCurrency={formatINR}
          onClose={() => setReportCustomer(null)}
          showActions={false}
          onViewPayments={openPlanPaymentsPanel}
        />
      )}

      <PlanPaymentsModal
        plan={paymentsPlan}
        open={paymentsModalOpen}
        payments={planPayments}
        loading={paymentsLoading}
        saving={false}
        error={paymentsError}
        formatCurrency={formatINR}
        onClose={closePaymentsModal}
        onSubmit={handleReadOnlyPaymentSubmit}
        onDeleteRequest={handleReadOnlyDelete}
        allowManage={false}
      />
    </div>
  );
}


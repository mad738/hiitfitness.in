"use client";
/* eslint-disable -- admin images are base64/dynamic */

import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import { useHorizontalScrollTable } from "@/hooks/useHorizontalScrollTable";
import type { Customer } from "@/models/customer";
import type { Trainer } from "@/models/trainer";
import { dedupeByMobile, normalizeMobile, isPlanCurrentlyRunning } from "@/lib/customer-utils";
import type { Tracker } from "@/models/tracker";
import { RevenueChart, type RevenueChartRow } from "./DashboardCharts";
import { CustomerReportModal } from "./CustomerReportModal";

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

function isCustomer(e: Customer | Tracker): e is Customer {
  return "name" in e && !("client_name" in e);
}

/** Sort key for "recent first": start_date > end_date > created_at */
function getSortDateMs(e: Customer | Tracker): number {
  const created =
    "created_at" in e && typeof (e as { created_at: string }).created_at === "string"
      ? (e as { created_at: string }).created_at
      : "";
  return parseDashboardDateMs(e.start_date) || parseDashboardDateMs(e.end_date) || parseDashboardDateMs(created) || 0;
}

export type TrainerReport = {
  name: string;
  entries: Customer[] | Tracker[];
  /** Trainer commission: sum of (total_fee / duration_months) * 30% for entries that started this (business) month. */
  commission: number;
  /** Entry ids that contributed to commission (start_date in current business month). */
  commissionEntryIds: Set<string>;
};

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
    // Commission = only entries that started this (business) month: (total_fee / duration_months) * 30%
    const trainerReportsList: TrainerReport[] = Object.entries(byTrainer)
      .map(([name, entries]) => {
        const deduped = dedupeByNameKeepRecent(entries);
        const commissionEntryIds = new Set<string>();
        let commission = 0;
        for (const c of deduped) {
          if (!isStartInCurrentMonth(c.start_date)) continue;
          commissionEntryIds.add(c.id);
          const total = Number(c.total_fee ?? 0);
          const months = durationToMonths(c.duration);
          commission += (total / months) * 0.3;
        }
        return {
          name,
          entries: deduped,
          commission,
          commissionEntryIds,
        };
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
          Active PT clients only (plan running today). Commission from clients who started this month (6th–5th): (total ÷ duration) × 30%. Highlighted = contributed to commission.
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
                  Commission: {formatINR(report.commission)}
                </p>
                <p className="text-stone-500 text-xs mb-2">
                  {report.entries.length} active client
                  {report.entries.length !== 1 ? "s" : ""} · Click for details
                </p>
                <ul className="text-stone-300 text-sm space-y-1 max-h-40 overflow-y-auto pr-1 scrollbar-theme">
                  {report.entries.slice(0, 8).map((e) => {
                    const name = isCustomer(e) ? e.name : (e.client_name ?? e.client_id ?? "—");
                    const contributes = report.commissionEntryIds.has(e.id);
                    if (name === "—") return null;
                    return (
                      <li
                        key={e.id}
                        className={`truncate pl-0 ${contributes ? "bg-emerald-950/50 text-emerald-200 font-medium rounded px-1.5 py-0.5 -mx-1.5" : ""}`}
                      >
                        {name}
                        {contributes && (
                          <span className="ml-1 text-[10px] text-emerald-400 font-normal">(commission)</span>
                        )}
                      </li>
                    );
                  })}
                  {report.entries.length > 8 && (
                    <li className="text-stone-500 text-xs">+ more</li>
                  )}
                </ul>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedTrainer && (
        <ClientDetailsModal
          trainerName={selectedTrainer.name}
          entries={selectedTrainer.entries}
          commissionEntryIds={selectedTrainer.commissionEntryIds}
          customers={customers}
          trainers={trainers}
          onClose={() => setSelectedTrainer(null)}
          onOpenCustomerReport={(customer) => {
            setSelectedTrainer(null);
            setReportCustomer(customer);
          }}
          formatINR={formatINR}
          formatDate={formatDate}
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
        />
      )}
    </div>
  );
}



function ClientDetailsModal({
  trainerName,
  entries,
  commissionEntryIds,
  customers,
  trainers,
  onClose,
  onOpenCustomerReport,
  formatINR,
  formatDate,
}: {
  trainerName: string;
  entries: Customer[] | Tracker[];
  commissionEntryIds: Set<string>;
  customers: Customer[];
  trainers: Trainer[];
  onClose: () => void;
  onOpenCustomerReport?: (customer: Customer) => void;
  formatINR: (n: number) => string;
  formatDate: (s: string | null) => string;
}) {
  const [selectedEntry, setSelectedEntry] = useState<Customer | Tracker | null>(null);
  const { tableScrollRef, topScrollRef, headerRef } = useHorizontalScrollTable(
    [entries.length, selectedEntry?.id ?? ""],
    { wheelOnBody: false }
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedEntry) setSelectedEntry(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, selectedEntry]);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort((a, b) =>
        getSortDateMs(b) - getSortDateMs(a)
      ),
    [entries]
  );



  const trainerById = useMemo(
    () => new Map(trainers.map((t) => [t.id, t])),
    [trainers]
  );

  const showCustomerReport = selectedEntry && isCustomer(selectedEntry);
  const customerReportHistory = useMemo(() => {
    if (!showCustomerReport || !selectedEntry) return [];
    const nameKey = (selectedEntry as Customer).name?.trim() ?? "";
    return customers
      .filter((c) => (c.name ?? "").trim() === nameKey)
      .sort((a, b) => parseDashboardDateMs(b.start_date ?? b.created_at) - parseDashboardDateMs(a.start_date ?? a.created_at));
  }, [showCustomerReport, selectedEntry, customers]);
  const totalPaidAllTime = useMemo(
    () => customerReportHistory.reduce((s, c) => s + Number(c.paid_fee ?? 0), 0),
    [customerReportHistory]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={() => (selectedEntry ? setSelectedEntry(null) : onClose())}
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-details-title"
    >
      <div
        className="liquid-glass rounded-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl bg-stone-900/95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10">
          <h2
            id="client-details-title"
            className="font-display text-lg font-bold uppercase text-stone-100"
          >
            {showCustomerReport ? "Customer report – all history" : `Client details — ${trainerName}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-red"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-5 overflow-hidden">
          {showCustomerReport ? (
            <div className="overflow-y-auto flex-1 min-h-0 space-y-4 scrollbar-theme">
              <div className="flex gap-4 flex-wrap">

                <div className="min-w-0">
                  <p className="text-xl font-bold text-stone-100">{(selectedEntry as Customer).name}</p>
                  <p className="text-stone-400 text-sm">{(selectedEntry as Customer).mobile ?? "—"}</p>
                  <p className="text-stone-500 text-sm mt-1">
                    {customerReportHistory.length} entr{customerReportHistory.length === 1 ? "y" : "ies"} · Total paid (all time): {formatINR(totalPaidAllTime)}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-stone-300 font-semibold text-sm uppercase tracking-wider mb-2">All entries & renewals</h3>
                <div className="flex flex-col">
                  <div
                    ref={topScrollRef}
                    className="overflow-x-auto overflow-y-hidden flex-shrink-0 scrollbar-horizontal-top border-b border-white/10 bg-stone-900/50 py-1.5 px-1"
                    aria-hidden
                  >
                    <div className="min-w-[800px] h-2" />
                  </div>
                  <div
                    ref={tableScrollRef}
                    className="overflow-x-auto overflow-y-visible scrollbar-theme scrollbar-horizontal-bottom flex-1 min-h-0"
                  >
                    <table className="w-full text-sm border-collapse min-w-[800px]">
                      <thead ref={headerRef} className="select-none cursor-ew-resize">
                        <tr className="border-b border-white/10 bg-white/[0.04]">
                          <th className="text-left py-2 px-2 text-stone-400 font-medium">#</th>
                          <th className="text-left py-2 px-2 text-stone-400 font-medium">Plan</th>
                          <th className="text-left py-2 px-2 text-stone-400 font-medium">Start</th>
                          <th className="text-left py-2 px-2 text-stone-400 font-medium">End</th>
                          <th className="text-left py-2 px-2 text-stone-400 font-medium">Duration</th>
                          <th className="text-right py-2 px-2 text-stone-400 font-medium">Total</th>
                          <th className="text-right py-2 px-2 text-stone-400 font-medium">Paid</th>
                          <th className="text-right py-2 px-2 text-stone-400 font-medium">Balance</th>
                          <th className="text-left py-2 px-2 text-stone-400 font-medium">Pay date</th>
                          <th className="text-left py-2 px-2 text-stone-400 font-medium">Payment</th>
                          <th className="text-left py-2 px-2 text-stone-400 font-medium">Trainer</th>
                          <th className="text-left py-2 px-2 text-stone-400 font-medium">Status</th>
                          <th className="text-left py-2 px-2 text-stone-400 font-medium">Remarks</th>
                          <th className="text-center py-2 px-2 text-stone-400 font-medium">Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerReportHistory.map((entry, idx) => {
                          const trainer = entry.trainer_id ? trainerById.get(entry.trainer_id) : null;
                          const isCurrent = entry.id === (selectedEntry as Customer).id;
                          return (
                            <tr
                              key={entry.id}
                              className={`border-b border-white/5 ${isCurrent ? "bg-brand-red/10" : ""}`}
                            >
                              <td className="py-2 px-2 text-stone-400">{customerReportHistory.length - idx}</td>
                              <td className="py-2 px-2 text-stone-200 font-medium">{entry.plan}</td>
                              <td className="py-2 px-2 text-stone-300 whitespace-nowrap">{formatDate(entry.start_date)}</td>
                              <td className="py-2 px-2 text-stone-300 whitespace-nowrap">{formatDate(entry.end_date)}</td>
                              <td className="py-2 px-2 text-stone-300">{entry.duration ?? "—"}</td>
                              <td className="py-2 px-2 text-right text-stone-300 tabular-nums">{formatINR(entry.total_fee)}</td>
                              <td className="py-2 px-2 text-right text-stone-300 tabular-nums">{formatINR(entry.paid_fee)}</td>
                              <td className="py-2 px-2 text-right tabular-nums">{formatINR(entry.balance)}</td>
                              <td className="py-2 px-2 text-stone-300 whitespace-nowrap">{formatDate(entry.pay_date)}</td>
                              <td className="py-2 px-2 text-stone-300">{entry.payment_mode ?? "—"}</td>
                              <td className="py-2 px-2 text-stone-300">{entry.plan === "PT" ? (trainer?.name ?? "—") : "—"}</td>
                              <td className="py-2 px-2 text-stone-300">{entry.status ?? "—"}</td>
                              <td className="py-2 px-2 text-stone-300 max-w-[100px] truncate" title={entry.remarks ?? undefined}>{entry.remarks ?? "—"}</td>
                              <td className="py-2 px-2 text-center text-stone-300">{entry.receipt ? "Yes" : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 rounded-xl border border-white/20 text-stone-400 hover:bg-white/5 text-sm"
              >
                ← Back to list
              </button>
            </div>
          ) : selectedEntry ? (
            <ClientDetailPanel
              entry={selectedEntry}
              isCustomer={isCustomer(selectedEntry)}
              formatINR={formatINR}
              formatDate={formatDate}
              trainerById={trainerById}
              onBack={() => setSelectedEntry(null)}
            />
          ) : (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div
                ref={topScrollRef}
                className="overflow-x-auto overflow-y-hidden flex-shrink-0 scrollbar-horizontal-top border-b border-white/10 bg-stone-900/50 py-1.5 px-1"
                aria-hidden
              >
                <div className="min-w-[700px] h-2" />
              </div>
              <div
                ref={tableScrollRef}
                className="overflow-x-auto flex-1 min-h-0 scrollbar-theme scrollbar-horizontal-bottom"
              >
                <table className="w-full text-sm border-collapse min-w-[700px]">
                  <thead ref={headerRef} className="select-none cursor-ew-resize">
                    <tr className="border-b border-white/20">

                      <th className="text-left py-2 px-2 text-stone-400 font-medium">Name</th>
                      <th className="text-left py-2 px-2 text-stone-400 font-medium">Plan</th>
                      <th className="text-left py-2 px-2 text-stone-400 font-medium">Start</th>
                      <th className="text-left py-2 px-2 text-stone-400 font-medium">End</th>
                      <th className="text-right py-2 px-2 text-stone-400 font-medium">Total (₹)</th>
                      <th className="text-right py-2 px-2 text-stone-400 font-medium">Paid (₹)</th>
                      <th className="text-right py-2 px-2 text-stone-400 font-medium">Due / Balance (₹)</th>
                      <th className="text-left py-2 px-2 text-stone-400 font-medium">Pay date</th>
                      <th className="text-left py-2 px-2 text-stone-400 font-medium">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEntries.map((row) => {
                      const name = isCustomer(row)
                        ? row.name
                        : (row.client_name ?? row.client_id ?? "—");
                      const dueOrBalance = isCustomer(row)
                        ? row.balance
                        : (row.due_fee ?? 0);
                      const contributesToCommission = commissionEntryIds.has(row.id);
                      return (
                        <tr
                          key={row.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            if (isCustomer(row) && onOpenCustomerReport) {
                              onOpenCustomerReport(row);
                              onClose();
                            } else {
                              setSelectedEntry(row);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter" && e.key !== " ") return;
                            if (isCustomer(row) && onOpenCustomerReport) {
                              onOpenCustomerReport(row);
                              onClose();
                            } else {
                              setSelectedEntry(row);
                            }
                          }}
                          className={`border-b border-white/5 hover:bg-white/10 cursor-pointer transition-colors ${contributesToCommission ? "bg-emerald-950/40 ring-1 ring-inset ring-emerald-500/30" : ""}`}
                          title={contributesToCommission ? "Contributes to this month’s commission" : undefined}
                        >

                          <td className="py-2 px-2 text-stone-200">
                            <span className="inline-flex items-center gap-1.5">
                              {name}
                              {contributesToCommission && (
                                <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-emerald-600/60 text-white">Commission</span>
                              )}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-stone-300">{row.plan ?? "—"}</td>
                          <td className="py-2 px-2 text-stone-300">
                            {formatDate(isCustomer(row) ? row.start_date : row.start_date)}
                          </td>
                          <td className="py-2 px-2 text-stone-300">
                            {formatDate(isCustomer(row) ? row.end_date : row.end_date)}
                          </td>
                          <td className="py-2 px-2 text-right text-stone-300">
                            {row.total_fee != null ? formatINR(Number(row.total_fee)) : "—"}
                          </td>
                          <td className="py-2 px-2 text-right text-stone-300">
                            {row.paid_fee != null ? formatINR(Number(row.paid_fee)) : "—"}
                          </td>
                          <td className="py-2 px-2 text-right text-stone-300">
                            {dueOrBalance != null ? formatINR(Number(dueOrBalance)) : "—"}
                          </td>
                          <td className="py-2 px-2 text-stone-300">
                            {formatDate(
                              isCustomer(row) ? row.pay_date : row.pay_date
                            )}
                          </td>
                          <td className="py-2 px-2 text-stone-300">
                            {(isCustomer(row) ? row.payment_mode : row.payment_mode) ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClientDetailPanel({
  entry,
  isCustomer: isCustomerEntry,
  formatINR,
  formatDate,
  trainerById,
  onBack,
}: {
  entry: Customer | Tracker;
  isCustomer: boolean;
  formatINR: (n: number) => string;
  formatDate: (s: string | null) => string;
  trainerById: Map<string, Trainer>;
  onBack: () => void;
}) {
  const name = isCustomerEntry
    ? (entry as Customer).name
    : (entry as Tracker).client_name ?? (entry as Tracker).client_id ?? "—";


  const rows: { label: string; value: string }[] = [];
  if (isCustomerEntry) {
    const c = entry as Customer;
    const trainerName = c.trainer_id ? trainerById.get(c.trainer_id)?.name ?? c.trainer_id : "—";
    rows.push(
      { label: "Name", value: c.name },
      { label: "Plan", value: c.plan ?? "—" },
      { label: "Trainer", value: trainerName },
      { label: "Total fee", value: c.total_fee != null ? formatINR(Number(c.total_fee)) : "—" },
      { label: "Paid fee", value: c.paid_fee != null ? formatINR(Number(c.paid_fee)) : "—" },
      { label: "Balance", value: c.balance != null ? formatINR(Number(c.balance)) : "—" },
      { label: "Start date", value: formatDate(c.start_date) },
      { label: "End date", value: formatDate(c.end_date) },
      { label: "Pay date", value: formatDate(c.pay_date) },
      { label: "Payment mode", value: c.payment_mode ?? "—" },
      { label: "Duration", value: c.duration ?? "—" },
      { label: "Remarks", value: c.remarks ?? "—" },
      { label: "Created", value: formatDate(c.created_at) },
      { label: "Updated", value: formatDate(c.updated_at) }
    );
  } else {
    const t = entry as Tracker;
    rows.push(
      { label: "Client name", value: t.client_name ?? "—" },
      { label: "Client ID", value: t.client_id ?? "—" },
      { label: "Plan", value: t.plan ?? "—" },
      { label: "Frequency", value: t.frequency ?? "—" },
      { label: "Trainer", value: t.trainer_name ?? "—" },
      { label: "Total fee", value: t.total_fee != null ? formatINR(Number(t.total_fee)) : "—" },
      { label: "Paid fee", value: t.paid_fee != null ? formatINR(Number(t.paid_fee)) : "—" },
      { label: "Due fee", value: t.due_fee != null ? formatINR(Number(t.due_fee)) : "—" },
      { label: "Mobile", value: t.mobile ?? "—" },
      { label: "Start date", value: formatDate(t.start_date) },
      { label: "End date", value: formatDate(t.end_date) },
      { label: "Pay date", value: formatDate(t.pay_date) },
      { label: "Payment mode", value: t.payment_mode ?? "—" },
      { label: "Paid to", value: t.paid_to ?? "—" },
      { label: "Remarks", value: t.remarks ?? "—" },
      { label: "Status", value: t.status ?? "—" },
      { label: "Created", value: formatDate(t.created_at) },
      { label: "Updated", value: formatDate(t.updated_at) }
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-stone-400 hover:text-stone-100 font-medium mb-2"
      >
        ← Back to list
      </button>
      <div className="flex gap-6 flex-wrap">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-stone-100 mb-4">{name}</h3>
          <dl className="grid gap-2 sm:grid-cols-2">
            {rows.map(({ label, value }) => (
              <div key={label} className="flex flex-wrap gap-x-2">
                <dt className="text-stone-500 text-sm">{label}</dt>
                <dd className="text-stone-200 text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import type { Customer } from "@/models/customer";
import type { Trainer } from "@/models/trainer";
import type { Tracker } from "@/models/tracker";
import { useDemoMode } from "./AdminDemoContext";
import {
  DUMMY_TRACKER_LIST,
  DUMMY_DASHBOARD,
  DUMMY_MONTH_WISE,
} from "@/data/dummy-admin-data";
import type { MonthWiseRow } from "@/data/dummy-admin-data";
import { AdminDatePicker } from "@/components/ui/admin-date-picker";

const DashboardCharts = dynamic(
  () => import("./DashboardCharts").then((m) => m.DashboardCharts),
  { ssr: false }
);

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

/** Date string YYYY-MM-DD for start of day (for comparisons) */
function toDateOnly(isoOrDate: string): string {
  const d = new Date(isoOrDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isCustomer(e: Customer | Tracker): e is Customer {
  return "name" in e && !("client_name" in e);
}

/** Sort key for "recent first": start_date > end_date > created_at */
function getSortDate(e: Customer | Tracker): string {
  const created =
    "created_at" in e && typeof (e as { created_at: string }).created_at === "string"
      ? (e as { created_at: string }).created_at
      : "";
  return e.start_date ?? e.end_date ?? created ?? "";
}

export type TrainerReport = {
  name: string;
  entries: Customer[] | Tracker[];
};

function trainerReportsFromDummyList(list: Tracker[]): TrainerReport[] {
  const byTrainer = list.reduce(
    (acc, row) => {
      const trainer = row.trainer_name ?? "—";
      if (!acc[trainer]) acc[trainer] = [];
      acc[trainer].push(row);
      return acc;
    },
    {} as Record<string, Tracker[]>
  );
  const dedupeTrackerByName = (entries: Tracker[]): Tracker[] => {
    const byName = new Map<string, Tracker>();
    for (const e of entries) {
      const name = e.client_name ?? e.client_id ?? "";
      const existing = byName.get(name);
      const eStart = e.start_date ?? "";
      const existingStart = existing?.start_date ?? "";
      if (!existing || eStart > existingStart) byName.set(name, e);
    }
    return Array.from(byName.values()).sort((a, b) =>
      getSortDate(b).localeCompare(getSortDate(a))
    );
  };
  return Object.entries(byTrainer)
    .map(([name, entries]) => ({
      name,
      entries: dedupeTrackerByName(entries),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const DUMMY_TRAINER_REPORTS = trainerReportsFromDummyList(DUMMY_TRACKER_LIST);

type Props = {
  customers: Customer[];
  trainers: Trainer[];
  adminCount: number;
};

const PRESETS = [
  { label: "This month", months: 0 },
  { label: "Last 3 months", months: 3 },
  { label: "Last 6 months", months: 6 },
  { label: "Last 12 months", months: 12 },
] as const;

function getDefaultRange(): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  return {
    dateFrom: toDateOnly(start.toISOString()),
    dateTo: toDateOnly(end.toISOString()),
  };
}

/** Monday as start of week (ISO-style). */
function getWeekStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + offset);
  return x;
}

export type WeekWiseRow = {
  weekKey: string;
  weekLabel: string;
  entries: number;
  revenue: number;
};

export function DashboardContent({
  customers,
  trainers,
  adminCount,
}: Props) {
  const useDummy = useDemoMode();
  const defaultRange = useMemo(getDefaultRange, []);
  const [dateFrom, setDateFrom] = useState(defaultRange.dateFrom);
  const [dateTo, setDateTo] = useState(defaultRange.dateTo);
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerReport | null>(
    null
  );

  const customerCount = customers.length;
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

  const { newEntries, revenue, monthWiseData, weekWiseData, trainerReports } = useMemo(() => {
    if (useDummy) {
      const dummyWeeks: WeekWiseRow[] = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const weekStart = getWeekStart(new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        dummyWeeks.push({
          weekKey: toDateOnly(weekStart.toISOString()),
          weekLabel: `${weekStart.getDate()}–${weekEnd.getDate()} ${weekEnd.toLocaleDateString("en-IN", { month: "short" })}`,
          entries: 4 + (i % 5),
          revenue: 25000 + (i % 4) * 8000,
        });
      }
      return {
        newEntries: DUMMY_DASHBOARD.newCustomersThisMonth,
        revenue: DUMMY_DASHBOARD.revenueThisMonth,
        monthWiseData: DUMMY_MONTH_WISE,
        weekWiseData: dummyWeeks,
        trainerReports: DUMMY_TRAINER_REPORTS,
      };
    }
    const from = dateFrom;
    const to = dateTo;
    const inRangeStart = (d: string | null) =>
      d && d >= from && d <= to;
    const inRangePay = (d: string | null) =>
      d && d >= from && d <= to;

    const newEntries = customers.filter((c) =>
      inRangeStart(c.start_date ? toDateOnly(c.start_date) : null)
    ).length;
    const revenue = customers
      .filter((c) =>
        inRangePay(c.pay_date ? toDateOnly(c.pay_date) : null)
      )
      .reduce((sum, c) => sum + Number(c.paid_fee ?? 0), 0);

    const start = new Date(from + "T00:00:00");
    const end = new Date(to + "T23:59:59");
    const months: MonthWiseRow[] = [];
    const curr = new Date(start.getFullYear(), start.getMonth(), 1);
    while (curr <= end) {
      const y = curr.getFullYear();
      const m = curr.getMonth();
      const monthKey = `${y}-${String(m + 1).padStart(2, "0")}`;
      const monthLabel = curr.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      });
      const monthStart = new Date(y, m, 1);
      const monthEnd = new Date(y, m + 1, 0, 23, 59, 59, 999);
      const entries = customers.filter((c) => {
        const sd = c.start_date ? new Date(c.start_date) : null;
        return sd && sd >= monthStart && sd <= monthEnd;
      }).length;
      const revenueM = customers
        .filter((c) => {
          const pd = c.pay_date ? new Date(c.pay_date) : null;
          return pd && pd >= monthStart && pd <= monthEnd;
        })
        .reduce((s, c) => s + Number(c.paid_fee ?? 0), 0);
      months.push({ month: monthKey, monthLabel, entries, revenue: revenueM });
      curr.setMonth(curr.getMonth() + 1);
    }

    const weeks: WeekWiseRow[] = [];
    let weekCurr = getWeekStart(start);
    while (weekCurr <= end) {
      const weekEnd = new Date(weekCurr);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      const weekKey = toDateOnly(weekCurr.toISOString());
      const weekLabel = `${weekCurr.getDate()}–${weekEnd.getDate()} ${weekEnd.toLocaleDateString("en-IN", { month: "short" })}`;
      const entriesW = customers.filter((c) => {
        const sd = c.start_date ? new Date(c.start_date) : null;
        return sd && sd >= weekCurr && sd <= weekEnd;
      }).length;
      const revenueW = customers
        .filter((c) => {
          const pd = c.pay_date ? new Date(c.pay_date) : null;
          return pd && pd >= weekCurr && pd <= weekEnd;
        })
        .reduce((s, c) => s + Number(c.paid_fee ?? 0), 0);
      weeks.push({ weekKey, weekLabel, entries: entriesW, revenue: revenueW });
      weekCurr.setDate(weekCurr.getDate() + 7);
    }
    const trainerById = new Map<string, Trainer>(
      trainers.map((t) => [t.id, t])
    );
    const allPt = customers.filter(
      (c) => c.plan === "PT" && c.trainer_id
    );
    const byTrainer: Record<string, Customer[]> = {};
    for (const c of allPt) {
      const trainerName = trainerById.get(c.trainer_id!)?.name ?? "Unknown trainer";
      if (!byTrainer[trainerName]) byTrainer[trainerName] = [];
      byTrainer[trainerName].push(c);
    }
    const dedupeByNameKeepRecent = (entries: Customer[]): Customer[] => {
      const byName = new Map<string, Customer>();
      for (const c of entries) {
        const name = c.name ?? "";
        const existing = byName.get(name);
        const cStart = c.start_date ?? "";
        const existingStart = existing?.start_date ?? "";
        if (!existing || cStart > existingStart) byName.set(name, c);
      }
      return Array.from(byName.values()).sort((a, b) =>
        (getSortDate(b) ?? "").localeCompare(getSortDate(a) ?? "")
      );
    };
    const trainerReportsList: TrainerReport[] = Object.entries(byTrainer)
      .map(([name, entries]) => ({
        name,
        entries: dedupeByNameKeepRecent(entries),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      newEntries,
      revenue,
      monthWiseData: months,
      weekWiseData: weeks,
      trainerReports: trainerReportsList,
    };
  }, [useDummy, customers, trainers, dateFrom, dateTo]);

  const chartData = monthWiseData;
  const weeklyChartData = weekWiseData.map((w) => ({
    monthLabel: w.weekLabel,
    entries: w.entries,
    revenue: w.revenue,
  }));

  const now = new Date();
  const firstOfMonth = toDateOnly(new Date(now.getFullYear(), now.getMonth(), 1).toISOString());
  const today = toDateOnly(now.toISOString());
  const isThisMonth = dateFrom === firstOfMonth && dateTo === today;

  const cards = [
    {
      title: "Customers",
      count: useDummy ? DUMMY_DASHBOARD.customerCount : customerCount,
      href: "/admin/customers",
      description: "All members with plan, fees, dates, and trainer (PT only).",
      meta: (
        <span className="text-base font-normal text-stone-500">
          GT: {useDummy ? DUMMY_DASHBOARD.gtCount : gtCount} · PT:{" "}
          {useDummy ? DUMMY_DASHBOARD.ptCount : ptCount}
        </span>
      ),
    },
    {
      title: "Admin users",
      count: useDummy ? DUMMY_DASHBOARD.adminCount : adminCount,
      href: "/admin/credentials",
      description: "Usernames and roles.",
      meta: null,
    },
  ];

  const applyPreset = (months: number) => {
    const end = new Date();
    const start =
      months === 0
        ? new Date(end.getFullYear(), end.getMonth(), 1)
        : new Date(end.getFullYear(), end.getMonth() - months, 1);
    setDateFrom(toDateOnly(start.toISOString()));
    setDateTo(toDateOnly(end.toISOString()));
  };

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
            className="liquid-glass block p-6 rounded-2xl min-h-[140px] transition-all duration-300 ease-out hover:scale-[1.02] hover:border-brand-red/40 hover:shadow-[0_0_32px_rgba(255,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 focus:ring-offset-black"
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
          Set a custom date range, then see new entries (by start date), revenue
          (by pay date), and month-wise breakdown below. Trainer reports are
          separate and show all clients.
        </p>

        <div className="liquid-glass p-4 sm:p-5 rounded-2xl border border-white/10 flex flex-wrap items-end gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-stone-400 text-sm font-medium">From</label>
            <AdminDatePicker
              value={dateFrom}
              onChange={setDateFrom}
              className="admin-date min-w-[140px]"
              aria-label="Date from"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-stone-400 text-sm font-medium">To</label>
            <AdminDatePicker
              value={dateTo}
              onChange={setDateTo}
              className="admin-date min-w-[140px]"
              aria-label="Date to"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(({ label, months }) => (
              <button
                key={label}
                type="button"
                onClick={() => applyPreset(months)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-stone-300 bg-white/10 border border-white/10 hover:bg-brand-red/20 hover:border-brand-red/40 hover:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand-red"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="liquid-glass p-5 sm:p-6 rounded-2xl border border-white/10 transition-all duration-300 ease-out hover:scale-[1.02] hover:border-brand-red/30 hover:shadow-[0_0_28px_rgba(255,0,0,0.12)]">
            <p className="text-stone-400 text-sm font-medium mb-1">
              New entries (start date)
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-stone-100">
              {newEntries}
            </p>
          </div>
          <div className="liquid-glass p-5 sm:p-6 rounded-2xl border border-white/10 transition-all duration-300 ease-out hover:scale-[1.02] hover:border-brand-red/30 hover:shadow-[0_0_28px_rgba(255,0,0,0.12)]">
            <p className="text-stone-400 text-sm font-medium mb-1">
              Revenue (pay date, INR)
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-stone-100">
              {formatINR(revenue)}
            </p>
          </div>
        </div>

        {isThisMonth ? (
          <>
            <div>
              <h3 className="font-display text-base font-bold uppercase text-stone-200 mb-3 tracking-tight">
                This month by week
              </h3>
              <p className="text-stone-500 text-sm mb-4">
                Weekly breakdown (Monday–Sunday) for the current month.
              </p>
              <DashboardCharts data={weeklyChartData} formatINR={formatINR} />
            </div>
            <div className="mt-10">
              <h3 className="font-display text-base font-bold uppercase text-stone-200 mb-3 tracking-tight">
                Monthly view
              </h3>
              <DashboardCharts data={chartData} formatINR={formatINR} />
            </div>
          </>
        ) : (
          <>
            <DashboardCharts data={chartData} formatINR={formatINR} />
            <div className="mt-10">
              <h3 className="font-display text-base font-bold uppercase text-stone-200 mb-3 tracking-tight">
                Weekly view
              </h3>
              <p className="text-stone-500 text-sm mb-4">
                Same date range, broken down by week (Monday–Sunday).
              </p>
              <DashboardCharts data={weeklyChartData} formatINR={formatINR} />
            </div>
          </>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-stone-100 mb-1 tracking-tight">
          Trainer-wise reports (PT)
        </h2>
        <p className="text-stone-400 text-sm mb-4">
          All PT clients per trainer. When the same name appears more than once,
          only the most recent (by start date) is shown. Click a card for details.
        </p>
        {reports.length === 0 ? (
          <div className="liquid-glass p-6 sm:p-8 rounded-2xl text-center">
            <p className="text-stone-500 text-sm">
              No PT customers yet. Add customers with PT plan and assign a trainer
              to see reports.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <button
                key={report.name}
                type="button"
                onClick={() => setSelectedTrainer(report)}
                className="liquid-glass p-5 rounded-2xl border border-white/10 min-h-[180px] flex flex-col text-left transition-all duration-300 ease-out hover:scale-[1.02] hover:border-brand-red/50 hover:shadow-[0_0_28px_rgba(255,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 focus:ring-offset-black"
              >
                <p className="text-brand-red font-semibold mb-1 truncate">
                  {report.name}
                </p>
                <p className="text-stone-500 text-xs mb-2">
                  {report.entries.length} client
                  {report.entries.length !== 1 ? "s" : ""} · Click for details
                </p>
                <ul className="text-stone-300 text-sm space-y-1 max-h-40 overflow-y-auto pr-1 scrollbar-theme">
                  {report.entries
                    .map((e) =>
                      isCustomer(e) ? e.name : (e.client_name ?? e.client_id ?? "—")
                    )
                    .filter((c) => c !== "—")
                    .slice(0, 8)
                    .map((c, i) => (
                      <li key={i} className="truncate pl-0">
                        {c}
                      </li>
                    ))}
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
          trainers={trainers}
          onClose={() => setSelectedTrainer(null)}
          formatINR={formatINR}
          formatDate={formatDate}
        />
      )}
    </div>
  );
}

const PROFILE_PLACEHOLDER = "/images/profile placeholder.jpg";

function ClientDetailsModal({
  trainerName,
  entries,
  trainers,
  onClose,
  formatINR,
  formatDate,
}: {
  trainerName: string;
  entries: Customer[] | Tracker[];
  trainers: Trainer[];
  onClose: () => void;
  formatINR: (n: number) => string;
  formatDate: (s: string | null) => string;
}) {
  const [selectedEntry, setSelectedEntry] = useState<Customer | Tracker | null>(null);

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
        (getSortDate(b) ?? "").localeCompare(getSortDate(a) ?? "")
      ),
    [entries]
  );

  const entryImage = (row: Customer | Tracker) =>
    isCustomer(row) ? (row.image ?? PROFILE_PLACEHOLDER) : PROFILE_PLACEHOLDER;

  const trainerById = useMemo(
    () => new Map(trainers.map((t) => [t.id, t])),
    [trainers]
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
        className="liquid-glass rounded-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10">
          <h2
            id="client-details-title"
            className="font-display text-lg font-bold uppercase text-stone-100"
          >
            Client details — {trainerName}
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
        <div className="overflow-auto flex-1 p-4 sm:p-5 scrollbar-theme">
          {selectedEntry ? (
            <ClientDetailPanel
              entry={selectedEntry}
              isCustomer={isCustomer(selectedEntry)}
              formatINR={formatINR}
              formatDate={formatDate}
              trainerById={trainerById}
              onBack={() => setSelectedEntry(null)}
            />
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-2 px-2 text-stone-400 font-medium w-14">
                    Photo
                  </th>
                  <th className="text-left py-2 px-2 text-stone-400 font-medium">
                    Name
                  </th>
                  <th className="text-left py-2 px-2 text-stone-400 font-medium">
                    Plan
                  </th>
                  <th className="text-left py-2 px-2 text-stone-400 font-medium">
                    Start
                  </th>
                  <th className="text-left py-2 px-2 text-stone-400 font-medium">
                    End
                  </th>
                  <th className="text-right py-2 px-2 text-stone-400 font-medium">
                    Total (₹)
                  </th>
                  <th className="text-right py-2 px-2 text-stone-400 font-medium">
                    Paid (₹)
                  </th>
                  <th className="text-right py-2 px-2 text-stone-400 font-medium">
                    Due / Balance (₹)
                  </th>
                  <th className="text-left py-2 px-2 text-stone-400 font-medium">
                    Pay date
                  </th>
                  <th className="text-left py-2 px-2 text-stone-400 font-medium">
                    Payment
                  </th>
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
                  return (
                    <tr
                      key={row.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedEntry(row)}
                      onKeyDown={(e) =>
                        (e.key === "Enter" || e.key === " ") && setSelectedEntry(row)
                      }
                      className="border-b border-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <td className="py-2 px-2 align-middle">
                        <img
                          src={entryImage(row)}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-white/10"
                        />
                      </td>
                      <td className="py-2 px-2 text-stone-200">{name}</td>
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
  const image =
    isCustomerEntry
      ? (entry as Customer).image ?? PROFILE_PLACEHOLDER
      : PROFILE_PLACEHOLDER;

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
        <div className="shrink-0">
          <img
            src={image}
            alt=""
            className="w-24 h-24 rounded-full object-cover border-2 border-white/20"
          />
        </div>
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

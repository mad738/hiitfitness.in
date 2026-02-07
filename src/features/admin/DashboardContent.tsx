"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { Tracker } from "@/models/tracker";
import { useDemoMode } from "./AdminDemoContext";
import {
  DUMMY_TRACKER_LIST,
  DUMMY_DASHBOARD,
  DUMMY_MONTH_WISE,
} from "@/data/dummy-admin-data";
import type { MonthWiseRow } from "@/data/dummy-admin-data";

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

export type TrainerReport = {
  name: string;
  entries: Tracker[];
};

function trainerReportsFromList(list: Tracker[]): TrainerReport[] {
  const byTrainer = list.reduce(
    (acc, row) => {
      const trainer = row.trainer_name ?? "—";
      if (!acc[trainer]) acc[trainer] = [];
      acc[trainer].push(row);
      return acc;
    },
    {} as Record<string, Tracker[]>
  );
  return Object.entries(byTrainer)
    .map(([name, entries]) => ({ name, entries }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const DUMMY_TRAINER_REPORTS = trainerReportsFromList(DUMMY_TRACKER_LIST);

type Props = {
  trackerCount: number;
  gtCount: number;
  ptCount: number;
  adminCount: number;
  newEntriesThisMonth: number;
  revenueThisMonth: number;
  trainerReports: TrainerReport[];
  monthWiseData: MonthWiseRow[];
};

export function DashboardContent({
  trackerCount,
  gtCount,
  ptCount,
  adminCount,
  newEntriesThisMonth,
  revenueThisMonth,
  trainerReports,
  monthWiseData,
}: Props) {
  const useDummy = useDemoMode();
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerReport | null>(
    null
  );
  const chartData = useDummy ? DUMMY_MONTH_WISE : monthWiseData;

  const cards = [
    {
      title: "Tracker",
      count: useDummy ? DUMMY_DASHBOARD.trackerCount : trackerCount,
      href: "/admin/tracker",
      description: "Client entries. Filter by plan, trainer, client.",
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

  const newEntries = useDummy
    ? DUMMY_DASHBOARD.newEntriesThisMonth
    : newEntriesThisMonth;
  const revenue = useDummy
    ? DUMMY_DASHBOARD.revenueThisMonth
    : revenueThisMonth;

  const reports = useDummy ? DUMMY_TRAINER_REPORTS : trainerReports;

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-stone-100 mb-1 tracking-tight">
          Dashboard
        </h1>
        <p className="text-stone-400 text-sm sm:text-base">
          Overview of HIIT Fitness admin data.
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

      <section className="space-y-4">
        <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-stone-100 mb-1 tracking-tight">
          This month
        </h2>
        <p className="text-stone-400 text-sm mb-2">
          New tracker entries and revenue collected (from tracker).
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="liquid-glass p-5 sm:p-6 rounded-2xl border border-white/10 transition-all duration-300 ease-out hover:scale-[1.02] hover:border-brand-red/30 hover:shadow-[0_0_28px_rgba(255,0,0,0.12)]">
            <p className="text-stone-400 text-sm font-medium mb-1">
              New entries this month
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-stone-100">
              {newEntries}
            </p>
          </div>
          <div className="liquid-glass p-5 sm:p-6 rounded-2xl border border-white/10 transition-all duration-300 ease-out hover:scale-[1.02] hover:border-brand-red/30 hover:shadow-[0_0_28px_rgba(255,0,0,0.12)]">
            <p className="text-stone-400 text-sm font-medium mb-1">
              Revenue collected (INR)
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-stone-100">
              {formatINR(revenue)}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-stone-100 mb-1 tracking-tight">
          Month-wise
        </h2>
        <p className="text-stone-400 text-sm mb-4">
          Entries and revenue by month.
        </p>
        <DashboardCharts data={chartData} formatINR={formatINR} />
      </section>

      <section>
        <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-stone-100 mb-1 tracking-tight">
          Trainer-wise reports
        </h2>
        <p className="text-stone-400 text-sm mb-4">
          Trainers and clients. Click a card to see client details.
        </p>
        {reports.length === 0 ? (
          <div className="liquid-glass p-6 sm:p-8 rounded-2xl text-center">
            <p className="text-stone-500 text-sm">
              No tracker entries yet. Add entries in Tracker to see trainer-wise
              reports.
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
                <ul className="text-stone-300 text-sm space-y-1 max-h-40 overflow-y-auto pr-1">
                  {report.entries
                    .map((e) => e.client_name ?? e.client_id ?? "—")
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
          onClose={() => setSelectedTrainer(null)}
          formatINR={formatINR}
          formatDate={formatDate}
        />
      )}

    </div>
  );
}

function ClientDetailsModal({
  trainerName,
  entries,
  onClose,
  formatINR,
  formatDate,
}: {
  trainerName: string;
  entries: Tracker[];
  onClose: () => void;
  formatINR: (n: number) => string;
  formatDate: (s: string | null) => string;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
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
        <div className="overflow-auto flex-1 p-4 sm:p-5">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-2 px-2 text-stone-400 font-medium">
                  Client name
                </th>
                <th className="text-left py-2 px-2 text-stone-400 font-medium">
                  Client ID
                </th>
                <th className="text-left py-2 px-2 text-stone-400 font-medium">
                  Plan
                </th>
                <th className="text-left py-2 px-2 text-stone-400 font-medium">
                  Frequency
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
                  Due (₹)
                </th>
                <th className="text-left py-2 px-2 text-stone-400 font-medium">
                  Mobile
                </th>
                <th className="text-left py-2 px-2 text-stone-400 font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="py-2 px-2 text-stone-200">
                    {row.client_name ?? "—"}
                  </td>
                  <td className="py-2 px-2 text-stone-300">
                    {row.client_id ?? "—"}
                  </td>
                  <td className="py-2 px-2 text-stone-300">{row.plan ?? "—"}</td>
                  <td className="py-2 px-2 text-stone-300">
                    {row.frequency ?? "—"}
                  </td>
                  <td className="py-2 px-2 text-stone-300">
                    {formatDate(row.start_date)}
                  </td>
                  <td className="py-2 px-2 text-stone-300">
                    {formatDate(row.end_date)}
                  </td>
                  <td className="py-2 px-2 text-right text-stone-300">
                    {row.total_fee != null ? formatINR(row.total_fee) : "—"}
                  </td>
                  <td className="py-2 px-2 text-right text-stone-300">
                    {row.paid_fee != null ? formatINR(row.paid_fee) : "—"}
                  </td>
                  <td className="py-2 px-2 text-right text-stone-300">
                    {row.due_fee != null ? formatINR(row.due_fee) : "—"}
                  </td>
                  <td className="py-2 px-2 text-stone-300">
                    {row.mobile ?? "—"}
                  </td>
                  <td className="py-2 px-2 text-stone-300">
                    {row.status ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

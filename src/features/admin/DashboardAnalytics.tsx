"use client";

import { useState } from "react";

/** Format number as Indian Rupees (e.g. ₹1,47,800) */
function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);
}

/** Andhra Pradesh–authentic dummy analytics (Vijayawada/Guntur–style gym, INR) */
const DUMMY_ANALYTICS = {
  newEntriesThisMonth: 24,
  revenueThisMonth: 147800,
  label: "Sample data (Vijayawada centre, Andhra Pradesh)",
};

type Props = {
  realNewEntriesThisMonth: number;
  realRevenueThisMonth: number;
};

export function DashboardAnalytics({
  realNewEntriesThisMonth,
  realRevenueThisMonth,
}: Props) {
  const [useDummy, setUseDummy] = useState(false);

  const newEntries = useDummy
    ? DUMMY_ANALYTICS.newEntriesThisMonth
    : realNewEntriesThisMonth;
  const revenue = useDummy
    ? DUMMY_ANALYTICS.revenueThisMonth
    : realRevenueThisMonth;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-stone-100 mb-1 tracking-tight">
            This month
          </h2>
          <p className="text-stone-400 text-sm">
            New tracker entries and revenue collected (from tracker).
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-stone-400 text-sm font-medium">
            Use sample data
          </span>
          <input
            type="checkbox"
            checked={useDummy}
            onChange={(e) => setUseDummy(e.target.checked)}
            className="h-4 w-4 rounded border-stone-500 bg-stone-800 text-brand-red focus:ring-brand-red focus:ring-offset-0"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="liquid-glass p-5 sm:p-6 rounded-2xl border border-white/10">
          <p className="text-stone-400 text-sm font-medium mb-1">
            New entries this month
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-stone-100">
            {newEntries}
          </p>
          {useDummy && (
            <p className="text-stone-500 text-xs mt-1">
              {DUMMY_ANALYTICS.label}
            </p>
          )}
        </div>
        <div className="liquid-glass p-5 sm:p-6 rounded-2xl border border-white/10">
          <p className="text-stone-400 text-sm font-medium mb-1">
            Revenue collected (INR)
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-stone-100">
            {formatINR(revenue)}
          </p>
          {useDummy && (
            <p className="text-stone-500 text-xs mt-1">
              {DUMMY_ANALYTICS.label}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

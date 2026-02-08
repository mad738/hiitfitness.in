"use client";

/** Format number as Indian Rupees (e.g. ₹1,47,800) */
function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);
}

type Props = {
  realNewEntriesThisMonth: number;
  realRevenueThisMonth: number;
};

export function DashboardAnalytics({
  realNewEntriesThisMonth,
  realRevenueThisMonth,
}: Props) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-stone-100 mb-1 tracking-tight">
          This month
        </h2>
        <p className="text-stone-400 text-sm">
          New tracker entries and revenue collected (from tracker).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="liquid-glass p-5 sm:p-6 rounded-2xl border border-white/10">
          <p className="text-stone-400 text-sm font-medium mb-1">
            New entries this month
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-stone-100">
            {realNewEntriesThisMonth}
          </p>
        </div>
        <div className="liquid-glass p-5 sm:p-6 rounded-2xl border border-white/10">
          <p className="text-stone-400 text-sm font-medium mb-1">
            Revenue collected (INR)
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-stone-100">
            {formatINR(realRevenueThisMonth)}
          </p>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useDemoMode } from "./AdminDemoContext";
import { DUMMY_PLANS } from "@/data/dummy-admin-data";

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);
}

export function PlansView() {
  const useDemo = useDemoMode();

  if (!useDemo) {
    return (
      <div className="liquid-glass p-6 sm:p-8 rounded-2xl text-center text-stone-500 text-sm">
        No plans yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="liquid-glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              <th className="py-3 px-4 text-stone-400 font-medium">Name</th>
              <th className="py-3 px-4 text-stone-400 font-medium">Description</th>
              <th className="py-3 px-4 text-stone-400 font-medium">Price (monthly)</th>
              <th className="py-3 px-4 text-stone-400 font-medium">Duration</th>
              <th className="py-3 px-4 text-stone-400 font-medium">Active</th>
            </tr>
          </thead>
          <tbody>
            {DUMMY_PLANS.map((p) => (
              <tr
                key={p.id}
                className="border-b border-white/5 hover:bg-white/[0.04]"
              >
                <td className="py-2.5 px-4 text-stone-100 font-medium">
                  {p.name}
                </td>
                <td className="py-2.5 px-4 text-stone-300 max-w-xs truncate">
                  {p.description}
                </td>
                <td className="py-2.5 px-4 text-stone-300">
                  {formatINR(p.price_monthly)}
                </td>
                <td className="py-2.5 px-4 text-stone-300">
                  {p.duration_days} days
                </td>
                <td className="py-2.5 px-4 text-stone-300">
                  {p.is_active ? "Yes" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

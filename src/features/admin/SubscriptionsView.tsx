"use client";

import { useDemoMode } from "./AdminDemoContext";
import { DUMMY_SUBSCRIPTIONS } from "@/data/dummy-admin-data";

export function SubscriptionsView() {
  const useDemo = useDemoMode();

  if (!useDemo) {
    return (
      <div className="liquid-glass p-6 sm:p-8 rounded-2xl text-center text-stone-500 text-sm">
        No subscriptions yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="liquid-glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              <th className="py-3 px-4 text-stone-400 font-medium">Customer</th>
              <th className="py-3 px-4 text-stone-400 font-medium">Plan</th>
              <th className="py-3 px-4 text-stone-400 font-medium">Start</th>
              <th className="py-3 px-4 text-stone-400 font-medium">End</th>
              <th className="py-3 px-4 text-stone-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {DUMMY_SUBSCRIPTIONS.map((s) => (
              <tr
                key={s.id}
                className="border-b border-white/5 hover:bg-white/[0.04]"
              >
                <td className="py-2.5 px-4 text-stone-100 font-medium">
                  {s.customer_name}
                </td>
                <td className="py-2.5 px-4 text-stone-300">{s.plan_name}</td>
                <td className="py-2.5 px-4 text-stone-300">
                  {new Date(s.start_date).toLocaleDateString("en-IN")}
                </td>
                <td className="py-2.5 px-4 text-stone-300">
                  {new Date(s.end_date).toLocaleDateString("en-IN")}
                </td>
                <td className="py-2.5 px-4 text-stone-300 capitalize">
                  {s.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

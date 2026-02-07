"use client";

import { useDemoMode } from "./AdminDemoContext";
import { DUMMY_CUSTOMERS } from "@/data/dummy-admin-data";

export function CustomersView() {
  const useDemo = useDemoMode();

  if (!useDemo) {
    return (
      <div className="liquid-glass p-6 sm:p-8 rounded-2xl text-center text-stone-500 text-sm">
        No customers yet.
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
              <th className="py-3 px-4 text-stone-400 font-medium">Email</th>
              <th className="py-3 px-4 text-stone-400 font-medium">Phone</th>
              <th className="py-3 px-4 text-stone-400 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {DUMMY_CUSTOMERS.map((c) => (
              <tr
                key={c.id}
                className="border-b border-white/5 hover:bg-white/[0.04]"
              >
                <td className="py-2.5 px-4 text-stone-100 font-medium">
                  {c.full_name}
                </td>
                <td className="py-2.5 px-4 text-stone-300">{c.email}</td>
                <td className="py-2.5 px-4 text-stone-300">{c.phone ?? "—"}</td>
                <td className="py-2.5 px-4 text-stone-500 text-xs">
                  {new Date(c.created_at).toLocaleDateString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

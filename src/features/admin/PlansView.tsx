"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MembershipPlan } from "@/models/membership_plan";
import { useDemoMode } from "./AdminDemoContext";
import { DUMMY_PLANS } from "@/data/dummy-admin-data";
import { createPlan, updatePlan } from "@app/actions/plans";

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);
}

const inputClass =
  "w-full px-3 py-2.5 rounded-xl bg-stone-900/80 border border-white/10 text-stone-100 placeholder:text-stone-500 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none text-sm";
const labelClass = "block text-sm text-stone-400 mb-1.5";

type PlansViewProps = { plans: MembershipPlan[] };

export function PlansView(props: PlansViewProps) {
  const { plans: initialPlans } = props;
  const router = useRouter();
  const useDemo = useDemoMode();
  const displayPlans = useDemo ? DUMMY_PLANS : initialPlans;

  const [editing, setEditing] = useState<MembershipPlan | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formPlan = editing ?? null;
  const isAdd = showAddForm && !editing;

  const openAdd = () => {
    setEditing(null);
    setShowAddForm(true);
    setError(null);
  };
  const openEdit = (p: MembershipPlan) => {
    setEditing(p);
    setShowAddForm(false);
    setError(null);
  };
  const closeForm = () => {
    setEditing(null);
    setShowAddForm(false);
    setError(null);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const description = (form.elements.namedItem("description") as HTMLInputElement).value.trim() || null;
    const price_monthly = Number((form.elements.namedItem("price_monthly") as HTMLInputElement).value);
    const duration_days = Number((form.elements.namedItem("duration_days") as HTMLInputElement).value);
    const total_feeRaw = (form.elements.namedItem("total_fee") as HTMLInputElement).value;
    const total_fee = total_feeRaw ? Number(total_feeRaw) : null;
    const is_active = (form.elements.namedItem("is_active") as HTMLInputElement).checked;

    if (isAdd) {
      const res = await createPlan({ name, description, price_monthly, duration_days, total_fee, is_active });
      setLoading(false);
      if (res.ok) {
        closeForm();
        router.refresh();
      } else {
        setError(res.error);
      }
    } else if (formPlan) {
      const res = await updatePlan(formPlan.id, { name, description, price_monthly, duration_days, total_fee, is_active });
      setLoading(false);
      if (res.ok) {
        closeForm();
        router.refresh();
      } else {
        setError(res.error);
      }
    }
  }

  if (useDemo) {
    return (
      <div className="space-y-6">
        <div className="liquid-glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="py-3 px-4 text-stone-400 font-medium">Name</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Description</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Price (monthly)</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Total fee</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Duration</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Active</th>
              </tr>
            </thead>
            <tbody>
              {DUMMY_PLANS.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.04]">
                  <td className="py-2.5 px-4 text-stone-100 font-medium">{p.name}</td>
                  <td className="py-2.5 px-4 text-stone-300 max-w-xs truncate">{p.description ?? "—"}</td>
                  <td className="py-2.5 px-4 text-stone-300">{formatINR(p.price_monthly)}</td>
                  <td className="py-2.5 px-4 text-stone-300">{"total_fee" in p && p.total_fee != null ? formatINR(p.total_fee) : "—"}</td>
                  <td className="py-2.5 px-4 text-stone-300">{p.duration_days} days</td>
                  <td className="py-2.5 px-4 text-stone-300">{p.is_active ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={openAdd}
          className="px-4 py-2.5 rounded-xl bg-brand-red hover:bg-red-600 text-white font-semibold text-sm transition"
        >
          Add plan
        </button>
      </div>

      {(isAdd || formPlan) && (
        <div className="liquid-glass p-6 rounded-2xl border border-white/10">
          <h2 className="text-lg font-semibold text-stone-100 mb-4">{formPlan ? "Edit plan" : "New plan"}</h2>
          {error && (
            <p className="text-red-400 text-sm mb-4 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="plan-name">Name</label>
              <input
                id="plan-name"
                name="name"
                type="text"
                required
                defaultValue={formPlan?.name}
                className={inputClass}
                placeholder="e.g. General 1 Month"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="plan-desc">Description (optional)</label>
              <input
                id="plan-desc"
                name="description"
                type="text"
                defaultValue={formPlan?.description ?? ""}
                className={inputClass}
                placeholder="e.g. ₹4,000 total · 1 month"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="plan-price">Price (monthly) ₹</label>
                <input
                  id="plan-price"
                  name="price_monthly"
                  type="number"
                  required
                  min={0}
                  defaultValue={formPlan?.price_monthly}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="plan-duration">Duration (days)</label>
                <input
                  id="plan-duration"
                  name="duration_days"
                  type="number"
                  required
                  min={1}
                  defaultValue={formPlan?.duration_days}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="plan-total">Total fee ₹ (optional, for display)</label>
              <input
                id="plan-total"
                name="total_fee"
                type="number"
                min={0}
                defaultValue={formPlan?.total_fee ?? ""}
                className={inputClass}
                placeholder="e.g. 4000"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="plan-active"
                name="is_active"
                type="checkbox"
                defaultChecked={formPlan?.is_active ?? true}
                className="h-4 w-4 rounded border-stone-500 bg-stone-800 text-brand-red focus:ring-brand-red"
              />
              <label className="text-sm text-stone-400" htmlFor="plan-active">Active (show on landing)</label>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-brand-red hover:bg-red-600 text-white font-semibold text-sm transition disabled:opacity-50"
              >
                {loading ? "Saving…" : formPlan ? "Update plan" : "Add plan"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2.5 rounded-xl border border-white/20 text-stone-400 hover:text-stone-100 hover:bg-white/5 text-sm font-medium transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {displayPlans.length === 0 && !isAdd && !formPlan ? (
        <div className="liquid-glass p-6 sm:p-8 rounded-2xl text-center text-stone-500 text-sm">
          No plans in membership_plans. Click &quot;Add plan&quot; to create one.
        </div>
      ) : (
        <div className="liquid-glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="py-3 px-4 text-stone-400 font-medium">Name</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Description</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Price (monthly)</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Total fee</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Duration</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Active</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayPlans.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.04]">
                  <td className="py-2.5 px-4 text-stone-100 font-medium">{p.name}</td>
                  <td className="py-2.5 px-4 text-stone-300 max-w-xs truncate">{p.description ?? "—"}</td>
                  <td className="py-2.5 px-4 text-stone-300">{formatINR(p.price_monthly)}</td>
                  <td className="py-2.5 px-4 text-stone-300">{p.total_fee != null ? formatINR(p.total_fee) : "—"}</td>
                  <td className="py-2.5 px-4 text-stone-300">{p.duration_days} days</td>
                  <td className="py-2.5 px-4 text-stone-300">{p.is_active ? "Yes" : "No"}</td>
                  <td className="py-2.5 px-4">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="text-brand-red hover:underline text-sm font-medium"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

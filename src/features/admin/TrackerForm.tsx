"use client";

import { useState, useEffect } from "react";
import { createTrackerEntry, updateTrackerEntry } from "@app/actions/tracker";
import type { Tracker, TrackerInsert } from "@/models/tracker";
import {
  TRACKER_PLAN_OPTIONS,
  TRACKER_FREQUENCY_OPTIONS,
  TRACKER_TRAINER_OPTIONS,
  TRACKER_PAYMENT_MODE_OPTIONS,
  TRACKER_PAID_TO_OPTIONS,
  TRACKER_PAID_FLAG_OPTIONS,
  TRACKER_STATUS_OPTIONS,
} from "@/config/tracker-options";
import { planToTrackerOption } from "@/data/plans";
import type { MembershipPlan } from "@/models/membership_plan";
import { AdminDatePicker } from "@/components/ui/admin-date-picker";

function toForm(row: Tracker): TrackerInsert {
  return {
    client_id: row.client_id ?? null,
    client_name: row.client_name ?? null,
    plan: row.plan ?? null,
    frequency: row.frequency ?? null,
    trainer_name: row.trainer_name ?? null,
    start_date: row.start_date ?? null,
    end_date: row.end_date ?? null,
    total_fee: row.total_fee ?? null,
    paid_fee: row.paid_fee ?? null,
    due_fee: row.due_fee ?? null,
    mobile: row.mobile ?? null,
    pay_date: row.pay_date ?? null,
    payment_mode: row.payment_mode ?? null,
    paid_to: row.paid_to ?? null,
    paid_flag: row.paid_flag ?? null,
    remarks: row.remarks ?? null,
    status: row.status ?? null,
  };
}

const emptyRow: TrackerInsert = {
  client_id: null,
  client_name: null,
  plan: null,
  frequency: null,
  trainer_name: null,
  start_date: null,
  end_date: null,
  total_fee: null,
  paid_fee: null,
  due_fee: null,
  mobile: null,
  pay_date: null,
  payment_mode: null,
  paid_to: null,
  paid_flag: null,
  remarks: null,
  status: null,
};

type Props = {
  /** Plans from Supabase membership_plans (for "Plan from fee structure" dropdown) */
  plans?: MembershipPlan[];
  onSuccess: () => void;
  editRow?: Tracker | null;
  onCancelEdit: () => void;
  /** When set, create is applied locally (no server call). Used for demo/sample data. */
  onCreateLocal?: (data: TrackerInsert) => void;
  /** When set, update is applied locally (no server call). Used for demo/sample data. */
  onUpdateLocal?: (id: string, data: TrackerInsert) => void;
};

export function TrackerForm({
  plans = [],
  onSuccess,
  editRow,
  onCancelEdit,
  onCreateLocal,
  onUpdateLocal,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TrackerInsert>(() =>
    editRow ? toForm(editRow) : { ...emptyRow }
  );

  useEffect(() => {
    setForm(editRow ? toForm(editRow) : { ...emptyRow });
  }, [editRow?.id]);

  const update = (k: keyof TrackerInsert, v: string | number | boolean | null) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (editRow) {
        if (onUpdateLocal) {
          onUpdateLocal(editRow.id, form);
        } else {
          await updateTrackerEntry(editRow.id, form);
        }
      } else {
        if (onCreateLocal) {
          onCreateLocal(form);
        } else {
          await createTrackerEntry(form);
        }
      }
      setForm({ ...emptyRow });
      onSuccess();
      onCancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-stone-800 border border-stone-600 text-stone-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none";
  const labelClass = "block text-sm text-stone-400 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="sm:col-span-2 lg:col-span-3">
          <label className={labelClass}>Plan (from fee structure)</label>
          <select
            value=""
            onChange={(e) => {
              const planId = e.target.value;
              if (!planId) return;
              const plan = plans.find((p) => p.id === planId);
              if (plan) {
                const { plan: cat, frequency, totalFee } = planToTrackerOption(plan);
                setForm((prev) => ({
                  ...prev,
                  plan: cat,
                  frequency,
                  total_fee: totalFee,
                }));
              }
            }}
            className={inputClass}
          >
            <option value="">— Select plan to auto-fill fee —</option>
            {plans.map((p) => {
              const { totalFee } = planToTrackerOption(p);
              return (
                <option key={p.id} value={p.id}>
                  {p.name} — ₹{totalFee.toLocaleString("en-IN")}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label className={labelClass}>Client Name</label>
          <input
            type="text"
            value={form.client_name ?? ""}
            onChange={(e) => update("client_name", e.target.value || null)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Plan</label>
          <select
            value={form.plan ?? ""}
            onChange={(e) =>
              update("plan", e.target.value ? e.target.value : null)
            }
            className={inputClass}
          >
            <option value="">— Select —</option>
            {TRACKER_PLAN_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Frequency</label>
          <select
            value={form.frequency ?? ""}
            onChange={(e) =>
              update("frequency", e.target.value ? e.target.value : null)
            }
            className={inputClass}
          >
            <option value="">— Select —</option>
            {TRACKER_FREQUENCY_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Trainer Name</label>
          <select
            value={form.trainer_name ?? ""}
            onChange={(e) =>
              update("trainer_name", e.target.value ? e.target.value : null)
            }
            className={inputClass}
          >
            <option value="">— Select —</option>
            {TRACKER_TRAINER_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Start Date</label>
          <AdminDatePicker
            value={form.start_date ?? ""}
            onChange={(v) => update("start_date", v || null)}
            className={inputClass}
            aria-label="Start date"
          />
        </div>
        <div>
          <label className={labelClass}>End Date</label>
          <AdminDatePicker
            value={form.end_date ?? ""}
            onChange={(v) => update("end_date", v || null)}
            className={inputClass}
            aria-label="End date"
          />
        </div>
        <div>
          <label className={labelClass}>Total Fee</label>
          <input
            type="number"
            value={form.total_fee ?? ""}
            onChange={(e) =>
              update(
                "total_fee",
                e.target.value ? Number(e.target.value) : null
              )
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Paid Fee</label>
          <input
            type="number"
            value={form.paid_fee ?? ""}
            onChange={(e) =>
              update("paid_fee", e.target.value ? Number(e.target.value) : null)
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Due Fee</label>
          <input
            type="number"
            value={form.due_fee ?? ""}
            onChange={(e) =>
              update("due_fee", e.target.value ? Number(e.target.value) : null)
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Mobile</label>
          <input
            type="text"
            value={form.mobile ?? ""}
            onChange={(e) => update("mobile", e.target.value || null)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Pay Date</label>
          <AdminDatePicker
            value={form.pay_date ?? ""}
            onChange={(v) => update("pay_date", v || null)}
            className={inputClass}
            aria-label="Pay date"
          />
        </div>
        <div>
          <label className={labelClass}>Payment Mode</label>
          <select
            value={form.payment_mode ?? ""}
            onChange={(e) =>
              update(
                "payment_mode",
                e.target.value ? e.target.value : null
              )
            }
            className={inputClass}
          >
            <option value="">— Select —</option>
            {TRACKER_PAYMENT_MODE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Paid to</label>
          <select
            value={form.paid_to ?? ""}
            onChange={(e) =>
              update("paid_to", e.target.value ? e.target.value : null)
            }
            className={inputClass}
          >
            <option value="">— Select —</option>
            {TRACKER_PAID_TO_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Paid</label>
          <select
            value={
              form.paid_flag === null
                ? ""
                : form.paid_flag
                  ? "true"
                  : "false"
            }
            onChange={(e) =>
              update(
                "paid_flag",
                e.target.value === ""
                  ? null
                  : e.target.value === "true"
                    ? true
                    : false
              )
            }
            className={inputClass}
          >
            <option value="">— Select —</option>
            {TRACKER_PAID_FLAG_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select
            value={form.status ?? ""}
            onChange={(e) =>
              update("status", e.target.value ? e.target.value : null)
            }
            className={inputClass}
          >
            <option value="">— Select —</option>
            {TRACKER_STATUS_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass}>Remarks</label>
        <textarea
          value={form.remarks ?? ""}
          onChange={(e) => update("remarks", e.target.value || null)}
          className={inputClass}
          rows={2}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-brand-red hover:opacity-90 text-white font-semibold disabled:opacity-50 transition"
        >
          {loading ? "Saving…" : editRow ? "Update" : "Add client"}
        </button>
        {editRow && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="px-4 py-2 rounded-xl border border-white/20 text-stone-300 hover:bg-white/5 font-medium transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

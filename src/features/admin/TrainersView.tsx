"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useHorizontalScrollTable } from "@/hooks/useHorizontalScrollTable";
import { useRouter } from "next/navigation";
import type { Trainer } from "@/models/trainer";
import type { Customer } from "@/models/customer";
import type { Payment } from "@/models/payment";
import { CustomerReportModal } from "@/features/admin/CustomerReportModal";
import { PlanPaymentsModal, type PaymentFormState } from "@/features/admin/PlanPaymentsModal";
import { TrainerReportModal } from "@/features/admin/TrainerReportModal";
import type { TrainerReport } from "@/features/admin/trainer-report-types";
import { buildTrainerReports, formatINR, formatDate } from "@/features/admin/DashboardContent";
import {
  createTrainer,
  updateTrainer,
  deleteTrainer,
} from "@app/actions/trainers";
import { listPlanPayments } from "@app/actions/payments";


type Props = { initialTrainers: Trainer[]; customers: Customer[] };

const inputClass =
  "w-full px-3 py-2.5 rounded-xl bg-stone-900/80 border border-white/10 text-stone-100 placeholder:text-stone-500 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none text-sm";
const labelClass = "block text-sm text-stone-400 mb-1.5";

export function TrainersView({ initialTrainers, customers }: Props) {
  const router = useRouter();
  const [trainers, setTrainers] = useState<Trainer[]>(initialTrainers);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [selectedTrainerReport, setSelectedTrainerReport] = useState<TrainerReport | null>(null);
  const [reportCustomer, setReportCustomer] = useState<Customer | null>(null);
  const [paymentsPlan, setPaymentsPlan] = useState<Customer | null>(null);
  const [planPayments, setPlanPayments] = useState<Payment[]>([]);
  const [paymentsModalOpen, setPaymentsModalOpen] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const { tableScrollRef, topScrollRef, headerRef } = useHorizontalScrollTable(
    [trainers.length],
    { wheelOnBody: true }
  );

  const trainerReports = useMemo(
    () => buildTrainerReports(customers, trainers),
    [customers, trainers]
  );
  const reportsByName = useMemo(() => new Map(trainerReports.map((report) => [report.name, report])), [trainerReports]);

  const trainerStats = useMemo(() => {
    const stats = new Map<string, { activeClients: number; totalCommission: number; outstanding: number }>();
    trainerReports.forEach((report) => {
      const outstanding = report.plans.reduce((sum, entry) => sum + Number(entry.plan.balance ?? 0), 0);
      stats.set(report.name, {
        activeClients: report.plans.length,
        totalCommission: report.totalCommission,
        outstanding,
      });
    });
    return stats;
  }, [trainerReports]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!selectedTrainerReport && !reportCustomer) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selectedTrainerReport, reportCustomer]);

  const openTrainerReport = useCallback(
    (trainer: Trainer) => {
      const report = reportsByName.get(trainer.name);
      setSelectedTrainerReport(
        report ?? {
          name: trainer.name,
          plans: [],
          totalCommission: 0,
        }
      );
    },
    [reportsByName]
  );

  const refreshPlanPayments = useCallback(async (planId: string) => {
    const data = await listPlanPayments(planId);
    setPlanPayments(data);
  }, []);

  const openPlanPaymentsPanel = useCallback(
    async (plan: Customer) => {
      setPaymentsPlan(plan);
      setPlanPayments([]);
      setPaymentsError(null);
      setPaymentsModalOpen(true);
      setPaymentsLoading(true);
      try {
        await refreshPlanPayments(plan.id);
      } catch (err) {
        setPaymentsError((err as Error)?.message ?? "Failed to load payments.");
      } finally {
        setPaymentsLoading(false);
      }
    },
    [refreshPlanPayments]
  );

  const closePaymentsModal = useCallback(() => {
    setPaymentsModalOpen(false);
    setPaymentsPlan(null);
    setPlanPayments([]);
    setPaymentsError(null);
    setPaymentsLoading(false);
  }, []);

  const handleReadOnlyPaymentSubmit = useCallback(async (form: PaymentFormState) => {
    void form;
    return {
      ok: false as const,
      error: "Payments can only be managed from the Customers screen.",
    };
  }, []);

  const handleReadOnlyDelete = useCallback((payment: Payment) => {
    void payment;
  }, []);

  function openAdd() {
    setEditing(null);
    setName("");
    setImage(null);
    setPhoneNumber("");
    setAddress("");
    setFormOpen(true);
    setError(null);
  }

  function openEdit(t: Trainer) {
    setEditing(t);
    setName(t.name);
    setImage(t.image);
    setPhoneNumber(t.phone_number ?? "");
    setAddress(t.address ?? "");
    setFormOpen(true);
    setError(null);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setError(null);
  }



  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }
    setLoading(true);
    try {
      if (editing) {
        const res = await updateTrainer(editing.id, {
          name: trimmedName,
          image: image,
          phone_number: phoneNumber.trim() || null,
          address: address.trim() || null,
        });
        if (res.ok) {
          setTrainers((prev) =>
            prev.map((t) =>
              t.id === editing.id
                ? {
                  ...t,
                  name: trimmedName,
                  image: image ?? t.image,
                  phone_number: phoneNumber.trim() || null,
                  address: address.trim() || null,
                  updated_at: new Date().toISOString(),
                }
                : t
            )
          );
          closeForm();
          router.refresh();
        } else {
          setError(res.error);
        }
      } else {
        const res = await createTrainer({
          name: trimmedName,
          image: image ?? null,
          phone_number: phoneNumber.trim() || null,
          address: address.trim() || null,
        });
        if (res.ok) {
          router.refresh();
          closeForm();
        } else {
          setError(res.error);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(t: Trainer) {
    if (!confirm(`Remove trainer "${t.name}"?`)) return;
    setLoading(true);
    const res = await deleteTrainer(t.id);
    setLoading(false);
    if (res.ok) {
      setTrainers((prev) => prev.filter((x) => x.id !== t.id));
      if (editing?.id === t.id) closeForm();
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openAdd}
          className="px-4 py-2 rounded-xl bg-brand-red hover:opacity-90 text-white font-semibold text-sm transition"
        >
          Add trainer
        </button>
      </div>

      {formOpen && (
        <div className="liquid-glass p-6 rounded-2xl border border-white/10">
          <h2 className="text-lg font-semibold text-stone-100 mb-4">
            {editing ? "Edit trainer" : "New trainer"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-brand-red text-sm bg-brand-red/10 px-3 py-2 rounded">
                {error}
              </p>
            )}
            <div>
              <label className={labelClass}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Phone number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={inputClass}
                placeholder="e.g. 9996667714"
              />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClass + " min-h-[80px]"}
                placeholder="Full address"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-brand-red hover:opacity-90 text-white font-semibold text-sm disabled:opacity-50"
              >
                {loading ? "Saving…" : editing ? "Update" : "Add"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2.5 rounded-xl border border-white/20 text-stone-400 hover:bg-white/5 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="liquid-glass rounded-2xl overflow-hidden border border-white/10">
        {trainers.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-sm">
            No trainers yet. Add one to get started.
          </div>
        ) : (
          <div className="flex flex-col">
            <p className="px-4 pt-4 text-sm text-stone-400">
              Click any trainer row to open the PT commission report with payment drill-down.
            </p>
            <div
              ref={topScrollRef}
              className="overflow-x-auto overflow-y-hidden flex-shrink-0 scrollbar-horizontal-top border-b border-white/10 bg-stone-900/50 py-1.5 px-1"
              aria-hidden
            >
              <div className="min-w-[700px] h-2" />
            </div>
            <div
              ref={tableScrollRef}
              className="overflow-x-auto overflow-y-visible scrollbar-theme scrollbar-horizontal-bottom"
            >
              <table className="w-full text-sm text-left border-collapse min-w-[700px]">
                <thead ref={headerRef} className="select-none cursor-ew-resize">
                  <tr className="border-b border-white/10 bg-white/[0.04]">

                    <th className="py-3 px-4 text-stone-400 font-medium">Name</th>
                    <th className="py-3 px-4 text-stone-400 font-medium">Phone</th>
                    <th className="py-3 px-4 text-stone-400 font-medium">Address</th>
                    <th className="py-3 px-4 text-stone-400 font-medium text-center">Active clients</th>
                    <th className="py-3 px-4 text-stone-400 font-medium text-right">Commission (6-5)</th>
                    <th className="py-3 px-4 text-stone-400 font-medium text-right">Client dues</th>
                    <th className="py-3 px-4 text-stone-400 font-medium w-48 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trainers.map((t) => {
                    const stats = trainerStats.get(t.name);
                    const activeClients = stats?.activeClients ?? 0;
                    const commissionTotal = stats?.totalCommission ?? 0;
                    const outstandingDues = stats?.outstanding ?? 0;
                    return (
                      <tr
                        key={t.id}
                        className="border-b border-white/5 hover:bg-white/[0.04] cursor-pointer"
                        onClick={() => openTrainerReport(t)}
                      >
                        <td className="py-2.5 px-4 text-stone-100 font-medium">{t.name}</td>
                        <td className="py-2.5 px-4 text-stone-300">{t.phone_number ?? "—"}</td>
                        <td className="py-2.5 px-4 text-stone-300 max-w-[200px] truncate">
                          {t.address ?? "—"}
                        </td>
                        <td className="py-2.5 px-4 text-center text-stone-100 font-semibold">
                          {activeClients}
                        </td>
                        <td className="py-2.5 px-4 text-right text-emerald-200 font-semibold tabular-nums">
                          {formatINR(commissionTotal)}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums">
                          <span className={outstandingDues !== 0 ? "text-amber-300 font-semibold" : "text-stone-300"}>
                            {formatINR(outstandingDues)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(t)}
                              className="px-3 py-1 rounded-full text-xs font-semibold border border-white/10 text-stone-200 hover:border-brand-red/60 hover:text-white transition"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(t)}
                              className="px-3 py-1 rounded-full text-xs font-semibold border border-brand-red/40 text-brand-red hover:bg-brand-red/10 transition"
                            >
                              Delete
                            </button>
                          </div>
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
      {selectedTrainerReport && (
        <TrainerReportModal
          report={selectedTrainerReport}
          formatCurrency={formatINR}
          formatDate={formatDate}
          onClose={() => setSelectedTrainerReport(null)}
          onOpenPlanPayments={openPlanPaymentsPanel}
          onOpenCustomerReport={(customer) => {
            setSelectedTrainerReport(null);
            setReportCustomer(customer);
          }}
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
          onViewPayments={openPlanPaymentsPanel}
        />
      )}

      <PlanPaymentsModal
        plan={paymentsPlan}
        open={paymentsModalOpen}
        payments={planPayments}
        loading={paymentsLoading}
        saving={false}
        error={paymentsError}
        formatCurrency={formatINR}
        onClose={closePaymentsModal}
        onSubmit={handleReadOnlyPaymentSubmit}
        onDeleteRequest={handleReadOnlyDelete}
        allowManage={false}
      />
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Customer } from "@/models/customer";
import type { Trainer } from "@/models/trainer";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@app/actions/customers";
import { readFileAsBase64 } from "@/lib/image-utils";
import { PLAN_CATEGORIES } from "@/data/plans";
import { TRACKER_PAYMENT_MODE_OPTIONS } from "@/config/tracker-options";
import { AdminDatePicker } from "@/components/ui/admin-date-picker";

type Props = { initialCustomers: Customer[]; initialTrainers: Trainer[] };

const inputClass =
  "w-full px-3 py-2.5 rounded-xl bg-stone-900/80 border border-white/10 text-stone-100 placeholder:text-stone-500 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none text-sm";
const labelClass = "block text-sm text-stone-400 mb-1.5";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function getStringParam(
  params: URLSearchParams,
  key: string
): string {
  const v = params.get(key);
  return typeof v === "string" ? v : "";
}

export function CustomersView({ initialCustomers, initialTrainers }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [trainers, setTrainers] = useState<Trainer[]>(initialTrainers);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>("GT");
  const [totalFee, setTotalFee] = useState<number>(0);
  const [paidFee, setPaidFee] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [payDate, setPayDate] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [remarks, setRemarks] = useState("");
  const [duration, setDuration] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlan, setFilterPlan] = useState("");
  const [filterTrainerId, setFilterTrainerId] = useState("");
  const [filterPaymentMode, setFilterPaymentMode] = useState("");
  const [filterPaidStatus, setFilterPaidStatus] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [openActionRowId, setOpenActionRowId] = useState<string | null>(null);
  const [detailsCustomer, setDetailsCustomer] = useState<Customer | null>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setSearchQuery(getStringParam(searchParams, "q"));
    setFilterPlan(getStringParam(searchParams, "plan"));
    setFilterTrainerId(getStringParam(searchParams, "trainer"));
    setFilterPaymentMode(getStringParam(searchParams, "payment_mode"));
    setFilterPaidStatus(getStringParam(searchParams, "paid_status"));
  }, [searchParams]);

  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);
  useEffect(() => {
    setTrainers(initialTrainers);
  }, [initialTrainers]);

  useEffect(() => {
    setBalance(Number(totalFee) - Number(paidFee));
  }, [totalFee, paidFee]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateDropdownPosition = useCallback(() => {
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: Math.max(8, rect.right - 320),
      });
    }
  }, []);

  useEffect(() => {
    if (showFilterDropdown) updateDropdownPosition();
  }, [showFilterDropdown, updateDropdownPosition]);

  useEffect(() => {
    if (!showFilterDropdown) return;
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("resize", updateDropdownPosition);
    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [showFilterDropdown, updateDropdownPosition]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        showFilterDropdown &&
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(target) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(target)
      ) {
        setShowFilterDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilterDropdown]);

  const hasFilterParamsInUrl =
    searchParams.has("q") ||
    searchParams.has("plan") ||
    searchParams.has("trainer") ||
    searchParams.has("payment_mode") ||
    searchParams.has("paid_status");

  const hasFilters =
    !!filterPlan || !!filterTrainerId || !!filterPaymentMode || !!filterPaidStatus || searchQuery.trim() !== "";

  const searchLower = searchQuery.trim().toLowerCase();
  const filteredCustomers = hasFilterParamsInUrl
    ? customers.filter((c) => {
        if (filterPlan && c.plan !== filterPlan) return false;
        if (filterTrainerId && c.trainer_id !== filterTrainerId) return false;
        if (filterPaymentMode && (c.payment_mode ?? "") !== filterPaymentMode) return false;
        if (filterPaidStatus === "paid" && (c.balance ?? 0) !== 0) return false;
        if (filterPaidStatus === "not_paid" && (c.balance ?? 0) === 0) return false;
        if (searchLower) {
          const nameMatch = (c.name ?? "").toLowerCase().includes(searchLower);
          const trainer = c.trainer_id ? trainers.find((t) => t.id === c.trainer_id) : null;
          const trainerMatch = trainer?.name?.toLowerCase().includes(searchLower);
          if (!nameMatch && !trainerMatch) return false;
        }
        return true;
      })
    : customers;

  function buildFilterUrl(): string {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (filterPlan) params.set("plan", filterPlan);
    if (filterTrainerId) params.set("trainer", filterTrainerId);
    if (filterPaymentMode) params.set("payment_mode", filterPaymentMode);
    if (filterPaidStatus) params.set("paid_status", filterPaidStatus);
    const q = params.toString();
    return q ? `${pathname}?${q}` : pathname;
  }

  function applyFilters() {
    window.open(buildFilterUrl(), "_blank", "noopener,noreferrer");
    setShowFilterDropdown(false);
  }

  function clearFilters() {
    setSearchQuery("");
    setFilterPlan("");
    setFilterTrainerId("");
    setFilterPaymentMode("");
    setFilterPaidStatus("");
    setShowFilterDropdown(false);
    router.push(pathname);
  }

  function openAdd() {
    setEditing(null);
    setName("");
    setImage(null);
    setPlan("GT");
    setTotalFee(0);
    setPaidFee(0);
    setBalance(0);
    setTrainerId(null);
    setStartDate("");
    setEndDate("");
    setPayDate("");
    setPaymentMode("");
    setRemarks("");
    setDuration("");
    setFormOpen(true);
    setError(null);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setName(c.name);
    setImage(c.image);
    setPlan(c.plan);
    setTotalFee(c.total_fee);
    setPaidFee(c.paid_fee);
    setBalance(c.balance);
    setTrainerId(c.trainer_id);
    setStartDate(c.start_date ?? "");
    setEndDate(c.end_date ?? "");
    setPayDate(c.pay_date ?? "");
    setPaymentMode(c.payment_mode ?? "");
    setRemarks(c.remarks ?? "");
    setDuration(c.duration ?? "");
    setFormOpen(true);
    setError(null);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setError(null);
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const data = await readFileAsBase64(file);
    if (data) setImage(data);
  }

  function clearImage() {
    setImage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }
    const balanceVal = Number(totalFee) - Number(paidFee);
    setLoading(true);
    try {
      const payload = {
        name: trimmedName,
        image: image ?? null,
        plan,
        total_fee: Number(totalFee),
        paid_fee: Number(paidFee),
        balance: balanceVal,
        trainer_id: plan === "PT" ? trainerId : null,
        start_date: startDate.trim() || null,
        end_date: endDate.trim() || null,
        pay_date: payDate.trim() || null,
        payment_mode: paymentMode.trim() || null,
        remarks: remarks.trim() || null,
        duration: duration.trim() || null,
      };
      if (editing) {
        const res = await updateCustomer(editing.id, payload);
        if (res.ok) {
          setCustomers((prev) =>
            prev.map((c) =>
              c.id === editing.id ? { ...c, ...payload, updated_at: new Date().toISOString() } : c
            )
          );
          closeForm();
          router.refresh();
        } else {
          setError(res.error);
        }
      } else {
        const res = await createCustomer(payload);
        if (res.ok) {
          closeForm();
          router.refresh();
        } else {
          setError(res.error);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(c: Customer) {
    if (!confirm(`Remove customer "${c.name}"?`)) return;
    setLoading(true);
    const res = await deleteCustomer(c.id);
    setLoading(false);
    if (res.ok) {
      setCustomers((prev) => prev.filter((x) => x.id !== c.id));
      if (editing?.id === c.id) closeForm();
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  const trainerOptions = trainers;
  const searchInputClass =
    "w-full px-3 py-2.5 rounded-xl bg-stone-900/80 border border-white/10 text-stone-100 placeholder:text-stone-500 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none text-sm transition shadow-inner";
  const filterSelectClass =
    "w-full pl-3 pr-9 py-2.5 text-sm appearance-none cursor-pointer bg-stone-900/80 border border-white/10 rounded-xl text-stone-100 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none";

  return (
    <div className="space-y-6">
      {/* Search bar + filter - sticky so it stays visible when scrolling */}
      <div className="sticky top-0 z-10 rounded-2xl border border-white/10 bg-stone-900/95 backdrop-blur-sm shadow-inner">
        <div className="flex items-stretch gap-0">
          <div className="flex-1 min-w-0 flex items-center pl-1 pb-1 pt-1">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer or trainer name…"
              className={searchInputClass + " border-0 rounded-l-2xl rounded-r-none focus:ring-2 focus:ring-inset focus:ring-brand-red"}
              aria-label="Search by customer or trainer name"
            />
          </div>
          <div className="relative shrink-0" ref={filterDropdownRef}>
            <button
              ref={filterButtonRef}
              type="button"
              onClick={() => setShowFilterDropdown((s) => !s)}
              className={`flex items-center justify-center w-12 h-12 rounded-r-xl border-l border-white/10 transition ${
                showFilterDropdown
                  ? "bg-brand-red/25 text-brand-red border-brand-red/50"
                  : "bg-stone-800/60 text-stone-400 hover:text-stone-100 hover:bg-stone-800/80"
              }`}
              aria-expanded={showFilterDropdown}
              aria-label="Filter options"
            >
              {hasFilters && !showFilterDropdown && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-red ring-2 ring-stone-900" />
              )}
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </button>
            {mounted && typeof document !== "undefined" && showFilterDropdown &&
              createPortal(
                <div
                  ref={filterDropdownRef}
                  className="fixed z-[100] w-80 rounded-2xl border border-white/15 bg-stone-900/95 backdrop-blur-xl shadow-xl shadow-black/40 overflow-hidden"
                  style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                >
                  <div className="border-b border-white/10 bg-white/[0.04] px-4 py-3">
                    <p className="text-stone-300 text-xs font-semibold uppercase tracking-wider">
                      Filter options
                    </p>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-400 mb-1.5">Plan</label>
                      <select
                        value={filterPlan}
                        onChange={(e) => setFilterPlan(e.target.value)}
                        className={filterSelectClass}
                      >
                        <option value="">All plans</option>
                        {PLAN_CATEGORIES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-400 mb-1.5">Trainer</label>
                      <select
                        value={filterTrainerId}
                        onChange={(e) => setFilterTrainerId(e.target.value)}
                        className={filterSelectClass}
                      >
                        <option value="">All trainers</option>
                        {trainers.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-400 mb-1.5">Payment mode</label>
                      <select
                        value={filterPaymentMode}
                        onChange={(e) => setFilterPaymentMode(e.target.value)}
                        className={filterSelectClass}
                      >
                        <option value="">All</option>
                        {TRACKER_PAYMENT_MODE_OPTIONS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-400 mb-1.5">Paid status</label>
                      <select
                        value={filterPaidStatus}
                        onChange={(e) => setFilterPaidStatus(e.target.value)}
                        className={filterSelectClass}
                      >
                        <option value="">All</option>
                        <option value="paid">Paid (balance = 0)</option>
                        <option value="not_paid">Not paid (balance ≠ 0)</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={applyFilters}
                        className="px-4 py-2.5 rounded-xl bg-brand-red hover:bg-red-600 text-white font-semibold text-sm transition"
                      >
                        Apply (new tab)
                      </button>
                      {hasFilters && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="px-4 py-2.5 rounded-xl border border-white/20 text-stone-400 hover:text-stone-100 hover:bg-white/5 text-sm font-medium transition"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>,
                document.body
              )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={openAdd}
          className="px-4 py-2 rounded-xl bg-brand-red hover:opacity-90 text-white font-semibold text-sm transition"
        >
          Add customer
        </button>
        <p className="text-stone-500 text-sm">
          {hasFilterParamsInUrl
            ? `Showing ${filteredCustomers.length} of ${customers.length} customer${customers.length === 1 ? "" : "s"}`
            : `Showing ${customers.length} customer${customers.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {formOpen && (
        <div className="liquid-glass p-6 rounded-2xl border border-white/10">
          <h2 className="text-lg font-semibold text-stone-100 mb-4">
            {editing ? "Edit customer" : "New customer"}
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
              <label className={labelClass}>Photo</label>
              <div className="flex items-center gap-4 flex-wrap">
                {image ? (
                  <>
                    <img
                      src={image}
                      alt="Preview"
                      className="w-20 h-20 rounded-xl object-cover border border-white/10"
                    />
                    <div className="flex gap-2">
                      <label className="cursor-pointer px-3 py-2 rounded-lg border border-white/20 text-stone-300 hover:bg-white/5 text-sm">
                        Change
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageChange}
                        />
                      </label>
                      <button type="button" onClick={clearImage} className="px-3 py-2 rounded-lg border border-white/20 text-stone-400 hover:bg-white/5 text-sm">
                        Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="cursor-pointer px-4 py-2.5 rounded-xl border border-dashed border-white/20 text-stone-400 hover:border-brand-red/50 hover:text-brand-red text-sm transition">
                    Upload image
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Plan</label>
                <select
                  value={plan}
                  onChange={(e) => {
                    setPlan(e.target.value);
                    if (e.target.value !== "PT") setTrainerId(null);
                  }}
                  className={inputClass}
                >
                  {PLAN_CATEGORIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              {plan === "PT" && (
                <div>
                  <label className={labelClass}>Trainer</label>
                  <select
                    value={trainerId ?? ""}
                    onChange={(e) => setTrainerId(e.target.value || null)}
                    className={inputClass}
                  >
                    <option value="">— Select —</option>
                    {trainerOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>Total fee (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={totalFee || ""}
                  onChange={(e) => setTotalFee(Number(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Paid fee (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={paidFee || ""}
                  onChange={(e) => setPaidFee(Number(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Balance (₹)</label>
                <input
                  type="number"
                  value={balance}
                  readOnly
                  className={inputClass + " bg-stone-900/50 text-stone-400"}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Start date</label>
                <AdminDatePicker
                  value={startDate}
                  onChange={setStartDate}
                  className={inputClass}
                  aria-label="Start date"
                />
              </div>
              <div>
                <label className={labelClass}>End date</label>
                <AdminDatePicker
                  value={endDate}
                  onChange={setEndDate}
                  className={inputClass}
                  aria-label="End date"
                />
              </div>
              <div>
                <label className={labelClass}>Pay date</label>
                <AdminDatePicker
                  value={payDate}
                  onChange={setPayDate}
                  className={inputClass}
                  aria-label="Pay date"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Payment mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className={inputClass}
              >
                <option value="">— Select —</option>
                {TRACKER_PAYMENT_MODE_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className={inputClass + " min-h-[80px] resize-y"}
                placeholder="Optional notes…"
                rows={3}
              />
            </div>
            <div>
              <label className={labelClass}>Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={inputClass}
                placeholder="e.g. 3M, 6M, 12M + 1M"
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

      {/* Customer details card modal */}
      {detailsCustomer && mounted && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setDetailsCustomer(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-details-title"
          >
            <div
              className="liquid-glass rounded-2xl border border-white/10 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 id="customer-details-title" className="text-lg font-bold text-stone-100">
                  Customer details
                </h2>
                <button
                  type="button"
                  onClick={() => setDetailsCustomer(null)}
                  className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-white/10"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-4">
                  <img
                    src={detailsCustomer.image ?? "/images/profile placeholder.jpg"}
                    alt=""
                    className="w-24 h-24 rounded-xl object-cover border border-white/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-stone-100">{detailsCustomer.name}</p>
                    <p className="text-stone-400 text-sm">Plan: {detailsCustomer.plan}</p>
                  </div>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-stone-500">Total fee</dt><dd className="text-stone-100 font-medium">{formatCurrency(detailsCustomer.total_fee)}</dd></div>
                  <div><dt className="text-stone-500">Paid fee</dt><dd className="text-stone-100 font-medium">{formatCurrency(detailsCustomer.paid_fee)}</dd></div>
                  <div><dt className="text-stone-500">Balance</dt><dd className="text-stone-100 font-medium">{formatCurrency(detailsCustomer.balance)}</dd></div>
                  <div><dt className="text-stone-500">Trainer</dt><dd className="text-stone-100">{detailsCustomer.plan === "PT" && detailsCustomer.trainer_id ? (trainers.find((t) => t.id === detailsCustomer.trainer_id)?.name ?? "—") : "Not applicable"}</dd></div>
                  <div><dt className="text-stone-500">Start date</dt><dd className="text-stone-100">{detailsCustomer.start_date ?? "—"}</dd></div>
                  <div><dt className="text-stone-500">End date</dt><dd className="text-stone-100">{detailsCustomer.end_date ?? "—"}</dd></div>
                  <div><dt className="text-stone-500">Pay date</dt><dd className="text-stone-100">{detailsCustomer.pay_date ?? "—"}</dd></div>
                  <div><dt className="text-stone-500">Payment mode</dt><dd className="text-stone-100">{detailsCustomer.payment_mode ?? "—"}</dd></div>
                  <div className="sm:col-span-2"><dt className="text-stone-500">Remarks</dt><dd className="text-stone-100">{detailsCustomer.remarks ?? "—"}</dd></div>
                  <div><dt className="text-stone-500">Duration</dt><dd className="text-stone-100">{detailsCustomer.duration ?? "—"}</dd></div>
                </dl>
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => { openEdit(detailsCustomer); setDetailsCustomer(null); }}
                    className="px-4 py-2.5 rounded-xl bg-brand-red hover:opacity-90 text-white font-semibold text-sm"
                  >
                    Edit customer data
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailsCustomer(null)}
                    className="px-4 py-2.5 rounded-xl border border-white/20 text-stone-400 hover:bg-white/5 text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      <div className="liquid-glass rounded-2xl overflow-hidden overflow-x-auto">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-sm">
            {customers.length === 0
              ? "No customers yet. Add one to get started."
              : "No customers match the current filters. Try changing search or filters."}
          </div>
        ) : (
          <table className="w-full text-sm text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="py-3 px-4 text-stone-400 font-medium w-14">Photo</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Name</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Plan</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Total</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Paid</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Balance</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Trainer</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Start</th>
                <th className="py-3 px-4 text-stone-400 font-medium">End</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Pay date</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Payment</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Remarks</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Duration</th>
                <th className="py-3 px-4 text-stone-400 font-medium w-28">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => {
                const trainer = c.trainer_id ? trainers.find((t) => t.id === c.trainer_id) : null;
                return (
                  <tr
                    key={c.id}
                    className="border-b border-white/5 hover:bg-white/[0.04] cursor-pointer"
                    onClick={() => setDetailsCustomer(c)}
                  >
                    <td className="py-2.5 px-4">
                      <img
                        src={c.image ?? "/images/profile placeholder.jpg"}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover border border-white/10"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-stone-100 font-medium">{c.name}</td>
                    <td className="py-2.5 px-4 text-stone-300">{c.plan}</td>
                    <td className="py-2.5 px-4 text-stone-300">{formatCurrency(c.total_fee)}</td>
                    <td className="py-2.5 px-4 text-stone-300">{formatCurrency(c.paid_fee)}</td>
                    <td className="py-2.5 px-4 text-stone-300">{formatCurrency(c.balance)}</td>
                    <td className="py-2.5 px-4 text-stone-400">{c.plan === "GT" ? "Not applicable" : (trainer?.name ?? "—")}</td>
                    <td className="py-2.5 px-4 text-stone-500 text-xs">{c.start_date ?? "—"}</td>
                    <td className="py-2.5 px-4 text-stone-500 text-xs">{c.end_date ?? "—"}</td>
                    <td className="py-2.5 px-4 text-stone-500 text-xs">{c.pay_date ?? "—"}</td>
                    <td className="py-2.5 px-4 text-stone-400 text-xs">{c.payment_mode ?? "—"}</td>
                    <td className="py-2.5 px-4 text-stone-500 text-xs max-w-[160px] truncate" title={c.remarks ?? undefined}>{c.remarks ?? "—"}</td>
                    <td className="py-2.5 px-4 text-stone-400 text-xs">{c.duration ?? "—"}</td>
                    <td className="py-2.5 px-4 relative" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenActionRowId(openActionRowId === c.id ? null : c.id)
                          }
                          className="p-2 rounded-lg border border-white/10 text-stone-400 hover:text-stone-100 hover:bg-white/5 transition"
                          aria-expanded={openActionRowId === c.id}
                          aria-haspopup="true"
                          aria-label="Actions"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                          </svg>
                        </button>
                        {openActionRowId === c.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              aria-hidden
                              onClick={() => setOpenActionRowId(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 z-20 min-w-[180px] py-1 rounded-xl border border-white/10 bg-stone-900/95 backdrop-blur-xl shadow-xl">
                              <button
                                type="button"
                                onClick={() => {
                                  openEdit(c);
                                  setOpenActionRowId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-stone-100 hover:bg-brand-red/20 hover:text-brand-red transition"
                              >
                                Edit customer data
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionRowId(null);
                                  handleDelete(c);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-stone-400 hover:bg-red-500/20 hover:text-red-400 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

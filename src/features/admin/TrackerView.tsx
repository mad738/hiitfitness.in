"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getTrackerList, deleteTrackerEntry } from "@app/actions/tracker";
import type { Tracker } from "@/models/tracker";
import type { TrackerFilters } from "@/repositories/tracker_repository";
import type { MembershipPlan } from "@/models/membership_plan";
import { TrackerForm } from "./TrackerForm";
import {
  TRACKER_PLAN_OPTIONS,
  TRACKER_TRAINER_OPTIONS,
} from "@/config/tracker-options";
import { useDemoMode } from "./AdminDemoContext";
import { DUMMY_TRACKER_LIST } from "@/data/dummy-admin-data";

type Props = {
  initialList: Tracker[];
  initialFilters?: TrackerFilters;
  initialPlans?: MembershipPlan[];
};

export function TrackerView({ initialList, initialFilters = {}, initialPlans = [] }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const useDemo = useDemoMode();
  const [list, setList] = useState<Tracker[]>(
    useDemo ? DUMMY_TRACKER_LIST : initialList
  );
  const [editing, setEditing] = useState<Tracker | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [plan, setPlan] = useState(initialFilters.plan ?? "");
  const [trainer, setTrainer] = useState(initialFilters.trainer ?? "");
  const [clientSearch, setClientSearch] = useState(
    initialFilters.clientSearch ?? ""
  );
  const [trainerSearch, setTrainerSearch] = useState(
    initialFilters.trainerSearch ?? ""
  );
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const prevUseDemoRef = useRef(useDemo);

  useEffect(() => {
    if (!useDemo) {
      setList(initialList);
      prevUseDemoRef.current = false;
    } else {
      if (!prevUseDemoRef.current) setList(DUMMY_TRACKER_LIST);
      prevUseDemoRef.current = true;
    }
    setEditing(null);
    setShowForm(false);
  }, [initialList, useDemo]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateDropdownPosition = useCallback(() => {
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      const dropdownWidth = 320;
      setDropdownPosition({
        top: rect.bottom + 8,
        left: Math.max(8, rect.right - dropdownWidth),
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

  function buildFilterUrl(): string {
    const params = new URLSearchParams();
    if (plan) params.set("plan", plan);
    if (trainer) params.set("trainer", trainer);
    if (clientSearch.trim()) params.set("client", clientSearch.trim());
    if (trainerSearch.trim()) params.set("trainer_q", trainerSearch.trim());
    const q = params.toString();
    return q ? `${pathname}?${q}` : pathname;
  }

  function applyFilters() {
    if (useDemo) {
      setShowFilterDropdown(false);
      return;
    }
    window.open(buildFilterUrl(), "_blank", "noopener,noreferrer");
  }

  function clearFilters() {
    setPlan("");
    setTrainer("");
    setClientSearch("");
    setTrainerSearch("");
    router.push(pathname);
  }

  const hasFilters =
    plan ||
    trainer ||
    clientSearch.trim() ||
    trainerSearch.trim();

  const searchLower = clientSearch.trim().toLowerCase();
  const trainerSearchLower = trainerSearch.trim().toLowerCase();

  const filteredList = useDemo
    ? list.filter((row) => {
        if (plan && row.plan !== plan) return false;
        if (trainer && row.trainer_name !== trainer) return false;
        if (searchLower) {
          const client = (row.client_name ?? row.client_id ?? "").toLowerCase();
          const train = (row.trainer_name ?? "").toLowerCase();
          if (!client.includes(searchLower) && !train.includes(searchLower))
            return false;
        }
        if (
          trainerSearchLower &&
          !(row.trainer_name ?? "").toLowerCase().includes(trainerSearchLower)
        )
          return false;
        return true;
      })
    : searchLower
      ? list.filter((row) => {
          const client = (row.client_name ?? row.client_id ?? "").toLowerCase();
          const train = (row.trainer_name ?? "").toLowerCase();
          return client.includes(searchLower) || train.includes(searchLower);
        })
      : list;

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    if (useDemo) {
      setList((prev) => prev.filter((r) => r.id !== id));
      if (editing?.id === id) setEditing(null);
      return;
    }
    await deleteTrackerEntry(id);
    refresh();
    if (editing?.id === id) setEditing(null);
  }

  const selectClass =
    "admin-select w-full pl-3 pr-9 py-2.5 text-sm appearance-none cursor-pointer bg-no-repeat bg-[length:1rem_1rem] bg-[right_0.75rem_center] transition shadow-inner";
  const selectBg =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a8a29e'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")";
  const inputClass =
    "w-full px-3 py-2.5 rounded-xl bg-stone-900/80 border border-white/10 text-stone-100 placeholder:text-stone-500 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none text-sm transition shadow-inner";

  return (
    <div className="space-y-8">
      {/* Search bar + filter icon (filter on right) - sticky so it stays visible when scrolling */}
      <div className="sticky top-0 z-10 rounded-2xl border border-white/10 bg-stone-900/95 backdrop-blur-sm shadow-inner">
        <div className="flex items-stretch gap-0">
          <div className="flex-1 min-w-0 flex items-center pl-1 pb-1 pt-1">
            <input
              type="search"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Search by client or trainer name…"
              className={inputClass + " w-full border-0 rounded-l-2xl rounded-r-none focus:ring-2 focus:ring-inset focus:ring-brand-red"}
              aria-label="Search by client or trainer name"
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
            {showFilterDropdown && mounted && typeof document !== "undefined" &&
              createPortal(
                <div
                  ref={filterDropdownRef}
                  className="fixed z-[100] w-80 rounded-2xl border border-white/15 bg-stone-900/95 backdrop-blur-xl shadow-xl shadow-black/40 overflow-hidden min-h-[200px]"
                  style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                >
                  <div className="border-b border-white/10 bg-white/[0.04] px-4 py-3">
                    <p className="text-stone-300 text-xs font-semibold uppercase tracking-wider">
                      Filter options
                    </p>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-400 mb-1.5">
                        Plan
                      </label>
                      <select
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        className={selectClass}
                        style={{ backgroundImage: selectBg }}
                      >
                        <option value="">All plans</option>
                        {TRACKER_PLAN_OPTIONS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-400 mb-1.5">
                        Trainer (exact)
                      </label>
                      <select
                        value={trainer}
                        onChange={(e) => setTrainer(e.target.value)}
                        className={selectClass}
                        style={{ backgroundImage: selectBg }}
                      >
                        <option value="">All trainers</option>
                        {TRACKER_TRAINER_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-400 mb-1.5">
                        Search trainer name
                      </label>
                      <input
                        type="text"
                        value={trainerSearch}
                        onChange={(e) => setTrainerSearch(e.target.value)}
                        placeholder="Type to search…"
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={applyFilters}
                        className="px-4 py-2.5 rounded-xl bg-brand-red hover:bg-red-600 text-white font-semibold text-sm transition shadow-md"
                      >
                        {useDemo ? "Apply" : "Apply (new tab)"}
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
          onClick={() => {
            setShowForm((s) => !s);
            setEditing(null);
          }}
          className="px-4 py-2 rounded-xl bg-brand-red hover:opacity-90 text-white font-semibold text-sm transition"
        >
          {showForm ? "Hide form" : "Add client"}
        </button>
        <p className="text-stone-500 text-sm">
          {(useDemo && hasFilters) || clientSearch.trim()
            ? `Showing ${filteredList.length} of ${list.length} entr${list.length === 1 ? "y" : "ies"}`
            : `Showing ${list.length} entr${list.length === 1 ? "y" : "ies"}`}
        </p>
      </div>

      {(showForm || editing) && (
        <div className="p-6 rounded-2xl liquid-glass">
          <h2 className="text-lg font-semibold text-stone-100 mb-4">
            {editing ? "Edit client" : "New client"}
          </h2>
          <TrackerForm
            plans={initialPlans}
            editRow={editing}
            onCancelEdit={() => {
              setEditing(null);
              setShowForm(false);
            }}
            onSuccess={useDemo ? () => {} : refresh}
            onCreateLocal={
              useDemo
                ? (data) => {
                    const now = new Date().toISOString();
                    const newRow: Tracker = {
                      ...data,
                      id: "demo-" + Date.now(),
                      created_at: now,
                      updated_at: now,
                    };
                    setList((prev) => [newRow, ...prev]);
                  }
                : undefined
            }
            onUpdateLocal={
              useDemo
                ? (id, data) => {
                    setList((prev) =>
                      prev.map((r) =>
                        r.id === id
                          ? {
                              ...r,
                              ...data,
                              id,
                              created_at: r.created_at,
                              updated_at: new Date().toISOString(),
                            }
                          : r
                      )
                    );
                  }
                : undefined
            }
          />
        </div>
      )}

      <div className="overflow-x-auto liquid-glass rounded-2xl overflow-hidden">
        {isPending && (
          <p className="text-stone-500 text-sm p-2">Updating…</p>
        )}
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              <th className="py-3 px-4 text-stone-400 font-medium">Client</th>
              <th className="py-3 px-4 text-stone-400 font-medium">Plan</th>
              <th className="py-3 px-4 text-stone-400 font-medium">Frequency</th>
              <th className="py-3 px-4 text-stone-400 font-medium">Trainer</th>
              <th className="py-3 px-4 text-stone-400 font-medium">Start</th>
              <th className="py-3 px-4 text-stone-400 font-medium">End</th>
              <th className="py-3 px-4 text-stone-400 font-medium">Total</th>
              <th className="py-3 px-4 text-stone-400 font-medium">Paid</th>
              <th className="py-3 px-4 text-stone-400 font-medium">Status</th>
              <th className="py-3 px-4 text-stone-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-stone-500 text-center">
                  {list.length === 0
                    ? "No entries match the current filters. Try changing filters or add a new entry."
                    : "No client or trainer name matches your search."}
                </td>
              </tr>
            ) : (
              filteredList.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-white/5 hover:bg-white/[0.04]"
                >
                  <td className="py-2.5 px-4 text-stone-200">
                    {row.client_name ?? row.client_id ?? "—"}
                  </td>
                  <td className="py-2.5 px-4 text-stone-300">{row.plan ?? "—"}</td>
                  <td className="py-2.5 px-4 text-stone-300">
                    {row.frequency ?? "—"}
                  </td>
                  <td className="py-2.5 px-4 text-stone-300">
                    {row.trainer_name ?? "—"}
                  </td>
                  <td className="py-2.5 px-4 text-stone-300">
                    {row.start_date ?? "—"}
                  </td>
                  <td className="py-2.5 px-4 text-stone-300">
                    {row.end_date ?? "—"}
                  </td>
                  <td className="py-2.5 px-4 text-stone-300">
                    {row.total_fee != null ? row.total_fee : "—"}
                  </td>
                  <td className="py-2.5 px-4 text-stone-300">
                    {row.paid_fee != null ? row.paid_fee : "—"}
                  </td>
                  <td className="py-2.5 px-4 text-stone-300">
                    {row.status ?? "—"}
                  </td>
                  <td className="py-2.5 px-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(row);
                        setShowForm(true);
                      }}
                      className="text-brand-red hover:underline font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id)}
                      className="text-stone-400 hover:text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

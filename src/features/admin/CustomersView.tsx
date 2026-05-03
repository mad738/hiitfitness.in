"use client";
/* eslint-disable -- admin images are base64/dynamic */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useHorizontalScrollTable } from "@/hooks/useHorizontalScrollTable";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { CustomerReportModal } from "./CustomerReportModal";
import { PlanPaymentsModal, type PaymentFormState } from "./PlanPaymentsModal";
import type { Customer } from "@/models/customer";
import type { Trainer } from "@/models/trainer";
import type { Payment } from "@/models/payment";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  deleteCustomerCascade,
  holdCustomerPlan,
  resumeCustomerPlan,
} from "@app/actions/customers";
import {
  listPlanPayments,
  createPlanPayment,
  updatePlanPayment,
  deletePlanPayment,
} from "@app/actions/payments";
import { readFileAsBase64 } from "@/lib/image-utils";
import {
  normalizeMobile,
  normalizeDateForStorage,
  isPlanCurrentlyRunning,
  formatDateForInput,
  ensureDdMmYyyyFormat,
  parseFlexibleDate,
} from "@/lib/customer-utils";
import { PLAN_CATEGORIES } from "@/data/plans";
import { TRACKER_PAYMENT_MODE_OPTIONS } from "@/config/tracker-options";
import { AdminDatePicker } from "@/components/ui/admin-date-picker";

type Props = { initialCustomers: Customer[]; initialTrainers: Trainer[] };

const inputClass =
  "w-full px-3 py-2.5 rounded-xl bg-stone-900/80 border border-white/10 text-stone-100 placeholder:text-stone-500 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none text-sm";
const labelClass = "block text-sm text-stone-400 mb-1.5";

function requireTextField(value: string | null | undefined, label: string): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    throw new Error(`${label} is required.`);
  }
  return trimmed;
}

function requirePositiveNumber(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be greater than 0.`);
  }
  return value;
}

function requireNonNegativeNumber(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} cannot be negative.`);
  }
  return value;
}

function requireDateValue(value: string, label: string): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    throw new Error(`${label} is required.`);
  }
  const formatted = ensureDdMmYyyyFormat(trimmed, label);
  return normalizeDateForStorage(formatted, label);
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayIsoDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function getStringParam(
  params: URLSearchParams | ReadonlyURLSearchParams | null,
  key: string
): string {
  if (!params) return "";
  const v = params.get(key);
  return typeof v === "string" ? v : "";
}

function dedupeById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

type PlanFormValues = {
  name: string;
  image: string | null;
  plan: string;
  totalFee: number;
  paidFee: number;
  trainerId: string | null;
  startDate: string;
  endDate: string;
  payDate: string;
  paymentMode: string;
  remarks: string;
  duration: string;
  status: string;
  slotTiming: string;
  mobile: string;
  paidTo: string;
  feedback: string;
  receipt: boolean;
};

const DEFAULT_PLAN_STATUS = "active";
const FILTER_DROPDOWN_WIDTH = 320;
const FILTER_DROPDOWN_MARGIN = 8;
const FILTER_DROPDOWN_VERTICAL_OFFSET = 8;
const FILTER_DROPDOWN_ESTIMATED_HEIGHT = 520;

function isPtPlan(planId: string | null | undefined): boolean {
  return (planId ?? "").trim().toUpperCase() === "PT";
}

function withDefaultStatus(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  return trimmed || DEFAULT_PLAN_STATUS;
}

type CustomerGroup = {
  key: string;
  primary: Customer;
  plans: Customer[];
};

type FriendOption = {
  id: string;
  name: string;
  mobile: string | null;
  label: string;
};

type FriendViewerState = {
  customer: Customer;
  friends: FriendOption[];
};

type DeletePrompt =
  | { level: "customer"; plan: Customer }
  | { level: "plan"; plan: Customer }
  | { level: "payment"; plan: Customer; payment: Payment };

type PlanHoldPrompt =
  | { mode: "hold"; plan: Customer }
  | { mode: "resume"; plan: Customer };

type CustomerMutationResult =
  | Awaited<ReturnType<typeof createCustomer>>
  | Awaited<ReturnType<typeof updateCustomer>>;

type CustomerMutationFailure = Extract<CustomerMutationResult, { ok: false }>;

type CustomerPlanConflict = {
  existingPlanId: string;
  customerId: string;
  planId: string;
  startDate: string;
  endDate: string;
};

type PlanConflictNotice = CustomerPlanConflict & { message: string };

function planSortValue(plan: Customer): number {
  const start = plan.start_date ? Date.parse(plan.start_date) : NaN;
  if (!Number.isNaN(start)) return start;
  return Date.parse(plan.created_at) || 0;
}

function getCustomerGroupKey(plan: Customer): string {
  return normalizeMobile(plan.mobile) || plan.customer_id || plan.id;
}

function isPlanActive(plan: Customer): boolean {
  if (plan.active_hold) return false;
  const status = (plan.status ?? "").toLowerCase();
  if (status === "active") return true;
  return isPlanCurrentlyRunning(plan.start_date, plan.end_date);
}

function getPlansHighlight(plans: Customer[]): Customer[] {
  const active = plans.filter(isPlanActive);
  if (active.length > 0) return active;
  const onHold = plans.filter((plan) => Boolean(plan.active_hold));
  if (onHold.length > 0) return onHold;
  return plans;
}

function findLatestActivePlan(plans: Customer[], planType: "GT" | "PT"): Customer | null {
  const normalizedType = planType.toUpperCase();
  const matching = plans
    .filter((plan) => (plan.plan ?? "").trim().toUpperCase() === normalizedType && isPlanActive(plan))
    .sort((a, b) => planSortValue(b) - planSortValue(a));
  return matching[0] ?? null;
}

function sanitizePlanDates(values: PlanFormValues, planLabel: string): PlanFormValues {
  return {
    ...values,
    startDate: requireDateValue(values.startDate, `${planLabel} start date`),
    endDate: requireDateValue(values.endDate, `${planLabel} end date`),
    payDate: requireDateValue(values.payDate, `${planLabel} payment date`),
  };
}

function hasPlanDetails(values: PlanFormValues): boolean {
  const trainerValue = (values.trainerId ?? "").trim();
  return (
    values.totalFee > 0 ||
    values.paidFee > 0 ||
    values.startDate.trim() !== "" ||
    values.endDate.trim() !== "" ||
    values.payDate.trim() !== "" ||
    values.paymentMode.trim() !== "" ||
    values.remarks.trim() !== "" ||
    values.duration.trim() !== "" ||
    values.slotTiming.trim() !== "" ||
    values.paidTo.trim() !== "" ||
    trainerValue !== "" ||
    values.feedback.trim() !== "" ||
    Boolean(values.image) ||
    values.receipt
  );
}

function formatPromptDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return value;
}

function formatMonthsLabel(months: number): string {
  if (!Number.isFinite(months)) return "";
  const safeMonths = Math.max(0.25, months);
  const rounded = Math.max(1, Math.floor(safeMonths));
  return `${rounded}M`;
}

function parseDurationToMonths(value: string | null | undefined): number | null {
  if (!value) return null;
  const raw = value.trim().toLowerCase();
  if (!raw) return null;
  const toNumber = parseFloat(raw);
  if (!Number.isNaN(toNumber)) {
    if (raw.includes("year")) return Math.max(1, toNumber * 12);
    if (raw.includes("month")) return Math.max(0.5, toNumber);
    if (raw.includes("week")) return Math.max(0.5, (toNumber * 7) / 30);
    if (raw.includes("day")) return Math.max(0.25, toNumber / 30);
    return Math.max(0.5, toNumber);
  }
  if (raw.includes("year")) {
    const num = parseFloat(raw.replace(/year(s)?/g, "").trim());
    return Number.isNaN(num) ? 12 : Math.max(1, num * 12);
  }
  if (raw.includes("month")) {
    const num = parseFloat(raw.replace(/month(s)?/g, "").trim());
    return Number.isNaN(num) ? 1 : Math.max(0.5, num);
  }
  if (raw.includes("week")) {
    const num = parseFloat(raw.replace(/week(s)?/g, "").trim());
    return Number.isNaN(num) ? 0.5 : Math.max(0.5, (num * 7) / 30);
  }
  if (raw.includes("day")) {
    const num = parseFloat(raw.replace(/day(s)?/g, "").trim());
    return Number.isNaN(num) ? 0.25 : Math.max(0.25, num / 30);
  }
  return null;
}

function monthsFromDateRange(start: string | null | undefined, end: string | null | undefined): number | null {
  if (!start || !end) return null;
  const startIso = parseFlexibleDate(start) ?? null;
  const endIso = parseFlexibleDate(end) ?? null;
  if (!startIso || !endIso) return null;

  const startMs = Date.parse(startIso);
  const endMs = Date.parse(endIso);
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return null;
  const days = (endMs - startMs) / (1000 * 60 * 60 * 24);
  return Math.max(0.25, Math.round((days / 30) * 10) / 10);
}

function getAutoDurationValue(start: string | null | undefined, end: string | null | undefined): string {
  const months = monthsFromDateRange(start, end);
  if (!months) return "";
  return formatMonthsLabel(months);
}

function getPrefilledDurationValue(plan: Customer | null): string {
  if (!plan) return "";
  const storedMonths = typeof plan.plan_months === "number" && plan.plan_months > 0 ? plan.plan_months : null;
  const parsedMonths = storedMonths ?? parseDurationToMonths(plan.duration) ?? monthsFromDateRange(plan.start_date, plan.end_date);
  if (!parsedMonths) return plan.duration ?? "";
  return formatMonthsLabel(parsedMonths);
}


export function CustomersView({ initialCustomers, initialTrainers }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>(() => dedupeById(initialCustomers));
  const [trainers, setTrainers] = useState<Trainer[]>(initialTrainers);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [editingLinkedId, setEditingLinkedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planConflictNotice, setPlanConflictNotice] = useState<PlanConflictNotice | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileCustomer, setProfileCustomer] = useState<Customer | null>(null);
  const [paymentsPlan, setPaymentsPlan] = useState<Customer | null>(null);
  const [planPayments, setPlanPayments] = useState<Payment[]>([]);
  const [paymentsModalOpen, setPaymentsModalOpen] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsSaving, setPaymentsSaving] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [deletePrompt, setDeletePrompt] = useState<DeletePrompt | null>(null);
  const [deleteInFlight, setDeleteInFlight] = useState(false);
  const [deletePromptError, setDeletePromptError] = useState<string | null>(null);
  const [planHoldPrompt, setPlanHoldPrompt] = useState<PlanHoldPrompt | null>(null);
  const [planHoldInFlight, setPlanHoldInFlight] = useState(false);
  const [planHoldError, setPlanHoldError] = useState<string | null>(null);

  // GT (left column)
  const [name, setName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [totalFee, setTotalFee] = useState<number>(0);
  const [paidFee, setPaidFee] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [, setTrainerId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [payDate, setPayDate] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [remarks, setRemarks] = useState("");
  const [duration, setDuration] = useState("");
  const [status, setStatus] = useState(DEFAULT_PLAN_STATUS);
  const [slotTiming, setSlotTiming] = useState("");
  const [mobile, setMobile] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [feedback, setFeedback] = useState("");
  const [receipt, setReceipt] = useState(false);
  // PT (right column) – same fields, individual per column when adding new entry
  const [, setNamePt] = useState("");
  const [imagePt, setImagePt] = useState<string | null>(null);
  const [totalFeePt, setTotalFeePt] = useState<number>(0);
  const [paidFeePt, setPaidFeePt] = useState<number>(0);
  const [balancePt, setBalancePt] = useState<number>(0);
  const [trainerIdPt, setTrainerIdPt] = useState<string | null>(null);
  const [startDatePt, setStartDatePt] = useState("");
  const [endDatePt, setEndDatePt] = useState("");
  const [payDatePt, setPayDatePt] = useState("");
  const [paymentModePt, setPaymentModePt] = useState("");
  const [remarksPt, setRemarksPt] = useState("");
  const [durationPt, setDurationPt] = useState("");
  const [statusPt, setStatusPt] = useState(DEFAULT_PLAN_STATUS);
  const [slotTimingPt, setSlotTimingPt] = useState("");
  const [, setMobilePt] = useState("");
  const [paidToPt, setPaidToPt] = useState("");
  const [feedbackPt, setFeedbackPt] = useState("");
  const [receiptPt, setReceiptPt] = useState(false);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [friendSearch, setFriendSearch] = useState("");
  const friendComboboxRef = useRef<HTMLDivElement>(null);
  const friendProfileComboboxRef = useRef<HTMLDivElement>(null);
  const friendInputRef = useRef<HTMLInputElement>(null);
  const [friendDropdownAnchor, setFriendDropdownAnchor] = useState<"main" | "profile" | null>(null);
  const friendDropdownOpen = friendDropdownAnchor !== null;
  const [friendViewer, setFriendViewer] = useState<FriendViewerState | null>(null);

  const [searchQuery, setSearchQuery] = useState(() => getStringParam(searchParams, "q"));
  const [filterPlan, setFilterPlan] = useState(() => getStringParam(searchParams, "plan"));
  const [filterTrainerId, setFilterTrainerId] = useState(() => getStringParam(searchParams, "trainer"));
  const [filterPaymentMode, setFilterPaymentMode] = useState(() => getStringParam(searchParams, "payment_mode"));
  const [filterPaidStatus, setFilterPaidStatus] = useState(() => getStringParam(searchParams, "paid_status"));
  const [filterCustomerActivity, setFilterCustomerActivity] = useState(() => getStringParam(searchParams, "customer_activity"));
  const [pendingFilterPlan, setPendingFilterPlan] = useState("");
  const [pendingFilterTrainerId, setPendingFilterTrainerId] = useState("");
  const [pendingFilterPaymentMode, setPendingFilterPaymentMode] = useState("");
  const [pendingFilterPaidStatus, setPendingFilterPaidStatus] = useState("");
  const [pendingFilterCustomerActivity, setPendingFilterCustomerActivity] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [detailsCustomer, setDetailsCustomer] = useState<Customer | null>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const formErrorRef = useRef<HTMLParagraphElement | null>(null);
  const profileErrorRef = useRef<HTMLParagraphElement | null>(null);
  const planConflictRef = useRef<HTMLDivElement | null>(null);
  useHorizontalScrollTable(
    [customers.length],
    { wheelOnBody: true }
  );
  useEffect(() => {
    if (!detailsCustomer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [detailsCustomer]);

  useEffect(() => {
    if (!error) return;
    const target = formOpen ? formErrorRef.current : (profileOpen ? profileErrorRef.current : null);
    if (!target) return;
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      if (typeof target.focus === "function") {
        target.focus({ preventScroll: true });
      }
    });
  }, [error, formOpen, profileOpen]);

  useEffect(() => {
    if (!planConflictNotice || !formOpen) return;
    const target = planConflictRef.current;
    if (!target) return;
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      if (typeof target.focus === "function") {
        target.focus({ preventScroll: true });
      }
    });
  }, [planConflictNotice, formOpen]);

  useEffect(() => {
    setSearchQuery(getStringParam(searchParams, "q"));
    setFilterPlan(getStringParam(searchParams, "plan"));
    setFilterTrainerId(getStringParam(searchParams, "trainer"));
    setFilterPaymentMode(getStringParam(searchParams, "payment_mode"));
    setFilterPaidStatus(getStringParam(searchParams, "paid_status"));
    setFilterCustomerActivity(getStringParam(searchParams, "customer_activity"));
  }, [searchParams]);

  // When filter dropdown opens, copy current URL params into pending so Apply only affects the new tab
  useEffect(() => {
    if (showFilterDropdown) {
      setPendingFilterPlan(filterPlan);
      setPendingFilterTrainerId(filterTrainerId);
      setPendingFilterPaymentMode(filterPaymentMode);
      setPendingFilterPaidStatus(filterPaidStatus);
      setPendingFilterCustomerActivity(filterCustomerActivity);
    }
  }, [showFilterDropdown, filterPlan, filterTrainerId, filterPaymentMode, filterPaidStatus, filterCustomerActivity]);

  useEffect(() => {
    setCustomers(dedupeById(initialCustomers));
  }, [initialCustomers]);
  useEffect(() => {
    setTrainers(initialTrainers);
  }, [initialTrainers]);

  useEffect(() => {
    setBalance(Number(totalFee) - Number(paidFee));
  }, [totalFee, paidFee]);
  useEffect(() => {
    setBalancePt(Number(totalFeePt) - Number(paidFeePt));
  }, [totalFeePt, paidFeePt]);

  useEffect(() => {
    setDuration(getAutoDurationValue(startDate, endDate));
  }, [startDate, endDate]);

  useEffect(() => {
    setDurationPt(getAutoDurationValue(startDatePt, endDatePt));
  }, [startDatePt, endDatePt]);

  useEffect(() => {
    setMounted(true);
  }, []);

  

  const updateDropdownPosition = useCallback(() => {
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const unclampedLeft = rect.right - FILTER_DROPDOWN_WIDTH;
      const left = Math.min(
        Math.max(FILTER_DROPDOWN_MARGIN, unclampedLeft),
        Math.max(FILTER_DROPDOWN_MARGIN, viewportWidth - FILTER_DROPDOWN_WIDTH - FILTER_DROPDOWN_MARGIN)
      );

      const belowTop = rect.bottom + FILTER_DROPDOWN_VERTICAL_OFFSET;
      const aboveTop = rect.top - FILTER_DROPDOWN_ESTIMATED_HEIGHT - FILTER_DROPDOWN_VERTICAL_OFFSET;
      const preferredTop =
        belowTop + FILTER_DROPDOWN_ESTIMATED_HEIGHT <= viewportHeight - FILTER_DROPDOWN_MARGIN
          ? belowTop
          : aboveTop;
      const top = Math.min(
        Math.max(FILTER_DROPDOWN_MARGIN, preferredTop),
        Math.max(FILTER_DROPDOWN_MARGIN, viewportHeight - FILTER_DROPDOWN_MARGIN - 48)
      );

      setDropdownPosition({
        top,
        left,
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

  useEffect(() => {
    function handleFriendClickOutside(e: MouseEvent) {
      if (!friendDropdownOpen) return;
      const target = e.target as Node;
      const containers = [friendComboboxRef.current, friendProfileComboboxRef.current];
      const clickedInside = containers.some((container) => container && container.contains(target));
      if (!clickedInside) {
        setFriendDropdownAnchor(null);
        setFriendSearch("");
      }
    }
    document.addEventListener("mousedown", handleFriendClickOutside);
    return () => document.removeEventListener("mousedown", handleFriendClickOutside);
  }, [friendDropdownOpen]);

  useEffect(() => {
    if (friendDropdownOpen && friendInputRef.current) {
      friendInputRef.current.focus();
    }
  }, [friendDropdownOpen]);

  const hasFilterParamsInUrl = Boolean(
    searchParams?.has("q") ||
    searchParams?.has("plan") ||
    searchParams?.has("trainer") ||
    searchParams?.has("payment_mode") ||
    searchParams?.has("paid_status") ||
    searchParams?.has("customer_activity")
  );

  const hasFilters =
    !!filterPlan || !!filterTrainerId || !!filterPaymentMode || !!filterPaidStatus || !!filterCustomerActivity || searchQuery.trim() !== "";

  const searchLower = searchQuery.trim().toLowerCase();
  const filteredCustomers = customers.filter((c) => {
    if (filterPlan && c.plan !== filterPlan) return false;
    if (filterTrainerId && c.trainer_id !== filterTrainerId) return false;
    if (filterPaymentMode && (c.payment_mode ?? "") !== filterPaymentMode) return false;
    if (filterPaidStatus === "paid" && (c.balance ?? 0) !== 0) return false;
    if (filterPaidStatus === "not_paid" && (c.balance ?? 0) === 0) return false;
    if (filterPaidStatus === "hold" && !c.active_hold) return false;
    if (searchLower) {
      const nameMatch = (c.name ?? "").toLowerCase().includes(searchLower);
      const mobileMatch = (c.mobile ?? "").toLowerCase().includes(searchLower);
      const trainer = c.trainer_id ? trainers.find((t) => t.id === c.trainer_id) : null;
      const trainerMatch = trainer?.name?.toLowerCase().includes(searchLower);
      if (!nameMatch && !mobileMatch && !trainerMatch) return false;
    }
    return true;
  });

  /** One row per unique mobile/person in the table (no double entries). */
  const customerGroups: CustomerGroup[] = useMemo(() => {
    const grouped = new Map<string, Customer[]>();
    filteredCustomers.forEach((planRow) => {
      const key = getCustomerGroupKey(planRow);
      const existing = grouped.get(key);
      if (existing) {
        existing.push(planRow);
      } else {
        grouped.set(key, [planRow]);
      }
    });
    return Array.from(grouped.entries()).map(([key, plans]) => {
      const sorted = plans.slice().sort((a, b) => planSortValue(b) - planSortValue(a));
      return { key, primary: sorted[0], plans: sorted } satisfies CustomerGroup;
    });
  }, [filteredCustomers]);

  const customerActivityByGroupKey = useMemo(() => {
    const map = new Map<string, boolean>();
    customers.forEach((plan) => {
      const key = getCustomerGroupKey(plan);
      if (!map.has(key)) {
        map.set(key, isPlanActive(plan));
        return;
      }
      if (!map.get(key) && isPlanActive(plan)) {
        map.set(key, true);
      }
    });
    return map;
  }, [customers]);

  const visibleCustomerGroups = useMemo(() => {
    if (!filterCustomerActivity) return customerGroups;
    if (filterCustomerActivity === "active") {
      return customerGroups.filter((group) => customerActivityByGroupKey.get(group.key) === true);
    }
    if (filterCustomerActivity === "inactive") {
      return customerGroups.filter((group) => customerActivityByGroupKey.get(group.key) !== true);
    }
    return customerGroups;
  }, [customerGroups, filterCustomerActivity, customerActivityByGroupKey]);

  const displayCustomers = visibleCustomerGroups.map((group) => group.primary);
  const currentProfileId = editing?.customer_id ?? null;

  const friendOptions = useMemo<FriendOption[]>(() => {
    const map = new Map<string, FriendOption>();
    customers.forEach((plan) => {
      const profileId = plan.customer_id;
      if (!profileId || map.has(profileId)) return;
      const nameValue = (plan.name ?? "").trim() || "Unnamed";
      const mobileValue = (plan.mobile ?? "").trim() || null;
      const label = mobileValue ? `${nameValue} • ${mobileValue}` : nameValue;
      map.set(profileId, { id: profileId, name: nameValue, mobile: mobileValue, label });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }, [customers]);

  const friendLookup = useMemo(() => new Map(friendOptions.map((option) => [option.id, option])), [friendOptions]);

  const friendSummaryByCustomerId = useMemo(() => {
    const map = new Map<string, FriendOption[]>();
    customers.forEach((plan) => {
      if (!plan.customer_id) return;
      const summaries = (plan.friend_ids ?? [])
        .map((id) => friendLookup.get(id))
        .filter((option): option is FriendOption => Boolean(option));
      map.set(plan.customer_id, summaries);
    });
    return map;
  }, [customers, friendLookup]);

  const selectedFriendOptions = friendIds.map((id) => {
    const option = friendLookup.get(id);
    if (option) return option;
    return { id, name: "Unknown member", mobile: null, label: id } satisfies FriendOption;
  });

  const normalizedFriendSearch = friendSearch.trim().toLowerCase();
  const filteredFriendOptions = friendOptions
    .filter((option) => option.id !== currentProfileId)
    .filter((option) => !friendIds.includes(option.id))
    .filter((option) => {
      if (!normalizedFriendSearch) return true;
      const mobile = option.mobile ?? "";
      return (
        option.name.toLowerCase().includes(normalizedFriendSearch) ||
        mobile.toLowerCase().includes(normalizedFriendSearch) ||
        option.label.toLowerCase().includes(normalizedFriendSearch)
      );
    })
    .slice(0, 8);

  function handleSelectFriendOption(optionId: string) {
    setFriendIds((prev) => (prev.includes(optionId) ? prev : [...prev, optionId]));
    setFriendSearch("");
    if (friendInputRef.current) {
      friendInputRef.current.focus();
    }
  }

  function handleRemoveFriend(optionId: string) {
    setFriendIds((prev) => prev.filter((id) => id !== optionId));
  }

  function toggleFriendDropdown(anchor: "main" | "profile") {
    setFriendDropdownAnchor((current) => {
      const nextAnchor = current === anchor ? null : anchor;
      setFriendSearch("");
      return nextAnchor;
    });
  }

  function normalizeFriendIdList(ids: string[]): string[] {
    return ids
      .map((id) => id.trim())
      .filter((id, index, arr) => id && arr.indexOf(id) === index);
  }

  function isCustomerPlanConflict(value: unknown): value is CustomerPlanConflict {
    if (!value || typeof value !== "object") return false;
    const candidate = value as Record<string, unknown>;
    return (
      typeof candidate.existingPlanId === "string" &&
      typeof candidate.customerId === "string" &&
      typeof candidate.planId === "string" &&
      typeof candidate.startDate === "string" &&
      typeof candidate.endDate === "string"
    );
  }

  function applyMutationFailure(result: CustomerMutationFailure, fallback: string) {
    const message = (result.error ?? "").trim() || fallback;
    if (isCustomerPlanConflict(result.conflict)) {
      setError(null);
      setPlanConflictNotice({ ...result.conflict, message });
      return;
    }
    setError(message);
    setPlanConflictNotice(null);
  }

  function openConflictPlanHistory(planId: string) {
    const existingPlan = customers.find((plan) => plan.id === planId);
    if (!existingPlan) {
      setError("The conflicting plan exists, but its history is not visible in the current view.");
      return;
    }
    setDetailsCustomer(existingPlan);
  }

  function buildFilterUrlForNewTab(): string {
    const params = new URLSearchParams();
    if (pendingFilterPlan) params.set("plan", pendingFilterPlan);
    if (pendingFilterTrainerId) params.set("trainer", pendingFilterTrainerId);
    if (pendingFilterPaymentMode) params.set("payment_mode", pendingFilterPaymentMode);
    if (pendingFilterPaidStatus) params.set("paid_status", pendingFilterPaidStatus);
    if (pendingFilterCustomerActivity) params.set("customer_activity", pendingFilterCustomerActivity);
    const q = params.toString();
    return q ? `${pathname}?${q}` : pathname;
  }

  function applyFilters() {
    window.open(buildFilterUrlForNewTab(), "_blank", "noopener,noreferrer");
    setShowFilterDropdown(false);
  }

  function clearFilters() {
    setSearchQuery("");
    setFilterPlan("");
    setFilterTrainerId("");
    setFilterPaymentMode("");
    setFilterPaidStatus("");
    setFilterCustomerActivity("");
    setShowFilterDropdown(false);
    router.push(pathname);
  }

  const refreshPlanPayments = useCallback(async (planId: string) => {
    const data = await listPlanPayments(planId);
    setPlanPayments(data);
  }, []);
  

  async function openPaymentsPanel(plan: Customer) {
    closeFormsForOtherActions();
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
  }

  function closePaymentsModal() {
    setPaymentsModalOpen(false);
    setPaymentsPlan(null);
    setPlanPayments([]);
    setPaymentsError(null);
    setPaymentsLoading(false);
    setPaymentsSaving(false);
  }

  async function handleSavePayment(form: PaymentFormState): Promise<{ ok: boolean; error?: string }> {
    if (!paymentsPlan) return { ok: false, error: "No plan selected." };
    try {
      setPaymentsSaving(true);
      setPaymentsError(null);
      const amount = Number(form.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Amount must be greater than 0.");
      }
      const paymentDateDisplay = ensureDdMmYyyyFormat(form.paymentDate, "Payment date");
      const isoDate = normalizeDateForStorage(paymentDateDisplay, "Payment date");
      const paymentModeValue = form.paymentMode.trim();
      if (!paymentModeValue) throw new Error("Payment mode is required.");
      const paidToValue = form.paidTo.trim();
      if (!paidToValue) throw new Error("Paid to is required.");
      const remarksValue = form.remarks.trim();
      const payload = {
        amount,
        payment_date: isoDate,
        payment_mode: paymentModeValue,
        paid_to: paidToValue,
        remarks: remarksValue || null,
        receipt_issued: form.receipt,
      };
      const result = form.paymentId
        ? await updatePlanPayment(form.paymentId, payload)
        : await createPlanPayment({ customer_plan_id: paymentsPlan.id, ...payload });
      if (!result.ok) throw new Error(result.error ?? "Failed to save payment.");
      await refreshPlanPayments(paymentsPlan.id);
      router.refresh();
      return { ok: true };
    } catch (err) {
      const message = (err as Error)?.message ?? "Failed to save payment.";
      setPaymentsError(message);
      return { ok: false, error: message };
    } finally {
      setPaymentsSaving(false);
    }
  }

  function clearGtPlanDetails() {
    setImage(null);
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
    setStatus(DEFAULT_PLAN_STATUS);
    setSlotTiming("");
    setPaidTo("");
    setFeedback("");
    setReceipt(false);
    setError(null);
    setPlanConflictNotice(null);
  }

  function clearPtPlanDetails() {
    setImagePt(null);
    setTotalFeePt(0);
    setPaidFeePt(0);
    setBalancePt(0);
    setTrainerIdPt(null);
    setStartDatePt("");
    setEndDatePt("");
    setPayDatePt("");
    setPaymentModePt("");
    setRemarksPt("");
    setDurationPt("");
    setStatusPt(DEFAULT_PLAN_STATUS);
    setSlotTimingPt("");
    setPaidToPt("");
    setFeedbackPt("");
    setReceiptPt(false);
    setError(null);
    setPlanConflictNotice(null);
  }

  function openAdd() {
    if (profileOpen) {
      closeProfileForm();
    }
    setEditing(null);
    // GT
    setName("");
    setImage(null);
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
    setStatus(DEFAULT_PLAN_STATUS);
    setSlotTiming("");
    setMobile("");
    setPaidTo("");
    setFeedback("");
    setReceipt(false);
    // PT
    setNamePt("");
    setImagePt(null);
    setTotalFeePt(0);
    setPaidFeePt(0);
    setBalancePt(0);
    setTrainerIdPt(null);
    setStartDatePt("");
    setEndDatePt("");
    setPayDatePt("");
    setPaymentModePt("");
    setRemarksPt("");
    setDurationPt("");
    setStatusPt(DEFAULT_PLAN_STATUS);
    setSlotTimingPt("");
    setMobilePt("");
    setPaidToPt("");
    setFeedbackPt("");
    setReceiptPt(false);
    setFriendIds([]);
    setFriendSearch("");
    setFriendDropdownAnchor(null);
    setFormOpen(true);
    setError(null);
    setPlanConflictNotice(null);
  }

  function openAddEntryFromReport(c: Customer) {
    openAdd();
    const fallbackName = c.name ?? "";
    const fallbackMobile = c.mobile ?? "";
    setName(fallbackName);
    setMobile(fallbackMobile);
    setNamePt(fallbackName);
    setMobilePt(fallbackMobile);
    setFriendIds(c.friend_ids ?? []);
    setFriendSearch("");
    setFriendDropdownAnchor(null);
    setDetailsCustomer(null);
  }

  function openEdit(c: Customer) {
    setError(null);
    setPlanConflictNotice(null);
    if (profileOpen) {
      closeProfileForm();
    }
    const isGtPrimary = (c.plan ?? "").trim().toUpperCase() === "GT";
    const clickedIsActive = isPlanActive(c);
    const groupKey = getCustomerGroupKey(c);
    const relatedPlans = customers.filter((plan) => getCustomerGroupKey(plan) === groupKey);
    const activeGt = findLatestActivePlan(relatedPlans, "GT");
    const activePt = findLatestActivePlan(relatedPlans, "PT");

    const primaryActive = isGtPrimary ? activeGt : activePt;
    const editingTarget = clickedIsActive ? (primaryActive ?? c) : c;
    setEditing(editingTarget);
    setName(editingTarget.name);
    setMobile(editingTarget.mobile ?? "");
    setFriendIds(editingTarget.friend_ids ?? []);
    setFriendSearch("");
    setFriendDropdownAnchor(null);

    const linkedActive = clickedIsActive ? (isGtPrimary ? activePt : activeGt) : null;
    setEditingLinkedId(linkedActive?.id ?? null);

    const gtSource = clickedIsActive ? activeGt : (isGtPrimary ? c : null);
    if (gtSource) {
      setImage(gtSource.image);
      setTotalFee(gtSource.total_fee);
      setPaidFee(gtSource.paid_fee);
      setBalance(gtSource.balance);
      setTrainerId(gtSource.trainer_id);
      setStartDate(formatDateForInput(gtSource.start_date));
      setEndDate(formatDateForInput(gtSource.end_date));
      setPayDate(formatDateForInput(gtSource.pay_date));
      setPaymentMode(gtSource.payment_mode ?? "");
      setRemarks(gtSource.remarks ?? "");
      setDuration(getPrefilledDurationValue(gtSource));
      setStatus(gtSource.status ?? DEFAULT_PLAN_STATUS);
      setSlotTiming(gtSource.slot_timing ?? "");
      setPaidTo(gtSource.paid_to ?? "");
      setFeedback(gtSource.feedback ?? "");
      setReceipt(gtSource.receipt ?? false);
    } else {
      setImage(null);
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
      setStatus(DEFAULT_PLAN_STATUS);
      setSlotTiming("");
      setPaidTo("");
      setFeedback("");
      setReceipt(false);
    }

    const ptSource = clickedIsActive ? activePt : (isGtPrimary ? null : c);
    if (ptSource) {
      setImagePt(ptSource.image);
      setTotalFeePt(ptSource.total_fee);
      setPaidFeePt(ptSource.paid_fee);
      setBalancePt(ptSource.balance);
      setTrainerIdPt(ptSource.trainer_id);
      setStartDatePt(formatDateForInput(ptSource.start_date));
      setEndDatePt(formatDateForInput(ptSource.end_date));
      setPayDatePt(formatDateForInput(ptSource.pay_date));
      setPaymentModePt(ptSource.payment_mode ?? "");
      setRemarksPt(ptSource.remarks ?? "");
      setDurationPt(getPrefilledDurationValue(ptSource));
      setStatusPt(ptSource.status ?? DEFAULT_PLAN_STATUS);
      setSlotTimingPt(ptSource.slot_timing ?? "");
      setMobilePt(ptSource.mobile ?? "");
      setPaidToPt(ptSource.paid_to ?? "");
      setFeedbackPt(ptSource.feedback ?? "");
      setReceiptPt(ptSource.receipt ?? false);
    } else {
      setImagePt(null);
      setTotalFeePt(0);
      setPaidFeePt(0);
      setBalancePt(0);
      setTrainerIdPt(null);
      setStartDatePt("");
      setEndDatePt("");
      setPayDatePt("");
      setPaymentModePt("");
      setRemarksPt("");
      setDurationPt("");
      setStatusPt(DEFAULT_PLAN_STATUS);
      setSlotTimingPt("");
      setMobilePt("");
      setPaidToPt("");
      setFeedbackPt("");
      setReceiptPt(false);
    }

    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setEditingLinkedId(null);
    setError(null);
    setPlanConflictNotice(null);
    setFriendIds([]);
    setFriendSearch("");
    setFriendDropdownAnchor(null);
  }

  function openFriendViewer(customer: Customer) {
    closeFormsForOtherActions();
    if (!customer.customer_id) {
      setFriendViewer({ customer, friends: [] });
      return;
    }
    const summary = friendSummaryByCustomerId.get(customer.customer_id) ?? [];
    setFriendViewer({ customer, friends: summary });
  }

  function openAddFriendsForCustomer(customer: Customer) {
    setFriendViewer(null);
    openProfileEdit(customer);
  }

  function openCustomerDetails(customer: Customer) {
    closeFormsForOtherActions();
    setDetailsCustomer(customer);
  }

  function openProfileEdit(c: Customer) {
    if (formOpen) {
      closeForm();
    }
    setProfileCustomer(c);
    setName(c.name);
    setMobile(c.mobile || "");
    setImage(c.image || null);
    setFriendIds(c.friend_ids ?? []);
    setFriendSearch("");
    setFriendDropdownAnchor(null);
    setError(null);
    setProfileOpen(true);
  }

  function closeProfileForm() {
    setProfileOpen(false);
    setProfileCustomer(null);
    setError(null);
    setPlanConflictNotice(null);
    setFriendIds([]);
    setFriendSearch("");
    setFriendDropdownAnchor(null);
  }

  function closeFormsForOtherActions() {
    if (formOpen) {
      closeForm();
    }
    if (profileOpen) {
      closeProfileForm();
    }
  }



  function buildPayload(opts: PlanFormValues, customerId?: string | null, friendIdsParam?: string[]) {
    const planId = opts.plan?.trim();
    if (!planId) {
      throw new Error("Plan type is required.");
    }
    const planLabel = planId.toUpperCase();
    const trimmedName = requireTextField(opts.name, "Name");
    const mobileValue = requireTextField(opts.mobile, "Phone number");
    const durationValue = requireTextField(opts.duration, `${planLabel} duration`);
    const paymentModeValue = requireTextField(opts.paymentMode, `${planLabel} payment mode`);
    const paidToValue = requireTextField(opts.paidTo, `${planLabel} paid to`);
    const totalFeeValue = requirePositiveNumber(opts.totalFee, `${planLabel} total fee`);
    const paidFeeValue = requireNonNegativeNumber(opts.paidFee, `${planLabel} paid amount`);
    const balanceVal = totalFeeValue - paidFeeValue;
    const slotValue = opts.slotTiming.trim();
    const ptPlan = isPtPlan(planId);
    if (ptPlan && !slotValue) {
      throw new Error("Slot timing is required for PT plans.");
    }
    const trainerValue = ptPlan ? requireTextField(opts.trainerId, "Trainer") : null;
    const statusValue = withDefaultStatus(opts.status);
    if (!statusValue) {
      throw new Error(`${planLabel} status is required.`);
    }
    const payload = {
      name: trimmedName,
      image: opts.image ?? null,
      plan: planId,
      total_fee: totalFeeValue,
      paid_fee: paidFeeValue,
      balance: balanceVal,
      trainer_id: ptPlan ? trainerValue : null,
      start_date: opts.startDate,
      end_date: opts.endDate,
      pay_date: opts.payDate,
      payment_mode: paymentModeValue,
      remarks: opts.remarks.trim() || null,
      duration: durationValue,
      status: statusValue,
      slot_timing: ptPlan ? slotValue : (slotValue || null),
      mobile: mobileValue,
      paid_to: paidToValue,
      feedback: opts.feedback.trim() || null,
      receipt: opts.receipt,
    };
    if (customerId) {
      (payload as Record<string, unknown>).customer_id = customerId;
    }
    if (friendIdsParam !== undefined) {
      (payload as Record<string, unknown>).friend_ids = friendIdsParam;
    }
    return payload;
  }

  /** Check if mobile is already used by another customer (optional excludeId when editing). */
  function isMobileAlreadyUsed(mobileVal: string, excludeId?: string, currentName?: string): boolean {
    const key = normalizeMobile(mobileVal);
    if (!key) return false;

    // Check if the mobile is used by someone else
    return customers.some((c) => {
      if (c.id === excludeId) return false; // same record
      if (normalizeMobile(c.mobile) !== key) return false; // different mobile
      if (currentName && (c.name || "").trim().toLowerCase() === currentName.trim().toLowerCase()) {
        return false; // same person's other record
      }
      return true; // found a conflict!
    });
  }

  async function handleSubmitProfile(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPlanConflictNotice(null);
    setLoading(true);
    try {
      const normalizedFriendIds = normalizeFriendIdList(friendIds);
      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("Name is required.");
        setLoading(false);
        return;
      }
      const newMobileRaw = mobile.trim();
      if (!newMobileRaw) {
        setError("Phone number is required.");
        setLoading(false);
        return;
      }
      const mobileKey = profileCustomer?.mobile ? normalizeMobile(profileCustomer.mobile) : null;
      const nameKey = (profileCustomer?.name ?? "").trim();
      const historyToUpdate = customers.filter((c) => {
        if (mobileKey) return normalizeMobile(c.mobile) === mobileKey;
        return (c.name ?? "").trim() === nameKey;
      });

      if (newMobileRaw !== (profileCustomer?.mobile || "").trim()) {
        const newKey = normalizeMobile(newMobileRaw);
        if (newKey) {
          const used = customers.some(c => !historyToUpdate.some(h => h.id === c.id) && normalizeMobile(c.mobile) === newKey);
          if (used) {
            setError("Another customer already has this mobile number.");
            setLoading(false);
            return;
          }
        }
      }

      const promises = historyToUpdate.map(h =>
        updateCustomer(h.id, {
          name: trimmedName,
          mobile: newMobileRaw || null,
          image: image || null,
          friend_ids: normalizedFriendIds,
        })
      );

      const results = await Promise.all(promises);
      const failed = results.find(r => !r.ok);
      if (failed) {
        applyMutationFailure(failed, "Failed to update profile for some entries.");
        setLoading(false);
        return;
      }

      closeProfileForm();
      router.refresh();
    } catch (err) {
      setError((err as Error)?.message ?? "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPlanConflictNotice(null);
    setLoading(true);
    try {
      const normalizedFriendIds = normalizeFriendIdList(friendIds);
      if (editing) {
        const trimmedName = name.trim();
        if (!trimmedName) {
          setError("Name is required.");
          setLoading(false);
          return;
        }
        const trimmedMobile = mobile.trim();
        if (!trimmedMobile) {
          setError("Phone number is required.");
          setLoading(false);
          return;
        }
        if (isMobileAlreadyUsed(trimmedMobile, editing.id, trimmedName)) {
          setError("Another customer already has this mobile number. Mobile must be unique.");
          setLoading(false);
          return;
        }

        const isGtMain = editing ? editing.plan === "GT" : true;
        const gtPayloadInfo: PlanFormValues = {
          name,
          image,
          plan: "GT",
          totalFee,
          paidFee,
          trainerId: null,
          startDate,
          endDate,
          payDate,
          paymentMode,
          remarks,
          duration,
          status,
          slotTiming,
          mobile: trimmedMobile,
          paidTo,
          feedback,
          receipt,
        };
        const ptPayloadInfo: PlanFormValues = {
          name,
          image: imagePt,
          plan: "PT",
          totalFee: totalFeePt,
          paidFee: paidFeePt,
          trainerId: trainerIdPt,
          startDate: startDatePt,
          endDate: endDatePt,
          payDate: payDatePt,
          paymentMode: paymentModePt,
          remarks: remarksPt,
          duration: durationPt,
          status: statusPt,
          slotTiming: slotTimingPt,
          mobile: trimmedMobile,
          paidTo: paidToPt,
          feedback: feedbackPt,
          receipt: receiptPt,
        };
        const hasGtDetails = hasPlanDetails(gtPayloadInfo);
        const hasPtDetails = hasPlanDetails(ptPayloadInfo);
        if (isGtMain && !hasGtDetails) {
          setError("GT details are required while editing this plan.");
          setLoading(false);
          return;
        }
        if (!isGtMain && !hasPtDetails) {
          setError("PT details are required while editing this plan.");
          setLoading(false);
          return;
        }

        let sanitizedGt: PlanFormValues | null = null;
        let sanitizedPt: PlanFormValues | null = null;
        try {
          if (hasGtDetails) {
            sanitizedGt = sanitizePlanDates(gtPayloadInfo, "GT");
          }
          if (hasPtDetails) {
            sanitizedPt = sanitizePlanDates(ptPayloadInfo, "PT");
          }
        } catch (validationErr) {
          setError(validationErr instanceof Error ? validationErr.message : "Invalid date input.");
          setLoading(false);
          return;
        }

        const payload = buildPayload(isGtMain ? sanitizedGt! : sanitizedPt!, undefined, normalizedFriendIds);
        const res = await updateCustomer(editing.id, payload);

        if (res.ok) {
          if (editingLinkedId) {
            const linkedPayloadSource = isGtMain ? sanitizedPt : sanitizedGt;
            if (linkedPayloadSource) {
              const linkedPayload = buildPayload(linkedPayloadSource);
              const linkedUpdate = await updateCustomer(editingLinkedId, linkedPayload);
              if (!linkedUpdate.ok) {
                applyMutationFailure(linkedUpdate, "Failed to update linked plan.");
                setLoading(false);
                return;
              }
            }
          } else {
            // If they entered details for the other plan type during edit, create it
            if (isGtMain && hasPtDetails && sanitizedPt) {
              const addPt = await createCustomer(buildPayload(sanitizedPt, editing.customer_id));
              if (!addPt.ok) {
                applyMutationFailure(addPt, "Failed to add PT plan.");
                setLoading(false);
                return;
              }
            } else if (!isGtMain && hasGtDetails && sanitizedGt) {
              const addGt = await createCustomer(buildPayload(sanitizedGt, editing.customer_id));
              if (!addGt.ok) {
                applyMutationFailure(addGt, "Failed to add GT plan.");
                setLoading(false);
                return;
              }
            }
          }
        } else {
          applyMutationFailure(res, "Failed to update this plan.");
          setLoading(false);
          return;
        }
      } else {
        // Add new entry
        const commonName = name.trim();
        if (!commonName) {
          setError("Name is required.");
          setLoading(false);
          return;
        }
        const commonMobileRaw = mobile.trim();
        if (!commonMobileRaw) {
          setError("Phone number is required.");
          setLoading(false);
          return;
        }
        if (isMobileAlreadyUsed(commonMobileRaw, undefined, commonName)) {
          setError("A customer with this mobile number already exists. Mobile must be unique.");
          setLoading(false);
          return;
        }
        const commonMobile = commonMobileRaw;

        const gtPayloadInfo: PlanFormValues = {
          name: commonName,
          image,
          plan: "GT",
          totalFee,
          paidFee,
          trainerId: null,
          startDate,
          endDate,
          payDate,
          paymentMode,
          remarks,
          duration,
          status,
          slotTiming,
          mobile: commonMobile,
          paidTo,
          feedback,
          receipt,
        };
        const ptPayloadInfo: PlanFormValues = {
          name: commonName,
          image: imagePt,
          plan: "PT",
          totalFee: totalFeePt,
          paidFee: paidFeePt,
          trainerId: trainerIdPt,
          startDate: startDatePt,
          endDate: endDatePt,
          payDate: payDatePt,
          paymentMode: paymentModePt,
          remarks: remarksPt,
          duration: durationPt,
          status: statusPt,
          slotTiming: slotTimingPt,
          mobile: commonMobile,
          paidTo: paidToPt,
          feedback: feedbackPt,
          receipt: receiptPt,
        };

        const hasGtDetails = hasPlanDetails(gtPayloadInfo);
        const hasPtDetails = hasPlanDetails(ptPayloadInfo);
        if (!hasGtDetails && !hasPtDetails) {
          setError("Add at least one plan (GT or PT) before saving.");
          setLoading(false);
          return;
        }

        const createGt = hasGtDetails;
        let sanitizedGt: PlanFormValues | null = null;
        let sanitizedPt: PlanFormValues | null = null;
        try {
          if (createGt) {
            sanitizedGt = sanitizePlanDates(gtPayloadInfo, "GT");
          }
          if (hasPtDetails) {
            sanitizedPt = sanitizePlanDates(ptPayloadInfo, "PT");
          }
        } catch (validationErr) {
          setError(validationErr instanceof Error ? validationErr.message : "Invalid date input.");
          setLoading(false);
          return;
        }

        let sharedCustomerId: string | null = null;
        if (createGt) {
          const payloadGt = buildPayload(sanitizedGt!, null, normalizedFriendIds);
          const resGt = await createCustomer(payloadGt);
          if (!resGt.ok) {
            applyMutationFailure(resGt, "Failed to add GT.");
            setLoading(false);
            return;
          }
          sharedCustomerId = resGt.customer?.customer_id ?? null;
        }

        if (hasPtDetails) {
          const payloadPt = buildPayload(
            sanitizedPt!,
            sharedCustomerId,
            createGt ? undefined : normalizedFriendIds
          );
          const resPt = await createCustomer(payloadPt);
          if (!resPt.ok) {
            applyMutationFailure(resPt, "Failed to add PT.");
            setLoading(false);
            return;
          }
          if (!sharedCustomerId) {
            sharedCustomerId = resPt.customer?.customer_id ?? null;
          }
        }
      }
      closeForm();
      router.refresh();
    } catch (err) {
      setError((err as Error)?.message ?? "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function openDeletePrompt(plan: Customer, level: DeletePrompt["level"], payment?: Payment) {
    closeFormsForOtherActions();
    if (level === "payment" && payment) {
      setDeletePrompt({ level, plan, payment });
    } else {
      if (level === "payment") {
        setDeletePrompt(null);
        return;
      }
      setDeletePrompt({ level, plan });
      if (paymentsPlan?.id === plan.id) {
        closePaymentsModal();
      }
    }
    setDeletePromptError(null);
    setDetailsCustomer(null);
  }

function getDeletePromptMessage(prompt: DeletePrompt) {
  if (prompt.level === "customer") {
    return (
      <>
        You are about to{" "}
        <span className="text-red-600 font-medium">
          delete this customer
        </span>.
        <br />
        This will permanently remove{" "}
        <span className="text-red-600 font-medium">all plans</span> and{" "}
        <span className="text-red-600 font-medium">payment history</span>.
      </>
    );
  }

  if (prompt.level === "payment") {
    const planName = prompt.plan.plan ?? "this plan";
    const customerName = prompt.plan.name?.trim() || "this customer";

    return (
      <>
        You are about to{" "}
        <span className="text-red-600 font-medium">delete a payment</span>{" "}
        for{" "}
        <span className="text-red-600 font-medium">{planName}</span> ({customerName}).
        <br />
        This will adjust their outstanding balance and cannot be undone.
      </>
    );
  }

  const customerName = prompt.plan.name?.trim() || "this customer";
  return (
    <>
      You are about to{" "}
      <span className="text-red-600 font-medium">delete a plan</span>{" "}
      for{" "}
      <span className="text-red-600 font-medium">{customerName}</span>.
      <br />
      This will also remove{" "}
      <span className="text-red-600 font-medium">all related payments</span>.
    </>
  );
}

function getDeletePromptWarning(prompt: DeletePrompt) {
  if (prompt.level !== "payment") return null;

  return isPlanActive(prompt.plan) ? (
    <span className="text-red-600 font-medium">
      ⚠ This plan is currently active. Deleting this payment may affect financial records.
    </span>
  ) : (
    <span className="text-red-600 font-medium">
      ⚠ This action is irreversible. Deleted data cannot be recovered.
    </span>
  );
}
  async function deletePaymentForPlan(planId: string, paymentId: string): Promise<{ ok: boolean; error?: string }> {
    try {
      setPaymentsSaving(true);
      setPaymentsError(null);
      const result = await deletePlanPayment(paymentId);
      if (!result.ok) throw new Error(result.error ?? "Failed to delete payment.");
      await refreshPlanPayments(planId);
      router.refresh();
      return { ok: true };
    } catch (err) {
      const message = (err as Error)?.message ?? "Failed to delete payment.";
      setPaymentsError(message);
      return { ok: false, error: message };
    } finally {
      setPaymentsSaving(false);
    }
  }

  async function confirmDeletePrompt() {
    if (!deletePrompt) return;
    const snapshot = deletePrompt;
    setDeletePromptError(null);
    setDeleteInFlight(true);
    if (snapshot.level !== "payment") {
      setLoading(true);
    }
    try {
      if (snapshot.level === "payment") {
        const result = await deletePaymentForPlan(snapshot.plan.id, snapshot.payment.id);
        if (!result.ok) throw new Error(result.error ?? "Failed to delete payment.");
        setDeletePrompt(null);
        return;
      }
      let deletedIds = new Set<string>();
      if (snapshot.level === "customer" && snapshot.plan.customer_id) {
        const affectedPlans = customers.filter((plan) => plan.customer_id === snapshot.plan.customer_id);
        const res = await deleteCustomerCascade(snapshot.plan.customer_id);
        if (!res.ok) throw new Error(res.error ?? "Failed to delete this record.");
        deletedIds = new Set(affectedPlans.map((plan) => plan.id));
      } else if (snapshot.level === "customer") {
        const fallbackPlans = customers.filter((plan) => getCustomerGroupKey(plan) === getCustomerGroupKey(snapshot.plan));
        for (const plan of fallbackPlans) {
          const res = await deleteCustomer(plan.id);
          if (!res.ok) throw new Error(res.error ?? "Failed to delete this record.");
        }
        deletedIds = new Set(fallbackPlans.map((plan) => plan.id));
      } else {
        const res = await deleteCustomer(snapshot.plan.id);
        if (!res.ok) throw new Error(res.error ?? "Failed to delete this record.");
        deletedIds = new Set([snapshot.plan.id]);
      }
      setCustomers((prev) => prev.filter((x) => !deletedIds.has(x.id)));
      if (editing && deletedIds.has(editing.id)) closeForm();
      setDeletePrompt(null);
      router.refresh();
    } catch (err) {
      setDeletePromptError((err as Error)?.message ?? "Failed to delete this record.");
    } finally {
      setDeleteInFlight(false);
      if (snapshot.level !== "payment") {
        setLoading(false);
      }
    }
  }

  function handleRequestDeletePayment(payment: Payment) {
    if (!paymentsPlan) return;
    closeFormsForOtherActions();
    openDeletePrompt(paymentsPlan, "payment", payment);
  }

  function requestPlanHold(plan: Customer) {
    closeFormsForOtherActions();
    setPlanHoldPrompt({ mode: "hold", plan });
    setPlanHoldError(null);
  }

  function requestPlanResume(plan: Customer) {
    closeFormsForOtherActions();
    setPlanHoldPrompt({ mode: "resume", plan });
    setPlanHoldError(null);
  }

  function closePlanHoldPrompt() {
    if (planHoldInFlight) return;
    setPlanHoldPrompt(null);
    setPlanHoldError(null);
  }

  async function confirmPlanHoldAction() {
    if (!planHoldPrompt) return;
    setPlanHoldInFlight(true);
    setPlanHoldError(null);
    try {
      const action = planHoldPrompt.mode === "hold" ? holdCustomerPlan : resumeCustomerPlan;
      const result = await action(planHoldPrompt.plan.id);
      if (!result.ok) {
        throw new Error(result.error ?? "Failed to update this plan.");
      }
      setPlanHoldPrompt(null);
      router.refresh();
    } catch (err) {
      setPlanHoldError((err as Error)?.message ?? "Unable to update this plan right now.");
    } finally {
      setPlanHoldInFlight(false);
    }
  }

  const planHoldModal = planHoldPrompt && mounted && typeof document !== "undefined"
    ? createPortal(
      (() => {
        const plan = planHoldPrompt.plan;
        const isHoldMode = planHoldPrompt.mode === "hold";
        const planLabel = plan.plan ?? "Plan";
        const customerLabel = plan.name?.trim() || "this customer";
        const todayIso = new Date().toISOString().slice(0, 10);
        const todayDisplay = formatPromptDate(todayIso);
        const bulletPoints = isHoldMode
          ? [
            "Freeze trainer allocation, attendance, and reminders until you resume.",
            "Extend the plan end date by the number of days it stays on hold.",
            "Stop auto-payment nudges so the member is not charged while paused.",
          ]
          : [
            "Reactivate attendance tracking and trainer allocation immediately.",
            "Capture today as the hold end date for audit history.",
            "Restart reminders and billing so the member shows as active again.",
          ];
        return (
          <div
            className="fixed inset-0 z-[195] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-8"
            role="dialog"
            aria-modal="true"
            onClick={closePlanHoldPrompt}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-white/15 bg-stone-950/95 text-stone-100 shadow-2xl p-5"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                  {isHoldMode ? "Hold plan" : "Resume plan"}
                </p>
                <h3 className="text-xl font-semibold text-white">
                  {isHoldMode ? `Pause ${planLabel} for ${customerLabel}?` : `Resume ${planLabel} for ${customerLabel}?`}
                </h3>
                <p className="text-sm text-stone-300">
                  Plan window: {formatPromptDate(plan.start_date)} → {formatPromptDate(plan.end_date)}
                </p>
                <p className="text-sm text-stone-400">
                  Here is what will happen when you {isHoldMode ? "pause" : "resume"} this plan:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm text-stone-100">
                  {bulletPoints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="text-xs text-stone-500">
                  {isHoldMode
                    ? `We use ${todayDisplay} as the hold start date so you can track how long the pause lasted.`
                    : `We use ${todayDisplay} as the hold end date so the history remains auditable.`}
                </p>
                {planHoldError && (
                  <p className="text-sm text-brand-red bg-brand-red/15 px-3 py-2 rounded-xl">{planHoldError}</p>
                )}
              </div>
              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closePlanHoldPrompt}
                  disabled={planHoldInFlight}
                  className="px-4 py-2 rounded-xl border border-white/20 text-sm text-stone-300 hover:bg-white/5 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmPlanHoldAction}
                  disabled={planHoldInFlight}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold text-white ${isHoldMode ? "bg-amber-500 hover:bg-amber-400" : "bg-emerald-500 hover:bg-emerald-400"} disabled:opacity-60`}
                >
                  {planHoldInFlight ? "Applying…" : isHoldMode ? "Put on hold" : "Resume now"}
                </button>
              </div>
            </div>
          </div>
        );
      })(),
      document.body
    )
    : null;

  const deletePromptModal = deletePrompt && mounted && typeof document !== "undefined"
    ? createPortal(
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-8"
        role="dialog"
        aria-modal="true"
        aria-live="assertive"
        onClick={() => { if (!deleteInFlight) setDeletePrompt(null); }}
      >
        <div
          className="w-full max-w-lg rounded-2xl border border-amber-400/40 bg-stone-900/95 text-stone-100 shadow-2xl p-5 space-y-3"
          onClick={(event) => event.stopPropagation()}
        >
          <p className="text-sm leading-relaxed">{deletePrompt ? getDeletePromptMessage(deletePrompt) : ""}</p>
          {deletePrompt?.level === "plan" && (
            <p className="text-xs text-stone-400">Plan: {deletePrompt.plan.plan ?? "—"} • {deletePrompt.plan.start_date ?? "—"} → {deletePrompt.plan.end_date ?? "—"}</p>
          )}
          {deletePrompt?.level === "payment" && (
            <div className="text-xs text-stone-400 space-y-1">
              <p>Plan: {deletePrompt.plan.plan ?? "—"} · {deletePrompt.plan.name ?? "—"}</p>
              <p>
                Amount: {formatCurrency(deletePrompt.payment.amount)} · Paid on {formatPromptDate(deletePrompt.payment.payment_date)} · Mode: {deletePrompt.payment.payment_mode ?? "—"}
              </p>
            </div>
          )}
          {deletePrompt?.level === "payment" && (
            <p className="text-xs text-amber-300">{getDeletePromptWarning(deletePrompt)}</p>
          )}
          {deletePromptError && (
            <p className="text-sm text-brand-red bg-brand-red/15 px-3 py-2 rounded-xl">{deletePromptError}</p>
          )}
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeletePrompt(null)}
              disabled={deleteInFlight}
              className="px-4 py-2 rounded-xl border border-white/20 text-sm text-stone-300 hover:bg-white/5 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeletePrompt}
              disabled={deleteInFlight}
              className="px-4 py-2 rounded-xl bg-brand-red text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {deleteInFlight ? "Deleting…" : "Delete now"}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
    : null;

  const friendViewerModal = friendViewer && mounted && typeof document !== "undefined"
    ? createPortal(
      <div
        className="fixed inset-0 z-[190] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-8"
        role="dialog"
        aria-modal="true"
        onClick={() => setFriendViewer(null)}
      >
        <div
          className="w-full max-w-md rounded-2xl border border-white/15 bg-stone-900/95 text-stone-100 shadow-2xl p-5 space-y-4"
          onClick={(event) => event.stopPropagation()}
        >
          <div>
            <p className="text-xs uppercase tracking-wider text-stone-500">Friends</p>
            <p className="text-lg font-semibold text-stone-100">{friendViewer.customer.name ?? "Unnamed"}</p>
            {friendViewer.customer.mobile && (
              <p className="text-sm text-stone-400">{friendViewer.customer.mobile}</p>
            )}
          </div>
          {friendViewer.friends.length === 0 ? (
            <p className="text-sm text-stone-400">No friends have been linked to this customer yet.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-theme">
              {friendViewer.friends.map((friend) => (
                <li key={friend.id} className="rounded-xl border border-white/10 px-3 py-2 bg-white/5">
                  <p className="text-sm text-stone-100 font-medium">{friend.name}</p>
                  {friend.mobile && (
                    <p className="text-xs text-stone-400">{friend.mobile}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => openAddFriendsForCustomer(friendViewer.customer)}
              className="px-4 py-2 rounded-xl bg-brand-red text-sm font-semibold text-white hover:opacity-90"
            >
              Add friends
            </button>
            <button
              type="button"
              onClick={() => setFriendViewer(null)}
              className="px-4 py-2 rounded-xl border border-white/20 text-sm text-stone-300 hover:bg-white/5"
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
    : null;

  const trainerOptions = trainers.filter((t) => (t.name ?? "").trim() !== "");
  const gtFormTouched = Boolean(
    totalFee > 0 ||
    paidFee > 0 ||
    startDate.trim() !== "" ||
    endDate.trim() !== "" ||
    payDate.trim() !== "" ||
    paymentMode.trim() !== "" ||
    remarks.trim() !== "" ||
    duration.trim() !== "" ||
    slotTiming.trim() !== "" ||
    paidTo.trim() !== "" ||
    feedback.trim() !== "" ||
    Boolean(image) ||
    receipt
  );
  const gtFormRequired = Boolean(editing?.plan === "GT" || gtFormTouched);
  const ptFormTouched = Boolean(
    totalFeePt > 0 ||
    paidFeePt > 0 ||
    startDatePt.trim() !== "" ||
    endDatePt.trim() !== "" ||
    payDatePt.trim() !== "" ||
    paymentModePt.trim() !== "" ||
    remarksPt.trim() !== "" ||
    durationPt.trim() !== "" ||
    slotTimingPt.trim() !== "" ||
    (trainerIdPt ?? "").trim() !== "" ||
    paidToPt.trim() !== "" ||
    feedbackPt.trim() !== "" ||
    Boolean(imagePt) ||
    receiptPt
  );
  const ptFormRequired = Boolean(editing?.plan === "PT" || ptFormTouched);
  // Filter dropdown: only trainers in use (assigned to ≥1 customer) with valid names, same as Trainers page
  const trainersInUseForFilter = trainers.filter(
    (t) => (t.name ?? "").trim() !== "" && customers.some((c) => c.trainer_id === t.id)
  );
  const searchInputClass =
    "w-full px-3 py-2.5 rounded-xl bg-stone-900/80 border border-white/10 text-stone-100 placeholder:text-stone-500 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none text-sm transition shadow-inner";
  const filterSelectClass =
    "w-full pl-3 pr-9 py-2.5 text-sm appearance-none cursor-pointer bg-stone-900/80 border border-white/10 rounded-xl text-stone-100 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none";

  return (
    <div className="space-y-6">
      {planHoldModal}
      {deletePromptModal}
      {friendViewerModal}
      
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
              className={`flex items-center justify-center w-12 h-12 rounded-r-xl border-l border-white/10 transition ${showFilterDropdown
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
                  style={{
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    maxHeight: `calc(100vh - ${FILTER_DROPDOWN_MARGIN * 2}px)`,
                  }}
                >
                  <div className="border-b border-white/10 bg-white/[0.04] px-4 py-3">
                    <p className="text-stone-300 text-xs font-semibold uppercase tracking-wider">
                      Filter options
                    </p>
                  </div>
                  <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
                    <div>
                      <label className="block text-xs font-medium text-stone-400 mb-1.5">Plan</label>
                      <select
                        value={pendingFilterPlan}
                        onChange={(e) => setPendingFilterPlan(e.target.value)}
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
                        value={pendingFilterTrainerId}
                        onChange={(e) => setPendingFilterTrainerId(e.target.value)}
                        className={filterSelectClass}
                      >
                        <option value="">All trainers</option>
                        {trainersInUseForFilter.map((t) => (
                          <option key={t.id} value={t.id}>{(t.name ?? "").trim()}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-400 mb-1.5">Payment mode</label>
                      <select
                        value={pendingFilterPaymentMode}
                        onChange={(e) => setPendingFilterPaymentMode(e.target.value)}
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
                        value={pendingFilterPaidStatus}
                        onChange={(e) => setPendingFilterPaidStatus(e.target.value)}
                        className={filterSelectClass}
                      >
                        <option value="">All</option>
                        <option value="paid">Paid (balance = 0)</option>
                        <option value="not_paid">Not paid (balance ≠ 0)</option>
                        <option value="hold">On hold</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-400 mb-1.5">Customer status</label>
                      <select
                        value={pendingFilterCustomerActivity}
                        onChange={(e) => setPendingFilterCustomerActivity(e.target.value)}
                        className={filterSelectClass}
                      >
                        <option value="">All customers</option>
                        <option value="active">Active customers</option>
                        <option value="inactive">Inactive customers</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={applyFilters}
                        className="px-4 py-2.5 rounded-xl bg-brand-red hover:opacity-90 text-white font-semibold text-sm transition"
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
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openAdd}
            className="px-4 py-2 rounded-xl bg-brand-red hover:opacity-90 text-white font-semibold text-sm transition"
          >
            Add customer
          </button>
          
        </div>
        <p className="text-stone-500 text-sm">
          {hasFilterParamsInUrl
            ? `Showing ${displayCustomers.length} of ${customers.length} customer${customers.length === 1 ? "" : "s"} (one per mobile)`
            : `Showing ${displayCustomers.length} customer${displayCustomers.length === 1 ? "" : "s"} (one per mobile)`}
        </p>
      </div>

      {formOpen && (
        <div className="liquid-glass p-6 rounded-2xl border border-white/10">
          <h2 className="text-lg font-semibold text-stone-100 mb-4">
            {editing ? "Edit customer" : "New entry (GT + PT)"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p
                ref={formErrorRef}
                tabIndex={-1}
                className="text-brand-red text-sm bg-brand-red/10 px-3 py-2 rounded focus:outline-none"
              >
                {error}
              </p>
            )}
            {planConflictNotice && (
              <div
                ref={planConflictRef}
                tabIndex={-1}
                className="rounded border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100 space-y-1 focus:outline-none"
              >
                <p className="font-medium">
                  {planConflictNotice.planId.toUpperCase()} already exists in this date range.
                </p>
                <p>
                  Existing plan dates: {formatPromptDate(planConflictNotice.startDate)} to {formatPromptDate(planConflictNotice.endDate)}
                </p>
                <button
                  type="button"
                  onClick={() => openConflictPlanHistory(planConflictNotice.existingPlanId)}
                  className="text-xs font-semibold underline underline-offset-2 hover:text-white"
                >
                  View existing plan history
                </button>
              </div>
            )}
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-4 border-b border-white/10">
                <div>
                  <label className={labelClass}>Name <span className="text-brand-red">*</span></label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Name (common)" required />
                </div>
                <div>
                  <label className={labelClass}>Number <span className="text-brand-red">*</span></label>
                  <input type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} className={inputClass} placeholder="Phone number (common)" required />
                </div>
                <div ref={friendComboboxRef} className="lg:col-span-1">
                  <p className="text-sm text-stone-400 mb-1.5">Friends (existing customers)</p>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleFriendDropdown("main")}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          setFriendDropdownAnchor(null);
                          setFriendSearch("");
                        }
                      }}
                      className={`${inputClass} flex items-center justify-between text-left`}
                    >
                      <div className="flex w-full items-center justify-between gap-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-stone-100">
                          Friends
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs text-stone-100">
                          {selectedFriendOptions.length}
                          <span className="text-stone-400">selected</span>
                        </span>
                      </div>
                      <svg className={`w-4 h-4 transition-transform ${friendDropdownAnchor === "main" ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.854a.75.75 0 111.08 1.04l-4.25 4.417a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {friendDropdownAnchor === "main" && (
                      <div className="absolute left-0 right-0 z-20 mt-2 rounded-xl border border-white/10 bg-stone-950/95 shadow-2xl">
                        <div className="p-3 border-b border-white/10">
                          <input
                            ref={friendInputRef}
                            type="text"
                            value={friendSearch}
                            onChange={(e) => setFriendSearch(e.target.value)}
                            className={`${inputClass} bg-stone-900/80`}
                            placeholder="Search customers…"
                          />
                          {selectedFriendOptions.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1 scrollbar-theme">
                              {selectedFriendOptions.map((friend) => (
                                <span
                                  key={friend.id}
                                  className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1 text-xs text-stone-100"
                                >
                                  <span>{friend.name}</span>
                                  {friend.mobile && <span className="text-[10px] text-stone-400">{friend.mobile}</span>}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFriend(friend.id)}
                                    className="text-stone-400 hover:text-white focus:outline-none"
                                    aria-label={`Remove ${friend.name}`}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          {filteredFriendOptions.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-stone-500">No matches. Try a different name or number.</p>
                          ) : (
                            filteredFriendOptions.map((option) => (
                              <button
                                type="button"
                                key={option.id}
                                onClick={() => handleSelectFriendOption(option.id)}
                                className="block w-full px-3 py-2 text-left text-sm text-stone-100 hover:bg-white/5"
                              >
                                <span>{option.name}</span>
                                {option.mobile && (
                                  <span className="block text-xs text-stone-400">{option.mobile}</span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                 
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                {/* Left column: GT — two fields per row */}
                <div className="border border-white/10 rounded-xl p-4 bg-stone-900/30">
                  <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-1.5">
                    <p className="text-sm font-semibold text-stone-300">GT</p>
                    {!editing && (
                      <button
                        type="button"
                        onClick={clearGtPlanDetails}
                        className="px-2.5 py-1 rounded-md border border-white/20 text-[11px] font-medium text-stone-300 hover:bg-white/5"
                      >
                        Clear GT
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Total fee (₹) <span className="text-brand-red">*</span></label>
                      <input type="number" min={0} value={totalFee || ""} onChange={(e) => setTotalFee(Number(e.target.value) || 0)} onWheel={(e) => (e.target as HTMLElement).blur()} className={inputClass} required={gtFormRequired} aria-required={gtFormRequired} />
                    </div>
                    <div>
                      <label className={labelClass}>Paid (₹) <span className="text-brand-red">*</span></label>
                      <input type="number" min={0} value={paidFee || ""} onChange={(e) => setPaidFee(Number(e.target.value) || 0)} onWheel={(e) => (e.target as HTMLElement).blur()} className={inputClass} required={gtFormRequired} aria-required={gtFormRequired} />
                    </div>
                    <div>
                      <label className={labelClass}>Balance</label>
                      <input type="number" value={balance} readOnly onWheel={(e) => (e.target as HTMLElement).blur()} className={inputClass + " bg-stone-900/50 text-stone-400 text-xs"} />
                    </div>
                    <div>
                      <label className={labelClass}>Start date <span className="text-brand-red">*</span></label>
                      <AdminDatePicker value={startDate} onChange={setStartDate} className={inputClass} aria-label="GT start date" aria-required={gtFormRequired} />
                    </div>
                    <div>
                      <label className={labelClass}>End date <span className="text-brand-red">*</span></label>
                      <AdminDatePicker value={endDate} onChange={setEndDate} className={inputClass} aria-label="GT end date" showDurationChips durationChipsReferenceDate={startDate || undefined} aria-required={gtFormRequired} />
                    </div>
                    <div>
                      <label className={labelClass}>Pay date <span className="text-brand-red">*</span></label>
                      <AdminDatePicker value={payDate} onChange={setPayDate} className={inputClass} aria-label="GT pay date" aria-required={gtFormRequired} />
                    </div>
                    <div>
                      <label className={labelClass}>Payment mode <span className="text-brand-red">*</span></label>
                      <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className={inputClass} required={gtFormRequired} aria-required={gtFormRequired}>
                        <option value="">— Select —</option>
                        {TRACKER_PAYMENT_MODE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Paid to <span className="text-brand-red">*</span></label>
                      <input type="text" value={paidTo} onChange={(e) => setPaidTo(e.target.value)} className={inputClass} placeholder="Paid to" required={gtFormRequired} aria-required={gtFormRequired} />
                    </div>
                    <div>
                      <label className={labelClass}>Remarks</label>
                      <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} className={inputClass + " min-h-[52px] resize-y text-sm"} placeholder="Optional" rows={1} />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="receipt-gt" checked={receipt} onChange={(e) => setReceipt(e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-stone-900/80 text-brand-red focus:ring-brand-red focus:ring-offset-0" />
                      <label htmlFor="receipt-gt" className={labelClass + " mb-0 cursor-pointer"}>Receipt</label>
                    </div>
                    <div className="col-span-2 pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setTotalFeePt(totalFee);
                          setPaidFeePt(paidFee);
                          setBalancePt(balance);
                          setStartDatePt(startDate);
                          setEndDatePt(endDate);
                          setPayDatePt(payDate);
                          setPaymentModePt(paymentMode);
                          setPaidToPt(paidTo);
                          setRemarksPt(remarks);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition ml-auto border border-white/10"
                      >
                        Copy to PT →
                      </button>
                    </div>
                  </div>
                </div>
                {/* Right column: PT — two fields per row */}
                <div className="border border-white/10 rounded-xl p-4 bg-stone-900/30">
                  <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-1.5">
                    <p className="text-sm font-semibold text-stone-300">PT</p>
                    {!editing && (
                      <button
                        type="button"
                        onClick={clearPtPlanDetails}
                        className="px-2.5 py-1 rounded-md border border-white/20 text-[11px] font-medium text-stone-300 hover:bg-white/5"
                      >
                        Clear PT
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Trainer <span className="text-brand-red">*</span></label>
                      <select value={trainerIdPt ?? ""} onChange={(e) => setTrainerIdPt(e.target.value || null)} className={inputClass} required={ptFormRequired} aria-required={ptFormRequired}>
                        <option value="">— Select —</option>
                        {trainerOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Total fee (₹) <span className="text-brand-red">*</span></label>
                      <input type="number" min={0} value={totalFeePt || ""} onChange={(e) => setTotalFeePt(Number(e.target.value) || 0)} onWheel={(e) => (e.target as HTMLElement).blur()} className={inputClass} required={ptFormRequired} aria-required={ptFormRequired} />
                    </div>
                    <div>
                      <label className={labelClass}>Paid (₹) <span className="text-brand-red">*</span></label>
                      <input type="number" min={0} value={paidFeePt || ""} onChange={(e) => setPaidFeePt(Number(e.target.value) || 0)} onWheel={(e) => (e.target as HTMLElement).blur()} className={inputClass} required={ptFormRequired} aria-required={ptFormRequired} />
                    </div>
                    <div>
                      <label className={labelClass}>Balance</label>
                      <input type="number" value={balancePt} readOnly onWheel={(e) => (e.target as HTMLElement).blur()} className={inputClass + " bg-stone-900/50 text-stone-400 text-xs"} />
                    </div>
                    <div>
                      <label className={labelClass}>Start date <span className="text-brand-red">*</span></label>
                      <AdminDatePicker value={startDatePt} onChange={setStartDatePt} className={inputClass} aria-label="PT start date" aria-required={ptFormRequired} />
                    </div>
                    <div>
                      <label className={labelClass}>End date <span className="text-brand-red">*</span></label>
                      <AdminDatePicker value={endDatePt} onChange={setEndDatePt} className={inputClass} aria-label="PT end date" showDurationChips durationChipsReferenceDate={startDatePt || undefined} aria-required={ptFormRequired} />
                    </div>
                    <div>
                      <label className={labelClass}>Pay date <span className="text-brand-red">*</span></label>
                      <AdminDatePicker value={payDatePt} onChange={setPayDatePt} className={inputClass} aria-label="PT pay date" aria-required={ptFormRequired} />
                    </div>
                    <div>
                      <label className={labelClass}>Payment mode <span className="text-brand-red">*</span></label>
                      <select value={paymentModePt} onChange={(e) => setPaymentModePt(e.target.value)} className={inputClass} required={ptFormRequired} aria-required={ptFormRequired}>
                        <option value="">— Select —</option>
                        {TRACKER_PAYMENT_MODE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Slot timing <span className="text-brand-red">*</span></label>
                      <input type="text" value={slotTimingPt} onChange={(e) => setSlotTimingPt(e.target.value)} className={inputClass} placeholder="e.g. 6–7 AM" required={ptFormRequired} aria-required={ptFormRequired} />
                    </div>
                    <div>
                      <label className={labelClass}>Paid to <span className="text-brand-red">*</span></label>
                      <input type="text" value={paidToPt} onChange={(e) => setPaidToPt(e.target.value)} className={inputClass} placeholder="Paid to" required={ptFormRequired} aria-required={ptFormRequired} />
                    </div>
                    <div>
                      <label className={labelClass}>Remarks</label>
                      <textarea value={remarksPt} onChange={(e) => setRemarksPt(e.target.value)} className={inputClass + " min-h-[52px] resize-y text-sm"} placeholder="Optional" rows={1} />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="receipt-pt" checked={receiptPt} onChange={(e) => setReceiptPt(e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-stone-900/80 text-brand-red focus:ring-brand-red focus:ring-offset-0" />
                      <label htmlFor="receipt-pt" className={labelClass + " mb-0 cursor-pointer"}>Receipt</label>
                    </div>
                  </div>
                </div>
              </div>
            </>
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

      {profileOpen && profileCustomer && (
        <div className="liquid-glass p-6 rounded-2xl border border-white/10">
          <h2 className="text-lg font-semibold text-stone-100 mb-4">
            Edit Customer Profile
          </h2>
          <form onSubmit={handleSubmitProfile} className="space-y-4">
            {error && (
              <p
                ref={profileErrorRef}
                tabIndex={-1}
                className="text-brand-red text-sm bg-brand-red/10 px-3 py-2 rounded focus:outline-none"
              >
                {error}
              </p>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Number</label>
                <input type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} className={inputClass} />
              </div>
              <div ref={friendProfileComboboxRef} className="lg:col-span-1">
                <p className="text-sm text-stone-400 mb-1.5">Friends (existing customers)</p>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleFriendDropdown("profile")}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                        setFriendDropdownAnchor(null);
                        setFriendSearch("");
                      }
                    }}
                    className={`${inputClass} flex items-center justify-between text-left`}
                  >
                    <div className="flex w-full items-center justify-between gap-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-stone-100">Friends</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs text-stone-100">
                        {selectedFriendOptions.length}
                        <span className="text-stone-400">selected</span>
                      </span>
                    </div>
                    <svg className={`w-4 h-4 transition-transform ${friendDropdownAnchor === "profile" ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.854a.75.75 0 111.08 1.04l-4.25 4.417a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {friendDropdownAnchor === "profile" && (
                    <div className="absolute left-0 right-0 z-20 mt-2 rounded-xl border border-white/10 bg-stone-950/95 shadow-2xl">
                      <div className="p-3 border-b border-white/10">
                        <input
                          ref={friendInputRef}
                          type="text"
                          value={friendSearch}
                          onChange={(e) => setFriendSearch(e.target.value)}
                          className={`${inputClass} bg-stone-900/80`}
                          placeholder="Search customers…"
                        />
                        {selectedFriendOptions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1 scrollbar-theme">
                            {selectedFriendOptions.map((friend) => (
                              <span
                                key={friend.id}
                                className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1 text-xs text-stone-100"
                              >
                                <span>{friend.name}</span>
                                {friend.mobile && <span className="text-[10px] text-stone-400">{friend.mobile}</span>}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFriend(friend.id)}
                                  className="text-stone-400 hover:text-white focus:outline-none"
                                  aria-label={`Remove ${friend.name}`}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        {filteredFriendOptions.length === 0 ? (
                          <p className="px-3 py-2 text-xs text-stone-500">No matches. Try a different name or number.</p>
                        ) : (
                          filteredFriendOptions.map((option) => (
                            <button
                              type="button"
                              key={option.id}
                              onClick={() => handleSelectFriendOption(option.id)}
                              className="block w-full px-3 py-2 text-left text-sm text-stone-100 hover:bg-white/5"
                            >
                              <span>{option.name}</span>
                              {option.mobile && (
                                <span className="block text-xs text-stone-400">{option.mobile}</span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-brand-red hover:opacity-90 text-white font-semibold text-sm disabled:opacity-50"
              >
                {loading ? "Saving…" : "Update"}
              </button>
              <button
                type="button"
                onClick={closeProfileForm}
                className="px-4 py-2.5 rounded-xl border border-white/20 text-stone-400 hover:bg-white/5 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customer report modal – shared component */}
      {detailsCustomer && mounted && (
        <CustomerReportModal
          customer={detailsCustomer}
          customers={customers}
          trainers={trainers}
          formatCurrency={formatCurrency}
          onClose={() => setDetailsCustomer(null)}
          showActions
          onAddEntry={openAddEntryFromReport}
          onEditEntry={openEdit}
          onDeleteEntry={(entry) => openDeletePrompt(entry, "plan")}
          onViewPayments={openPaymentsPanel}
          onHoldPlan={requestPlanHold}
          onResumePlan={requestPlanResume}
        />
      )}

      <PlanPaymentsModal
        plan={paymentsPlan}
        open={paymentsModalOpen}
        payments={planPayments}
        loading={paymentsLoading}
        saving={paymentsSaving}
        error={paymentsError}
        formatCurrency={formatCurrency}
        onClose={closePaymentsModal}
        onSubmit={handleSavePayment}
        onDeleteRequest={handleRequestDeletePayment}
      />

      <div className="liquid-glass rounded-2xl overflow-hidden border border-white/10">
        {displayCustomers.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-sm">
            {customers.length === 0
              ? "No customers yet. Add one to get started."
              : "No customers match the current filters. Try changing search or filters."}
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="overflow-x-auto overflow-y-visible scrollbar-theme">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.04]">
                    <th className="text-left py-4 px-6 font-semibold text-stone-400 uppercase tracking-wider w-[100px] h-[50px]">S. No</th>
                    <th className="text-left py-4 px-6 font-semibold text-stone-400 uppercase tracking-wider h-[50px]">Name</th>
                    <th className="text-left py-4 px-6 font-semibold text-stone-400 uppercase tracking-wider w-[200px] h-[50px]">Phone No</th>
                    <th className="text-left py-4 px-6 font-semibold text-stone-400 uppercase tracking-wider w-[140px] h-[50px]">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-stone-400 uppercase tracking-wider min-w-[220px] h-[50px]">Active plans</th>
                    <th className="text-center py-4 px-6 font-semibold text-stone-400 uppercase tracking-wider w-[100px] h-[50px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCustomerGroups.map((group, i) => {
                    const c = group.primary;
                    const plansForDisplay = getPlansHighlight(group.plans);
                    const remainingCount = Math.max(group.plans.length - plansForDisplay.length, 0);
                    const friendsForCustomer = c.customer_id ? friendSummaryByCustomerId.get(c.customer_id) ?? [] : [];
                    const friendCount = friendsForCustomer.length;
                    const customerIsActive = customerActivityByGroupKey.get(group.key) === true;
                    return (
                      <tr
                        key={`${group.key}-${c.id}-${i}`}
                        className="border-b border-white/5 hover:bg-white/[0.04] cursor-pointer transition-colors group"
                        onClick={() => openCustomerDetails(c)}
                      >

                        <td className="py-3 px-6 text-stone-400 font-medium">
                          {i + 1}
                        </td>

                        <td className="py-3 px-6">
                          <span className="text-stone-100 font-semibold text-base">{c.name}</span>
                        </td>

                        <td className="py-3 px-6 text-stone-300 font-medium">
                          {c.mobile ?? "—"}
                        </td>
                        <td className="py-3 px-6">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              customerIsActive
                                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                                : "border-white/15 bg-white/5 text-stone-300"
                            }`}
                          >
                            {customerIsActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-6">
                          {plansForDisplay.length === 0 ? (
                            <span className="text-stone-500 text-sm">No plans</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {plansForDisplay.map((plan) => {
                                const active = isPlanActive(plan);
                                const onHold = Boolean(plan.active_hold);
                                const badgeClass = onHold
                                  ? "border-amber-400/50 bg-amber-500/15 text-amber-100"
                                  : active
                                    ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                                    : "border-white/10 bg-white/5 text-stone-200";
                                const statusLabel = onHold ? " • Hold" : active ? " • Active" : "";
                                return (
                                  <button
                                    key={plan.id}
                                    type="button"
                                    onClick={(event) => { event.stopPropagation(); openPaymentsPanel(plan); }}
                                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${badgeClass} hover:border-brand-red/60 hover:text-white`}
                                    title={`${plan.plan} • ${plan.start_date ?? "?"} → ${plan.end_date ?? "?"} (click to view payments)`}
                                  >
                                    {plan.plan}
                                    {statusLabel}
                                  </button>
                                );
                              })}
                              {remainingCount > 0 && (
                                <span className="text-xs text-stone-500 self-center">+{remainingCount} more</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-6" onClick={(event) => event.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={(event) => { event.stopPropagation(); openFriendViewer(c); }}
                              className="px-3 py-1 rounded-full text-xs font-semibold border border-white/10 text-stone-200 hover:border-brand-red/60 hover:text-white transition whitespace-nowrap"
                            >
                              Friends{friendCount ? ` (${friendCount})` : ""}
                            </button>
                            <button
                              type="button"
                              onClick={(event) => { event.stopPropagation(); openProfileEdit(c); }}
                              className="px-3 py-1 rounded-full text-xs font-semibold border border-white/10 text-stone-200 hover:border-brand-red/60 hover:text-white transition"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={(event) => { event.stopPropagation(); openDeletePrompt(c, "customer"); }}
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
    </div>
  );
}
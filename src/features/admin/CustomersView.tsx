"use client";
/* eslint-disable @next/next/no-img-element -- admin images are base64/dynamic */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useHorizontalScrollTable } from "@/hooks/useHorizontalScrollTable";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CustomerReportModal } from "./CustomerReportModal";
import type { Customer } from "@/models/customer";
import type { Trainer } from "@/models/trainer";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@app/actions/customers";
import { readFileAsBase64 } from "@/lib/image-utils";
import { normalizeMobile, dedupeByMobile } from "@/lib/customer-utils";
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

function dedupeById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

export function CustomersView({ initialCustomers, initialTrainers }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>(() => dedupeById(initialCustomers));
  const [trainers, setTrainers] = useState<Trainer[]>(initialTrainers);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [editingLinkedId, setEditingLinkedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileCustomer, setProfileCustomer] = useState<Customer | null>(null);

  // GT (left column)
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
  const [status, setStatus] = useState("");
  const [slotTiming, setSlotTiming] = useState("");
  const [mobile, setMobile] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [feedback, setFeedback] = useState("");
  const [receipt, setReceipt] = useState(false);
  // PT (right column) – same fields, individual per column when adding new entry
  const [namePt, setNamePt] = useState("");
  const [imagePt, setImagePt] = useState<string | null>(null);
  const [planPt, setPlanPt] = useState<string>("PT");
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
  const [statusPt, setStatusPt] = useState("");
  const [slotTimingPt, setSlotTimingPt] = useState("");
  const [mobilePt, setMobilePt] = useState("");
  const [paidToPt, setPaidToPt] = useState("");
  const [feedbackPt, setFeedbackPt] = useState("");
  const [receiptPt, setReceiptPt] = useState(false);

  const [searchQuery, setSearchQuery] = useState(() => getStringParam(searchParams, "q"));
  const [filterPlan, setFilterPlan] = useState(() => getStringParam(searchParams, "plan"));
  const [filterTrainerId, setFilterTrainerId] = useState(() => getStringParam(searchParams, "trainer"));
  const [filterPaymentMode, setFilterPaymentMode] = useState(() => getStringParam(searchParams, "payment_mode"));
  const [filterPaidStatus, setFilterPaidStatus] = useState(() => getStringParam(searchParams, "paid_status"));
  const [pendingFilterPlan, setPendingFilterPlan] = useState("");
  const [pendingFilterTrainerId, setPendingFilterTrainerId] = useState("");
  const [pendingFilterPaymentMode, setPendingFilterPaymentMode] = useState("");
  const [pendingFilterPaidStatus, setPendingFilterPaidStatus] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [openActionRowId, setOpenActionRowId] = useState<string | null>(null);
  const [detailsCustomer, setDetailsCustomer] = useState<Customer | null>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const { tableScrollRef, topScrollRef, headerRef } = useHorizontalScrollTable(
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
    setSearchQuery(getStringParam(searchParams, "q"));
    setFilterPlan(getStringParam(searchParams, "plan"));
    setFilterTrainerId(getStringParam(searchParams, "trainer"));
    setFilterPaymentMode(getStringParam(searchParams, "payment_mode"));
    setFilterPaidStatus(getStringParam(searchParams, "paid_status"));
  }, [searchParams]);

  // When filter dropdown opens, copy current URL params into pending so Apply only affects the new tab
  useEffect(() => {
    if (showFilterDropdown) {
      setPendingFilterPlan(filterPlan);
      setPendingFilterTrainerId(filterTrainerId);
      setPendingFilterPaymentMode(filterPaymentMode);
      setPendingFilterPaidStatus(filterPaidStatus);
    }
  }, [showFilterDropdown, filterPlan, filterTrainerId, filterPaymentMode, filterPaidStatus]);

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
  const filteredCustomers = customers.filter((c) => {
    if (filterPlan && c.plan !== filterPlan) return false;
    if (filterTrainerId && c.trainer_id !== filterTrainerId) return false;
    if (filterPaymentMode && (c.payment_mode ?? "") !== filterPaymentMode) return false;
    if (filterPaidStatus === "paid" && (c.balance ?? 0) !== 0) return false;
    if (filterPaidStatus === "not_paid" && (c.balance ?? 0) === 0) return false;
    if (searchLower) {
      const nameMatch = (c.name ?? "").toLowerCase().includes(searchLower);
      const mobileMatch = (c.mobile ?? "").toLowerCase().includes(searchLower);
      const trainer = c.trainer_id ? trainers.find((t) => t.id === c.trainer_id) : null;
      const trainerMatch = trainer?.name?.toLowerCase().includes(searchLower);
      if (!nameMatch && !mobileMatch && !trainerMatch) return false;
    }
    return true;
  });

  /** One row per unique mobile in the table (no double entries for same number). */
  const displayCustomers = useMemo(
    () => dedupeByMobile(filteredCustomers),
    [filteredCustomers]
  );

  function buildFilterUrlForNewTab(): string {
    const params = new URLSearchParams();
    if (pendingFilterPlan) params.set("plan", pendingFilterPlan);
    if (pendingFilterTrainerId) params.set("trainer", pendingFilterTrainerId);
    if (pendingFilterPaymentMode) params.set("payment_mode", pendingFilterPaymentMode);
    if (pendingFilterPaidStatus) params.set("paid_status", pendingFilterPaidStatus);
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
    setShowFilterDropdown(false);
    router.push(pathname);
  }

  function openAdd() {
    setEditing(null);
    // GT
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
    setStatus("");
    setSlotTiming("");
    setMobile("");
    setPaidTo("");
    setFeedback("");
    setReceipt(false);
    // PT
    setNamePt("");
    setImagePt(null);
    setPlanPt("PT");
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
    setStatusPt("");
    setSlotTimingPt("");
    setMobilePt("");
    setPaidToPt("");
    setFeedbackPt("");
    setReceiptPt(false);
    setFormOpen(true);
    setError(null);
  }

  function openAddEntryFromReport(c: Customer) {
    openAdd();
    const isPt = (c.plan ?? "").toUpperCase() === "PT";
    if (isPt) {
      setNamePt(c.name ?? "");
      setMobilePt(c.mobile ?? "");
    } else {
      setName(c.name ?? "");
      setMobile(c.mobile ?? "");
    }
    setDetailsCustomer(null);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setError(null);
    // Common fields
    setName(c.name);
    setMobile(c.mobile ?? "");

    // Attempt to find matching PT/GT to show in the two-column template
    const mobileKey = normalizeMobile(c.mobile);
    const linked = mobileKey ? customers.find(x => x.id !== c.id && normalizeMobile(x.mobile) === mobileKey && x.plan !== c.plan) : null;
    setEditingLinkedId(linked?.id ?? null);

    const gtSource = c.plan === "GT" ? c : (linked?.plan === "GT" ? linked : null);
    const ptSource = c.plan === "PT" ? c : (linked?.plan === "PT" ? linked : null);

    if (gtSource) {
      setImage(gtSource.image);
      setPlan("GT");
      setTotalFee(gtSource.total_fee);
      setPaidFee(gtSource.paid_fee);
      setBalance(gtSource.balance);
      setTrainerId(gtSource.trainer_id);
      setStartDate(gtSource.start_date ?? "");
      setEndDate(gtSource.end_date ?? "");
      setPayDate(gtSource.pay_date ?? "");
      setPaymentMode(gtSource.payment_mode ?? "");
      setRemarks(gtSource.remarks ?? "");
      setDuration(gtSource.duration ?? "");
      setStatus(gtSource.status ?? "");
      setSlotTiming(gtSource.slot_timing ?? "");
      setPaidTo(gtSource.paid_to ?? "");
      setFeedback(gtSource.feedback ?? "");
      setReceipt(gtSource.receipt ?? false);
    } else {
      setImage(null); setTotalFee(0); setPaidFee(0); setTrainerId(null); setStartDate(""); setEndDate(""); setPayDate(""); setPaymentMode(""); setRemarks(""); setDuration(""); setStatus(""); setSlotTiming(""); setPaidTo(""); setFeedback(""); setReceipt(false);
    }

    if (ptSource) {
      setImagePt(ptSource.image);
      setPlanPt("PT");
      setTotalFeePt(ptSource.total_fee);
      setPaidFeePt(ptSource.paid_fee);
      setBalancePt(ptSource.balance);
      setTrainerIdPt(ptSource.trainer_id);
      setStartDatePt(ptSource.start_date ?? "");
      setEndDatePt(ptSource.end_date ?? "");
      setPayDatePt(ptSource.pay_date ?? "");
      setPaymentModePt(ptSource.payment_mode ?? "");
      setRemarksPt(ptSource.remarks ?? "");
      setDurationPt(ptSource.duration ?? "");
      setStatusPt(ptSource.status ?? "");
      setSlotTimingPt(ptSource.slot_timing ?? "");
      setMobilePt(ptSource.mobile ?? "");
      setPaidToPt(ptSource.paid_to ?? "");
      setFeedbackPt(ptSource.feedback ?? "");
      setReceiptPt(ptSource.receipt ?? false);
    } else {
      setImagePt(null); setTotalFeePt(0); setPaidFeePt(0); setTrainerIdPt(null); setStartDatePt(""); setEndDatePt(""); setPayDatePt(""); setPaymentModePt(""); setRemarksPt(""); setDurationPt(""); setStatusPt(""); setSlotTimingPt(""); setPaidToPt(""); setFeedbackPt(""); setReceiptPt(false);
    }

    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setEditingLinkedId(null);
    setError(null);
  }

  function openProfileEdit(c: Customer) {
    setProfileCustomer(c);
    setName(c.name);
    setMobile(c.mobile || "");
    setImage(c.image || null);
    setError(null);
    setProfileOpen(true);
  }

  function closeProfileForm() {
    setProfileOpen(false);
    setProfileCustomer(null);
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

  async function handleImageChangePt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const data = await readFileAsBase64(file);
    if (data) setImagePt(data);
  }
  function clearImagePt() {
    setImagePt(null);
  }

  function buildPayload(opts: {
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
  }) {
    const balanceVal = Number(opts.totalFee) - Number(opts.paidFee);
    return {
      name: opts.name.trim(),
      image: opts.image ?? null,
      plan: opts.plan,
      total_fee: Number(opts.totalFee),
      paid_fee: Number(opts.paidFee),
      balance: balanceVal,
      trainer_id: opts.plan === "PT" ? opts.trainerId : null,
      start_date: opts.startDate.trim() || null,
      end_date: opts.endDate.trim() || null,
      pay_date: opts.payDate.trim() || null,
      payment_mode: opts.paymentMode.trim() || null,
      remarks: opts.remarks.trim() || null,
      duration: opts.duration.trim() || null,
      status: opts.status.trim() || null,
      slot_timing: opts.slotTiming.trim() || null,
      mobile: opts.mobile.trim() || null,
      paid_to: opts.paidTo.trim() || null,
      feedback: opts.feedback.trim() || null,
      receipt: opts.receipt,
    };
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
    setLoading(true);
    try {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("Name is required.");
        setLoading(false);
        return;
      }
      const newMobileRaw = mobile.trim();
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
          image: image || null
        })
      );

      const results = await Promise.all(promises);
      const failed = results.find(r => !r.ok);
      if (failed) throw new Error(failed.error ?? "Failed to update profile for some entries.");

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
    setLoading(true);
    try {
      if (editing) {
        const trimmedName = name.trim();
        if (!trimmedName) {
          setError("Name is required.");
          setLoading(false);
          return;
        }
        if (isMobileAlreadyUsed(mobile, editing.id, trimmedName)) {
          setError("Another customer already has this mobile number. Mobile must be unique.");
          setLoading(false);
          return;
        }

        const isGtMain = plan === "GT";
        const gtPayloadInfo = {
          name, image, plan: "GT", totalFee, paidFee, trainerId: null, startDate, endDate, payDate, paymentMode, remarks, duration, status, slotTiming, mobile, paidTo, feedback, receipt
        };
        const ptPayloadInfo = {
          name, image: imagePt, plan: "PT", totalFee: totalFeePt, paidFee: paidFeePt, trainerId: trainerIdPt, startDate: startDatePt, endDate: endDatePt, payDate: payDatePt, paymentMode: paymentModePt, remarks: remarksPt, duration: durationPt, status: statusPt, slotTiming: slotTimingPt, mobile, paidTo: paidToPt, feedback: feedbackPt, receipt: receiptPt
        };

        const payload = buildPayload(isGtMain ? gtPayloadInfo : ptPayloadInfo);
        const res = await updateCustomer(editing.id, payload);

        if (res.ok) {
          if (editingLinkedId) {
            const linkedPayload = buildPayload(isGtMain ? ptPayloadInfo : gtPayloadInfo);
            await updateCustomer(editingLinkedId, linkedPayload);
          } else {
            // If they entered details for the other plan type during edit, create it
            const hasPtDetails = totalFeePt > 0 || paidFeePt > 0 || durationPt.trim() !== "" || !!trainerIdPt;
            const hasGtDetails = totalFee > 0 || paidFee > 0 || duration.trim() !== "";

            if (isGtMain && hasPtDetails) {
              await createCustomer(buildPayload(ptPayloadInfo));
            } else if (!isGtMain && hasGtDetails) {
              await createCustomer(buildPayload(gtPayloadInfo));
            }
          }
        } else {
          setError(res.error);
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
        if (commonMobileRaw && isMobileAlreadyUsed(commonMobileRaw, undefined, commonName)) {
          setError("A customer with this mobile number already exists. Mobile must be unique.");
          setLoading(false);
          return;
        }
        const commonMobile = commonMobileRaw || null;

        const hasGtDetails = totalFee > 0 || paidFee > 0 || duration.trim() !== "" || startDate.trim() !== "";
        const hasPtDetails = totalFeePt > 0 || paidFeePt > 0 || durationPt.trim() !== "" || !!trainerIdPt || startDatePt.trim() !== "";

        // If neither have details but they hit submit, default to creating an empty GT
        const createGt = hasGtDetails || !hasPtDetails;

        if (createGt) {
          const payloadGt = buildPayload({
            name: commonName, image, plan: "GT", totalFee, paidFee, trainerId: null, startDate, endDate, payDate, paymentMode, remarks, duration, status, slotTiming, mobile: commonMobile ?? "", paidTo, feedback, receipt,
          });
          const resGt = await createCustomer(payloadGt);
          if (!resGt.ok) {
            setError(resGt.error ?? "Failed to add GT.");
            setLoading(false);
            return;
          }
        }

        if (hasPtDetails) {
          const payloadPt = buildPayload({
            name: commonName, image: imagePt, plan: "PT", totalFee: totalFeePt, paidFee: paidFeePt, trainerId: trainerIdPt, startDate: startDatePt, endDate: endDatePt, payDate: payDatePt, paymentMode: paymentModePt, remarks: remarksPt, duration: durationPt, status: statusPt, slotTiming: slotTimingPt, mobile: commonMobile ?? "", paidTo: paidToPt, feedback: feedbackPt, receipt: receiptPt,
          });
          const resPt = await createCustomer(payloadPt);
          if (!resPt.ok) {
            setError(resPt.error ?? "Failed to add PT.");
            setLoading(false);
            return;
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

  const trainerOptions = trainers.filter((t) => (t.name ?? "").trim() !== "");
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
              <p className="text-brand-red text-sm bg-brand-red/10 px-3 py-2 rounded">
                {error}
              </p>
            )}
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-white/10">
                <div>
                  <label className={labelClass}>Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Name (common)" required />
                </div>
                <div>
                  <label className={labelClass}>Number</label>
                  <input type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} className={inputClass} placeholder="Phone number (common)" />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                {/* Left column: GT — two fields per row */}
                <div className="border border-white/10 rounded-xl p-4 bg-stone-900/30">
                  <p className="text-sm font-semibold text-stone-300 border-b border-white/10 pb-1.5 mb-4">GT</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Duration</label>
                      <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} className={inputClass} placeholder="e.g. 3M, 6M" />
                    </div>

                    <div>
                      <label className={labelClass}>Total fee (₹)</label>
                      <input type="number" min={0} value={totalFee || ""} onChange={(e) => setTotalFee(Number(e.target.value) || 0)} onWheel={(e) => (e.target as HTMLElement).blur()} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Paid (₹)</label>
                      <input type="number" min={0} value={paidFee || ""} onChange={(e) => setPaidFee(Number(e.target.value) || 0)} onWheel={(e) => (e.target as HTMLElement).blur()} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Balance</label>
                      <input type="number" value={balance} readOnly onWheel={(e) => (e.target as HTMLElement).blur()} className={inputClass + " bg-stone-900/50 text-stone-400 text-xs"} />
                    </div>
                    <div>
                      <label className={labelClass}>Start date</label>
                      <AdminDatePicker value={startDate} onChange={setStartDate} className={inputClass} aria-label="GT start date" />
                    </div>
                    <div>
                      <label className={labelClass}>End date</label>
                      <AdminDatePicker value={endDate} onChange={setEndDate} className={inputClass} aria-label="GT end date" showDurationChips durationChipsReferenceDate={startDate || undefined} />
                    </div>
                    <div>
                      <label className={labelClass}>Pay date</label>
                      <AdminDatePicker value={payDate} onChange={setPayDate} className={inputClass} aria-label="GT pay date" />
                    </div>
                    <div>
                      <label className={labelClass}>Payment mode</label>
                      <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className={inputClass}>
                        <option value="">— Select —</option>
                        {TRACKER_PAYMENT_MODE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Paid to</label>
                      <input type="text" value={paidTo} onChange={(e) => setPaidTo(e.target.value)} className={inputClass} placeholder="Paid to" />
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
                          setDurationPt(duration);
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
                  <p className="text-sm font-semibold text-stone-300 border-b border-white/10 pb-1.5 mb-4">PT</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Duration</label>
                      <input type="text" value={durationPt} onChange={(e) => setDurationPt(e.target.value)} className={inputClass} placeholder="e.g. 3M, 6M" />
                    </div>
                    <div>
                      <label className={labelClass}>Trainer</label>
                      <select value={trainerIdPt ?? ""} onChange={(e) => setTrainerIdPt(e.target.value || null)} className={inputClass}>
                        <option value="">— Select —</option>
                        {trainerOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>Total fee (₹)</label>
                      <input type="number" min={0} value={totalFeePt || ""} onChange={(e) => setTotalFeePt(Number(e.target.value) || 0)} onWheel={(e) => (e.target as HTMLElement).blur()} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Paid (₹)</label>
                      <input type="number" min={0} value={paidFeePt || ""} onChange={(e) => setPaidFeePt(Number(e.target.value) || 0)} onWheel={(e) => (e.target as HTMLElement).blur()} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Balance</label>
                      <input type="number" value={balancePt} readOnly onWheel={(e) => (e.target as HTMLElement).blur()} className={inputClass + " bg-stone-900/50 text-stone-400 text-xs"} />
                    </div>
                    <div>
                      <label className={labelClass}>Start date</label>
                      <AdminDatePicker value={startDatePt} onChange={setStartDatePt} className={inputClass} aria-label="PT start date" />
                    </div>
                    <div>
                      <label className={labelClass}>End date</label>
                      <AdminDatePicker value={endDatePt} onChange={setEndDatePt} className={inputClass} aria-label="PT end date" showDurationChips durationChipsReferenceDate={startDatePt || undefined} />
                    </div>
                    <div>
                      <label className={labelClass}>Pay date</label>
                      <AdminDatePicker value={payDatePt} onChange={setPayDatePt} className={inputClass} aria-label="PT pay date" />
                    </div>
                    <div>
                      <label className={labelClass}>Payment mode</label>
                      <select value={paymentModePt} onChange={(e) => setPaymentModePt(e.target.value)} className={inputClass}>
                        <option value="">— Select —</option>
                        {TRACKER_PAYMENT_MODE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Slot timing</label>
                      <input type="text" value={slotTimingPt} onChange={(e) => setSlotTimingPt(e.target.value)} className={inputClass} placeholder="e.g. 6–7 AM" />
                    </div>
                    <div>
                      <label className={labelClass}>Paid to</label>
                      <input type="text" value={paidToPt} onChange={(e) => setPaidToPt(e.target.value)} className={inputClass} placeholder="Paid to" />
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
              <p className="text-brand-red text-sm bg-brand-red/10 px-3 py-2 rounded">
                {error}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Number</label>
                <input type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} className={inputClass} />
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
          onDeleteEntry={handleDelete}
        />
      )}

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

                    <th className="text-left py-4 px-6 font-semibold text-stone-400 uppercase tracking-wider h-[50px]">Name</th>
                    <th className="text-left py-4 px-6 font-semibold text-stone-400 uppercase tracking-wider w-[200px] h-[50px]">Phone No</th>
                    <th className="text-center py-4 px-6 font-semibold text-stone-400 uppercase tracking-wider w-[100px] h-[50px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayCustomers.map((c, i) => {
                    return (
                      <tr
                        key={`${c.id}-${i}`}
                        className="border-b border-white/5 hover:bg-white/[0.04] cursor-pointer transition-colors group"
                        onClick={() => setDetailsCustomer(c)}
                      >

                        <td className="py-3 px-6">
                          <span className="text-stone-100 font-semibold text-base">{c.name}</span>
                        </td>

                        <td className="py-3 px-6 text-stone-300 font-medium">
                          {c.mobile ?? "—"}
                        </td>
                        <td className="py-3 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block">
                            <button
                              type="button"
                              onClick={() => setOpenActionRowId(openActionRowId === c.id ? null : c.id)}
                              className="p-2 rounded-xl border border-white/10 text-stone-400 hover:text-stone-100 hover:bg-white/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                              </svg>
                            </button>
                            {openActionRowId === c.id && (
                              <>
                                <div className="fixed inset-0 z-10" aria-hidden onClick={() => setOpenActionRowId(null)} />
                                <div className="absolute right-0 top-full mt-2 z-20 min-w-[160px] py-2 rounded-2xl border border-white/10 bg-stone-900 shadow-2xl animate-in fade-in zoom-in duration-200">
                                  <button
                                    type="button"
                                    onClick={() => { openProfileEdit(c); setOpenActionRowId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-stone-100 hover:bg-white/5"
                                  >
                                    Edit Profile
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setOpenActionRowId(null); handleDelete(c); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10"
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

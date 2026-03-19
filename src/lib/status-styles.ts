export type PlanStatusMeta = {
  label: string;
  className: string;
  isActive: boolean;
  isInactive: boolean;
};

const ACTIVE_META: PlanStatusMeta = {
  label: "Active",
  className: "bg-emerald-500/15 text-emerald-200 border border-emerald-400/40",
  isActive: true,
  isInactive: false,
};

const INACTIVE_META: PlanStatusMeta = {
  label: "Inactive",
  className: "bg-rose-500/15 text-rose-200 border border-rose-400/30",
  isActive: false,
  isInactive: true,
};

const DEFAULT_CLASS = "bg-stone-900/60 text-stone-200 border border-white/10";

function formatLabel(value: string): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getPlanStatusMeta(status: string | null | undefined): PlanStatusMeta | null {
  const normalized = (status ?? "").trim();
  if (!normalized) return null;
  const lowered = normalized.toLowerCase();
  if (lowered === "active") {
    return ACTIVE_META;
  }
  if (lowered === "inactive") {
    return INACTIVE_META;
  }
  return {
    label: formatLabel(normalized),
    className: DEFAULT_CLASS,
    isActive: false,
    isInactive: false,
  };
}

export type MembershipPlan = {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  duration_days: number;
  /** Exact total fee for display (avoids rounding drift from price_monthly × months) */
  total_fee?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MembershipPlanInsert = Omit<
  MembershipPlan,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type MembershipPlanUpdate = Partial<MembershipPlanInsert>;

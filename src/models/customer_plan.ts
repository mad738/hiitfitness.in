export type CustomerPlan = {
  id: string;
  customer_id: string;
  plan_id: string;
  trainer_id: string | null;
  start_date: string | null;
  end_date: string | null;
  total_fee: number;
  paid_amount: number;
  balance: number;
  status: string | null;
  slot_timing: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  plan_months?: number | null;
  monthly_value?: number | null;
  commission_rate?: number | null;
  trainer_commission?: number | null;
};

export type CustomerPlanInsert = Omit<CustomerPlan, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type CustomerPlanUpdate = Partial<CustomerPlanInsert>;

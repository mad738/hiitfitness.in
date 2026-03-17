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
  created_at: string;
  updated_at: string;
};

export type CustomerPlanInsert = Omit<CustomerPlan, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type CustomerPlanUpdate = Partial<CustomerPlanInsert>;

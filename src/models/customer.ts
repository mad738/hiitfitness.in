import type { PlanHold } from "./plan_hold";

export type Customer = {
  id: string;
  customer_id: string;
  name: string;
  image: string | null;
  plan: string;
  total_fee: number;
  paid_fee: number;
  balance: number;
  trainer_id: string | null;
  start_date: string | null;
  end_date: string | null;
  pay_date: string | null;
  payment_mode: string | null;
  paid_to: string | null;
  remarks: string | null;
  feedback: string | null;
  mobile: string | null;
  duration: string | null;
  status: string | null;
  slot_timing: string | null;
  receipt: boolean;
  created_at: string;
  updated_at: string;
  plan_months?: number | null;
  monthly_value?: number | null;
  commission_rate?: number | null;
  trainer_commission?: number | null;
  friend_ids?: string[];
  active_hold?: PlanHold | null;
  hold_history?: PlanHold[];
};

export type CustomerInsert = Omit<Customer, "id" | "created_at" | "updated_at" | "customer_id"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  customer_id?: string;
};

export type CustomerUpdate = Partial<CustomerInsert>;

export type Customer = {
  id: string;
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
  remarks: string | null;
  duration: string | null;
  status: string | null;
  slot_timing: string | null;
  receipt: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerInsert = Omit<Customer, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type CustomerUpdate = Partial<CustomerInsert>;

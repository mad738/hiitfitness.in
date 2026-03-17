export type Payment = {
  id: string;
  customer_plan_id: string;
  amount: number;
  payment_date: string;
  payment_mode: string | null;
  paid_to: string | null;
  receipt_issued: boolean | null;
  created_at: string;
  updated_at: string;
};

export type PaymentInsert = Omit<Payment, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type PaymentUpdate = Partial<PaymentInsert>;

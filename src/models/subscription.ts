export type Subscription = {
  id: string;
  customer_id: string;
  plan_id: string;
  status: "active" | "cancelled" | "expired" | "pending";
  started_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionInsert = Omit<
  Subscription,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type SubscriptionUpdate = Partial<SubscriptionInsert>;

export type CustomerProfile = {
  id: string;
  name: string;
  image: string | null;
  status: string | null;
  mobile: string | null;
  active_plans_count: number | null;
  created_at: string;
  updated_at: string;
};

export type CustomerProfileInsert = Omit<CustomerProfile, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type CustomerProfileUpdate = Partial<CustomerProfileInsert>;

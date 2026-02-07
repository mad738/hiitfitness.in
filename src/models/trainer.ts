export type Trainer = {
  id: string;
  name: string;
  image: string | null;
  phone_number: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
};

export type TrainerInsert = Omit<Trainer, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type TrainerUpdate = Partial<TrainerInsert>;

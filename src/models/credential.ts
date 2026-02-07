export type Credential = {
  id: string;
  username: string;
  pass: string;
  role: string;
  created_at: string;
  updated_at: string;
};

export type CredentialInsert = Omit<
  Credential,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type CredentialUpdate = Partial<CredentialInsert>;

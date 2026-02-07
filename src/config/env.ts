const required = (key: string): string => {
  const value = process.env[key];
  if (value == null || value === "") {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
};

const PUBLISHABLE_KEY = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY";

export function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env[PUBLISHABLE_KEY];
  return Boolean(url && key);
}

export const env = {
  supabase: {
    url: () => process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: () => process.env[PUBLISHABLE_KEY] ?? "",
    serviceRoleKey: () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  },
  getSupabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  getSupabaseAnonKey: () => required(PUBLISHABLE_KEY),
  /** Service role key (optional until used). Add SUPABASE_SERVICE_ROLE_KEY to .env for admin/tracker. */
  getSupabaseServiceRoleKey: () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
} as const;

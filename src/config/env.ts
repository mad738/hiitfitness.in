const required = (key: string): string => {
  const value = process.env[key];
  if (value == null || value === "") {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
};

export const env = {
  supabase: {
    url: () => process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    serviceRoleKey: () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  },
  getSupabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  getSupabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  getSupabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
} as const;

import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/config/env";

export async function createClient() {
  const cookieStore = await cookies();
  const url = env.getSupabaseUrl();
  const anonKey = env.getSupabaseAnonKey();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // ignore in Server Component
        }
      },
    },
  });
}

export async function createServiceRoleClient() {
  const url = env.getSupabaseUrl();
  const key = env.getSupabaseServiceRoleKey();
  if (!key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env from Supabase Dashboard → Settings → API → service_role (secret)."
    );
  }
  const { createClient: createSupabaseClient } = await import(
    "@supabase/supabase-js"
  );
  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
}

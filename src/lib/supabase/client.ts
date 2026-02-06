import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/config/env";

export function createClient() {
  const url = env.supabase.url();
  const anonKey = env.supabase.anonKey();
  if (!url || !anonKey) {
    throw new Error("Supabase URL and anon key must be set for client.");
  }
  return createBrowserClient(url, anonKey);
}

"use server";

import { redirect } from "next/navigation";
import { findCredentialByUsername } from "@/repositories/credential_repository";
import { verifyPassword } from "@/lib/verify-password";
import {
  setAdminSession,
  clearAdminSession,
  getAdminSession,
} from "@/lib/admin-session";
import { hasSupabaseConfig } from "@/config/env";

export type AdminLoginResult = { error?: string };

function isAllowedRedirect(path: string): boolean {
  return path.startsWith("/admin") && !path.startsWith("/admin/login");
}

export async function adminLogin(
  username: string,
  password: string,
  redirectTo?: string | null
): Promise<AdminLoginResult> {
  const trimmed = username.trim();
  if (!trimmed || !password) {
    return { error: "Username and password are required." };
  }

  if (!hasSupabaseConfig()) {
    return { error: "Server is not configured (Supabase missing)." };
  }

  const credential = await findCredentialByUsername(trimmed);
  if (!credential) {
    return { error: "Invalid username or password." };
  }

  const valid = await verifyPassword(password, credential.pass);
  if (!valid) {
    return { error: "Invalid username or password." };
  }

  try {
    await setAdminSession({
      username: credential.username,
      role: credential.role,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Session setup failed.";
    return { error: msg };
  }
  const target =
    redirectTo && isAllowedRedirect(redirectTo) ? redirectTo : "/admin";
  redirect(target);
}

export async function signOut() {
  await clearAdminSession();
  // Optional: also clear Supabase auth if it was used before
  try {
    const { createClient } = await import("@/lib/supabase/server");
    if (hasSupabaseConfig()) {
      const supabase = await createClient();
      await supabase.auth.signOut();
    }
  } catch {
    // ignore
  }
}

export async function requireAdminSession() {
  return { username: "admin", role: "admin" };
}

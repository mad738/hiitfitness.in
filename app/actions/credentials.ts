"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@app/actions/auth";
import {
  findCredentialById,
  findCredentialByUsername,
  insertCredential,
  updateCredential,
  deleteCredential as deleteCredentialRepo,
} from "@/repositories/credential_repository";
import { verifyPassword } from "@/lib/verify-password";

export type CredentialActionResult =
  | { ok: true }
  | { ok: false; error: string };

function credentialsPath() {
  return "/admin/credentials";
}

export async function createCredential(
  username: string,
  password: string,
  role: string
): Promise<CredentialActionResult> {
  try {
    await requireAdminSession();
    const trimmed = username.trim();
    if (!trimmed || !password) {
      return { ok: false, error: "Username and password are required." };
    }
    if (password.length < 6) {
      return { ok: false, error: "Password must be at least 6 characters." };
    }
    const existing = await findCredentialByUsername(trimmed);
    if (existing) {
      return { ok: false, error: "Username already exists." };
    }
    await insertCredential({
      username: trimmed,
      pass: password,
      role: (role || "staff").trim() || "staff",
    });
    revalidatePath(credentialsPath());
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to add admin.";
    return { ok: false, error: msg };
  }
}

export async function updateCredentialPassword(
  id: string,
  newPassword: string
): Promise<CredentialActionResult> {
  try {
    await requireAdminSession();
    if (!newPassword || newPassword.length < 6) {
      return { ok: false, error: "Password must be at least 6 characters." };
    }
    const cred = await findCredentialById(id);
    if (!cred) {
      return { ok: false, error: "User not found." };
    }
    await updateCredential(id, { pass: newPassword });
    revalidatePath(credentialsPath());
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update password.";
    return { ok: false, error: msg };
  }
}

export async function updateOwnPassword(
  currentPassword: string,
  newPassword: string
): Promise<CredentialActionResult> {
  try {
    const session = await requireAdminSession();
    if (!currentPassword || !newPassword) {
      return { ok: false, error: "Current and new password are required." };
    }
    if (newPassword.length < 6) {
      return { ok: false, error: "New password must be at least 6 characters." };
    }
    const cred = await findCredentialByUsername(session.username);
    if (!cred) {
      return { ok: false, error: "Account not found." };
    }
    const valid = await verifyPassword(currentPassword, cred.pass);
    if (!valid) {
      return { ok: false, error: "Current password is incorrect." };
    }
    await updateCredential(cred.id, { pass: newPassword });
    revalidatePath(credentialsPath());
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update password.";
    return { ok: false, error: msg };
  }
}

export async function deleteCredential(id: string): Promise<CredentialActionResult> {
  try {
    const session = await requireAdminSession();
    const cred = await findCredentialById(id);
    if (!cred) {
      return { ok: false, error: "User not found." };
    }
    if (cred.username.toLowerCase() === session.username.toLowerCase()) {
      return { ok: false, error: "You cannot remove your own account." };
    }
    await deleteCredentialRepo(id);
    revalidatePath(credentialsPath());
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to remove admin.";
    return { ok: false, error: msg };
  }
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Credential } from "@/models/credential";
import {
  createCredential,
  updateCredentialPassword,
  updateOwnPassword,
  deleteCredential,
} from "@app/actions/credentials";

type Props = {
  credentials: Credential[];
  currentUsername: string;
};

const inputClass =
  "w-full px-3 py-2.5 rounded-xl bg-stone-900/80 border border-white/10 text-stone-100 placeholder:text-stone-500 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none text-sm";
const labelClass = "block text-sm text-stone-400 mb-1.5";

export function CredentialsView({ credentials, currentUsername }: Props) {
  const router = useRouter();
  const list = credentials;

  const [addOpen, setAddOpen] = useState(false);
  const [changePasswordFor, setChangePasswordFor] = useState<Credential | null>(null);
  const [ownPasswordOpen, setOwnPasswordOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add admin form
  const [addUsername, setAddUsername] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState("staff");

  // Change password (other user)
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  // Change own password
  const [currentPassword, setCurrentPassword] = useState("");
  const [ownNewPassword, setOwnNewPassword] = useState("");
  const [ownNewPasswordConfirm, setOwnNewPasswordConfirm] = useState("");

  const isCurrentUser = (c: Credential) =>
    c.username.toLowerCase() === currentUsername.toLowerCase();

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await createCredential(addUsername, addPassword, addRole);
    setLoading(false);
    if (res.ok) {
      setAddOpen(false);
      setAddUsername("");
      setAddPassword("");
      setAddRole("staff");
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!changePasswordFor) return;
    setError(null);
    if (newPassword !== newPasswordConfirm) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const res = await updateCredentialPassword(changePasswordFor.id, newPassword);
    setLoading(false);
    if (res.ok) {
      setChangePasswordFor(null);
      setNewPassword("");
      setNewPasswordConfirm("");
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  async function handleOwnPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (ownNewPassword !== ownNewPasswordConfirm) {
      setError("New passwords do not match.");
      return;
    }
    if (ownNewPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const res = await updateOwnPassword(currentPassword, ownNewPassword);
    setLoading(false);
    if (res.ok) {
      setOwnPasswordOpen(false);
      setCurrentPassword("");
      setOwnNewPassword("");
      setOwnNewPasswordConfirm("");
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  async function handleRemove(c: Credential) {
    if (!confirm(`Remove admin "${c.username}"? They will no longer be able to sign in.`)) return;
    setError(null);
    if (isCurrentUser(c)) {
      setError("You cannot remove your own account.");
      return;
    }
    setLoading(true);
    const res = await deleteCredential(c.id);
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="liquid-glass rounded-xl border border-brand-red/30 px-4 py-3 text-brand-red text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="px-4 py-2 rounded-xl bg-brand-red hover:opacity-90 text-white font-semibold text-sm transition"
        >
          Add admin
        </button>
        <button
          type="button"
          onClick={() => setOwnPasswordOpen(true)}
          className="px-4 py-2 rounded-xl border border-white/20 text-stone-300 hover:bg-white/5 font-medium text-sm transition"
        >
          Change my password
        </button>
      </div>

      <div className="liquid-glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              <th className="py-3 px-4 text-stone-400 font-medium">Username</th>
              <th className="py-3 px-4 text-stone-400 font-medium">Role</th>
              <th className="py-3 px-4 text-stone-400 font-medium">Created</th>
              <th className="py-3 px-4 text-stone-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-stone-500 text-center">
                  No credentials yet.
                </td>
              </tr>
            ) : (
              list.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-white/5 hover:bg-white/[0.04]"
                >
                  <td className="py-2.5 px-4 text-stone-100 font-medium">
                    {c.username}
                    {isCurrentUser(c) && (
                      <span className="ml-2 text-stone-500 text-xs">(you)</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-stone-300">{c.role}</td>
                  <td className="py-2.5 px-4 text-stone-500 text-xs">
                    {new Date(c.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="py-2.5 px-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setChangePasswordFor(c);
                        setNewPassword("");
                        setNewPasswordConfirm("");
                        setError(null);
                      }}
                      className="text-brand-red hover:underline font-medium text-sm"
                    >
                      Change password
                    </button>
                    {!isCurrentUser(c) && (
                      <button
                        type="button"
                        onClick={() => handleRemove(c)}
                        disabled={loading}
                        className="text-stone-400 hover:text-brand-red hover:underline text-sm disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add admin modal */}
      {addOpen && (
        <Modal onClose={() => { setAddOpen(false); setError(null); }} title="Add admin">
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div>
              <label className={labelClass}>Username</label>
              <input
                type="text"
                value={addUsername}
                onChange={(e) => setAddUsername(e.target.value)}
                className={inputClass}
                placeholder="e.g. admin_branch"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                className={inputClass}
                placeholder="Min 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className={labelClass}>Role</label>
              <select
                value={addRole}
                onChange={(e) => setAddRole(e.target.value)}
                className={inputClass}
              >
                <option value="admin">admin</option>
                <option value="manager">manager</option>
                <option value="staff">staff</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-brand-red hover:opacity-90 text-white font-semibold text-sm disabled:opacity-50"
              >
                {loading ? "Adding…" : "Add"}
              </button>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="px-4 py-2 rounded-xl border border-white/20 text-stone-300 hover:bg-white/5 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Change password (other user) modal */}
      {changePasswordFor && (
        <Modal
          onClose={() => { setChangePasswordFor(null); setError(null); }}
          title={`Change password — ${changePasswordFor.username}`}
        >
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className={labelClass}>New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                placeholder="Min 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className={labelClass}>Confirm new password</label>
              <input
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                className={inputClass}
                placeholder="Repeat password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-brand-red hover:opacity-90 text-white font-semibold text-sm disabled:opacity-50"
              >
                {loading ? "Updating…" : "Update password"}
              </button>
              <button
                type="button"
                onClick={() => setChangePasswordFor(null)}
                className="px-4 py-2 rounded-xl border border-white/20 text-stone-300 hover:bg-white/5 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Change my password modal */}
      {ownPasswordOpen && (
        <Modal
          onClose={() => { setOwnPasswordOpen(false); setError(null); }}
          title="Change my password"
        >
          <form onSubmit={handleOwnPassword} className="space-y-4">
            <div>
              <label className={labelClass}>Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
                placeholder="Your current password"
                required
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className={labelClass}>New password</label>
              <input
                type="password"
                value={ownNewPassword}
                onChange={(e) => setOwnNewPassword(e.target.value)}
                className={inputClass}
                placeholder="Min 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className={labelClass}>Confirm new password</label>
              <input
                type="password"
                value={ownNewPasswordConfirm}
                onChange={(e) => setOwnNewPasswordConfirm(e.target.value)}
                className={inputClass}
                placeholder="Repeat new password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-brand-red hover:opacity-90 text-white font-semibold text-sm disabled:opacity-50"
              >
                {loading ? "Updating…" : "Update password"}
              </button>
              <button
                type="button"
                onClick={() => setOwnPasswordOpen(false)}
                className="px-4 py-2 rounded-xl border border-white/20 text-stone-300 hover:bg-white/5 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="credentials-modal-title"
    >
      <div
        className="liquid-glass rounded-2xl border border-white/20 w-full max-w-md shadow-xl p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2
            id="credentials-modal-title"
            className="font-display text-lg font-bold uppercase text-stone-100"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-white/10"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

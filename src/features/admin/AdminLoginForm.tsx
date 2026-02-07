"use client";

import { useState } from "react";
import { adminLogin } from "@app/actions/auth";

type Props = { redirectTo?: string | null };

export function AdminLoginForm({ redirectTo }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await adminLogin(username, password, redirectTo);
      if (result?.error) {
        setError(result.error);
        return;
      }
      window.location.href = redirectTo && redirectTo.startsWith("/admin") && redirectTo !== "/admin/login" ? redirectTo : "/admin";
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-brand-red text-sm bg-brand-red/10 px-3 py-2 rounded">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="username" className="block text-sm text-stone-400 mb-1">
          Username
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-stone-100 placeholder:text-stone-500 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition"
          placeholder="admin"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm text-stone-400 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-stone-100 placeholder:text-stone-500 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-brand-red hover:opacity-90 text-white font-extrabold transition disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

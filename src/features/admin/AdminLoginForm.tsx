"use client";

import { useState } from "react";
import { signIn } from "@app/actions/auth";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn(email, password);
      if (result?.error) {
        setError(result.error);
        return;
      }
      window.location.href = "/admin";
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="block text-sm text-stone-400 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg bg-stone-800 border border-stone-600 text-stone-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
          placeholder="admin@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm text-stone-400 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg bg-stone-800 border border-stone-600 text-stone-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@app/actions/auth";

export function AdminNav() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <nav className="border-b border-stone-700 bg-stone-900/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/admin" className="text-stone-100 font-semibold">
          HIIT Gym Admin
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/customers"
            className="text-stone-400 hover:text-stone-100 text-sm"
          >
            Customers
          </Link>
          <Link
            href="/admin/plans"
            className="text-stone-400 hover:text-stone-100 text-sm"
          >
            Plans
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-stone-400 hover:text-red-400 text-sm"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}

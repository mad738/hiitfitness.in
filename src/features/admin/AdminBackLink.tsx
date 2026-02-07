"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminBackLink() {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname === "/admin/") return null;

  return (
    <div className="mb-4 sm:mb-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm font-semibold text-stone-400 hover:text-brand-red transition-colors group"
      >
        <span className="transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden>
          ←
        </span>
        <span>Back to Dashboard</span>
      </Link>
    </div>
  );
}

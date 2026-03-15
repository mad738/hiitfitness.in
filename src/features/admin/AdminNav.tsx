"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "@app/actions/auth";

const navLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/trainers", label: "Trainers" },
  { href: "/admin/plans", label: "Plans" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/credentials", label: "Admin users" },
] as const;

export function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      {/* Desktop: fixed left sidebar */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 bottom-0 z-50 w-[var(--admin-sidebar-width)] flex-col border-r border-stone-800/80 bg-black/95 backdrop-blur-md"
        aria-label="Admin navigation"
      >
        <div className="flex flex-col flex-1 min-h-0 p-4">
          <Link
            href="/admin"
            className="flex items-center gap-3 shrink-0 pb-6 border-b border-stone-800/80 mb-6"
            aria-label="HIIT Fitness Admin"
          >
            <Image
              src="/images/99558_FLAT_JP_AC_03-nobg-cropped.svg"
              alt=""
              width={80}
              height={80}
              className="h-12 w-12 shrink-0 object-contain"
              aria-hidden
            />
            <span className="flex flex-col justify-center leading-tight min-w-0">
              <span className="font-display text-lg font-bold uppercase text-white tracking-tight">
                HIIT FITNESS
              </span>
              <span className="font-sans text-[10px] font-bold uppercase text-brand-red tracking-tight mt-0.5 leading-tight">
                HIGH INTENSITY INTERVAL TRAINING
              </span>
            </span>
          </Link>

          <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
            {navLinks.map(({ href, label }) => {
              const active =
                pathname === href ||
                (href !== "/admin" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-xl px-3 py-2.5 text-sm font-semibold border-l-2 transition-all duration-200 ease-out ${
                    active
                      ? "bg-brand-red/20 text-stone-100 border-l-4 border-brand-red shadow-[0_0_20px_rgba(238,42,36,0.15)]"
                      : "border-transparent text-stone-400 hover:text-stone-100 hover:bg-white/10 hover:border-l-4 hover:border-brand-red/70 hover:translate-x-1 hover:shadow-[0_0_18px_rgba(238,42,36,0.12)]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="shrink-0 pt-4 mt-4 border-t border-stone-800/80 space-y-3">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-400 transition-all duration-200 hover:text-brand-red hover:bg-white/10 hover:translate-x-1 hover:shadow-[0_0_12px_rgba(238,42,36,0.1)] text-left"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile: fixed top header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-stone-800/80 bg-black/90 backdrop-blur-md">
        <nav className="flex items-center justify-between h-[var(--header-height)] px-3 sm:px-6 gap-2 min-h-0">
          <Link
            href="/admin"
            className="flex items-center gap-2 sm:gap-3 tracking-tight min-w-0 flex-1 sm:flex-initial"
            aria-label="HIIT Fitness Admin"
          >
            <Image
              src="/images/99558_FLAT_JP_AC_03-nobg-cropped.svg"
              alt=""
              width={80}
              height={80}
              className="h-11 w-11 min-h-11 min-w-11 sm:h-14 sm:w-14 shrink-0 object-contain"
              aria-hidden
            />
            <span className="flex flex-col justify-center leading-tight text-center min-w-0 flex-1 overflow-hidden">
              <span className="font-display text-base sm:text-lg font-bold uppercase text-white tracking-tight">
                HIIT FITNESS
              </span>
              <span className="font-sans text-[9px] sm:text-[10px] font-bold uppercase text-brand-red tracking-tight mt-0.5 sm:mt-1 whitespace-nowrap">
                HIGH INTENSITY INTERVAL TRAINING
              </span>
            </span>
          </Link>

          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-stone-800 bg-stone-900/30 hover:bg-stone-900/50 transition shrink-0"
          >
            <span className="sr-only">Menu</span>
            <div className="flex flex-col gap-1">
              <span className="block h-[2px] w-5 bg-stone-200" />
              <span className="block h-[2px] w-5 bg-stone-200/80" />
              <span className="block h-[2px] w-5 bg-stone-200/60" />
            </div>
          </button>
        </nav>

        {mobileOpen && (
          <div className="border-t border-stone-800/80 bg-black/95 backdrop-blur-md">
            <div className="px-4 sm:px-6 py-3 flex flex-col gap-2">
              {navLinks.map(({ href, label }) => {
                const active =
                  pathname === href ||
                  (href !== "/admin" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-base font-semibold transition ${
                      active
                        ? "bg-stone-900/50 text-stone-100 border border-stone-800"
                        : "text-stone-300 hover:bg-stone-900/30"
                    }`}
                  >
                    {label}
                    {active && (
                      <span className="h-2 w-2 rounded-full bg-brand-red shadow-[0_0_18px_rgba(238,42,36,0.4)]" />
                    )}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  handleSignOut();
                }}
                className="flex items-center rounded-xl px-3 py-2 text-base font-semibold text-stone-400 hover:text-brand-red hover:bg-stone-900/30 transition text-left w-full"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

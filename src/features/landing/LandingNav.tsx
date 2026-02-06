"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

export function LandingNav() {
  const sections = useMemo(
    () =>
      [
        { id: "facilities", label: "Facilities" },
        { id: "plans", label: "Plans" },
        { id: "contact", label: "Contact" },
      ] as const,
    []
  );

  const [active, setActive] = useState<string>("facilities");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((x): x is HTMLElement => Boolean(x));

    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        if (visible?.target?.id) setActive(visible.target.id);
      },
      {
        root: null,
        threshold: [0.2, 0.35, 0.5, 0.65],
        rootMargin: "-20% 0px -65% 0px",
      }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  // Close mobile menu on hash navigation.
  useEffect(() => {
    const onHashChange = () => setMobileOpen(false);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const linkClass = (id: string) =>
    [
      "text-sm md:text-base font-semibold transition relative",
      active === id ? "text-stone-100" : "text-stone-400 hover:text-stone-100",
    ].join(" ");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-stone-800/80 bg-stone-950/90 backdrop-blur-md">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-[var(--header-height)]">
        <Link href="/" className="flex items-center gap-2 md:gap-3 text-lg md:text-2xl font-bold text-stone-100 tracking-tight">
          <Image src="/images/icon.png" alt="HIIT Gym" width={48} height={48} className="h-9 w-9 md:h-12 md:w-12 shrink-0" />
          <span>HIIT <span className="text-red-400">GYM</span></span>
        </Link>
        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className={linkClass(s.id)}>
              {s.label}
              {active === s.id && (
                <span className="absolute -bottom-2 left-0 right-0 h-[2px] rounded-full bg-red-500 shadow-[0_0_18px_rgba(239,68,68,0.4)]" />
              )}
            </a>
          ))}
          <Link
            href="/admin/login"
            className="text-stone-500 hover:text-stone-300 text-base"
          >
            Staff
          </Link>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-3">
          <Link href="/admin/login" className="text-stone-500 hover:text-stone-300 text-base">
            Staff
          </Link>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-stone-800 bg-stone-900/30 hover:bg-stone-900/50 transition"
          >
            <span className="sr-only">Menu</span>
            <div className="flex flex-col gap-1">
              <span className="block h-[2px] w-5 bg-stone-200" />
              <span className="block h-[2px] w-5 bg-stone-200/80" />
              <span className="block h-[2px] w-5 bg-stone-200/60" />
            </div>
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-stone-800/80 bg-stone-950/95 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-2">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={[
                  "flex items-center justify-between rounded-xl px-3 py-2 text-base font-semibold transition",
                  active === s.id
                    ? "bg-stone-900/50 text-stone-100 border border-stone-800"
                    : "text-stone-300 hover:bg-stone-900/30",
                ].join(" ")}
              >
                {s.label}
                {active === s.id && (
                  <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_18px_rgba(239,68,68,0.4)]" />
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

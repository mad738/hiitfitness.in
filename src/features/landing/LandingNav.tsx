"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useMobileHeader } from "@/features/landing/MobileHeaderContext";

export function LandingNav() {
  const { headerHidden, isMobile } = useMobileHeader();
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
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b border-stone-800/80 bg-black/90 backdrop-blur-md transition-transform duration-300 ease-out ${
        isMobile && headerHidden ? "-translate-y-full" : ""
      }`}
    >
      <nav className="max-w-6xl mx-auto px-3 sm:px-6 flex items-center justify-between h-[var(--header-height)] gap-2 min-h-0">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 tracking-tight min-w-0 flex-1 sm:flex-initial" aria-label="HIIT Fitness – High intensity interval training">
          <Image src="/images/99558_FLAT_JP_AC_03-nobg-cropped.svg" alt="" width={80} height={80} className="h-11 w-11 min-h-11 min-w-11 sm:h-14 sm:w-14 md:h-20 md:w-20 shrink-0 object-contain" aria-hidden />
          <span className="flex flex-col justify-center leading-tight text-center min-w-0 flex-1 overflow-hidden">
            <span className="font-display text-base sm:text-lg md:text-2xl lg:text-3xl font-bold uppercase text-white tracking-tight">HIIT FITNESS</span>
            <span className="font-sans text-[9px] lg:text-xs font-bold uppercase text-brand-red tracking-tight mt-0.5 sm:mt-1 whitespace-nowrap">HIGH INTENSITY INTERVAL TRAINING</span>
          </span>
        </Link>
        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8 shrink-0">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className={linkClass(s.id)}>
              {s.label}
              {active === s.id && (
                <span className="absolute -bottom-2 left-0 right-0 h-[2px] rounded-full bg-brand-red shadow-[0_0_18px_rgba(255,0,0,0.4)]" />
              )}
            </a>
          ))}
          <Link
            href="/admin/login"
            className="text-stone-500 hover:text-stone-300 text-base"
          >
            Admin
          </Link>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center shrink-0">
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
        <div className="md:hidden border-t border-stone-800/80 bg-black/95 backdrop-blur-md">
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
                  <span className="h-2 w-2 rounded-full bg-brand-red shadow-[0_0_18px_rgba(255,0,0,0.4)]" />
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

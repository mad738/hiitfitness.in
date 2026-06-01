"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram, Youtube } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMobileHeader } from "@/features/landing/MobileHeaderContext";

export function LandingNav() {
  const { headerHidden, isMobile } = useMobileHeader();
  const sections = useMemo(
    () =>
      [
        { id: "facilities", label: "Facilities" },
        { id: "programs", label: "Programs" },
        { id: "plans", label: "Plans" },
        { id: "branches", label: "Branches" },
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
      active === id ? "text-white" : "text-white/80 hover:text-white",
    ].join(" ");

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b border-stone-800 bg-black backdrop-blur-md transition-transform duration-300 ease-out ${isMobile && headerHidden ? "-translate-y-full" : ""
        }`}
    >
      <nav className="max-w-6xl mx-auto px-3 sm:px-6 flex items-center justify-between h-[var(--header-height)] gap-2 min-h-0">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 tracking-tight min-w-0 flex-1 sm:flex-initial" aria-label="HIIT Fitness – High intensity interval training">
          <Image src="/images/99558_FLAT_JP_AC_03-nobg-cropped.svg" alt="" width={80} height={80} className="h-12 w-12 min-h-12 min-w-12 sm:h-14 sm:w-14 md:h-20 md:w-20 shrink-0 object-contain" aria-hidden />
          <span className="flex flex-col justify-center leading-tight text-center min-w-0 flex-1 overflow-visible">
            <span className="font-display text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold uppercase text-white tracking-tight drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] [text-shadow:0_0_20px_rgba(255,255,255,0.3)]">HIIT FITNESS</span>
            <span className="font-sans text-xs sm:text-xs lg:text-xs font-bold uppercase text-brand-red tracking-tight mt-0.5 sm:mt-1 whitespace-nowrap drop-shadow-[0_0_10px_rgba(255,0,0,0.5)] [text-shadow:0_0_14px_rgba(255,0,0,0.4)]">HIGH INTENSITY INTERVAL TRAINING</span>
          </span>
        </Link>
        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8 shrink-0">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className={linkClass(s.id)}>
              {s.label}
              {active === s.id && (
                <span className="absolute -bottom-2 left-0 right-0 h-[2px] rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.4)]" />
              )}
            </a>
          ))}


          <div className="flex items-center gap-4 ml-6 pl-6 border-l border-stone-800">
            <a
              href="https://www.instagram.com/hiitfitness01?igsh=MWt5Y29ueXM5bDMwcw=="
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-[#EE2A24] transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://youtube.com/@hiit_fitness?si=P0vvcx4SiFozU5QH"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-[#EE2A24] transition-colors"
              aria-label="YouTube"
            >
              <Youtube className="w-5 h-5" />
            </a>
          </div>
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
        <div className="md:hidden border-t border-stone-800 bg-black backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-2">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={[
                  "flex items-center justify-between rounded-xl px-3 py-2 text-base font-semibold transition",
                  active === s.id
                    ? "bg-stone-800/50 text-white border border-stone-700"
                    : "text-white/80 hover:bg-stone-800/30",
                ].join(" ")}
              >
                {s.label}
                {active === s.id && (
                  <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.4)]" />
                )}
              </a>
            ))}

            {/* Mobile Social Links */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-stone-800 px-3">
              <a
                href="https://www.instagram.com/hiitfitness01?igsh=MWt5Y29ueXM5bDMwcw=="
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-white/80 hover:text-[#EE2A24] transition-colors"
              >
                <Instagram className="w-6 h-6" />
                <span className="font-semibold">Instagram</span>
              </a>
              <a
                href="https://youtube.com/@hiit_fitness?si=P0vvcx4SiFozU5QH"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-white/80 hover:text-[#EE2A24] transition-colors"
              >
                <Youtube className="w-6 h-6" />
                <span className="font-semibold">YouTube</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

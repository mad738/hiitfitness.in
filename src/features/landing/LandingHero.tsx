"use client";

import Link from "next/link";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

export function LandingHero() {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center px-4 sm:px-6 pt-[calc(var(--header-height)+var(--header-content-gap)+3.25rem)] md:pt-[calc(var(--header-height)+var(--header-content-gap))] overflow-hidden bg-black text-center">
      {/* Background Image & Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/images/HIIT_GYM3.jpg')` }}
      />
      <div className="absolute inset-0 z-[1] bg-black/70" />

      <AnimateOnScroll rootMargin="0px 0px -20px 0px" className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center justify-center pt-10">
        <h1 className="font-display text-5xl sm:text-7xl md:text-[90px] lg:text-[110px] font-black tracking-tighter mb-10 leading-[0.85] sm:leading-[0.9] uppercase text-[#EE2A24] drop-shadow-md">
          EARN YOUR <br />
          NEXT PR <br />
          EVERY <br />
          SESSION
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center w-full max-w-lg mx-auto">
          <Link
            href="https://wa.me/918111977114?text=Hi!%20I'm%20interested%20in%20joining%20the%20community%20at%20HIIT%20Fitness."
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center min-h-[3.5rem] px-8 rounded-sm text-sm sm:text-base font-extrabold transition uppercase tracking-wide bg-[#EE2A24] text-white hover:bg-red-700 shadow-[0_0_15px_rgba(238,42,36,0.3)] hover:-translate-y-1"
          >
            JOIN COMMUNITY
          </Link>
          <Link
            href="#videos"
            className="flex-1 inline-flex items-center justify-center min-h-[3.5rem] px-8 rounded-sm text-sm sm:text-base font-extrabold transition uppercase tracking-wide bg-[#EE2A24] text-white hover:bg-red-700 shadow-[0_0_15px_rgba(238,42,36,0.3)] hover:-translate-y-1"
          >
            OUR COMMUNITY
          </Link>
        </div>
      </AnimateOnScroll>
    </section>
  );
}

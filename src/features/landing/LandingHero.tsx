"use client";

import Link from "next/link";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

export function LandingHero() {
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center px-4 sm:px-6 pt-[calc(var(--header-height)+var(--header-content-gap)+3.25rem)] md:pt-[calc(var(--header-height)+var(--header-content-gap))] overflow-hidden bg-black text-center">
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
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center w-full max-w-md mx-auto">
          <Link
            href="https://wa.me/919996667714?text=Hi!%20I'm%20interested%20in%20joining%20the%20community%20at%20HIIT%20Fitness."
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex-1 inline-flex items-center justify-center min-h-[2.75rem] sm:min-h-[3rem] px-6 rounded-sm text-xs sm:text-sm font-black transition-all uppercase tracking-[0.15em] text-white bg-[#EE2A24] border border-[#EE2A24] overflow-hidden shadow-[0_0_15px_rgba(238,42,36,0.4)] hover:shadow-[0_0_30px_rgba(238,42,36,0.8)] hover:scale-[1.02]"
          >
            {/* Shimmer effect */}
            <span className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            <span className="relative z-10 flex items-center gap-2">
                JOIN COMMUNITY
                <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7" /></svg>
            </span>
          </Link>
          <Link
            href="#videos"
            className="group relative flex-1 inline-flex items-center justify-center min-h-[2.75rem] sm:min-h-[3rem] px-6 rounded-sm text-xs sm:text-sm font-black transition-all uppercase tracking-[0.15em] text-[#EE2A24] bg-black/60 backdrop-blur-md border border-[#EE2A24]/60 hover:border-[#EE2A24] hover:text-white overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(238,42,36,0.4)] hover:scale-[1.02]"
          >
            {/* Slide fill effect */}
            <span className="absolute inset-0 bg-[#EE2A24] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out z-0" />
            <span className="relative z-10 flex items-center gap-2">
                OUR COMMUNITY
            </span>
          </Link>
        </div>
      </AnimateOnScroll>
    </section>
  );
}

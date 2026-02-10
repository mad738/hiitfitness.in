"use client";

import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { ServicesCarousel } from "@/components/ServicesCarousel";

export function LandingServices() {
  return (
    <section
      id="services"
      className="py-16 sm:py-24 px-4 sm:px-6 scroll-mt-[var(--header-height)]"
    >
      <AnimateOnScroll className="max-w-5xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-stone-50 mb-4">
            Our Services
          </h2>
          <p className="text-stone-300/80 max-w-2xl mx-auto">
            From fat burn to strength and HIIT — programs built for results.
          </p>
        </div>
        <ServicesCarousel />
      </AnimateOnScroll>
    </section>
  );
}

"use client";

import Image from "next/image";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { MobileInViewHover } from "@/components/ui/mobile-in-view-hover";

const facilities = [
  {
    title: "Cardio & training floor",
    description:
      "Treadmills, ellipticals, and cardio machines in a spacious layout. Linear LED lighting and dedicated zones so you can focus — morning or evening slots, no crowding.",
    imageSrc: "/images/HIIT_GYM.jpg",
    alt: "Gym cardio section with treadmills and ellipticals, strength area in background, modern LED lighting",
  },
  {
    title: "Functional training station",
    description:
      "Multi-station cable machine with adjustable pulleys and weight stacks. Versatile for rows, presses, and cable work — plus on-machine exercise guides so you train right.",
    imageSrc: "/images/functional_station_generated.png",
    alt: "Functional trainer cable machine with pulleys and weight stacks in modern gym",
  },
  {
    title: "Free weights area",
    description:
      "Full range of dumbbells from light to heavy, neatly racked. Rubber flooring for grip and safety, with mirrors and focused lighting so you can train with confidence.",
    imageSrc: "/images/HIIT_GYM4.jpg",
    alt: "Dumbbell racks and free weights section with professional rubber flooring",
  },
] as const;

export function LandingFacilities() {
  return (
    <section id="facilities" className="py-16 sm:py-24 px-4 sm:px-6 bg-stone-50 scroll-mt-[var(--header-height)]">
      <AnimateOnScroll className="max-w-4xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#EE2A24] mb-4">
            Infrastructure that hits different
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 justify-items-center max-w-3xl mx-auto">
          {facilities.map((f) => (
            <div key={f.title} className="w-full max-w-[280px] sm:max-w-xs">
              <MobileInViewHover className="w-full p-2 md:p-0">
                <article
                  className="bg-white overflow-hidden rounded-xl shadow-md border border-red-100 transition-all duration-300 ease-out hover:scale-[1.04] hover:border-[#EE2A24] hover:shadow-xl"
                >
                  <div className="relative aspect-[16/10] bg-stone-100">
                    <Image
                      src={f.imageSrc}
                      alt={f.alt}
                      fill
                      className="object-cover"
                      priority={false}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-4 border-t border-stone-100">
                    <h3 className="text-base font-bold text-black mb-1.5 leading-tight">
                      {f.title}
                    </h3>
                    <p className="text-stone-600 text-[11px] leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                </article>
              </MobileInViewHover>
            </div>
          ))}
        </div>
      </AnimateOnScroll>
    </section>
  );
}


"use client";

import Image from "next/image";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { MobileInViewHover } from "@/components/ui/mobile-in-view-hover";

const programs = [
    {
        title: "Personal Training",
        description: "1-on-1 sessions tailored to your goals and biology. Precision programming for ultimate results.",
        imageSrc: "/images/HIIT_GYM3.jpg",
        alt: "Personal Training",
    },
    {
        title: "Small Group",
        description: "High energy, community-driven motivation. Train with 4-6 individuals pushing the same limits.",
        imageSrc: "/images/HIIT_GYM4.jpg",
        alt: "Small Group Training",
    },
    {
        title: "Strength & Cond.",
        description: "Athlete-level programming focusing on power, agility, and overall endurance.",
        imageSrc: "/images/HIIT_GYM.jpg",
        alt: "Strength and Conditioning",
    },
];

export function LandingPrograms() {
    return (
        <section id="programs" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#EE2A24] scroll-mt-[var(--header-height)]">
            <AnimateOnScroll className="max-w-4xl mx-auto">
                <div className="text-center mb-10 sm:mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                        Our Elite Programs
                    </h2>
                    <p className="text-white/80 max-w-2xl mx-auto font-medium">
                        Designed for those who demand excellence. Find the right path to forge your strength.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 justify-items-center max-w-3xl mx-auto">
                    {programs.map((p) => (
                        <div key={p.title} className="w-full max-w-[280px] sm:max-w-xs">
                            <MobileInViewHover className="w-full p-2 md:p-0">
                                <article
                                    className="bg-black overflow-hidden rounded-xl shadow-md border border-stone-800 transition-all duration-300 ease-out hover:-translate-y-2 hover:border-white/20 hover:shadow-xl group"
                                >
                                    <div className="relative aspect-[4/3] bg-stone-900 overflow-hidden">
                                        <Image
                                            src={p.imageSrc}
                                            alt={p.alt}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                    </div>
                                    <div className="p-4 relative -mt-8">
                                        <h3 className="text-base font-bold text-white mb-1.5">
                                            {p.title}
                                        </h3>
                                        <p className="text-stone-300 text-[11px] leading-relaxed">
                                            {p.description}
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

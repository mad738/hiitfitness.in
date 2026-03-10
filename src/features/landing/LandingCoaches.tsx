"use client";

import Image from "next/image";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { MobileInViewHover } from "@/components/ui/mobile-in-view-hover";

const coaches = [
    {
        name: "Mark Thompson",
        role: "Head Strength Coach",
        imageSrc: "/images/HIIT_GYM.jpg",
    },
    {
        name: "Sarah Jenkins",
        role: "HIIT Specialist",
        imageSrc: "/images/HIIT_GYM3.jpg",
    },
    {
        name: "Alex Rodriguez",
        role: "Performance Nutritionist",
        imageSrc: "/images/HIIT_GYM4.jpg",
    },
    {
        name: "Elena Vance",
        role: "Mobility & Recovery",
        imageSrc: "/images/HIIT_GYM.jpg", // re-using image
    },
];

export function LandingCoaches() {
    return (
        <section id="coaches" className="py-16 sm:py-24 px-4 sm:px-6 bg-stone-100 scroll-mt-[var(--header-height)]">
            <AnimateOnScroll className="max-w-6xl mx-auto">
                <div className="text-center mb-10 sm:mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#EE2A24] mb-4">
                        Expert Coaches
                    </h2>
                    <p className="text-stone-700 max-w-2xl mx-auto font-medium">
                        Train with the elite. Our coaching staff applies the latest sports science and methodology.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {coaches.map((c) => (
                        <div key={c.name} className="flex justify-center w-full">
                            <MobileInViewHover className="w-full">
                                <article className="bg-white overflow-hidden rounded-2xl shadow-sm border border-stone-200 text-center transition-all hover:border-[#EE2A24] hover:shadow-lg">
                                    <div className="relative aspect-[3/4] bg-stone-200">
                                        <Image
                                            src={c.imageSrc}
                                            alt={c.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="p-5">
                                        <h3 className="text-lg font-bold text-black mb-1">
                                            {c.name}
                                        </h3>
                                        <p className="text-sm font-semibold text-[#EE2A24]">
                                            {c.role}
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

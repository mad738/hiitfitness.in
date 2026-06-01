"use client";

import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

const values = [
    {
        title: "Integrity",
        description: "Honest work and transparent results. No shortcuts, just dedication to the process.",
    },
    {
        title: "Discipline",
        description: "Success earned through daily commitment. We value consistency over intensity.",
    },
    {
        title: "Community",
        description: "Training alongside like-minded individuals. We push each other to reach new heights.",
    },
    {
        title: "Innovation",
        description: "Latest sports science and methodology. Constantly evolving to bring you the best.",
    },
];

export function LandingPhilosophy() {
    return (
        <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white border-y border-stone-200">
            <AnimateOnScroll className="max-w-6xl mx-auto">
                <div className="text-center mb-12 sm:mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#EE2A24] mb-4">
                        Built on discipline. Driven by results.
                    </h2>
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                    {values.map((v) => (
                        <div key={v.title} className="bg-white rounded-xl p-6 border-2 border-[#EE2A24] shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                            <h3 className="text-xl font-bold text-[#EE2A24] mb-3 uppercase tracking-wide">
                                {v.title}
                            </h3>
                            <p className="text-stone-600 text-sm md:text-base leading-relaxed font-medium">
                                {v.description}
                            </p>
                        </div>
                    ))}
                </div>
            </AnimateOnScroll>
        </section>
    );
}

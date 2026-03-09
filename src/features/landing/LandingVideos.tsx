"use client";

import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

const videos = [
    {
        id: "v1",
        title: "High Intensity Group Training",
        src: "https://www.youtube.com/embed/v7AYKMP6rOE"
    }, // Some generic fitness video ID
    {
        id: "v2",
        title: "Strength Conditioning Masterclass",
        src: "https://www.youtube.com/embed/yG1K_lQ538M"
    },
    {
        id: "v3",
        title: "Functional Fitness Floor",
        src: "https://www.youtube.com/embed/cb3H3a4k-4g"
    },
];

export function LandingVideos() {
    return (
        <section id="videos" className="py-16 sm:py-24 px-4 sm:px-6 bg-black text-white scroll-mt-[var(--header-height)]">
            <AnimateOnScroll className="max-w-4xl mx-auto">
                <div className="text-center mb-10 sm:mb-16">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-[#EE2A24] mb-3 tracking-tight uppercase">
                        See Us In Action
                    </h2>
                    <p className="text-white/80 text-lg md:text-xl font-medium">
                        Watch our members push their limits and transform their lives.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
                    {videos.map((vid) => (
                        <div
                            key={vid.id}
                            className="relative aspect-video rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(238,42,36,0.15)] border border-stone-800 transition-all hover:-translate-y-1 hover:border-[#EE2A24]"
                        >
                            {/* Fallback styling for the embed container */}
                            <div className="absolute inset-0 bg-stone-900 flex items-center justify-center -z-10">
                                <span className="text-stone-700 font-bold">Loading Video...</span>
                            </div>
                            <iframe
                                className="absolute inset-0 w-full h-full z-10"
                                src={vid.src}
                                title={vid.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                loading="lazy"
                                allowFullScreen
                            />
                        </div>
                    ))}
                </div>
            </AnimateOnScroll>
        </section>
    );
}

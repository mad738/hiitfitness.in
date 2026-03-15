"use client";

import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

const testimonials = [
    {
        name: "Jason Miller",
        review: "The world-class equipment and elite atmosphere here are unmatched. Every session pushes me further.",
    },
    {
        name: "Emma Richards",
        review: "The expert coaching and community support keep me coming back. A true game-changer for my journey.",
    },
    {
        name: "David Chen",
        review: "Finally found a gym that takes performance seriously. The HIIT sessions are high-octane and results-driven.",
    },
    {
        name: "Sarah Vane",
        review: "Best community I've ever been part of. Everyone is focused, disciplined, and incredibly supportive.",
    },
    {
        name: "Marcus Thorne",
        review: "The strength facilities are top-tier. I've hit all my PR goals within the first three months here.",
    },
    {
        name: "Aisha Khan",
        review: "Transformation programs are scientific and effective. I feel stronger and more energetic than ever.",
    },
];

export function LandingTestimonials() {
    return (
        <section id="testimonials" className="py-16 sm:py-24 px-4 sm:px-6 bg-black text-white scroll-mt-[var(--header-height)] border-b border-[#EE2A24]">
            <AnimateOnScroll className="max-w-4xl mx-auto">
                <div className="text-center mb-10 sm:mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#EE2A24] mb-4 uppercase tracking-tight">
                        Member Testimonials
                    </h2>
                    <p className="text-stone-300 max-w-2xl mx-auto font-medium">
                        Real results from our dedicated community members.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((t) => (
                        <div key={t.name} className="bg-stone-900/50 border border-stone-800 rounded-xl p-6 relative hover:border-[#EE2A24] transition-all group">
                            <span className="absolute -top-4 -left-1 text-5xl text-[#EE2A24] opacity-30 font-serif leading-none group-hover:opacity-60 transition-opacity">
                                &quot;
                            </span>
                            <p className="text-stone-300 text-sm italic mb-6 relative z-10 leading-relaxed">
                                {t.review}
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center font-bold text-base uppercase border border-[#EE2A24]">
                                    {t.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-white">{t.name}</h4>
                                    <div className="text-[#EE2A24] text-[10px] font-bold uppercase tracking-wider">Member</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </AnimateOnScroll>
        </section>
    );
}


"use client";

import { useState, useEffect } from "react";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

const testimonials = [
    {
        name: "SamRam",
        review: "The gym offers a clean and well-maintained environment with modern equipment and a motivating atmosphere. Trainers are knowledgeable, supportive, and provide personalized guidance. The staff is friendly and always ready to help.",
    },
    {
        name: "Kiranmai vattiprolu",
        review: "Amazing gym and trainers! Every day we get different and effective workouts that keep things exciting.",
    },
    {
        name: "Sai Vamsi Kode",
        review: "This gym has taken my fitness to the next level. The equipment is perfect for building muscle and burning fat, and seeing others work hard keeps me motivated. Having access to trainers has helped me fine tune my workouts and nutrition.",
    },
    {
        name: "jeji gopal",
        review: "I absolutely love this gym! The facilities are top-notch and always clean. The variety of equipment caters to everyone, from beginners to advanced athletes, and there’s never a long wait. The staff is incredibly friendly and knowledgeable.",
    },
    {
        name: "CHINTA HIMAJA",
        review: "Hey all…😊 Actually my brother and me have recently joined this HIIT Fitness and we must say, we were thoroughly impressed..",
    },
    {
        name: "chenna clinical",
        review: "I have been going to HIIT FITNESS currency nagar from past 3 Months. I am completely new to the gym workouts. I do a desk job where I need to sit for hours together, so gradually my body feels much better.",
    }
];

export function LandingTestimonials() {
    const [api, setApi] = useState<CarouselApi>();

    useEffect(() => {
        if (!api) return;

        const interval = setInterval(() => {
            api.scrollNext();
        }, 4000);

        return () => clearInterval(interval);
    }, [api]);

    return (
        <section id="testimonials" className="py-8 sm:py-12 px-4 sm:px-6 bg-black text-white scroll-mt-[var(--header-height)] border-b border-[#EE2A24]">
            <AnimateOnScroll className="max-w-5xl mx-auto">
                <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-[#EE2A24] mb-2 uppercase tracking-tight">
                        Member Testimonials
                    </h2>
                    <p className="text-stone-300 max-w-2xl mx-auto font-medium text-xs sm:text-sm">
                        Real results and experiences from our dedicated community members.
                    </p>
                </div>

                <div className="max-w-xl mx-auto px-4 relative">
                    <Carousel
                        setApi={setApi}
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent>
                            {testimonials.map((t) => (
                                <CarouselItem key={t.name} className="flex justify-center p-1">
                                    <div className="w-full bg-stone-900/30 backdrop-blur-sm border border-stone-850 rounded-xl p-4 sm:p-6 relative hover:border-[#EE2A24] transition-all group shadow-xl hover:shadow-[0_0_20px_rgba(238,42,36,0.06)] flex flex-col items-center text-center">
                                        <span className="text-4xl text-[#EE2A24] opacity-30 font-serif leading-none mb-2 select-none">
                                            &ldquo;
                                        </span>
                                        <p className="text-stone-200 text-xs sm:text-sm italic mb-4 relative z-10 leading-relaxed font-medium">
                                            {t.review}
                                        </p>
                                        <div className="flex flex-col items-center gap-2 border-t border-stone-800/80 pt-4 w-full max-w-xs justify-center">
                                            <div className="w-8 h-8 bg-stone-800 rounded-full flex items-center justify-center font-bold text-xs uppercase border border-[#EE2A24] shadow-[0_0_10px_rgba(238,42,36,0.2)] text-white">
                                                {t.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-extrabold text-xs text-white tracking-wide leading-none">{t.name}</h4>
                                                <div className="text-[#EE2A24] text-[9px] font-bold uppercase tracking-wider mt-1">Member</div>
                                            </div>
                                        </div>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <div className="flex justify-center gap-3 mt-4">
                            <CarouselPrevious className="static translate-y-0 h-8 w-8 border-stone-800 hover:border-[#EE2A24]/50 hover:bg-[#EE2A24]/10 text-white hover:text-white" />
                            <CarouselNext className="static translate-y-0 h-8 w-8 border-stone-800 hover:border-[#EE2A24]/50 hover:bg-[#EE2A24]/10 text-white hover:text-white" />
                        </div>
                    </Carousel>
                </div>
            </AnimateOnScroll>
        </section>
    );
}


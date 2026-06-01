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
        }, 6000);

        return () => clearInterval(interval);
    }, [api]);

    return (
        <section id="testimonials" className="py-8 sm:py-12 px-4 sm:px-6 bg-black text-white scroll-mt-[var(--header-height)] border-b border-[#EE2A24]">
            <AnimateOnScroll className="max-w-5xl mx-auto">
                <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-[#EE2A24] mb-2 uppercase tracking-tight">
                        Member Testimonials
                    </h2>
                </div>

                <div className="max-w-6xl mx-auto relative px-4 sm:px-6">
                    <Carousel
                        setApi={setApi}
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-2 sm:-ml-4">
                            {testimonials.map((t) => (
                                <CarouselItem key={t.name} className="pl-2 sm:pl-4 md:basis-1/2 lg:basis-1/3">
                                    <div className="h-full bg-stone-900/40 backdrop-blur-md border border-stone-800 rounded-2xl p-6 sm:p-8 relative hover:border-[#EE2A24]/60 transition-all duration-300 group shadow-lg flex flex-col justify-between">
                                        <div>
                                            <span className="text-6xl text-[#EE2A24] opacity-30 font-serif leading-none absolute top-4 left-4 select-none">
                                                &ldquo;
                                            </span>
                                            <p className="text-stone-300 text-sm sm:text-base italic mb-6 relative z-10 leading-relaxed font-medium mt-6">
                                                {t.review}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 pt-5 border-t border-stone-800/80 mt-auto w-full">
                                            <div className="w-12 h-12 bg-gradient-to-br from-stone-800 to-stone-900 rounded-full flex items-center justify-center font-bold text-lg uppercase border border-[#EE2A24]/40 shadow-inner text-white shrink-0 group-hover:scale-110 transition-transform duration-300">
                                                {t.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-extrabold text-sm text-white tracking-wide">{t.name}</h4>
                                                <div className="text-[#EE2A24] text-[10px] font-bold uppercase tracking-wider mt-1">Verified Member</div>
                                            </div>
                                        </div>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <div className="flex justify-center gap-4 mt-8">
                            <CarouselPrevious className="static translate-y-0 h-10 w-10 border-stone-700 bg-stone-900 hover:border-[#EE2A24] hover:bg-[#EE2A24] text-white transition-colors" />
                            <CarouselNext className="static translate-y-0 h-10 w-10 border-stone-700 bg-stone-900 hover:border-[#EE2A24] hover:bg-[#EE2A24] text-white transition-colors" />
                        </div>
                    </Carousel>
                </div>
            </AnimateOnScroll>
        </section>
    );
}


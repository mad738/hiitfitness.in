"use client";

import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

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
    },
    {
        name: "V G Sankar Sai Pasupuleti",
        review: "I've been a member of HIIT FITNESS for 2 Months and I can confidently say it's one of the best gyms I've ever been to!",
    },
    {
        name: "RAMAVATH SIDDHARDHA",
        review: "One of the best gyms in the area! The equipment is well-maintained, trainers are very supportive (specially SANDEEP BRO & LOKESH BRO), and the environment is super motivating. Perfect place for beginners as well as regular lifters.",
    },
    {
        name: "Sharon Perla",
        review: "This gym is awesome and has top and advanced equipment with great environment and the trainers are well qualified. “Your body is your weapon keep it strong”. So, burn and sharpen your weapon in HIIT FITNESS.",
    },
    {
        name: "Poojitha Tadikonda",
        review: "HIIT Fitness Gym is one of the best gyms with great facilities and motivating atmosphere. Mr.KK is an amazing trainer who guides with perfect techniques and pushes you to achieve your goals.",
    },
    {
        name: "Adithya Alajangi",
        review: "This is honestly the best gym I’ve been to! The equipment is well-maintained, the trainers are highly supportive, and the atmosphere is always motivating. It’s a really good place for both beginners and advanced fitness enthusiasts.",
    },
    {
        name: "Suresh Chavitlo",
        review: "Joining personal training with Trainer Manoj was one of the best decisions I’ve made. The sessions are focused, fun, and perfectly suited to my fitness level.",
    },
    {
        name: "pullarao Kanneganti",
        review: "The equipment is perfect and always in working order. The gym is very neat and spacious, which makes for a great workout.",
    },
    {
        name: "Grandhi M",
        review: "KK is an outstanding trainer who truly cares about his clients’ progress. His guidance is clear, motivating, and tailored to individual needs.",
    },
    {
        name: "SYAM PEDDIPAGA",
        review: "Well place to workout. HIIT fitness Ramavarappadu. Certified trainers are available in the gym, nice equipments. My trainer Lokesh pushed me to start Fitness Journey tq Trainer and HIIT Fitness 💥",
    }
];

export function LandingTestimonials() {
    return (
        <section id="testimonials" className="py-16 sm:py-24 px-4 sm:px-6 bg-black text-white scroll-mt-[var(--header-height)] border-b border-[#EE2A24]">
            <AnimateOnScroll className="max-w-7xl mx-auto">
                <div className="text-center mb-10 sm:mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-[#EE2A24] mb-4 uppercase tracking-tight">
                        Member Testimonials
                    </h2>
                    <p className="text-stone-300 max-w-2xl mx-auto font-medium">
                        Real results and experiences from our dedicated community members.
                    </p>
                </div>

                {/* Using a columns layout for a masonry effect with varying heights */}
                <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 sm:gap-6 space-y-4 sm:space-y-6 max-w-6xl mx-auto">
                    {testimonials.map((t) => (
                        <div key={t.name} className="break-inside-avoid w-full bg-stone-900/50 border border-stone-800 rounded-xl p-5 relative hover:border-[#EE2A24] transition-all group shadow-sm hover:shadow-[0_0_20px_rgba(238,42,36,0.15)]">
                            <span className="absolute -top-3 -left-1 text-4xl text-[#EE2A24] opacity-30 font-serif leading-none group-hover:opacity-60 transition-opacity">
                                &quot;
                            </span>
                            <p className="text-stone-300 text-sm italic mb-5 relative z-10 leading-relaxed">
                                {t.review}
                            </p>
                            <div className="flex items-center gap-3 border-t border-stone-800/50 pt-4">
                                <div className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center font-bold text-sm uppercase border border-[#EE2A24] shrink-0 shadow-[0_0_10px_rgba(238,42,36,0.2)] text-white">
                                    {t.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-white leading-none">{t.name}</h4>
                                    <div className="text-[#EE2A24] text-[10px] font-bold uppercase tracking-wider mt-1">Member</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </AnimateOnScroll>
        </section>
    );
}


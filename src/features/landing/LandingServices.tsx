"use client";

import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import {
  Bike, Dumbbell, Swords, Activity, Target,
  HeartPulse, Star, Users, Repeat
} from "lucide-react";

const servicesList = [
  { title: "Functional Training", icon: <Bike className="w-6 h-6 text-white" /> },
  { title: "Strength Conditioning", icon: <Dumbbell className="w-6 h-6 text-white" /> },
  { title: "MMA Training", icon: <Swords className="w-6 h-6 text-white" /> },
  { title: "Calisthenics", icon: <Activity className="w-6 h-6 text-white" /> },
  { title: "Boxing", icon: <Target className="w-6 h-6 text-white" /> },
  { title: "Yoga", icon: <HeartPulse className="w-6 h-6 text-white" /> },

  { title: "Weekend Masterclass", icon: <Star className="w-6 h-6 text-white" /> },
  { title: "Group Training (HIIT)", icon: <Users className="w-6 h-6 text-white" /> },
  { title: "Looping", icon: <Repeat className="w-6 h-6 text-white" /> },
  { title: "Fully Equipped Weight Training Area", icon: <Dumbbell className="w-6 h-6 text-white" /> },
];

export function LandingServices() {
  return (
    <section
      id="services"
      className="py-16 sm:py-24 px-4 sm:px-6 scroll-mt-[var(--header-height)] bg-black"
    >
      <AnimateOnScroll className="max-w-6xl mx-auto">
        <div className="mb-10 sm:mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
            Our Services
          </h2>
          <p className="text-white/80 text-lg md:text-xl font-medium">
            You Have the Strength We Have The Plan
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {servicesList.map((service, i) => (
            <div
              key={i}
              className="flex items-center gap-4 bg-[#EE2A24] p-4 sm:p-5 rounded-xl hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(238,42,36,0.3)] transition-all duration-300 min-h-[90px] cursor-pointer"
            >
              <div className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-full border-[3px] border-white flex items-center justify-center shrink-0 shadow-sm">
                {service.icon}
              </div>
              <span className="text-white font-extrabold text-sm sm:text-base leading-snug">
                {service.title}
              </span>
            </div>
          ))}
        </div>
      </AnimateOnScroll>
    </section>
  );
}

"use client";

import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import {
  User, Dumbbell, HeartPulse, Users, Activity
} from "lucide-react";

const servicesList = [
  { title: "Personal Training (1-1)", icon: <User className="w-6 h-6 text-white" /> },
  { title: "Strength Training", icon: <Dumbbell className="w-6 h-6 text-white" /> },
  { title: "Weight Loss Program", icon: <HeartPulse className="w-6 h-6 text-white" /> },
  { title: "Functional Training", icon: <Activity className="w-6 h-6 text-white" /> },
  { title: "Group Training (HIIT)", icon: <Users className="w-6 h-6 text-white" /> },
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
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto justify-items-center">
          {servicesList.map((service, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-4 bg-[#EE2A24] p-4 rounded-xl hover:-translate-y-1 hover:shadow-[0_8px_15px_rgba(238,42,36,0.3)] transition-all duration-300 min-h-[70px] cursor-pointer w-full max-w-[280px]"
            >
              <div className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full border-2 border-white flex items-center justify-center shrink-0 shadow-sm">
                {service.icon}
              </div>
              <span className="text-white font-extrabold text-xs sm:text-sm leading-snug flex items-center min-h-[40px]">
                {service.title}
              </span>
            </div>
          ))}
        </div>
      </AnimateOnScroll>
    </section>
  );
}

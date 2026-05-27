"use client";

import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { MapPin, Phone, Clock, ExternalLink } from "lucide-react";
import Image from "next/image";

export function LandingBranches() {
  return (
    <section id="branches" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#050505] scroll-mt-[var(--header-height)] border-t border-stone-800">
      <AnimateOnScroll className="max-w-5xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#EE2A24] mb-4 uppercase tracking-tight">
            Our Branches
          </h2>
          <p className="text-stone-300 max-w-2xl mx-auto font-medium text-sm sm:text-base">
            Find the closest HIIT Fitness headquarters near you. Drop by for a tour.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="group relative w-full max-w-4xl bg-black border border-stone-800 rounded-2xl overflow-hidden hover:border-[#EE2A24] transition-all duration-300 hover:shadow-[0_0_30px_rgba(238,42,36,0.15)] flex flex-col md:flex-row">
            {/* Branch Image / Map Graphic */}
            <div className="relative w-full md:w-2/5 aspect-video md:aspect-auto bg-stone-900 border-b md:border-b-0 md:border-r border-stone-800 overflow-hidden">
                <Image
                    src="/images/HIIT_GYM3.jpg"
                    alt="HIIT Fitness Kanuru Branch"
                    fill
                    className="object-cover opacity-60 group-hover:opacity-100 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EE2A24] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#EE2A24]"></span>
                    </span>
                    <span className="text-white text-[10px] font-bold tracking-widest uppercase shadow-black drop-shadow-md bg-black/50 px-2 py-0.5 rounded-sm">Active HQ</span>
                </div>
            </div>

            {/* Branch Details */}
            <div className="w-full md:w-3/5 p-6 sm:p-8 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
                        Kanuru Branch
                    </h3>
                    <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="text-stone-500 hover:text-[#EE2A24] transition-colors p-2 bg-stone-900 rounded-full hover:bg-[#EE2A24]/10 border border-stone-800 hover:border-[#EE2A24]/50" title="Get Directions">
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
                
                <div className="w-12 h-1 bg-[#EE2A24] mb-8 rounded-full" />

                <div className="space-y-6">
                    <div className="flex items-start gap-4 group/item">
                        <div className="w-10 h-10 rounded-full bg-stone-900/50 border border-stone-800 flex items-center justify-center text-[#EE2A24] shrink-0 group-hover/item:bg-[#EE2A24]/10 transition-colors">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-white text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Address</h4>
                            <p className="text-stone-300 text-sm leading-relaxed">
                                2nd Floor, Sri Anuja Balaji Square, vi Seshadri street, 3rd Ln, opp. Currency Nagar, Ramavarapadu, Kanuru, Andhra Pradesh 521108
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 group/item">
                        <div className="w-10 h-10 rounded-full bg-stone-900/50 border border-stone-800 flex items-center justify-center text-[#EE2A24] shrink-0 group-hover/item:bg-[#EE2A24]/10 transition-colors">
                            <Phone className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-white text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Contact</h4>
                            <a href="tel:+919996667714" className="block text-stone-300 hover:text-[#EE2A24] text-sm font-semibold transition-colors">999 666 7714</a>
                            <a href="tel:+919996665573" className="block text-stone-300 hover:text-[#EE2A24] text-sm font-semibold transition-colors mt-0.5">999 666 5573</a>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 group/item">
                        <div className="w-10 h-10 rounded-full bg-stone-900/50 border border-stone-800 flex items-center justify-center text-[#EE2A24] shrink-0 group-hover/item:bg-[#EE2A24]/10 transition-colors">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-white text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60">Hours</h4>
                            <p className="text-stone-300 text-sm font-semibold">Mon-Sat: <span className="font-normal text-stone-400">5:00 AM - 10:00 PM</span></p>
                            <p className="text-stone-300 text-sm font-semibold mt-0.5">Sun: <span className="font-normal text-[#EE2A24]">Closed</span></p>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </AnimateOnScroll>
    </section>
  );
}

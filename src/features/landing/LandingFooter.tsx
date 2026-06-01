"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { Instagram, Facebook, MapPin, Phone, Youtube } from "lucide-react";
import { useBranch } from "./BranchContext";

const BRANCHES_FOOTER_DATA = {
  kanuru: {
    name: "Currency Nagar branch",
    address: "2nd Floor, Sri Anuja Balaji Square, vi Seshadri street, 3rd Ln, opp. Currency Nagar, Ramavarapadu, Kanuru, Andhra Pradesh 521108",
    phones: [
      { display: "999 666 7714", tel: "tel:+919996667714" },
      { display: "999 666 5573", tel: "tel:+919996665573" }
    ]
  },
  bhavanipuram: {
    name: "Bhavanipuram Branch",
    address: "76-14-165, Bhavanipuram Housing Board Road, Crombway Road, Bhavanipuram, V D Puram, Vijayawada - 520012, Andhra Pradesh, India",
    phones: [
      { display: "999 666 4188", tel: "tel:+919996664188" },
      { display: "999 666 4288", tel: "tel:+919996664288" }
    ]
  }
};

export function LandingFooter() {
  const { selectedBranch } = useBranch();
  return (
    <footer className="bg-black border-t border-[#EE2A24]/30 pt-16 pb-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Decorative top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-[#EE2A24]/50 to-transparent" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#EE2A24]/5 blur-[120px] rounded-full pointer-events-none" />

      <AnimateOnScroll className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          
          {/* Brand Info */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <span className="flex flex-col justify-center leading-tight">
                <span className="font-display text-2xl font-black uppercase text-white tracking-widest flex items-center gap-3">
                  <Image 
                    src="/images/99558_FLAT_JP_AC_03-nobg-cropped.svg" 
                    alt="HIIT Icon" 
                    width={48} 
                    height={48} 
                    className="object-contain" 
                  />
                  HIIT FITNESS
                </span>
                <span className="font-sans text-[10px] sm:text-xs font-bold uppercase text-[#EE2A24] tracking-widest mt-1.5 ml-1">
                  High Intensity Interval Training
                </span>
              </span>
            </Link>
            <p className="text-stone-400 text-sm leading-relaxed mb-6 font-medium">
              Elite facility offering functional training, strength conditioning, MMA, boxing, and high-intensity group workouts designed to push your limits.
            </p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/hiitfitness01?igsh=MWt5Y29ueXM5bDMwcw==" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:border-[#EE2A24] hover:bg-[#EE2A24]/10 transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:border-[#EE2A24] hover:bg-[#EE2A24]/10 transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://youtube.com/@hiit_fitness?si=P0vvcx4SiFozU5QH" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400 hover:text-white hover:border-[#EE2A24] hover:bg-[#EE2A24]/10 transition-all">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-6 uppercase tracking-wider text-sm border-l-2 border-[#EE2A24] pl-3">Quick Links</h3>
            <ul className="space-y-3">
              <li><a href="#programs" className="text-stone-400 hover:text-[#EE2A24] text-sm font-medium transition-colors">Our Programs</a></li>
              <li><a href="#services" className="text-stone-400 hover:text-[#EE2A24] text-sm font-medium transition-colors">Services</a></li>
              <li><a href="#facilities" className="text-stone-400 hover:text-[#EE2A24] text-sm font-medium transition-colors">Facilities</a></li>
              <li><a href="#plans" className="text-stone-400 hover:text-[#EE2A24] text-sm font-medium transition-colors">Pricing Plans</a></li>
              <li><a href="#testimonials" className="text-stone-400 hover:text-[#EE2A24] text-sm font-medium transition-colors">Success Stories</a></li>
            </ul>
          </div>


        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-stone-500 text-sm font-medium text-center sm:text-left">
            © {new Date().getFullYear()} HIIT Fitness. All rights reserved.
          </p>

        </div>
      </AnimateOnScroll>
    </footer>
  );
}

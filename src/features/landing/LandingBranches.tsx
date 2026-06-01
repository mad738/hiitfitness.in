"use client";

import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";
import { MapPin, Phone, Clock, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useBranch, BranchId } from "./BranchContext";

const BRANCHES = [
  {
    id: "kanuru",
    name: "Currency Nagar branch",
    address: "2nd Floor, Sri Anuja Balaji Square, vi Seshadri street, 3rd Ln, opp. Currency Nagar, Ramavarapadu, Kanuru, Andhra Pradesh 521108",
    phones: ["999 666 7714", "999 666 5573"],
    hours: {
      weekdays: "5:00 AM - 10:30 AM, 5:00 PM - 9:00 PM",
      sunday: "6:00 AM - 11:00 AM"
    },
    googleMapsDirectionsUrl: "https://www.google.com/maps/dir//16.5215298,80.6783943",
    image: "/images/currency_nagar_branch.png",
    status: "Active HQ"
  },
  {
    id: "bhavanipuram",
    name: "Bhavanipuram Branch",
    address: "2nd floor, 76-13-1/A, Royal Enfield showroom building, Joji Nagar, Bhavanipuram, Vijayawada - 520012",
    phones: ["999 666 4188", "999 666 4288"],
    hours: {
      weekdays: "5:00 AM - 10:30 AM, 5:00 PM - 9:00 PM",
      sunday: "6:00 AM - 11:00 AM"
    },
    googleMapsDirectionsUrl: "https://maps.app.goo.gl/U5coN7fPwEJLxxRr8",
    image: "/images/bhavanipuram_branch.jpg",
    status: "New Branch"
  }
];

export function LandingBranches() {
  const { selectedBranch, setSelectedBranch } = useBranch();

  return (
    <section id="branches" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#050505] scroll-mt-[var(--header-height)] border-t border-stone-800">
      <AnimateOnScroll className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#EE2A24] mb-4 uppercase tracking-tight">
            Our Branches
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {BRANCHES.map((branch) => {
            const isSelected = selectedBranch === branch.id;
            return (
              <div
                key={branch.id}
                onClick={() => setSelectedBranch(branch.id as BranchId)}
                className={`group relative w-full bg-black border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col sm:flex-row cursor-pointer ${
                  isSelected
                    ? "border-[#EE2A24] shadow-[0_0_30px_rgba(238,42,36,0.25)] opacity-100 scale-[1.01]"
                    : "border-stone-800 opacity-60 hover:opacity-90 hover:border-stone-700"
                }`}
              >
              {/* Branch Image / Map Graphic */}
              <div className="relative w-full sm:w-2/5 aspect-video sm:aspect-auto bg-stone-900 border-b sm:border-b-0 sm:border-r border-stone-800 overflow-hidden min-h-[220px]">
                <Image
                  src={branch.image}
                  alt={`HIIT Fitness ${branch.name}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EE2A24] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#EE2A24]"></span>
                  </span>
                  <span className="text-white text-[10px] font-bold tracking-widest uppercase shadow-black drop-shadow-md bg-black/50 px-2 py-0.5 rounded-sm">
                    {branch.status}
                  </span>
                </div>
              </div>

              {/* Branch Details */}
              <div className="w-full sm:w-3/5 p-6 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-wide">
                    {branch.name}
                  </h3>
                  <a
                    href={branch.googleMapsDirectionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-stone-500 hover:text-[#EE2A24] transition-colors p-2 bg-stone-900 rounded-full hover:bg-[#EE2A24]/10 border border-stone-800 hover:border-[#EE2A24]/50"
                    title="Get Directions"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="w-12 h-1 bg-[#EE2A24] mb-6 rounded-full" />

                <div className="space-y-4">
                  <div className="flex items-start gap-3 group/item">
                    <div className="w-8 h-8 rounded-full bg-stone-900/50 border border-stone-800 flex items-center justify-center text-[#EE2A24] shrink-0 group-hover/item:bg-[#EE2A24]/10 transition-colors">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-white text-[9px] font-bold uppercase tracking-widest mb-0.5 opacity-60">Address</h4>
                      <p className="text-stone-300 text-xs leading-relaxed">
                        {branch.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 group/item">
                    <div className="w-8 h-8 rounded-full bg-stone-900/50 border border-stone-800 flex items-center justify-center text-[#EE2A24] shrink-0 group-hover/item:bg-[#EE2A24]/10 transition-colors">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-white text-[9px] font-bold uppercase tracking-widest mb-0.5 opacity-60">Contact</h4>
                      {branch.phones.map((phone, idx) => (
                        <a
                          key={idx}
                          href={`tel:+91${phone.replace(/\s+/g, "")}`}
                          className="block text-stone-300 hover:text-[#EE2A24] text-xs font-semibold transition-colors"
                        >
                          {phone}
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 group/item">
                    <div className="w-8 h-8 rounded-full bg-stone-900/50 border border-stone-800 flex items-center justify-center text-[#EE2A24] shrink-0 group-hover/item:bg-[#EE2A24]/10 transition-colors">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-white text-[9px] font-bold uppercase tracking-widest mb-0.5 opacity-60">Hours</h4>
                      <p className="text-stone-300 text-xs font-semibold">
                        Mon-Sat: <span className="font-normal text-stone-400">{branch.hours.weekdays}</span>
                      </p>
                      <p className="text-stone-300 text-xs font-semibold mt-0.5">
                        Sun: <span className="font-normal text-[#EE2A24]">{branch.hours.sunday}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </AnimateOnScroll>
    </section>
  );
}


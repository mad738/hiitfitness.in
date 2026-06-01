"use client";

import { useBranch } from "./BranchContext";
import { MapPin } from "lucide-react";
import { useMobileHeader } from "./MobileHeaderContext";
import { useEffect, useState, useRef } from "react";

export function FloatingBranchSelector() {
  const { selectedBranch, setSelectedBranch } = useBranch();
  const { headerHidden, isMobile } = useMobileHeader();
  const [visualViewportTop, setVisualViewportTop] = useState(0);
  const lastViewportTopRef = useRef(-1);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const top = Math.round(vv.offsetTop || 0);
      if (top !== lastViewportTopRef.current) {
        lastViewportTopRef.current = top;
        setVisualViewportTop(top);
      }
    };
    update();

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  const mobileTopStyle = isMobile
    ? {
        top: headerHidden
          ? `${visualViewportTop + 56 + 12}px`
          : `${visualViewportTop + 56 + 56 + 12}px`,
        left: "0px",
      }
    : undefined;

  return (
    <div
      style={mobileTopStyle}
      className={`z-50 flex items-center gap-1 bg-black/90 backdrop-blur-md border border-stone-800 p-1 shadow-2xl hover:border-stone-700 transition-all duration-300 fixed rounded-r-xl rounded-l-none border-l-0 ${
        isMobile
          ? "transition-[top] ease-out pl-2 pr-3"
          : "bottom-6 left-0 pl-3 pr-1.5 hover:pl-4"
      }`}
    >
      <div className="flex items-center gap-1 pl-2 pr-1 text-stone-400">
        <MapPin className="w-3.5 h-3.5 text-[#EE2A24] animate-pulse" />
        <span className="text-[9px] font-bold tracking-widest uppercase hidden md:inline">Branch:</span>
      </div>
      <button
        onClick={() => setSelectedBranch("kanuru")}
        className={`px-2 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
          selectedBranch === "kanuru"
            ? "bg-[#EE2A24] text-white shadow-md shadow-[#EE2A24]/30"
            : "text-stone-400 hover:text-white hover:bg-stone-900"
        }`}
      >
        Currency Nagar
      </button>
      <button
        onClick={() => setSelectedBranch("bhavanipuram")}
        className={`px-2 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
          selectedBranch === "bhavanipuram"
            ? "bg-[#EE2A24] text-white shadow-md shadow-[#EE2A24]/30"
            : "text-stone-400 hover:text-white hover:bg-stone-900"
        }`}
      >
        Bhavanipuram
      </button>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { Play, Flag } from "lucide-react";

const SCROLL_IDLE_MS = 280;
const LOTTIE_SIZE = 44;
const BOOM_DURATION_MS = 500;

type LottieAnimationData = object;

export function ScrollCyclingLottie() {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [animationData, setAnimationData] = useState<LottieAnimationData | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showBoom, setShowBoom] = useState(false);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevProgressRef = useRef(0);

  useEffect(() => {
    fetch("/cycling.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch(() => setAnimationData(null));
  }, []);

  const updateProgress = useCallback(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    const viewHeight = window.innerHeight;
    const maxScroll = Math.max(0, docHeight - viewHeight);
    const progress = maxScroll <= 0 ? 0 : Math.min(1, Math.max(0, scrollTop / maxScroll));
    setScrollProgress(progress);
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      setIsScrolling(true);
      if (idleRef.current) {
        clearTimeout(idleRef.current);
        idleRef.current = null;
      }
      idleRef.current = setTimeout(() => {
        setIsScrolling(false);
        idleRef.current = null;
      }, SCROLL_IDLE_MS);

      if (!ticking) {
        rafRef.current = requestAnimationFrame(() => {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateProgress);
      if (idleRef.current) clearTimeout(idleRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateProgress]);

  useEffect(() => {
    const lottie = lottieRef.current;
    if (!lottie) return;
    if (isScrolling) {
      lottie.play();
    } else {
      lottie.pause();
    }
  }, [isScrolling]);

  // Trigger silent boom when reaching end of lap (100% scroll)
  useEffect(() => {
    const prev = prevProgressRef.current;
    prevProgressRef.current = scrollProgress;
    if (prev < 1 && scrollProgress >= 1) {
      setShowBoom(true);
      const t = setTimeout(() => setShowBoom(false), BOOM_DURATION_MS);
      return () => clearTimeout(t);
    }
  }, [scrollProgress]);

  if (!animationData) return null;

  return (
    <>
      {/* Red boom covers whole screen on finish (mobile, silent) */}
      {showBoom && (
        <div className="fixed inset-0 z-30 md:hidden pointer-events-none overflow-hidden" aria-hidden>
          <div className="absolute inset-0 animate-lap-boom-fullscreen" />
        </div>
      )}
      <div
        className="fixed left-0 right-0 z-40 h-[52px] md:hidden border-b border-stone-800/80 bg-stone-950/95 backdrop-blur-sm"
        style={{ top: "var(--header-height)" }}
        aria-hidden
      >
      {/* Horizontal track: full line (stone) + filled portion (red) */}
      <div className="absolute inset-0 flex items-center px-3">
        <div className="flex-1 relative h-[2px] rounded-full bg-stone-700/80 overflow-visible">
          {/* Filled (covered) track in red */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-red-500 transition-[width] duration-75 ease-out"
            style={{ width: `${scrollProgress * 100}%` }}
          />
          {/* Start lap icon */}
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 flex items-center justify-center w-6 h-6 rounded-full bg-stone-800 border border-stone-600/80 text-red-400/90 shadow-inner"
            title="Start lap"
            aria-hidden
          >
            <Play className="w-3 h-3 ml-0.5" fill="currentColor" strokeWidth={2} />
          </span>
          <span className="absolute left-0 top-1/2 -translate-y-1/2 translate-y-4 text-[9px] font-mono font-bold text-stone-500 uppercase">
            Start
          </span>
          {/* Finish lap icon with small boom on lap complete */}
          <span
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 flex items-center justify-center w-6 h-6 rounded-full bg-stone-800 border border-stone-600/80 text-red-400/90 shadow-inner overflow-visible"
            title="Finish lap"
            aria-hidden
          >
            <Flag className="w-3 h-3" fill="currentColor" strokeWidth={0} />
            {showBoom && (
              <span className="absolute inset-0 rounded-full animate-end-lap-boom pointer-events-none" aria-hidden />
            )}
          </span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-y-4 text-[9px] font-mono font-bold text-stone-500 uppercase">
            Finish
          </span>
        </div>
      </div>
      {/* Cyclist moves along track by scroll % */}
      <div
        className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center transition-[left] duration-75 ease-out"
        style={{
          left: `calc(12px + (100% - 24px - ${LOTTIE_SIZE}px) * ${scrollProgress})`,
          width: LOTTIE_SIZE,
          height: LOTTIE_SIZE,
        }}
      >
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop
          className="w-full h-full"
          style={{ pointerEvents: "none" }}
          onDOMLoaded={() => {
            lottieRef.current?.pause();
          }}
          rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
        />
      </div>
    </div>
    </>
  );
}

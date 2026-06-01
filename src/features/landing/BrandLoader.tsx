"use client";

import { useLoader } from "./LoaderContext";
import Image from "next/image";
import { useEffect, useState } from "react";

export function BrandLoader() {
  const { isLoading } = useLoader();
  const [shouldRender, setShouldRender] = useState(isLoading);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShouldRender(true);
      setIsFadingOut(false);
      // Lock scroll
      document.body.style.overflow = "hidden";
    } else {
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsFadingOut(false);
      }, 500); // Wait for transition fade duration (500ms)
      // Unlock scroll
      document.body.style.overflow = "";
      return () => {
        clearTimeout(timer);
      };
    }
  }, [isLoading]);

  // Clean up overflow styled styles if unmounted unexpectedly
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center transition-opacity duration-500 ease-out pointer-events-auto ${
        isFadingOut ? "opacity-0" : "opacity-100 animate-fade-in"
      }`}
    >
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-[400px] md:h-[400px] flex items-center justify-center p-4">
        <Image
          src="/images/brand_logo.png"
          alt="HIIT Fitness"
          fill
          className="object-contain animate-pulse-slow"
          priority
        />
      </div>
    </div>
  );
}

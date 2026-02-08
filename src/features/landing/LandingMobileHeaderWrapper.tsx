"use client";

import { LandingNav } from "@/features/landing/LandingNav";
import { ScrollCyclingLottie } from "@/features/landing/ScrollCyclingLottie";
import { MobileHeaderProvider } from "@/features/landing/MobileHeaderContext";

/**
 * Wraps only the header and cycle bar in the mobile scroll provider
 * so the client chunk stays small and avoids ChunkLoadError.
 */
export function LandingMobileHeaderWrapper() {
  return (
    <MobileHeaderProvider>
      <LandingNav />
      <ScrollCyclingLottie />
    </MobileHeaderProvider>
  );
}

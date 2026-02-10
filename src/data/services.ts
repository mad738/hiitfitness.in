/**
 * Services data for the morphing services carousel.
 * Uses actual images from public/images/ so cards show real gym/training visuals.
 */

export interface ServiceItem {
  title: string;
  image: string;
  description: string;
}

export const services: ServiceItem[] = [
  {
    title: "Weight Loss",
    image: "/images/HIIT_GYM4.jpg",
    description: "Burn fat and build sustainable habits",
  },
  {
    title: "Muscle Gain",
    image: "/images/HIIT_GYM3.jpg",
    description: "Hypertrophy-focused strength programs",
  },
  {
    title: "Muscle Training",
    image: "/images/facility-strength.svg",
    description: "Strength, endurance and technique mastery",
  },
  {
    title: "HIIT",
    image: "/images/HIIT_GYM.jpg",
    description: "High intensity workouts for max calorie burn",
  },
];

/** Fallbacks if primary image fails to load */
export const serviceImageFallbacks: Record<number, string> = {
  0: "/images/HIIT_GYM3.jpg",
  1: "/images/HIIT_GYM.jpg",
  2: "/images/HIIT_GYM4.jpg",
  3: "/images/HIIT_GYM3.jpg",
};

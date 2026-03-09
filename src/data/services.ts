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
    title: "Amenities",
    image: "/images/HIIT_GYM4.jpg",
    description: "Whether it’s dumbbells, cardio, dedicated strength training area, functional training, or kettlebells, we have it all.",
  },
  {
    title: "Group Classes",
    image: "/images/HIIT_GYM3.jpg",
    description: "Workout with people who share the same fitness goal. With options for all levels, join our expert-led sessions.",
  },
  {
    title: "Personal Training",
    image: "/images/HIIT_GYM.jpg",
    description: "Personal training gives you personalized guidance and support from certified trainers to help you reach your goals faster.",
  },
  {
    title: "Masterclass",
    image: "/images/HIIT_GYM4.jpg",
    description: "Free Master Classes designed to energize and inspire you, including functional training, strength conditioning, and more.",
  },
];

/** Fallbacks if primary image fails to load */
export const serviceImageFallbacks: Record<number, string> = {
  0: "/images/HIIT_GYM3.jpg",
  1: "/images/HIIT_GYM.jpg",
  2: "/images/HIIT_GYM4.jpg",
  3: "/images/HIIT_GYM3.jpg",
};

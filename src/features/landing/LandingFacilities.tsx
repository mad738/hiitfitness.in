import Image from "next/image";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

const facilities = [
  {
    title: "Cardio & training floor",
    description:
      "Treadmills, ellipticals, and cardio machines in a spacious layout. Linear LED lighting and dedicated zones so you can focus — morning or evening slots, no crowding.",
    imageSrc: "/images/HIIT_GYM.jpg",
    alt: "Gym cardio section with treadmills and ellipticals, strength area in background, modern LED lighting",
  },
  {
    title: "Functional training station",
    description:
      "Multi-station cable machine with adjustable pulleys and weight stacks. Versatile for rows, presses, and cable work — plus on-machine exercise guides so you train right.",
    imageSrc: "/images/HIIT_GYM3.jpg",
    alt: "Functional trainer cable machine with pulleys and weight stacks in modern gym",
  },
  {
    title: "Free weights area",
    description:
      "Full range of dumbbells from light to heavy, neatly racked. Rubber flooring for grip and safety, with mirrors and focused lighting so you can train with confidence.",
    imageSrc: "/images/HIIT_GYM4.jpg",
    alt: "Dumbbell racks and free weights section with professional rubber flooring",
  },
] as const;

export function LandingFacilities() {
  return (
    <section id="facilities" className="py-16 sm:py-24 px-4 sm:px-6 scroll-mt-[var(--header-height)]">
      <AnimateOnScroll className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-stone-50 mb-4">
            Infrastructure that hits different
          </h2>
          <p className="text-stone-300/80 max-w-2xl mx-auto">
            Dark, focused layout with bright linear LED lighting. Cardio zones, cable
            stations, and a full free-weights floor — serious kit, no excuses.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {facilities.map((f) => (
            <article
              key={f.title}
              className="liquid-glass overflow-hidden"
            >
              <div className="relative aspect-[16/10] bg-black">
                <Image
                  src={f.imageSrc}
                  alt={f.alt}
                  fill
                  className="object-cover"
                  priority={false}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="p-6 border-t border-white/10">
                <h3 className="text-lg font-bold text-stone-100 mb-2">
                  {f.title}
                </h3>
                <p className="text-stone-300/75 text-sm leading-relaxed">
                  {f.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </AnimateOnScroll>
    </section>
  );
}


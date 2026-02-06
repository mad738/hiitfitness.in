import Image from "next/image";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

const facilities = [
  {
    title: "Strength floor",
    description:
      "Platforms, racks, dumbbells, cables, and space to actually lift — no waiting, no excuses.",
    imageSrc:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
    alt: "Strength floor with power racks and dumbbells",
  },
  {
    title: "HIIT studio",
    description:
      "Intervals done right: sleds, assault bikes, rowers, and circuits that turn effort into results.",
    imageSrc:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80",
    alt: "HIIT studio with assault bikes and rowers",
  },
  {
    title: "Recovery + mobility",
    description:
      "Stretch, roll, and reset. Train hard today, show up stronger tomorrow.",
    imageSrc:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
    alt: "Recovery zone with stretching and foam rolling",
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
            Built for lifters, sprinters, and anyone chasing the next level. Clean
            layout, serious tools, and a vibe that keeps your foot on the gas.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {facilities.map((f) => (
            <article
              key={f.title}
              className="liquid-glass overflow-hidden"
            >
              <div className="relative aspect-[16/10] bg-stone-950">
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


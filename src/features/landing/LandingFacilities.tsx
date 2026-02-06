import Image from "next/image";

const facilities = [
  {
    title: "Strength floor",
    description:
      "Platforms, racks, dumbbells, cables, and space to actually lift — no waiting, no excuses.",
    imageSrc: "/images/facility-strength.svg",
  },
  {
    title: "HIIT studio",
    description:
      "Intervals done right: sleds, assault bikes, rowers, and circuits that turn effort into results.",
    imageSrc: "/images/facility-hiit.svg",
  },
  {
    title: "Recovery + mobility",
    description:
      "Stretch, roll, and reset. Train hard today, show up stronger tomorrow.",
    imageSrc: "/images/facility-recovery.svg",
  },
] as const;

export function LandingFacilities() {
  return (
    <section id="facilities" className="py-16 sm:py-24 px-4 sm:px-6 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
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
                  alt={f.title}
                  fill
                  className="object-cover"
                  priority={false}
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
      </div>
    </section>
  );
}


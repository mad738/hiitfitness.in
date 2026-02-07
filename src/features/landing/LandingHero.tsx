import Link from "next/link";
import Image from "next/image";
import { MatterButton } from "@/components/ui/matter-button";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

const HERO_IMAGE_SRC =
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80";

export function LandingHero() {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center px-4 sm:px-6 pt-[calc(var(--header-height)+var(--header-content-gap)+3.25rem)] md:pt-[calc(var(--header-height)+var(--header-content-gap))] overflow-hidden">
      {/* No top/side gradients – global interactive grid shows through as hero background */}

      <AnimateOnScroll rootMargin="0px 0px -20px 0px" className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Copy + CTA */}
          <div className="text-center lg:text-left">
            <p className="text-brand-red font-mono text-xs sm:text-sm uppercase tracking-widest mb-4">
              Built for gym rats & grinders
            </p>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-stone-50 tracking-tight mb-6 leading-tight">
              Earn your{" "}
              <span className="text-brand-red">next PR</span>
              <span className="text-stone-200/90"> — </span>
              <span className="text-stone-200">every</span>{" "}
              <span className="text-brand-red">session</span>.
            </h1>
            <p className="text-stone-300/85 text-sm sm:text-base md:text-lg max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              HIIT Fitness is a no-excuses training space with serious equipment, focused
              programming, and a culture that doesn’t quit. Come for the sweat.
              Stay for the strength.
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-[clamp(0.5rem,2vw,1rem)]">
              <MatterButton asChild size="lg" hoverGlowColor="red" className="shrink-0">
                <a href="#plans" className="inline-flex items-center justify-center">
                  View plans
                </a>
              </MatterButton>
              <Link
                href="#story"
                className="inline-flex items-center justify-center shrink-0 min-h-[clamp(2.75rem,5vw+2rem,3rem)] py-[0.5em] px-[clamp(1rem,2vw+0.5rem,1.75rem)] rounded-full text-[clamp(0.875rem,1.5vw+0.5rem,1rem)] font-semibold transition whitespace-nowrap backdrop-blur-xl bg-white/[0.06] border border-white/10 text-stone-100 hover:bg-white/[0.1] hover:border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              >
                Our story
              </Link>
            </div>
          </div>

          {/* Stock gym / person asset – visually signals “gym” */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="liquid-glass relative w-full max-w-md aspect-[4/5] rounded-2xl overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
              <Image
                src={HERO_IMAGE_SRC}
                alt="Person training at the gym – strength and conditioning"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw,  min(100%, 480px)"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Marquee chips – full width, no side space unused */}
        <div className="mt-12 w-screen relative left-1/2 -translate-x-1/2 overflow-hidden">
          <div className="animate-marquee flex w-max gap-3 px-4 sm:px-6">
            {[...Array(2)].map((_, set) => (
              <div key={set} className="flex gap-3 shrink-0">
                {[
                  { title: "Strength zone", desc: "Racks, platforms, cables — the real stuff.", accent: "red" },
                  { title: "HIIT studio", desc: "Circuits that spike intensity safely.", accent: "red" },
                  { title: "Recovery corner", desc: "Cool down, mobility, reset.", accent: "red" },
                  { title: "Open 7 days", desc: "Train when it suits you.", accent: "red" },
                  { title: "No long-term contracts", desc: "Cancel anytime.", accent: "red" },
                  { title: "Drop-in welcome", desc: "Try before you commit.", accent: "red" },
                  { title: "Expert coaching", desc: "Form, programming, support.", accent: "red" },
                  { title: "24/7 access", desc: "Some plans round the clock.", accent: "red" },
                ].map((chip) => (
                  <div
                    key={`${set}-${chip.title}`}
                    className="liquid-glass shrink-0 rounded-2xl px-4 py-3 min-w-[180px] sm:min-w-[200px]"
                  >
                    <p className="font-semibold text-stone-100 text-sm sm:text-base text-brand-red/90">
                      {chip.title}
                    </p>
                    <p className="text-stone-400 text-xs sm:text-sm mt-0.5 truncate max-w-[220px]">
                      {chip.desc}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </AnimateOnScroll>
    </section>
  );
}

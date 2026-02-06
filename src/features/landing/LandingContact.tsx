import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export function LandingContact() {
  const gym = {
    label: "HIIT FITNESS",
    address:
      "2nd Floor, Sri Anuja Balaji Square, vi Seshadri street, 3rd Ln, opp. Currency Nagar, Ramavarapadu, Kanuru, Andhra Pradesh 521108",
    phone: "099966 67714",
    lat: 16.5215298,
    lng: 80.6783943,
    googleMapsDirectionsUrl: "https://www.google.com/maps/dir//16.5215298,80.6783943",
  };

  const bboxDelta = 0.01;
  const left = gym.lng - bboxDelta;
  const right = gym.lng + bboxDelta;
  const top = gym.lat + bboxDelta;
  const bottom = gym.lat - bboxDelta;

  const osmEmbedSrc =
    "https://www.openstreetmap.org/export/embed.html" +
    `?bbox=${encodeURIComponent(`${left},${bottom},${right},${top}`)}` +
    `&layer=mapnik&marker=${encodeURIComponent(`${gym.lat},${gym.lng}`)}`;

  return (
    <section id="contact" className="py-16 sm:py-24 px-4 sm:px-6 scroll-mt-[var(--header-height)]">
      <AnimateOnScroll className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-stone-50 mb-4">
              Contact us
            </h2>
            <p className="text-stone-300/85 text-base sm:text-lg leading-relaxed mb-8">
              Ready to train? Drop in, ask about memberships, or get a quick tour.
              We’ll point you to the right plan and help you start strong.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="liquid-glass p-5">
                <p className="text-red-400 font-bold mb-1">Phone</p>
                <p className="text-stone-200 font-semibold">{gym.phone}</p>
                <p className="text-stone-500 text-sm mt-1">
                  Call for class times & tours
                </p>
              </div>
              <div className="liquid-glass p-5">
                <p className="text-red-400 font-bold mb-1">Email</p>
                <p className="text-stone-200 font-semibold">hello@hiitgym.com</p>
                <p className="text-stone-500 text-sm mt-1">
                  We reply within 24 hours
                </p>
              </div>
              <div className="liquid-glass p-5 sm:col-span-2">
                <p className="text-red-400 font-bold mb-2">Hours</p>
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <p className="text-stone-300">
                    Mon–Fri: <span className="text-stone-100 font-semibold">5am–10pm</span>
                  </p>
                  <p className="text-stone-300">
                    Sat: <span className="text-stone-100 font-semibold">7am–8pm</span>
                  </p>
                  <p className="text-stone-300">
                    Sun: <span className="text-stone-100 font-semibold">8am–6pm</span>
                  </p>
                  <p className="text-stone-500">
                    (Edit these anytime in code)
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 justify-center items-center">
              <a
                href="#plans"
                className="inline-flex items-center justify-center px-7 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-extrabold transition"
              >
                Pick a plan
              </a>
              <Link
                href="/admin/login"
                className="inline-flex items-center justify-center px-7 py-3 rounded-xl font-semibold text-stone-100 transition backdrop-blur-xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] hover:border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              >
                Staff login
              </Link>
            </div>
          </div>

          <div className="liquid-glass rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <p className="text-stone-100 font-bold">Visit the gym</p>
              <p className="text-stone-400 text-sm break-words">
                {gym.address}
              </p>
            </div>
            <div className="relative aspect-[16/10]">
              <iframe
                title={`${gym.label} map`}
                src={osmEmbedSrc}
                className="absolute inset-0 h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_20%,rgba(239,68,68,0.08),transparent)]" />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-stone-800" />
            </div>
            <div className="p-6 space-y-4">
              <p className="text-stone-300/80 text-sm leading-relaxed">
                Parking available. First visit? Come 10 minutes early and we’ll
                get you set up.
              </p>
              <Button asChild size="lg" className="w-full sm:w-auto bg-red-500 text-white hover:bg-red-400 font-semibold shadow-[0_0_20px_rgba(239,68,68,0.35)]">
                <a
                  href={gym.googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPinIcon />
                  Get directions in Google Maps
                </a>
              </Button>
            </div>
          </div>
        </div>
      </AnimateOnScroll>
    </section>
  );
}


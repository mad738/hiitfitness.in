import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export function LandingContact() {
  const gym = {
    label: "HIIT FITNESS",
    address:
      "2nd Floor, Sri Anuja Balaji Square, vi Seshadri street, 3rd Ln, opp. Currency Nagar, Ramavarapadu, Kanuru, Andhra Pradesh 521108",
    phones: [
      { display: "999 666 7714", tel: "tel:+919996667714" },
      { display: "999 666 5573", tel: "tel:+919996665573" },
    ],
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
          <div className="w-full">
            <h2 className="text-3xl md:text-4xl font-extrabold text-stone-50 mb-4">
              Contact us
            </h2>
            <p className="text-stone-300/85 text-base sm:text-lg leading-relaxed mb-8">
              Ready to train? Drop in, ask about memberships, or get a quick tour.
              We’ll point you to the right plan and help you start strong.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="w-full min-w-0">
                <div className="liquid-glass p-5 rounded-2xl">
                  <p className="text-brand-red font-bold mb-1 flex items-center gap-2">
                    <PhoneIcon />
                    Phone
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {gym.phones.map((p) => (
                      <a
                        key={p.tel}
                        href={p.tel}
                        className="text-stone-200 font-semibold hover:text-brand-red transition"
                      >
                        {p.display}
                      </a>
                    ))}
                  </div>
                  <p className="text-stone-500 text-sm mt-1">
                    Tap to call — class times & tours
                  </p>
                </div>
              </div>
              <div className="w-full min-w-0">
                <div className="liquid-glass p-5 rounded-2xl">
                  <p className="text-brand-red font-bold mb-1 flex items-center gap-2">
                    <InstagramIcon />
                    Instagram
                  </p>
                  <a
                    href="https://www.instagram.com/hiitfitness01"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-200 font-semibold hover:text-brand-red transition break-all inline-flex items-center gap-2"
                  >
                    @hiitfitness01
                  </a>
                  <p className="text-stone-500 text-sm mt-1">
                    Follow us for updates & reels
                  </p>
                </div>
              </div>
              <div className="w-full min-w-0 sm:col-span-2">
                <div className="liquid-glass p-5 rounded-2xl">
                  <p className="text-brand-red font-bold mb-2 flex items-center gap-2">
                    <ClockIcon />
                    Gym timings
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm">
                    <p className="text-stone-300">
                      Mon–Sat: <span className="text-stone-100 font-semibold">Morning 6 AM – 10 AM</span>
                    </p>
                    <p className="text-stone-300">
                      Mon–Sat: <span className="text-stone-100 font-semibold">Evening 5 PM – 9 PM</span>
                    </p>
                    <p className="text-stone-300">
                      Sun: <span className="text-stone-100 font-semibold">Morning 6 AM – 11 AM</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 justify-center items-center">
              <a
                href="#plans"
                className="inline-flex items-center justify-center px-7 py-3 rounded-xl bg-brand-red hover:opacity-90 text-white font-extrabold transition"
              >
                Pick a plan
              </a>
              <Link
                href="/admin/login"
                className="inline-flex items-center justify-center px-7 py-3 rounded-xl font-semibold text-stone-100 transition backdrop-blur-xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] hover:border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              >
                Admin login
              </Link>
            </div>
          </div>

          <div className="w-full min-w-0 flex justify-center">
            <div className="liquid-glass rounded-3xl overflow-hidden w-full max-w-md lg:max-w-xl">
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
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_20%,rgba(255,0,0,0.08),transparent)]" />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-stone-800" />
            </div>
            <div className="p-6 space-y-4">
              <p className="text-stone-300/80 text-sm leading-relaxed">
                Parking available. First visit? Come 10 minutes early and we’ll
                get you set up.
              </p>
              <Button asChild size="lg" className="w-full sm:w-auto bg-brand-red text-white hover:opacity-90 font-semibold shadow-[0_0_20px_rgba(255,0,0,0.35)]">
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
        </div>
      </AnimateOnScroll>
    </section>
  );
}


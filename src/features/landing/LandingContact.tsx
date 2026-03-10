import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
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

  const googleMapsEmbedSrc = `https://maps.google.com/maps?q=${gym.lat},${gym.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <section id="contact" className="py-16 sm:py-24 px-4 sm:px-6 scroll-mt-[var(--header-height)] bg-stone-50">
      <AnimateOnScroll className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Contact Form & Info */}
          <div className="w-full">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#EE2A24] mb-4 uppercase">
              Start Your Journey
            </h2>
            <p className="text-stone-600 text-base sm:text-lg leading-relaxed mb-8">
              Ready to train? Claim your free trial today. Drop in, ask about memberships, or get a quick tour.
            </p>


            <div className="flex flex-wrap gap-4 items-center">
              <div className="bg-white border border-stone-200 shadow-sm p-4 rounded-xl flex-1 min-w-[200px]">
                <p className="text-[#EE2A24] font-bold mb-1 flex items-center gap-2">
                  <PhoneIcon />
                  Phone
                </p>
                <div className="flex flex-col">
                  {gym.phones.map((p) => (
                    <a key={p.tel} href={p.tel} className="text-stone-900 font-semibold hover:text-[#EE2A24] transition">
                      {p.display}
                    </a>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-stone-200 shadow-sm p-4 rounded-xl flex-1 min-w-[200px]">
                <p className="text-[#EE2A24] font-bold mb-2 flex items-center gap-2">
                  <ClockIcon />
                  Gym timings
                </p>
                <div className="text-sm text-stone-600">
                  <p>Mon–Sat: <span className="font-semibold text-stone-900">6 AM – 10 AM, 5 PM – 9 PM</span></p>
                  <p>Sun: <span className="font-semibold text-stone-900">6 AM – 11 AM</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Feature */}
          <div className="w-full min-w-0 flex justify-center">
            <div className="bg-white rounded-3xl overflow-hidden w-full max-w-md lg:max-w-xl shadow border border-stone-200 h-full flex flex-col">
              <div className="p-6 border-b border-stone-200">
                <p className="text-[#EE2A24] font-extrabold text-xl mb-1 uppercase">Visit the gym</p>
                <p className="text-stone-500 text-sm break-words">
                  {gym.address}
                </p>
              </div>
              <div className="relative flex-1 min-h-[400px]">
                <iframe
                  title={`${gym.label} Google Map`}
                  src={googleMapsEmbedSrc}
                  className="absolute inset-0 h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  style={{ border: 0 }}
                />
              </div>
              <div className="p-6">
                <Button asChild size="lg" className="w-full sm:w-auto bg-[#EE2A24] text-white hover:bg-red-700 font-semibold">
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

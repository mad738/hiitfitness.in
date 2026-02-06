import { LandingHero } from "@/features/landing/LandingHero";
import { LandingFacilities } from "@/features/landing/LandingFacilities";
import { LandingPlans } from "@/features/landing/LandingPlans";
import { LandingContact } from "@/features/landing/LandingContact";
import { LandingNav } from "@/features/landing/LandingNav";
import { LandingFooter } from "@/features/landing/LandingFooter";

export default function HomePage() {
  return (
    <>
      <LandingNav />
      <main>
        <LandingHero />
        <LandingFacilities />
        <LandingPlans />
        <LandingContact />
      </main>
      <LandingFooter />
    </>
  );
}

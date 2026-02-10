import { LandingHero } from "@/features/landing/LandingHero";
import { LandingFacilities } from "@/features/landing/LandingFacilities";
import { LandingServices } from "@/features/landing/LandingServices";
import { LandingPlans } from "@/features/landing/LandingPlans";
import { LandingContact } from "@/features/landing/LandingContact";
import { LandingFooter } from "@/features/landing/LandingFooter";
import { LandingMobileHeaderWrapper } from "@/features/landing/LandingMobileHeaderWrapper";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage() {
  return (
    <>
      <LandingMobileHeaderWrapper />
      <main>
        <LandingHero />
        <LandingFacilities />
        <LandingServices />
        <LandingPlans />
        <LandingContact />
      </main>
      <LandingFooter />
    </>
  );
}

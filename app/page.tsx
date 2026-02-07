import { LandingHero } from "@/features/landing/LandingHero";
import { LandingFacilities } from "@/features/landing/LandingFacilities";
import { LandingPlans } from "@/features/landing/LandingPlans";
import { LandingContact } from "@/features/landing/LandingContact";
import { LandingNav } from "@/features/landing/LandingNav";
import { LandingFooter } from "@/features/landing/LandingFooter";
import { ScrollCyclingLottie } from "@/features/landing/ScrollCyclingLottie";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage() {
  return (
    <>
      <LandingNav />
      <ScrollCyclingLottie />
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

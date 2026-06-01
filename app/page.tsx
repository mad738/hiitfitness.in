import { LandingHero } from "@/features/landing/LandingHero";
import { LandingFacilities } from "@/features/landing/LandingFacilities";
import { LandingServices } from "@/features/landing/LandingServices";
import { LandingPlans } from "@/features/landing/LandingPlans";
import { LandingBranches } from "@/features/landing/LandingBranches";
import { LandingContact } from "@/features/landing/LandingContact";
import { LandingFooter } from "@/features/landing/LandingFooter";
import { LandingMobileHeaderWrapper } from "@/features/landing/LandingMobileHeaderWrapper";
import { LandingEnquiryPopup } from "@/features/landing/LandingEnquiryPopup";
import { LandingPhilosophy } from "@/features/landing/LandingPhilosophy";
import { LandingPrograms } from "@/features/landing/LandingPrograms";
import { LandingChallenge } from "@/features/landing/LandingChallenge";
import { LandingTestimonials } from "@/features/landing/LandingTestimonials";
import { LandingVideos } from "@/features/landing/LandingVideos";
import { FloatingWhatsApp } from "@/features/landing/FloatingWhatsApp";
import { BranchProvider } from "@/features/landing/BranchContext";
import { FloatingBranchSelector } from "@/features/landing/FloatingBranchSelector";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { LoaderProvider } from "@/features/landing/LoaderContext";
import { BrandLoader } from "@/features/landing/BrandLoader";

export default function HomePage() {
  return (
    <BranchProvider>
      <LoaderProvider>
        <BrandLoader />
        <LandingMobileHeaderWrapper />
        <LandingEnquiryPopup />
        <main>
          <LandingHero />
          <LandingPhilosophy />
          <LandingFacilities />
          <LandingServices />
          <LandingVideos />
          <LandingPrograms />
          <LandingChallenge />
          <LandingPlans />
          <LandingTestimonials />
          <LandingBranches />
          <LandingContact />
        </main>
        <LandingFooter />
        <FloatingWhatsApp />
        <FloatingBranchSelector />
      </LoaderProvider>
    </BranchProvider>
  );
}

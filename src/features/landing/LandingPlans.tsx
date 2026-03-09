import { unstable_noStore as noStore } from "next/cache";
import { getPublicPlans } from "@/services/membership_service";
import { PlanGroups } from "@/features/landing/PlanGroups";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

/** Plans from membership_plans table; always fetched fresh (no cache). */
export async function LandingPlans() {
  noStore();
  const plans = await getPublicPlans();

  return (
    <section id="plans" className="py-16 sm:py-24 px-4 sm:px-6 scroll-mt-[var(--header-height)] bg-stone-50">
      <AnimateOnScroll className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#EE2A24] mb-4">
            Membership plans
          </h2>
          <p className="text-stone-700 max-w-xl mx-auto">
            Compare plans and choose what fits your goals. No hidden fees, cancel anytime.
          </p>
        </div>
        {plans.length > 0 ? (
          <PlanGroups plans={plans} />
        ) : (
          <div className="bg-white shadow-sm border border-stone-200 border-dashed text-center py-12 rounded-xl text-stone-500">
            <p>Plans are being updated. Check back soon.</p>
          </div>
        )}
      </AnimateOnScroll>
    </section>
  );
}

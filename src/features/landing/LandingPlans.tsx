import { fetchPublicPlans } from "@app/actions/plans";
import { PlanCard } from "@/ui/PlanCard";
import { AnimateOnScroll } from "@/components/ui/animate-on-scroll";

export async function LandingPlans() {
  const plans = await fetchPublicPlans();

  return (
    <section id="plans" className="py-16 sm:py-24 px-4 sm:px-6 scroll-mt-[var(--header-height)]">
      <AnimateOnScroll className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-100 mb-4">
            Membership plans
          </h2>
          <p className="text-stone-400 max-w-xl mx-auto">
            Choose the plan that fits your goals. No hidden fees, cancel anytime.
          </p>
        </div>
        {plans.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        ) : (
          <div className="liquid-glass border-dashed text-center py-12 rounded-xl text-stone-500">
            <p>Plans are being updated. Check back soon.</p>
          </div>
        )}
      </AnimateOnScroll>
    </section>
  );
}

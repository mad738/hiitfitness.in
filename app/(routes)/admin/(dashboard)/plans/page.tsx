import { PlansView } from "@/features/admin/PlansView";
import { listAllPlans } from "@/repositories/membership_plan_repository";

export default async function AdminPlansPage() {
  const plans = await listAllPlans();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-stone-100 mb-1 tracking-tight">
          Membership plans
        </h1>
        <p className="text-stone-400 text-sm">
          Plans from membership_plans. Used on landing and in tracker.
        </p>
      </section>
      <PlansView plans={plans} />
    </div>
  );
}

import { PlansView } from "@/features/admin/PlansView";

export default function AdminPlansPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-stone-100 mb-1 tracking-tight">
          Membership plans
        </h1>
        <p className="text-stone-400 text-sm">
          Membership plans and pricing.
        </p>
      </section>
      <PlansView />
    </div>
  );
}

import { SubscriptionsView } from "@/features/admin/SubscriptionsView";

export default function AdminSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-stone-100 mb-1 tracking-tight">
          Subscriptions
        </h1>
        <p className="text-stone-400 text-sm">
          Active subscriptions.
        </p>
      </section>
      <SubscriptionsView />
    </div>
  );
}

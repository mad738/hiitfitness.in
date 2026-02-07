import { CustomersView } from "@/features/admin/CustomersView";

export default function AdminCustomersPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-stone-100 mb-1 tracking-tight">
          Customers
        </h1>
        <p className="text-stone-400 text-sm">
          Customer list.
        </p>
      </section>
      <CustomersView />
    </div>
  );
}

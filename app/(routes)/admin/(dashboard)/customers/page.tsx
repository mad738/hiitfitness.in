import { listCustomers } from "@app/actions/customers";
import { listTrainers } from "@app/actions/trainers";
import { CustomersView } from "@/features/admin/CustomersView";

export default async function AdminCustomersPage() {
  const [customers, trainers] = await Promise.all([
    listCustomers(),
    listTrainers(),
  ]);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-stone-100 mb-1 tracking-tight">
          Customers
        </h1>
        <p className="text-stone-400 text-sm">
          Customer list with plan, fees, and trainer (for PT).
        </p>
      </section>
      <CustomersView initialCustomers={customers} initialTrainers={trainers} />
    </div>
  );
}

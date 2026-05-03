import { listCustomers } from "@app/actions/customers";
import { listTrainers } from "@app/actions/trainers";
import { PaymentHistoryView } from "@/features/admin/PaymentHistoryView";

export default async function AdminPaymentHistoryPage() {
  const [customers, trainers] = await Promise.all([
    listCustomers(),
    listTrainers(),
  ]);

  return (
    <div className="space-y-6">
      <PaymentHistoryView initialCustomers={customers} initialTrainers={trainers} />
    </div>
  );
}

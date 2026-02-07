import { listCustomers } from "@/repositories/customer_repository";
import { listTrainers } from "@/repositories/trainer_repository";
import { listCredentials } from "@/repositories/credential_repository";
import { DashboardContent } from "@/features/admin/DashboardContent";

export default async function AdminDashboardPage() {
  const [customers, trainers, credentials] = await Promise.all([
    listCustomers(),
    listTrainers(),
    listCredentials(),
  ]);

  return (
    <DashboardContent
      customers={customers}
      trainers={trainers}
      adminCount={credentials.length}
    />
  );
}

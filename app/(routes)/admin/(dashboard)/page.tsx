import { listCustomers } from "@/repositories/customer_repository";
import { listTrainers } from "@/repositories/trainer_repository";
import { listCredentials } from "@/repositories/credential_repository";
import { DashboardContent } from "@/features/admin/DashboardContent";
import type { Customer } from "@/models/customer";
import type { Trainer } from "@/models/trainer";

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

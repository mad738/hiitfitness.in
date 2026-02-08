import { listTrainersInUse } from "@app/actions/trainers";
import { TrainersView } from "@/features/admin/TrainersView";

export default async function AdminTrainersPage() {
  const trainers = await listTrainersInUse();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-stone-100 mb-1 tracking-tight">
          Trainers
        </h1>
        <p className="text-stone-400 text-sm">
          Showing trainers assigned to at least one customer. Add new trainers below; they appear here once assigned to a customer.
        </p>
      </section>
      <TrainersView initialTrainers={trainers} />
    </div>
  );
}

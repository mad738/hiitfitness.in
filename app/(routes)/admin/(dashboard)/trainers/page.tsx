import { listTrainers } from "@app/actions/trainers";
import { TrainersView } from "@/features/admin/TrainersView";

export default async function AdminTrainersPage() {
  const trainers = await listTrainers();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-stone-100 mb-1 tracking-tight">
          Trainers
        </h1>
        <p className="text-stone-400 text-sm">
          Manage trainers. Add photo, phone, and address.
        </p>
      </section>
      <TrainersView initialTrainers={trainers} />
    </div>
  );
}

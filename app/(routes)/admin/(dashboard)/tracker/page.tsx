import { Suspense } from "react";
import { getTrackerList } from "@app/actions/tracker";
import { TrackerView } from "@/features/admin/TrackerView";
import type { TrackerFilters } from "@/repositories/tracker_repository";

function parseFilters(
  searchParams: { [key: string]: string | string[] | undefined }
): TrackerFilters {
  const get = (k: string): string | null => {
    const v = searchParams[k];
    if (v == null) return null;
    return Array.isArray(v) ? (v[0] ?? null) : v;
  };
  return {
    plan: get("plan") ?? undefined,
    trainer: get("trainer") ?? undefined,
    clientSearch: get("client") ?? undefined,
    trainerSearch: get("trainer_q") ?? undefined,
  };
}

export default async function AdminTrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const initialList = await getTrackerList(filters);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-stone-100 mb-1 tracking-tight">
          Tracker
        </h1>
        <p className="text-stone-400 text-sm">
          Client entries. Filter by plan, trainer, or search by name.
        </p>
      </section>
      <Suspense fallback={<p className="text-stone-500 py-4">Loading tracker…</p>}>
        <TrackerView
          initialList={initialList}
          initialFilters={filters}
        />
      </Suspense>
    </div>
  );
}

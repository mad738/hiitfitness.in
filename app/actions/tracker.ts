"use server";

import { requireAdminSession } from "@app/actions/auth";
import {
  listTracker,
  listTrackerFiltered,
  insertTracker,
  updateTracker,
  deleteTracker as deleteTrackerRepo,
} from "@/repositories/tracker_repository";
import type { TrackerInsert, TrackerUpdate } from "@/models/tracker";
import type { TrackerFilters } from "@/repositories/tracker_repository";

export async function getTrackerList(filters?: TrackerFilters) {
  await requireAdminSession();
  if (filters && hasActiveFilters(filters)) {
    return listTrackerFiltered(filters);
  }
  return listTracker();
}

function hasActiveFilters(f: TrackerFilters): boolean {
  return (
    (f.plan != null && f.plan !== "") ||
    (f.trainer != null && f.trainer !== "") ||
    (f.clientSearch != null && f.clientSearch.trim() !== "") ||
    (f.trainerSearch != null && f.trainerSearch.trim() !== "")
  );
}

export async function createTrackerEntry(row: TrackerInsert) {
  await requireAdminSession();
  return insertTracker(row);
}

export async function updateTrackerEntry(id: string, updates: TrackerUpdate) {
  await requireAdminSession();
  return updateTracker(id, updates);
}

export async function deleteTrackerEntry(id: string) {
  await requireAdminSession();
  await deleteTrackerRepo(id);
}

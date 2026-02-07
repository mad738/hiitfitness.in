"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@app/actions/auth";
import * as trainerRepo from "@/repositories/trainer_repository";
import type { TrainerInsert, TrainerUpdate } from "@/models/trainer";

const ADMIN_PATHS = ["/admin/trainers", "/admin/customers"];

export async function listTrainers() {
  await requireAdminSession();
  return trainerRepo.listTrainers();
}

export async function createTrainer(data: TrainerInsert) {
  try {
    await requireAdminSession();
    await trainerRepo.insertTrainer(data);
    revalidatePath(ADMIN_PATHS[0]);
    revalidatePath(ADMIN_PATHS[1]);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to add trainer." };
  }
}

export async function updateTrainer(id: string, data: TrainerUpdate) {
  try {
    await requireAdminSession();
    await trainerRepo.updateTrainer(id, data);
    revalidatePath(ADMIN_PATHS[0]);
    revalidatePath(ADMIN_PATHS[1]);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to update trainer." };
  }
}

export async function deleteTrainer(id: string) {
  try {
    await requireAdminSession();
    await trainerRepo.deleteTrainer(id);
    revalidatePath(ADMIN_PATHS[0]);
    revalidatePath(ADMIN_PATHS[1]);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to delete trainer." };
  }
}

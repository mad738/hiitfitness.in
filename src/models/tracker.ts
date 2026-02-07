/** Tracker row; fields match Tracker - 2026.xlsx. Category fields use DB enums. */
import type {
  TRACKER_PLAN_OPTIONS,
  TRACKER_FREQUENCY_OPTIONS,
  TRACKER_TRAINER_OPTIONS,
  TRACKER_PAYMENT_MODE_OPTIONS,
  TRACKER_PAID_TO_OPTIONS,
  TRACKER_STATUS_OPTIONS,
} from "@/config/tracker-options";

export type TrackerPlan = (typeof TRACKER_PLAN_OPTIONS)[number];
export type TrackerFrequency = (typeof TRACKER_FREQUENCY_OPTIONS)[number];
export type TrackerTrainerName = (typeof TRACKER_TRAINER_OPTIONS)[number];
export type TrackerPaymentMode = (typeof TRACKER_PAYMENT_MODE_OPTIONS)[number];
export type TrackerPaidTo = (typeof TRACKER_PAID_TO_OPTIONS)[number];
export type TrackerStatus = (typeof TRACKER_STATUS_OPTIONS)[number];

export type Tracker = {
  id: string;
  client_id: string | null;
  client_name: string | null;
  plan: TrackerPlan | null;
  frequency: TrackerFrequency | null;
  trainer_name: TrackerTrainerName | null;
  start_date: string | null;
  end_date: string | null;
  total_fee: number | null;
  paid_fee: number | null;
  due_fee: number | null;
  mobile: string | null;
  pay_date: string | null;
  payment_mode: TrackerPaymentMode | null;
  paid_to: TrackerPaidTo | null;
  paid_flag: boolean | null;
  remarks: string | null;
  status: TrackerStatus | null;
  created_at: string;
  updated_at: string;
};

export type TrackerInsert = Omit<Tracker, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type TrackerUpdate = Partial<TrackerInsert>;

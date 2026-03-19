export type PlanHold = {
  id: string;
  customer_plan_id: string;
  hold_start_date: string;
  hold_end_date: string | null;
  created_at: string;
};

export type PlanOverlapConflict = {
  existingPlanId: string;
  customerId: string;
  planId: string;
  startDate: string;
  endDate: string;
};

export class PlanOverlapError extends Error {
  readonly code = "PLAN_OVERLAP";
  readonly conflict: PlanOverlapConflict;

  constructor(conflict: PlanOverlapConflict) {
    const planLabel = conflict.planId.trim().toUpperCase();
    super(
      `${planLabel} is already active from ${conflict.startDate} to ${conflict.endDate}. Open that plan history to review before saving.`
    );
    this.name = "PlanOverlapError";
    this.conflict = conflict;
  }
}

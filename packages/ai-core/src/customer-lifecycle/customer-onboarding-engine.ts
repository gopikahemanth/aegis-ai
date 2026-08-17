/**
 * CustomerOnboardingEngine
 *
 * Measures customer onboarding progress, time-to-first-value, and setup completion.
 * Hard Invariant: ONBOARDING COMPLETION != CUSTOMER SUCCESS.
 */

export type CustomerOnboardingStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "ON_TRACK"
  | "AT_RISK"
  | "COMPLETED"
  | "FAILED"
  | "INSUFFICIENT_EVIDENCE";

export interface CustomerOnboardingReport {
  customerId: string;
  projectId: string;
  setupStepsCompleted: number;
  totalSetupSteps: number;
  timeToFirstValueHours: number;
  status: CustomerOnboardingStatus;
  summary: string;
}

export class CustomerOnboardingEngine {
  public static evaluateOnboarding(
    customerId: string,
    projectId: string,
    completedSteps: number,
    totalSteps: number = 5,
    ttfvHours: number = 2.5
  ): CustomerOnboardingReport {
    let status: CustomerOnboardingStatus = "IN_PROGRESS";

    if (completedSteps === 0) {
      status = "NOT_STARTED";
    } else if (completedSteps >= totalSteps) {
      status = "COMPLETED";
    } else if (ttfvHours > 48) {
      status = "AT_RISK";
    } else if (completedSteps > 0) {
      status = "ON_TRACK";
    }

    return {
      customerId,
      projectId,
      setupStepsCompleted: completedSteps,
      totalSetupSteps: totalSteps,
      timeToFirstValueHours: ttfvHours,
      status,
      summary: `Customer ${customerId} onboarding status: ${status} (${completedSteps}/${totalSteps} steps completed, TTFV: ${ttfvHours}h).`,
    };
  }
}

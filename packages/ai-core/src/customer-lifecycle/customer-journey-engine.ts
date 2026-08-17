/**
 * CustomerJourneyEngine
 *
 * Models customer journey milestones and detects friction and bottleneck points.
 */

export type CustomerJourneyMilestone =
  | "ONBOARDING"
  | "ACTIVATION"
  | "FIRST_VALUE"
  | "ADOPTION"
  | "HABITUAL_USAGE"
  | "VALUE_REALIZATION"
  | "RETENTION"
  | "EXPANSION";

export interface CustomerJourneyReport {
  customerId: string;
  projectId: string;
  currentMilestone: CustomerJourneyMilestone;
  completedMilestones: CustomerJourneyMilestone[];
  journeyBottlenecksDetected: string[];
  timeInCurrentMilestoneDays: number;
  summary: string;
}

export class CustomerJourneyEngine {
  public static evaluateJourney(
    customerId: string,
    projectId: string,
    onboardingDone: boolean,
    firstValueReached: boolean,
    habitualUsageReached: boolean,
    expansionReached: boolean,
    daysInCurrentStage: number = 5
  ): CustomerJourneyReport {
    const completed: CustomerJourneyMilestone[] = [];
    const bottlenecks: string[] = [];

    if (onboardingDone) completed.push("ONBOARDING", "ACTIVATION");
    if (firstValueReached) completed.push("FIRST_VALUE", "ADOPTION");
    if (habitualUsageReached) completed.push("HABITUAL_USAGE", "VALUE_REALIZATION", "RETENTION");
    if (expansionReached) completed.push("EXPANSION");

    let currentMilestone: CustomerJourneyMilestone = "ONBOARDING";
    if (expansionReached) currentMilestone = "EXPANSION";
    else if (habitualUsageReached) currentMilestone = "RETENTION";
    else if (firstValueReached) currentMilestone = "HABITUAL_USAGE";
    else if (onboardingDone) currentMilestone = "FIRST_VALUE";

    if (daysInCurrentStage > 30) {
      bottlenecks.push(`Stalled in milestone ${currentMilestone} for ${daysInCurrentStage} days.`);
    }

    return {
      customerId,
      projectId,
      currentMilestone,
      completedMilestones: completed,
      journeyBottlenecksDetected: bottlenecks,
      timeInCurrentMilestoneDays: daysInCurrentStage,
      summary: `Customer ${customerId} is at journey milestone ${currentMilestone} with ${completed.length} completed milestone(s).`,
    };
  }
}

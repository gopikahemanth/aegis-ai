/**
 * StrategicMilestoneEngine
 *
 * Tracks enterprise strategic milestone lifecycles with evidence-based acceptance.
 */

export type MilestoneStatus =
  | "PLANNED"
  | "APPROVED"
  | "IN_PROGRESS"
  | "VALIDATING"
  | "ACHIEVED"
  | "MISSED"
  | "CANCELLED";

export interface StrategicMilestone {
  milestoneId: string;
  initiativeId: string;
  title: string;
  dueDate: string;
  status: MilestoneStatus;
  evidenceSummary?: string;
}

export class StrategicMilestoneEngine {
  private static milestones: Map<string, StrategicMilestone> = new Map();

  public static createMilestone(milestone: StrategicMilestone): StrategicMilestone {
    this.milestones.set(milestone.milestoneId, milestone);
    return milestone;
  }

  public static updateMilestoneStatus(milestoneId: string, status: MilestoneStatus, evidenceSummary?: string): boolean {
    const m = this.milestones.get(milestoneId);
    if (!m) return false;
    m.status = status;
    if (evidenceSummary) m.evidenceSummary = evidenceSummary;
    return true;
  }

  public static getMilestone(milestoneId: string): StrategicMilestone | undefined {
    return this.milestones.get(milestoneId);
  }

  public static reset(): void {
    this.milestones.clear();
  }
}

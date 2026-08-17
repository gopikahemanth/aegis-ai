/**
 * StrategicInitiative
 *
 * Model representing high-level enterprise engineering initiatives and strategic roadmap items.
 */

export type InitiativeStatus =
  | "PROPOSED"
  | "ANALYZING"
  | "SIMULATING"
  | "PRIORITIZED"
  | "APPROVED"
  | "EXECUTING"
  | "VERIFYING"
  | "COMPLETED"
  | "DEFERRED"
  | "REJECTED";

export interface StrategicInitiative {
  initiativeId: string;
  organizationId: string;
  name: string;
  description: string;
  businessObjective: string;
  affectedProjects: string[];
  priorityClass: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "DEFER";
  status: InitiativeStatus;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

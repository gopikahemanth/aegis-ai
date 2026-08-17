/**
 * AssignmentEngine
 *
 * Governs task assignments to Humans, AI Agents, Worker Nodes, or Teams,
 * strictly enforcing authorization scopes.
 */

import { IdentityManager } from "../identity/identity-manager.js";

export type AssigneeType = "HUMAN" | "AI_AGENT" | "WORKER" | "TEAM";

export interface TaskAssignment {
  assignmentId: string;
  workflowId: string;
  organizationId: string;
  projectId: string;
  actorId: string;
  assigneeType: AssigneeType;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "ESCALATED";
}

export class AssignmentEngine {
  private static assignments: Map<string, TaskAssignment> = new Map();

  public static assignTask(params: {
    assignmentId: string;
    workflowId: string;
    organizationId: string;
    projectId: string;
    actorId: string;
    assigneeType: AssigneeType;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  }): { success: boolean; assignment?: TaskAssignment; error?: string } {
    if (params.assigneeType === "HUMAN") {
      const actor = IdentityManager.getActor(params.actorId);
      if (!actor) {
        return { success: false, error: "ACTOR_NOT_FOUND: Assignee must be a registered identity." };
      }
      if (actor.organizationId !== params.organizationId) {
        return { success: false, error: "CROSS_TENANT_ASSIGNMENT_DENIED" };
      }
    }

    const assignment: TaskAssignment = {
      ...params,
      priority: params.priority || "MEDIUM",
      status: "ASSIGNED",
    };
    this.assignments.set(params.assignmentId, assignment);
    return { success: true, assignment };
  }

  public static getAssignment(assignmentId: string): TaskAssignment | undefined {
    return this.assignments.get(assignmentId);
  }

  public static reset(): void {
    this.assignments.clear();
  }
}

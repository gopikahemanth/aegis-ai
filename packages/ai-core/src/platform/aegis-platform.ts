/**
 * AegisPlatform
 *
 * The unified public platform API providing high-level operational access
 * to all underlying AEGIS canonical subsystems without duplicating governance.
 */

import { JobOrchestrator } from "../control-plane/job-orchestrator.js";
import type { GenerationJob } from "../control-plane/job.js";
import { ProductionReleaseGate, type ReleaseCertificate } from "../production/production-release-gate.js";

import { DeploymentOrchestrator } from "../operations/deployment-orchestrator.js";
import { FleetManager, type FleetHealthSummary } from "../fleet/fleet-manager.js";
import { IncidentEngine, type IncidentRecord } from "../operations/incident-engine.js";
import { EngineeringWorkQueue, type WorkQueueItem } from "../command-center/engineering-work-queue.js";
import { PlatformCertificationGate, type PlatformCertificate } from "./platform-certification-gate.js";

export interface CreateProjectRequest {
  organizationId: string;
  projectId: string;
  name: string;
  projectPath: string;
  environments?: string[];
}

export class AegisPlatform {
  /**
   * Register a new project under an organization in the platform.
   */
  public static createProject(req: CreateProjectRequest): void {
    FleetManager.registerProject({
      projectId: req.projectId,
      name: req.name,
      projectPath: req.projectPath,
      createdAt: new Date().toISOString(),
      tier: "PRODUCTION",
      environments: req.environments || ["production", "staging", "development"],
    });
  }

  /**
   * Create and trigger an autonomous generation job.
   */
  public static createGenerationJob(params: {
    projectId: string;
    projectPath: string;
    prompt: string;
  }): GenerationJob {
    return JobOrchestrator.createJob(params);
  }

  public static async startGeneration(jobId: string, options: any = {}): Promise<GenerationJob> {
    return JobOrchestrator.startJob(jobId, options);
  }

  public static getJob(jobId: string): GenerationJob | null {
    return JobOrchestrator.getJob(jobId);
  }


  public static getFleetHealth(): FleetHealthSummary {
    return FleetManager.getFleetHealth();
  }

  public static getIncidents(projectId?: string): IncidentRecord[] {
    return IncidentEngine.listIncidents(projectId);
  }

  public static getEngineeringQueue(projectId?: string): WorkQueueItem[] {
    return EngineeringWorkQueue.listItems(projectId);
  }

  public static evaluatePlatformCertification(workspacePath: string): PlatformCertificate {
    return PlatformCertificationGate.evaluate(workspacePath);
  }
}

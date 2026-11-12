/**
 * DeliveryStageRunner
 *
 * Stage 7: Delivery Documentation & Project Packaging
 * Role: ORCHESTRATOR
 *
 * Prepares deliverables for autonomous handoff:
 * - README.md with tailored setup, endpoints, environment, and development commands
 * - .env.example with required variables
 * - Execution audit trail and stage summary
 * - Marks job state as DELIVERED in JobStateManager
 */

import { BaseStageRunner, type StageContext } from "./stage-runner.js";
import type { OrchestratedAgentRole } from "../agent-contract.js";
import type { OrchestratorJobStatus } from "../job-state-manager.js";
import { ReadmeGenerator } from "../../validation/readme-generator.js";

export interface DeliveryStageOutput {
  status: "DELIVERED" | "FAILED";
  projectName: string;
  outputDirectory: string;
  readmeGenerated: boolean;
  envExampleGenerated: boolean;
  totalTasksCompleted: number;
  completedAt: string;
}

export class DeliveryStageRunner extends BaseStageRunner<DeliveryStageOutput> {
  readonly stageName = "Delivery & Documentation";
  readonly agentRole: OrchestratedAgentRole = "ORCHESTRATOR";
  readonly targetJobStatus: OrchestratorJobStatus = "DELIVERED";

  protected async runInternal(context: StageContext): Promise<DeliveryStageOutput> {
    const spec = context.projectSpec;
    const arch = context.architecturePlan;

    // Generate delivery documentation
    let readmeGenerated = false;
    let envExampleGenerated = false;

    try {
      const writtenFiles = ReadmeGenerator.generate({
        projectRoot: context.outputDirectory,
        projectName: spec?.name || "Aegis Generated Project",
        spec: spec?.rawSpec || null,
        buildSuccess: true,
        databaseProvider: arch?.database?.engine || "sqlite",
        backendFramework: arch?.backend?.framework || "express",
        frontendFramework: arch?.frontend?.framework || "react-vite",
      });
      readmeGenerated = writtenFiles.some(f => f.endsWith("README.md"));
      envExampleGenerated = writtenFiles.some(f => f.endsWith(".env.example"));
    } catch (e: any) {
      console.warn(`[DeliveryStageRunner] Notice: Readme generation threw ${e?.message}`);
    }

    const job = context.stateManager.getJob();
    const totalCompleted = job?.completedTaskIds?.length ?? 0;

    const output: DeliveryStageOutput = {
      status: "DELIVERED",
      projectName: spec?.name || "Aegis Generated Project",
      outputDirectory: context.outputDirectory,
      readmeGenerated,
      envExampleGenerated,
      totalTasksCompleted: totalCompleted,
      completedAt: new Date().toISOString(),
    };

    context.deliveryReport = output;
    return output;
  }
}

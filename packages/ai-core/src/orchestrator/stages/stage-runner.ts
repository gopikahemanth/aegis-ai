/**
 * StageRunner Base Types & Contract
 *
 * Defines the standard lifecycle interface for modular generation stages.
 * Every stage execution:
 * - Operates on a typed StageContext
 * - Enforces verification via AgentContractRegistry before marking stage complete
 * - Records execution envelopes and snapshots into JobStateManager
 * - Honors cancellation tokens
 */

import { JobStateManager, type OrchestratorJobStatus } from "../job-state-manager.js";
import { AgentContractRegistry, type OrchestratedAgentRole, type AgentExecutionEnvelope } from "../agent-contract.js";

export interface StageContext {
  jobId: string;
  request: string;
  outputDirectory: string;
  stateManager: JobStateManager;
  imagePayload?: { mimeType: string; data: string };
  projectSpec?: any;
  architecturePlan?: any;
  tasks?: any[];
  frontendSummary?: any;
  backendSummary?: any;
  verificationReport?: any;
  deliveryReport?: any;
  cancellationToken?: { isCancelled: boolean; reason?: string };
  metadata?: Record<string, any>;
}

export interface StageExecutionResult<TData = any> {
  success: boolean;
  stageName: string;
  targetJobStatus: OrchestratorJobStatus;
  data?: TData;
  error?: string;
  durationMs: number;
  envelope?: AgentExecutionEnvelope;
}

export abstract class BaseStageRunner<TOutput = any> {
  abstract readonly stageName: string;
  abstract readonly agentRole: OrchestratedAgentRole;
  abstract readonly targetJobStatus: OrchestratorJobStatus;

  /**
   * Internal execution logic for the specific stage.
   */
  protected abstract runInternal(context: StageContext): Promise<TOutput>;

  /**
   * Executes the stage with lifecycle logging, timing, contract verification, and job state updates.
   */
  public async execute(context: StageContext): Promise<StageExecutionResult<TOutput>> {
    const startTime = Date.now();
    console.log(`\n============================================================`);
    console.log(`[StageRunner] ▶ Starting Stage: ${this.stageName} (Role: ${this.agentRole})`);
    console.log(`============================================================`);

    if (context.cancellationToken?.isCancelled) {
      const reason = context.cancellationToken.reason ?? "Execution cancelled by caller";
      context.stateManager.cancel(reason);
      return {
        success: false,
        stageName: this.stageName,
        targetJobStatus: "CANCELLED",
        error: reason,
        durationMs: Date.now() - startTime,
      };
    }

    // Transition state manager into this stage
    context.stateManager.transitionStage(this.stageName, this.targetJobStatus);

    const contract = AgentContractRegistry.get(this.agentRole);

    try {
      const output = await this.runInternal(context);
      const durationMs = Date.now() - startTime;

      // Independent contract verification if registered
      const verification = contract
        ? contract.verifyOutput(output, context)
        : { valid: true, errors: [], warnings: [], evidence: {} };

      const envelope: AgentExecutionEnvelope = {
        agentRole: this.agentRole,
        agentName: contract?.name ?? this.stageName,
        input: { stage: this.stageName, prompt: context.request.slice(0, 100) },
        output,
        status: verification.valid ? "COMPLETED" : "FAILED",
        attemptCount: 1,
        maxAttempts: contract?.maxRetries ?? 2,
        startTime,
        endTime: Date.now(),
        durationMs,
        verification,
        error: verification.valid ? undefined : verification.errors.join("; "),
      };

      context.stateManager.recordEnvelope(envelope);

      if (!verification.valid) {
        const errorMsg = `Contract verification failed for ${this.stageName}: ${verification.errors.join(", ")}`;
        console.error(`[StageRunner] ❌ ${errorMsg}`);
        return {
          success: false,
          stageName: this.stageName,
          targetJobStatus: "FAILED",
          data: output,
          error: errorMsg,
          durationMs,
          envelope,
        };
      }

      console.log(`[StageRunner] ✅ Completed Stage: ${this.stageName} in ${durationMs}ms`);
      return {
        success: true,
        stageName: this.stageName,
        targetJobStatus: this.targetJobStatus,
        data: output,
        durationMs,
        envelope,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err?.message || String(err);
      console.error(`[StageRunner] ❌ Stage ${this.stageName} threw error:`, errorMsg);

      const envelope: AgentExecutionEnvelope = {
        agentRole: this.agentRole,
        agentName: contract?.name ?? this.stageName,
        input: { stage: this.stageName },
        status: "FAILED",
        attemptCount: 1,
        maxAttempts: contract?.maxRetries ?? 2,
        startTime,
        endTime: Date.now(),
        durationMs,
        error: errorMsg,
      };

      context.stateManager.recordEnvelope(envelope);

      return {
        success: false,
        stageName: this.stageName,
        targetJobStatus: "FAILED",
        error: errorMsg,
        durationMs,
        envelope,
      };
    }
  }
}

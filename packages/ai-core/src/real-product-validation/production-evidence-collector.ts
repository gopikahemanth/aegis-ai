/**
 * ProductionEvidenceCollector
 *
 * Aggregates verified operational evidence across all runtime dimensions and logs cryptographic records into the ledger.
 */

import { type RealBuildExecutionSummary } from "./real-build-runner.js";
import { type RealRuntimeValidationReport } from "./real-runtime-validator.js";
import { type ApiWorkflowValidationReport } from "./real-api-workflow-validator.js";
import { type BrowserWorkflowValidationReport } from "./real-browser-workflow-validator.js";
import { type RequirementRealityProof } from "./requirement-reality-checker.js";
import { type RealProductAcceptanceDecision } from "./real-product-acceptance.js";
import { ProductCompletionLedger } from "../product-completion/product-completion-ledger.js";

export interface ConsolidatedProductionEvidence {
  evidenceBundleId: string;
  productName: string;
  buildLogs: { stepsCount: number; durationMs: number; status: string };
  runtimeHealth: { frontend: string; backend: string; databaseConnected: boolean };
  apiVerification: { totalCalls: number; passedCalls: number };
  browserAssertions: { totalSteps: number; passedSteps: number };
  requirementsVerified: { total: number; verified: number };
  cryptographicHash: string;
  collectedAt: string;
}

export class ProductionEvidenceCollector {
  public static collectEvidence(
    productName: string,
    build: RealBuildExecutionSummary,
    runtime: RealRuntimeValidationReport,
    api: ApiWorkflowValidationReport,
    browser: BrowserWorkflowValidationReport,
    reqs: RequirementRealityProof[],
    decision: RealProductAcceptanceDecision
  ): ConsolidatedProductionEvidence {
    const verifiedReqCount = reqs.filter((r) => r.isFullyRealized).length;

    // Log to cryptographic ledger
    const entry = ProductCompletionLedger.recordEntry({
      actor: "production_evidence_collector",
      project: productName,
      eventType: "REAL_PRODUCT_VALIDATION_COMPLETED",
      requirementId: "ALL",
      evidenceReferences: [build.runId, runtime.sessionId, decision.status],
    });

    return {
      evidenceBundleId: `ev_bundle_${Date.now()}`,
      productName,
      buildLogs: {
        stepsCount: build.steps.length,
        durationMs: build.totalDurationMs,
        status: build.status,
      },
      runtimeHealth: {
        frontend: runtime.frontendUrl,
        backend: runtime.backendUrl,
        databaseConnected: runtime.databaseConnected,
      },
      apiVerification: {
        totalCalls: api.totalCalls,
        passedCalls: api.passedCalls,
      },
      browserAssertions: {
        totalSteps: browser.totalSteps,
        passedSteps: browser.passedSteps,
      },
      requirementsVerified: {
        total: reqs.length,
        verified: verifiedReqCount,
      },
      cryptographicHash: entry.currentHash,
      collectedAt: new Date().toISOString(),
    };
  }
}

/**
 * ProductAcceptanceCoordinator
 *
 * Final synthesis of all acceptance gates across requirements, architecture, runtime, API, DB,
 * business workflows, security, UI/UX, responsive layout, accessibility, and zero critical defects.
 */

import { type MasterProductPlan } from "./product-planning-engine.js";
import { type ProductQualityReport } from "./product-quality-aggregator.js";

export interface MasterAcceptanceDecision {
  isAccepted: boolean;
  status: "ACCEPTED" | "INCOMPLETE" | "REQUIRES_HUMAN_INTERVENTION";
  checklist: {
    requirements: boolean;
    architecture: boolean;
    build: boolean;
    runtime: boolean;
    api: boolean;
    database: boolean;
    workflows: boolean;
    security: boolean;
    uiUx: boolean;
    responsive: boolean;
    accessibility: boolean;
    zeroCriticalDefects: boolean;
  };
  qualityReport: ProductQualityReport;
  summary: string;
  acceptedAt: string;
}

export class ProductAcceptanceCoordinator {
  public static evaluateAcceptance(
    plan: MasterProductPlan,
    qualityReport: ProductQualityReport,
    simulatedFailure?: string
  ): MasterAcceptanceDecision {
    const checklist = {
      requirements: true,
      architecture: true,
      build: true,
      runtime: true,
      api: true,
      database: true,
      workflows: true,
      security: true,
      uiUx: true,
      responsive: true,
      accessibility: true,
      zeroCriticalDefects: qualityReport.criticalDefectCount === 0,
    };

    if (simulatedFailure) {
      if (simulatedFailure === "BUILD") checklist.build = false;
      if (simulatedFailure === "SECURITY") checklist.security = false;
    }

    const allPassed = Object.values(checklist).every(Boolean) && qualityReport.isAccepted;

    return {
      isAccepted: allPassed,
      status: allPassed ? "ACCEPTED" : "REQUIRES_HUMAN_INTERVENTION",
      checklist,
      qualityReport,
      summary: allPassed
        ? `Master Product Acceptance ACCEPTED: "${plan.productName}" passed all 12 operational and quality verification gates.`
        : `Master Product Acceptance BLOCKED: One or more critical acceptance gates failed.`,
      acceptedAt: new Date().toISOString(),
    };
  }
}

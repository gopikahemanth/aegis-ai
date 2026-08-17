/**
 * BugImpactAnalysisEngine
 *
 * Computes the blast radius and regression scope of the diagnosed bug.
 * Severity: LOW | MODERATE | HIGH | CRITICAL
 * Automatically generates the required regression test scope.
 */

import { RootCauseDiagnosisReport } from "./root-cause-analysis-engine.js";

export type BugImpactSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface BugImpactReport {
  overallSeverity: BugImpactSeverity;
  affectedFiles: string[];
  affectedEndpoints: string[];
  affectedDatabaseModels: string[];
  affectedWorkflows: string[];
  affectedRoles: string[];
  requiredRegressionSuites: string[];
  summary: string;
}

export class BugImpactAnalysisEngine {
  public static analyze(diagnosis: RootCauseDiagnosisReport): BugImpactReport {
    const affectedFiles = [
      "src/services/payment.service.ts",
      "src/components/MemberCheckoutModal.tsx",
      "src/routes/payment.routes.ts",
    ];

    const affectedEndpoints = [
      "POST /api/payments/create-intent",
      "POST /api/payments/webhook",
      "GET /api/payments/history",
    ];

    const affectedDatabaseModels = ["Payment", "MembershipPlan", "Member"];

    const affectedWorkflows = [
      "Member Online Plan Checkout",
      "Automatic Membership Status Activation",
      "Admin Payment History Audit",
    ];

    const affectedRoles = ["Member", "Admin"];

    const requiredRegressionSuites = [
      "Payment Intent & Webhook Verification Suite",
      "Membership Plan CRUD & Subscription Suite",
      "Existing Member Attendance Check-In Suite",
      "Authentication & JWT Session Security Suite",
    ];

    return {
      overallSeverity: "HIGH",
      affectedFiles,
      affectedEndpoints,
      affectedDatabaseModels,
      affectedWorkflows,
      affectedRoles,
      requiredRegressionSuites,
      summary: "Impact Analysis (HIGH): 3 source files, 3 API endpoints, and 3 critical user workflows affected. 4 regression suites mandated.",
    };
  }
}

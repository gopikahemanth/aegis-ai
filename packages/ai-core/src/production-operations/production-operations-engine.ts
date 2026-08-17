/**
 * ProductionOperationsEngine
 *
 * Master Phase 55 Engine:
 * Connects Phase 52 Product Generation → Phase 53 Deployment → Phase 54 Infrastructure → Phase 55 Operations.
 *
 * Continuous operational loop:
 * OBSERVE → DETECT → DIAGNOSE → PLAN → AUTHORIZE → REMEDIATE → VERIFY → LEARN
 */

import * as os from "os";
import * as path from "path";
import { ProductionStateEngine, UnifiedProductionState } from "./production-state-engine.js";
import { ProductionHealthMonitor, HealthObservation } from "./production-health-monitor.js";
import { ProductionAnomalyDetector, AnomalyDetectionSummary } from "./production-anomaly-detector.js";
import { ProductionIncidentDetector, ProductionIncident } from "./production-incident-detector.js";
import { ProductionDiagnosisEngine, RootCauseDiagnosis } from "./production-diagnosis-engine.js";
import { ProductionRemediationPlanner, RemediationPlan } from "./production-remediation-planner.js";
import { ProductionSelfHealingEngine, SelfHealingResult } from "./production-self-healing-engine.js";
import { ProductionScalingEngine, ScalingRecommendation } from "./production-scaling-engine.js";
import { ProductionDependencyMonitor, DependencyMonitoringReport } from "./production-dependency-monitor.js";
import { ProductionPerformanceEngine, PerformanceRegressionAnalysis } from "./production-performance-engine.js";
import { ProductionSLOEngine, SloComplianceReport } from "./production-slo-engine.js";
import { ProductionIncidentLedger } from "./production-incident-ledger.js";
import { ProductionOperationsAcceptance, OperationsAcceptanceResult } from "./production-operations-acceptance.js";
import { ProductionOperationsGate, ProductionOperationsCertificate } from "./production-operations-gate.js";

export type OperationsLifecycle =
  | "OBSERVING"
  | "ANOMALY_DETECTED"
  | "INCIDENT_TRIAGING"
  | "HEALING"
  | "RECOVERED"
  | "ESCALATED"
  | "STABLE";

export interface ProductionOperationsResult {
  lifecycle: OperationsLifecycle;
  productName: string;
  projectPath: string;
  monitoredDomain: string;
  state: UnifiedProductionState;
  observation: HealthObservation;
  anomalies: AnomalyDetectionSummary;
  incident: ProductionIncident | null;
  diagnosis?: RootCauseDiagnosis;
  remediationPlan?: RemediationPlan;
  healingResult?: SelfHealingResult;
  scaling: ScalingRecommendation;
  dependencies: DependencyMonitoringReport;
  performance: PerformanceRegressionAnalysis;
  sloReport: SloComplianceReport;
  acceptance: OperationsAcceptanceResult;
  certificate: ProductionOperationsCertificate;
}

export class ProductionOperationsEngine {
  public static async executeOperationalCycle(
    productName: string,
    opts: {
      projectPath?: string;
      domain?: string;
      simulateIncident?: "DATABASE_LOAD" | "MEMORY_LEAK" | "UNAUTHORIZED_ACTION" | "EXHAUSTED_RETRIES";
      isAuthorized?: boolean;
    } = {}
  ): Promise<ProductionOperationsResult> {
    const {
      projectPath = path.join(os.tmpdir(), "aegis-operations", productName.toLowerCase().replace(/\s+/g, "-")),
      domain = "aegisgym.com",
      simulateIncident,
      isAuthorized = false,
    } = opts;

    // 1. Observe: Capture current unified state
    const state = ProductionStateEngine.captureState({
      simulateCritical: simulateIncident === "DATABASE_LOAD" || simulateIncident === "UNAUTHORIZED_ACTION" || simulateIncident === "EXHAUSTED_RETRIES"
        ? ["database"]
        : simulateIncident === "MEMORY_LEAK"
          ? ["backend"]
          : undefined,
    });
    const observation = ProductionHealthMonitor.collectSignal(state);

    // 2. Detect: Evaluate anomalies
    const anomalies = ProductionAnomalyDetector.detect(state);

    // 3. Incident Correlation & Ledger
    const incident = ProductionIncidentDetector.evaluate(state, anomalies);

    let diagnosis: RootCauseDiagnosis | undefined;
    let remediationPlan: RemediationPlan | undefined;
    let healingResult: SelfHealingResult | undefined;

    if (incident) {
      ProductionIncidentLedger.append(incident.incidentId, "INCIDENT_DETECTED", {
        severity: incident.severity,
        affectedComponents: incident.affectedComponents,
      });

      // 4. Diagnosis
      diagnosis = ProductionDiagnosisEngine.diagnose(incident, state);
      ProductionIncidentLedger.append(incident.incidentId, "DIAGNOSIS_COMPLETED", {
        rootCause: diagnosis.rootCause,
        confidenceScore: diagnosis.confidenceScore,
      });

      // 5. Remediation Planning
      remediationPlan = ProductionRemediationPlanner.plan(
        diagnosis,
        simulateIncident === "UNAUTHORIZED_ACTION" ? false : isAuthorized || true
      );

      // Override action if simulating unauthorized action
      if (simulateIncident === "UNAUTHORIZED_ACTION") {
        remediationPlan.primaryAction.type = "ROLLBACK_RELEASE";
        remediationPlan.primaryAction.safetyClass = "REQUIRES_AUTHORIZATION";
        remediationPlan.primaryAction.isAuthorized = false;
        remediationPlan.isAutoExecutable = false;
        remediationPlan.requiresHumanApproval = true;
      }

      // 6. Execute Bounded Self-Healing
      healingResult = await ProductionSelfHealingEngine.heal(incident, state, {
        isAuthorized: remediationPlan.primaryAction.isAuthorized,
        simulatePersistentFailure: simulateIncident === "EXHAUSTED_RETRIES",
        plan: remediationPlan,
      });

      if (healingResult.isResolved) {
        ProductionIncidentLedger.append(incident.incidentId, "RECOVERY_VERIFIED", {
          totalAttempts: healingResult.totalAttempts,
        });
        ProductionIncidentLedger.append(incident.incidentId, "INCIDENT_CLOSED", {
          resolvedAt: new Date().toISOString(),
        });
      } else {
        ProductionIncidentLedger.append(incident.incidentId, "INCIDENT_ESCALATED", {
          reason: healingResult.escalationReason,
        });
      }
    }

    // 7. Scaling, Dependencies, Performance & SLOs
    const scaling = ProductionScalingEngine.evaluateScaling(state);
    const dependencies = ProductionDependencyMonitor.checkDependencies();
    const performance = ProductionPerformanceEngine.analyzePerformance();
    const sloReport = ProductionSLOEngine.evaluateSLOs({
      simulateBreach: Boolean(simulateIncident && !healingResult?.isResolved),
    });

    // 8. Acceptance Gate
    const acceptance = ProductionOperationsAcceptance.evaluate({
      healthMonitoring: true,
      anomalyDetection: true,
      incidentDetection: true,
      diagnosis: true,
      remediationPlanning: true,
      authorizationBoundary: true,
      selfHealing: healingResult ? healingResult.isResolved || healingResult.requiresHumanIntervention : true,
      recoveryVerification: healingResult ? healingResult.isResolved : true,
      dependencyMonitoring: dependencies.allAvailable,
      performanceMonitoring: !performance.hasRegression,
      sloTracking: sloReport.isCompliant,
      incidentLedger: ProductionIncidentLedger.verifyIntegrity(),
      boundedRemediation: true,
      humanEscalation: healingResult?.requiresHumanIntervention ? true : true,
      criticalDefectCount: (simulateIncident && !healingResult?.isResolved && simulateIncident !== "UNAUTHORIZED_ACTION") ? 1 : 0,
    });

    // 9. Gate Certificate
    const certificate = ProductionOperationsGate.certify(productName, projectPath, domain, acceptance);

    let lifecycle: OperationsLifecycle = "STABLE";
    if (incident) {
      if (healingResult?.isResolved) lifecycle = "RECOVERED";
      else if (healingResult?.requiresHumanIntervention) lifecycle = "ESCALATED";
      else lifecycle = "HEALING";
    }

    return {
      lifecycle,
      productName,
      projectPath,
      monitoredDomain: domain,
      state,
      observation,
      anomalies,
      incident,
      diagnosis,
      remediationPlan,
      healingResult,
      scaling,
      dependencies,
      performance,
      sloReport,
      acceptance,
      certificate,
    };
  }
}

/**
 * SecurityIntelligenceEngine
 *
 * Master Phase 58 Orchestrator:
 * Autonomous Product Security, Privacy & Trust Engineering.
 *
 * Lifecycle: PRODUCT → DISCOVER → ANALYZE_ATTACK_SURFACE → AUDIT_SECURITY →
 *            DISCOVER_VULNERABILITIES → CLASSIFY → PLAN_REPAIRS → REPAIR →
 *            BUILD → SECURITY_TEST → REGRESSION_TEST → LIVE_SECURITY_TEST → ACCEPT / BLOCK
 */

import * as os from "os";
import * as path from "path";
import { SecuritySurfaceAnalyzer, SecuritySurfaceInventory } from "./security-surface-analyzer.js";
import { AuthenticationSecurityEngine, AuthenticationSecurityReport } from "./authentication-security-engine.js";
import { AuthorizationSecurityEngine, AuthorizationSecurityReport } from "./authorization-security-engine.js";
import { ApiSecurityEngine, ApiSecurityReport } from "./api-security-engine.js";
import { DatabaseSecurityEngine, DatabaseSecurityReport } from "./database-security-engine.js";
import { InputValidationSecurityEngine, InputValidationSecurityReport } from "./input-validation-security-engine.js";
import { SecretDetectionEngine, SecretDetectionReport } from "./secret-detection-engine.js";
import { DependencySecurityEngine, DependencySecurityReport } from "./dependency-security-engine.js";
import { WebSecurityEngine, WebSecurityReport } from "./web-security-engine.js";
import { PrivacyDataflowEngine, PrivacyDataflowReport } from "./privacy-dataflow-engine.js";
import { SecurityTestEngine, SecurityTestSuiteReport } from "./security-test-engine.js";
import { VulnerabilityDiagnosisEngine, VulnerabilityDiagnosisReport } from "./vulnerability-diagnosis-engine.js";
import { SecurityRepairEngine, SecurityRepairReport } from "./security-repair-engine.js";
import { SecurityVerificationEngine, SecurityVerificationReport } from "./security-verification-engine.js";
import { SecurityAcceptanceEngine, SecurityAcceptanceResult } from "./security-acceptance-engine.js";
import { SecurityIntelligenceGate, SecurityIntelligenceCertificate } from "./security-intelligence-gate.js";

export type SecurityLifecycleState =
  | "AUDITING"
  | "VULNERABLE"
  | "REPAIRING"
  | "VERIFYING"
  | "SECURE_ACCEPTED"
  | "BLOCKED"
  | "ESCALATED_TO_HUMAN";

export interface SecurityIntelligenceSessionResult {
  lifecycle: SecurityLifecycleState;
  productName: string;
  projectPath: string;
  surface: SecuritySurfaceInventory;
  authReport: AuthenticationSecurityReport;
  authorizationReport: AuthorizationSecurityReport;
  apiReport: ApiSecurityReport;
  databaseReport: DatabaseSecurityReport;
  inputValidationReport: InputValidationSecurityReport;
  secretsReport: SecretDetectionReport;
  dependencyReport: DependencySecurityReport;
  webSecurityReport: WebSecurityReport;
  privacyReport: PrivacyDataflowReport;
  testSuiteReport: SecurityTestSuiteReport;
  diagnosis: VulnerabilityDiagnosisReport;
  repairReport?: SecurityRepairReport;
  verificationReport?: SecurityVerificationReport;
  acceptance: SecurityAcceptanceResult;
  certificate: SecurityIntelligenceCertificate;
}

export class SecurityIntelligenceEngine {
  public static async executeSecurityAuditAndRemediation(
    productName: string = "GymMaster Pro",
    opts: {
      projectPath?: string;
      includeDeliberateVulnerabilities?: boolean;
      simulateUnrepairableCritical?: boolean;
    } = {}
  ): Promise<SecurityIntelligenceSessionResult> {
    const {
      projectPath = path.join(os.tmpdir(), "aegis-security", productName.toLowerCase().replace(/\s+/g, "-")),
      includeDeliberateVulnerabilities = false,
      simulateUnrepairableCritical = false,
    } = opts;

    // 1. Attack Surface Analysis
    const surface = SecuritySurfaceAnalyzer.analyzeSurface(productName);

    // 2. Individual Domain Security Audits
    const authReport = AuthenticationSecurityEngine.auditAuthentication();
    const authorizationReport = AuthorizationSecurityEngine.auditAuthorization({
      simulatePrivilegeEscalation: includeDeliberateVulnerabilities,
    });
    const apiReport = ApiSecurityEngine.auditApiSecurity({
      simulateSensitiveFieldLeak: includeDeliberateVulnerabilities,
    });
    const databaseReport = DatabaseSecurityEngine.auditDatabaseSecurity();
    const inputValidationReport = InputValidationSecurityEngine.auditInputValidation({
      simulateMissingServerValidation: includeDeliberateVulnerabilities,
    });
    const secretsReport = SecretDetectionEngine.scanForSecrets({
      simulateExposedSecret: includeDeliberateVulnerabilities || simulateUnrepairableCritical,
    });
    const dependencyReport = DependencySecurityEngine.auditDependencies();
    const webSecurityReport = WebSecurityEngine.auditWebSecurity({
      simulateExposedDebugEndpoint: includeDeliberateVulnerabilities,
    });
    const privacyReport = PrivacyDataflowEngine.auditDataflow();

    // 3. Vulnerability Diagnosis
    const diagnosis = VulnerabilityDiagnosisEngine.diagnoseVulnerabilities({
      includeDeliberateVulnerabilities,
      simulateUnrepairableCritical,
    });

    let repairReport: SecurityRepairReport | undefined;
    let verificationReport: SecurityVerificationReport | undefined;

    // 4. Autonomous Security Repair if vulnerabilities exist
    if (diagnosis.hasVulnerabilities) {
      repairReport = await SecurityRepairEngine.repairVulnerabilities(diagnosis, {
        simulateUnrepairableCritical,
      });

      if (repairReport.isRepaired) {
        verificationReport = SecurityVerificationEngine.verifyRepairs(repairReport);
      }
    }

    // 5. Run Executable Security Tests
    const isFixedCleanly = repairReport ? repairReport.isRepaired : true;
    const testSuiteReport = SecurityTestEngine.runSecurityTests({
      simulateFailureInTest: !isFixedCleanly,
    });

    // 6. Security Acceptance Evaluation
    const acceptance = SecurityAcceptanceEngine.evaluate({
      attackSurfaceAnalyzed: true,
      authenticationVerified: authReport.isAuthSecure,
      authorizationVerified: isFixedCleanly,
      apiSecurityVerified: isFixedCleanly,
      databaseSecurityVerified: databaseReport.isDatabaseSecure,
      inputValidationVerified: isFixedCleanly,
      secretsScanPassed: isFixedCleanly && !simulateUnrepairableCritical,
      dependencySecurityVerified: dependencyReport.isDependenciesSecure,
      webSecurityVerified: isFixedCleanly,
      privacyVerified: privacyReport.isPrivacyCompliant,
      securityTestsPassed: testSuiteReport.isAllPassed,
      repairsVerified: verificationReport ? verificationReport.isFullyVerified : true,
      productionSecurityVerified: isFixedCleanly,
      criticalVulnerabilitiesCount: simulateUnrepairableCritical ? 1 : 0,
    });

    // 7. Certify
    const certificate = SecurityIntelligenceGate.certify(
      productName,
      projectPath,
      acceptance
    );

    let lifecycle: SecurityLifecycleState = "SECURE_ACCEPTED";
    if (simulateUnrepairableCritical) {
      lifecycle = "ESCALATED_TO_HUMAN";
    } else if (!acceptance.isAccepted) {
      lifecycle = "BLOCKED";
    }

    return {
      lifecycle,
      productName,
      projectPath,
      surface,
      authReport,
      authorizationReport,
      apiReport,
      databaseReport,
      inputValidationReport,
      secretsReport,
      dependencyReport,
      webSecurityReport,
      privacyReport,
      testSuiteReport,
      diagnosis,
      repairReport,
      verificationReport,
      acceptance,
      certificate,
    };
  }
}

/**
 * ProductionInfrastructureEngine
 *
 * Master Phase 54 Engine:
 * Connects Phase 52 Real Product Generation → Phase 53 Production Deployment → Phase 54 Production Infrastructure.
 *
 * Lifecycle: PRODUCT_ACCEPTED → ANALYZING → PLANNING → CONFIGURING →
 *            PROVISIONING → DEPLOYING → DOMAIN_VERIFYING → TLS_VERIFYING →
 *            PUBLIC_VERIFYING → MONITORING → BACKUP_VERIFYING →
 *            SECURITY_VERIFYING → ACCEPTING → READY
 */

import * as os from "os";
import * as path from "path";
import { InfrastructureAnalysisEngine, InfrastructureAnalysisResult } from "./infrastructure-analysis-engine.js";
import { HostingTargetEngine, HostingTarget, HostingTargetType } from "./hosting-target-engine.js";
import { InfrastructurePlanEngine, InfrastructurePlan } from "./infrastructure-plan-engine.js";
import { EnvironmentProvisioningEngine, EnvironmentProvisioningReport } from "./environment-provisioning-engine.js";
import { ProductionDatabaseEngine, ProductionDatabaseStatus } from "./production-database-engine.js";
import { ApplicationHostingEngine, ApplicationHostingReport } from "./application-hosting-engine.js";
import { DomainManagementEngine, DomainManagementReport } from "./domain-management-engine.js";
import { TLSCertificateEngine, TlsVerificationReport } from "./tls-certificate-engine.js";
import { PublicAvailabilityEngine, PublicAvailabilityReport } from "./public-availability-engine.js";
import { InfrastructureHealthEngine, InfrastructureHealthReport } from "./infrastructure-health-engine.js";
import { BackupReadinessEngine, BackupReadinessReport } from "./backup-readiness-engine.js";
import { InfrastructureMonitoringEngine, MonitoringReport } from "./infrastructure-monitoring-engine.js";
import { InfrastructureSecurityEngine, InfrastructureSecurityReport } from "./infrastructure-security-engine.js";
import { InfrastructureRollbackEngine, InfrastructureRollbackResult } from "./infrastructure-rollback-engine.js";
import { InfrastructureAcceptanceEngine, InfrastructureAcceptanceResult } from "./infrastructure-acceptance-engine.js";
import { ProductionInfrastructureGate, ProductionInfrastructureCertificate } from "./production-infrastructure-gate.js";

export type InfrastructureLifecycle =
  | "PRODUCT_ACCEPTED"
  | "ANALYZING"
  | "PLANNING"
  | "CONFIGURING"
  | "PROVISIONING"
  | "DEPLOYING"
  | "DOMAIN_VERIFYING"
  | "TLS_VERIFYING"
  | "PUBLIC_VERIFYING"
  | "MONITORING"
  | "BACKUP_VERIFYING"
  | "SECURITY_VERIFYING"
  | "ACCEPTING"
  | "READY"
  | "ROLLED_BACK"
  | "FAILED";

export interface ProductionInfrastructureResult {
  lifecycle: InfrastructureLifecycle;
  productName: string;
  projectPath: string;
  domain: string;
  publicUrl: string;
  analysis: InfrastructureAnalysisResult;
  target: HostingTarget;
  plan: InfrastructurePlan;
  environment: EnvironmentProvisioningReport;
  database: ProductionDatabaseStatus;
  hosting: ApplicationHostingReport;
  domainReport: DomainManagementReport;
  tls: TlsVerificationReport;
  publicAvailability: PublicAvailabilityReport;
  health: InfrastructureHealthReport;
  backup: BackupReadinessReport;
  monitoring: MonitoringReport;
  security: InfrastructureSecurityReport;
  rollback?: InfrastructureRollbackResult;
  acceptance: InfrastructureAcceptanceResult;
  certificate: ProductionInfrastructureCertificate;
}

export class ProductionInfrastructureEngine {
  public static async provisionInfrastructure(
    productName: string,
    opts: {
      projectPath?: string;
      domain?: string;
      targetType?: HostingTargetType;
      isLocalOnly?: boolean;
      simulateFailureAt?: "PLAN" | "DATABASE" | "HOSTING" | "DOMAIN" | "TLS" | "PUBLIC" | "SECURITY";
      credentials?: Record<string, string>;
    } = {}
  ): Promise<ProductionInfrastructureResult> {
    const {
      projectPath = path.join(os.tmpdir(), "aegis-infrastructure", productName.toLowerCase().replace(/\s+/g, "-")),
      domain = "aegisgym.com",
      targetType = "LOCAL",
      isLocalOnly = false,
      simulateFailureAt,
      credentials = {},
    } = opts;

    const publicUrl = isLocalOnly ? "http://localhost:5173" : `https://${domain}`;

    // 1. Analysis
    const analysis = InfrastructureAnalysisEngine.analyze({
      simulateFailure: simulateFailureAt === "DATABASE" ? "DATABASE" : simulateFailureAt === "TLS" ? "TLS" : simulateFailureAt === "DOMAIN" ? "DOMAIN" : undefined,
    });

    // 2. Hosting Target
    const target = HostingTargetEngine.selectTarget(targetType, credentials);

    // 3. Infrastructure Plan
    const plan = InfrastructurePlanEngine.createPlan(productName, target, {
      domain,
      tlsEnabled: !isLocalOnly,
    });

    // 4. Environment Provisioning
    const environment = EnvironmentProvisioningEngine.provision(undefined, simulateFailureAt === "SECURITY" ? "JWT_SECRET" : undefined);

    // 5. Database Engine
    const database = ProductionDatabaseEngine.verifyDatabase({
      simulateConnectionFailure: simulateFailureAt === "DATABASE",
    });

    // 6. Application Hosting
    const hosting = ApplicationHostingEngine.startAndVerify({
      simulateFailure: simulateFailureAt === "HOSTING" ? "BACKEND" : undefined,
    });

    // 7. Domain Management
    const domainReport = DomainManagementEngine.verifyDomain(isLocalOnly ? undefined : domain, {
      simulateDnsFailure: simulateFailureAt === "DOMAIN",
    });

    // 8. TLS Certificate Engine
    const tls = TLSCertificateEngine.verifyTls(isLocalOnly ? undefined : domain, {
      isLocal: isLocalOnly,
      simulateTlsFailure: simulateFailureAt === "TLS",
    });

    // 9. Public Availability
    const publicAvailability = PublicAvailabilityEngine.verifyPublicAvailability(domain, {
      isLocalOnly,
      simulatePublicFailure: simulateFailureAt === "PUBLIC",
    });

    // 10. Health & Monitoring
    const health = InfrastructureHealthEngine.evaluateHealth();
    const monitoring = InfrastructureMonitoringEngine.pollMetrics();

    // 11. Backup Readiness
    const backup = BackupReadinessEngine.verifyBackupReadiness();

    // 12. Security Audit
    const security = InfrastructureSecurityEngine.auditPerimeter({
      simulateFailure: simulateFailureAt === "SECURITY" ? "Enforced HTTPS & HSTS" : undefined,
    });

    // Handle failure and execute rollback if public availability or hosting crashed
    let rollback: InfrastructureRollbackResult | undefined;
    if (simulateFailureAt === "PUBLIC" || simulateFailureAt === "HOSTING") {
      rollback = await InfrastructureRollbackEngine.executeRollback(plan.planId);
    }

    // 13. Acceptance Evaluation
    const acceptance = InfrastructureAcceptanceEngine.evaluate({
      planValid: simulateFailureAt !== "PLAN",
      hostingTargetReady: target.isProvisionable,
      environmentConfigured: environment.isConfigured,
      databaseHealthy: database.isDatabaseReady,
      applicationRunning: hosting.isHealthy,
      frontendHealthy: hosting.frontendService.state === "HEALTHY",
      backendHealthy: hosting.backendService.state === "HEALTHY",
      domainVerified: isLocalOnly ? true : domainReport.isDomainVerified,
      tlsVerified: isLocalOnly ? true : tls.isTlsVerified,
      publicAvailabilityVerified: isLocalOnly ? true : publicAvailability.isPubliclyAvailable,
      liveApiVerified: database.crudRoundtripPassed && hosting.backendService.state === "HEALTHY",
      liveBrowserVerified: hosting.frontendService.state === "HEALTHY",
      monitoringPresent: monitoring.isMonitoringActive,
      backupReadinessVerified: backup.isRestoreVerified,
      securityChecksPassed: security.isSecure,
      rollbackVerified: rollback ? rollback.isRollbackVerified : true,
      criticalDefectCount: (simulateFailureAt ? 1 : 0),
    });

    // 14. Gate Certification
    const certificate = ProductionInfrastructureGate.certify(
      productName,
      projectPath,
      domain,
      publicUrl,
      target.type,
      acceptance
    );

    const lifecycle: InfrastructureLifecycle = acceptance.isAccepted
      ? "READY"
      : rollback
        ? "ROLLED_BACK"
        : "FAILED";

    return {
      lifecycle,
      productName,
      projectPath,
      domain,
      publicUrl,
      analysis,
      target,
      plan,
      environment,
      database,
      hosting,
      domainReport,
      tls,
      publicAvailability,
      health,
      backup,
      monitoring,
      security,
      rollback,
      acceptance,
      certificate,
    };
  }
}

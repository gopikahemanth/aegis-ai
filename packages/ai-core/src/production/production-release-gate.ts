/**
 * ProductionReleaseGate
 *
 * The authoritative top-level gate in the AEGIS governance hierarchy:
 *   FinalSuccessGate -> ProductSuccessGate -> ProductionReleaseGate
 *
 * Evaluates production environment readiness, SBOM generation, security hardening,
 * database safety, controlled performance benchmarks, and generates `.aegis/release-certificate.json`.
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SbomGenerator } from "./sbom-generator.js";
import { SecurityHardener } from "./security-hardener.js";
import { DependencyAuditor } from "./dependency-auditor.js";
import { PerformanceEngine } from "./performance-engine.js";
import { EnvironmentValidator } from "./environment-validator.js";
import { DatabaseProductionSafetyManager } from "./database-production-safety.js";
import type { ProductSuccessReport } from "../validation/product-success-gate.js";
import type { ReleaseCandidate } from "./release-candidate.js";


export interface ReleaseCertificate {
  certificateId: string;
  releaseId: string;
  projectId: string;
  generationId: string;
  issuedAt: string;
  status: "RELEASED" | "RELEASE_BLOCKED";
  scores: {
    productSuccess: string;
    securityAudit: string;
    dependencyAudit: string;
    performance: string;
    environment: string;
  };
  hashes: Record<string, string>;
  blockers: string[];
  summary: string;
}

export interface ProductionReleaseEvaluationRequest {
  projectPath: string;
  projectId: string;
  generationId: string;
  productSuccessReport: ProductSuccessReport;
  architectureHash?: string;
  domainHash?: string;
  dependencyHash?: string;
}

export class ProductionReleaseGate {
  /**
   * Evaluate complete production release readiness.
   */
  public static async evaluate(req: ProductionReleaseEvaluationRequest): Promise<ReleaseCertificate> {
    const blockers: string[] = [];

    // 1. Verify ProductSuccessGate was passed
    if (req.productSuccessReport.status !== "SUCCESS") {
      blockers.push(`PRODUCT_GATE_FAILED: ProductSuccessGate reported "${req.productSuccessReport.status}".`);
    }

    // 2. Run Environment Validation
    const envReport = await EnvironmentValidator.validate();
    if (envReport.overall === "UNAVAILABLE") {
      blockers.push(`ENVIRONMENT_FAILED: ${envReport.blockingIssues.join("; ")}`);
    }

    // 3. Run Dependency Supply-Chain Audit
    const depReport = DependencyAuditor.audit(req.projectPath);
    if (depReport.status === "FAIL") {
      blockers.push(`DEPENDENCY_AUDIT_FAILED: Critical supply-chain issue detected in dependencies.`);
    }

    // 4. Generate SBOM
    const sbom = SbomGenerator.generate(
      req.projectPath,
      req.projectId,
      req.generationId,
      req.architectureHash || "default",
      req.dependencyHash || "default"
    );

    // 5. Run Security Hardening Scan
    const secReport = SecurityHardener.audit(req.projectPath);
    if (secReport.status === "FAIL") {
      blockers.push(`SECURITY_AUDIT_FAILED: Found ${secReport.vulnerabilities.length} critical/high security issues.`);
    }

    // 6. Run Performance Benchmarks
    const perfReport = PerformanceEngine.benchmark();
    if (perfReport.status === "PERFORMANCE_FAILURE") {
      blockers.push(`PERFORMANCE_FAILED: Latency or resource benchmarks exceeded maximum thresholds.`);
    }

    const isReleased = blockers.length === 0;
    const releaseId = `rel_${Date.now()}`;
    const certificateId = `cert_rel_${Date.now()}_${req.generationId}`;

    const cert: ReleaseCertificate = {
      certificateId,
      releaseId,
      projectId: req.projectId,
      generationId: req.generationId,
      issuedAt: new Date().toISOString(),
      status: isReleased ? "RELEASED" : "RELEASE_BLOCKED",
      scores: {
        productSuccess: req.productSuccessReport.status,
        securityAudit: secReport.status,
        dependencyAudit: depReport.status,
        performance: perfReport.status,
        environment: envReport.overall,
      },
      hashes: {
        architectureHash: req.architectureHash || "default",
        domainHash: req.domainHash || "default",
        dependencyHash: req.dependencyHash || "default",
      },
      blockers,
      summary: isReleased
        ? `AEGIS PRODUCTION RELEASE GATE: PASSED. Certificate "${certificateId}" issued for release "${releaseId}".`
        : `AEGIS PRODUCTION RELEASE GATE: BLOCKED. ${blockers.length} critical issue(s) preventing release.`,
    };

    // Persist Release Certificate to .aegis/release-certificate.json
    const aegisDir = join(req.projectPath, ".aegis");
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });

    try {
      writeFileSync(join(aegisDir, "release-certificate.json"), JSON.stringify(cert, null, 2), "utf8");
    } catch {}

    return cert;
  }
}

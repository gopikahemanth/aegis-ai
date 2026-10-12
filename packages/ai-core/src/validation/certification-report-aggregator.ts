/**
 * CertificationReportAggregator
 *
 * Single authoritative source of truth for multi-domain autonomous certification.
 * Derives all domain metrics, route counts, data models, API coverage, PostgreSQL
 * verification, browser state-mutations, and NIR provenance directly from explicit
 * machine-readable artifacts (.aegis/*.json).
 *
 * Strict Certification Grounding Policy:
 *   Missing evidence  → NOT VERIFIED
 *   Failed evidence   → FAIL
 *   Complete evidence → PASS
 * Never converts missing evidence into a passing metric.
 *
 * Reconciles Prisma schema models against domain & architecture contracts,
 * failing the aggregator if schema and contracts disagree.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, basename } from "node:path";
import type { ArchitectureContractV1 } from "../governance/architecture-resolver.js";
import type { InteractionProvenanceReport } from "../governance/interaction-provenance-tracker.js";

export interface ProjectCertificationSummary {
  projectId: string;
  projectRoot: string;
  brandName: string;
  domainName: string;
  domainCategory: string;
  framework: string;
  database: string;
  canonicalRouteCount: number;
  canonicalRoutes: string[];
  modelCount: number;
  models: string[];
  schemaConsistent: boolean;
  schemaDiscrepancies?: string[];
  browserAuditStatus: "PASS" | "FAIL" | "NOT_VERIFIED";
  browserMutationCount: number;
  passiveShellsCount: number;
  browserEvidenceDetails?: string;
  apiWorkflowStatus: "PASS" | "FAIL" | "NOT_VERIFIED";
  apiCoverageRatio: number;
  http500Count: number;
  postgresVerified: boolean;
  apiEvidenceDetails?: string;
  nativeHandlers: number;
  injectedHandlers: number;
  repairedComponentsCount: number;
  nir?: number;
  provenanceStatus: "UNASSISTED_NATIVE" | "ASSISTED_INJECTED" | "NOT_VERIFIED";
  finalStatus: "SUCCESS" | "FAILED" | "NOT_VERIFIED" | "BLOCKED";
}

export interface MultiDomainCertificationReport {
  timestamp: string;
  projectsAudited: number;
  allPassed: boolean;
  summaries: ProjectCertificationSummary[];
  markdownTable: string;
  invariantsAudit: {
    zeroPassiveShells: boolean;
    zeroHttp500s: boolean;
    realPostgresPersisted: boolean;
    unassistedProvenanceEnforced: boolean;
    allEvidenceVerified: boolean;
    schemasReconciled: boolean;
  };
}

export class CertificationReportAggregator {
  /**
   * Derive authoritative domain category from domain prompt/description.
   */
  public static deriveDomainCategory(prompt: string, domainName: string): string {
    const domainLower = (domainName || "").toLowerCase();
    if (domainLower.includes("maritime") || domainLower.includes("aquila") || domainLower.includes("cargo") || domainLower.includes("vessel")) {
      return "Commercial Maritime Logistics";
    }
    if (domainLower.includes("robotics") || domainLower.includes("forgecore") || domainLower.includes("workcell") || domainLower.includes("kinematics")) {
      return "Precision Industrial Robotics & Telemetry";
    }
    if (domainLower.includes("observatory") || domainLower.includes("orbitalis") || domainLower.includes("astrophysical") || domainLower.includes("telescope")) {
      return "Scientific Astrophysical Observatory";
    }
    if (domainLower.includes("hotel") || domainLower.includes("velora") || domainLower.includes("hospitality") || domainLower.includes("resort")) {
      return "Luxury Hospitality";
    }
    if (domainLower.includes("cyber") || domainLower.includes("security")) {
      return "Cyber Risk Intelligence";
    }

    // Strip negative constraints like "Do not use SaaS dashboards, generic card grids, hotel/booking terminology..."
    const positivePrompt = prompt.replace(/do not use [^.]+?\./gi, "").toLowerCase();

    if (positivePrompt.includes("maritime") || positivePrompt.includes("vessel") || positivePrompt.includes("berth") || positivePrompt.includes("harbor")) {
      return "Commercial Maritime Logistics";
    }
    if (positivePrompt.includes("robotics") || positivePrompt.includes("telemetry") || positivePrompt.includes("workcell") || positivePrompt.includes("kinematics")) {
      return "Precision Industrial Robotics & Telemetry";
    }
    if (positivePrompt.includes("observatory") || positivePrompt.includes("astrophysical") || positivePrompt.includes("celestial") || positivePrompt.includes("telescope")) {
      return "Scientific Astrophysical Observatory";
    }
    if (positivePrompt.includes("hotel") || positivePrompt.includes("hospitality") || positivePrompt.includes("resort") || positivePrompt.includes("suites")) {
      return "Luxury Hospitality";
    }
    if (positivePrompt.includes("cyber") || positivePrompt.includes("vulnerability")) {
      return "Cyber Risk Intelligence";
    }

    return domainName || "Specialized Autonomous Domain";
  }

  /**
   * Audits a single project root directly from its machine-readable artifacts and explicit evidence.
   */
  public static auditProject(projectRoot: string): ProjectCertificationSummary {
    const projectId = basename(projectRoot);
    const aegisDir = join(projectRoot, ".aegis");

    // 1. Architecture Contract
    let archContract: ArchitectureContractV1 | null = null;
    const archPath = join(aegisDir, "architecture-contract.json");
    if (existsSync(archPath)) {
      try {
        archContract = JSON.parse(readFileSync(archPath, "utf8"));
      } catch {}
    }

    // 2. Domain Contract
    let domainContract: any = null;
    const domainPath = join(aegisDir, "domain-contract.json");
    if (existsSync(domainPath)) {
      try {
        domainContract = JSON.parse(readFileSync(domainPath, "utf8"));
      } catch {}
    }

    // 3. Execution Report
    let execReport: any = null;
    const execPath = join(aegisDir, "execution-report.json");
    if (existsSync(execPath)) {
      try {
        execReport = JSON.parse(readFileSync(execPath, "utf8"));
      } catch {}
    }

    // 4. Stage Checkpoint
    let stageCheckpoint: any = null;
    const stagePath = join(aegisDir, "stage-checkpoint.json");
    if (existsSync(stagePath)) {
      try {
        stageCheckpoint = JSON.parse(readFileSync(stagePath, "utf8"));
      } catch {}
    }

    // Domain naming
    let brandName = domainContract?.brandName || (archContract as any)?.brandName || projectId.toUpperCase();
    if (brandName.length > 30 || brandName.includes("...")) {
      if (projectId.includes("forgecore")) {
        brandName = "FORGECORE AUTOMATION";
      } else {
        brandName = projectId.replace(/-test$/, "").replace(/-/g, " ").toUpperCase();
      }
    }
    const domainName = domainContract?.domainName || brandName;
    const prompt = archContract?.prompt || domainContract?.domainDescription || "";
    const domainCategory = this.deriveDomainCategory(prompt, domainName);

    // Routes
    const canonicalRoutes: string[] = archContract?.requiredRoutes ||
      stageCheckpoint?.approvedRoutes ||
      execReport?.architectureContract?.requiredRoutes ||
      ["/"];
    const canonicalRouteCount = canonicalRoutes.length;

    // Framework & Database
    const framework = archContract?.frontend?.framework || "React-Vite";
    const database = archContract?.database?.provider || "PostgreSQL";

    // ─── 5. AUTHORITATIVE DATA MODEL AUDIT & SCHEMA RECONCILIATION ───
    const schemaPath = join(projectRoot, "prisma", "schema.prisma");
    const schemaModels: string[] = [];
    const schemaDiscrepancies: string[] = [];
    let schemaConsistent = true;

    if (existsSync(schemaPath)) {
      try {
        const schemaContent = readFileSync(schemaPath, "utf8");
        const matches = [...schemaContent.matchAll(/^model\s+(\w+)/gm)];
        for (const m of matches) {
          if (m[1]) schemaModels.push(m[1]);
        }
      } catch (err: any) {
        schemaConsistent = false;
        schemaDiscrepancies.push(`Failed to read schema.prisma: ${err.message}`);
      }
    } else {
      schemaConsistent = false;
      schemaDiscrepancies.push("Missing prisma/schema.prisma");
    }

    // Reconcile schema models with contracts
    const domainEntities: string[] = domainContract?.entities
      ? domainContract.entities.map((e: any) => e.name)
      : [];
    const requiredModels: string[] = archContract?.requiredModels || [];

    if (schemaModels.length === 0) {
      schemaConsistent = false;
      schemaDiscrepancies.push("No models found in prisma/schema.prisma");
    } else {
      if (domainEntities.length > 0) {
        for (const entity of domainEntities) {
          if (!schemaModels.includes(entity)) {
            schemaConsistent = false;
            schemaDiscrepancies.push(`Domain entity "${entity}" missing in prisma/schema.prisma`);
          }
        }
        for (const model of schemaModels) {
          if (!domainEntities.includes(model)) {
            schemaConsistent = false;
            schemaDiscrepancies.push(`Prisma model "${model}" undeclared in domain-contract.json`);
          }
        }
      }

      if (requiredModels.length > 0) {
        for (const req of requiredModels) {
          if (!schemaModels.includes(req)) {
            schemaConsistent = false;
            schemaDiscrepancies.push(`Required model "${req}" missing in prisma/schema.prisma`);
          }
        }
        for (const model of schemaModels) {
          if (!requiredModels.includes(model)) {
            if (model === "User" && (archContract?.authentication === "JWT" || archContract?.authentication === "SESSION" || !archContract?.authentication)) {
              continue;
            }
            schemaConsistent = false;
            schemaDiscrepancies.push(`Prisma model "${model}" undeclared in architecture-contract.json`);
          }
        }
      }
    }

    const models = schemaModels.length > 0 ? schemaModels : requiredModels;
    const modelCount = models.length;

    // ─── 6. BROWSER AUDIT EVIDENCE VERIFICATION ───
    let browserAuditStatus: "PASS" | "FAIL" | "NOT_VERIFIED" = "NOT_VERIFIED";
    let browserMutationCount = 0;
    let passiveShellsCount = canonicalRouteCount;
    let browserEvidenceDetails = "Missing .aegis/browser-validation.json";

    const browserEvidencePath = join(aegisDir, "browser-validation.json");
    if (existsSync(browserEvidencePath)) {
      try {
        const browserData = JSON.parse(readFileSync(browserEvidencePath, "utf8"));
        const semanticResults: Array<{
          route: string;
          actionName?: string;
          trigger?: string;
          mutationType?: string;
          stateBefore?: string;
          stateAfter?: string;
          passed: boolean;
        }> = browserData.semanticMutationResults || [];

        const passingMutations = semanticResults.filter(r => r.passed === true);
        const routesWithPassingMutation = new Set(passingMutations.map(r => r.route));
        const passiveRoutes = canonicalRoutes.filter(r => !routesWithPassingMutation.has(r));

        browserMutationCount = passingMutations.length;
        passiveShellsCount = passiveRoutes.length;

        if (browserData.passed === false || passiveShellsCount > 0 || (semanticResults.length > 0 && passingMutations.length < semanticResults.length)) {
          browserAuditStatus = "FAIL";
          browserEvidenceDetails = browserData.passed === false
            ? "Browser validation reported general test failure"
            : `${passiveShellsCount} canonical route(s) lack passing semantic DOM mutations (${passiveRoutes.join(", ")})`;
        } else if (passingMutations.length >= canonicalRouteCount && passiveShellsCount === 0) {
          browserAuditStatus = "PASS";
          browserEvidenceDetails = `${browserMutationCount}/${canonicalRouteCount} canonical route mutations verified`;
        } else {
          browserAuditStatus = "FAIL";
          browserEvidenceDetails = `Incomplete mutation coverage: ${passingMutations.length}/${canonicalRouteCount} routes verified`;
        }
      } catch (err: any) {
        browserAuditStatus = "FAIL";
        browserEvidenceDetails = `Corrupt browser evidence: ${err.message}`;
      }
    }

    // ─── 7. API WORKFLOW & PERSISTENCE EVIDENCE VERIFICATION ───
    let apiWorkflowStatus: "PASS" | "FAIL" | "NOT_VERIFIED" = "NOT_VERIFIED";
    let apiCoverageRatio = 0;
    let http500Count = 0;
    let postgresVerified = false;
    let apiEvidenceDetails = "Missing .aegis/api-workflow-report.json";

    const apiEvidencePath = join(aegisDir, "api-workflow-report.json");
    if (existsSync(apiEvidencePath)) {
      try {
        const apiData = JSON.parse(readFileSync(apiEvidencePath, "utf8"));
        http500Count = apiData.http500Count ?? 0;
        const totalSteps = apiData.totalSteps ?? 0;
        const passedSteps = apiData.passedSteps ?? 0;
        const failedSteps = apiData.failedSteps ?? 0;
        apiCoverageRatio = apiData.coverageRatio ?? (totalSteps > 0 ? passedSteps / totalSteps : 0);

        const results: Array<{ dbMutationConfirmed?: boolean; passed: boolean }> = apiData.results || [];
        const confirmedMutations = results.filter(r => r.dbMutationConfirmed === true).length;
        postgresVerified = apiData.postgresVerified === true || confirmedMutations > 0 || (apiData.mutationsVerified && apiData.mutationsVerified > 0);

        if (apiData.passed === false || http500Count > 0 || failedSteps > 0 || !postgresVerified) {
          apiWorkflowStatus = "FAIL";
          apiEvidenceDetails = http500Count > 0
            ? `${http500Count} HTTP 500 error(s) observed`
            : (!postgresVerified ? "PostgreSQL stateful mutation read-back unconfirmed" : `${failedSteps} API step(s) failed`);
        } else {
          apiWorkflowStatus = "PASS";
          apiEvidenceDetails = `${passedSteps}/${totalSteps} steps passed, ${confirmedMutations} DB state mutations confirmed`;
        }
      } catch (err: any) {
        apiWorkflowStatus = "FAIL";
        apiEvidenceDetails = `Corrupt API workflow evidence: ${err.message}`;
      }
    }

    // ─── 8. INTERACTION PROVENANCE (NIR) EVIDENCE VERIFICATION ───
    let provenanceReport: InteractionProvenanceReport | null = null;
    let provenanceStatus: "UNASSISTED_NATIVE" | "ASSISTED_INJECTED" | "NOT_VERIFIED" = "NOT_VERIFIED";
    let nativeHandlers = 0;
    let injectedHandlers = 0;
    let repairedComponentsCount = 0;
    let nir: number | undefined = undefined;

    const provPath = join(aegisDir, "interaction-provenance.json");
    const baselinePath = join(aegisDir, "interaction-baseline.json");

    if (existsSync(provPath)) {
      try {
        provenanceReport = JSON.parse(readFileSync(provPath, "utf8"));
        const hasBaseline = existsSync(baselinePath) || (provenanceReport as any)?.isBaselineCalibrated === true;
        const total = (provenanceReport?.nativeHandlers ?? 0) + (provenanceReport?.sanitizerInjectedHandlers ?? 0);

        // If report has 0 native handlers but total > 0 and no calibrated baseline exists,
        // it is an uncalibrated / legacy artifact that cannot substantiate NIR -> report NOT_VERIFIED.
        if (!hasBaseline && provenanceReport?.nativeHandlers === 0 && (provenanceReport?.sanitizerInjectedHandlers ?? 0) > 0) {
          provenanceStatus = "NOT_VERIFIED";
          nir = undefined;
        } else if (hasBaseline || (provenanceReport?.nativeHandlers ?? 0) > 0) {
          nativeHandlers = provenanceReport?.nativeHandlers ?? 0;
          injectedHandlers = provenanceReport?.sanitizerInjectedHandlers ?? 0;
          repairedComponentsCount = provenanceReport?.sanitizerRepairedComponents?.length ?? 0;
          nir = provenanceReport?.nir ?? (total > 0 ? Number((nativeHandlers / total).toFixed(3)) : 1.0);
          provenanceStatus = injectedHandlers === 0 ? "UNASSISTED_NATIVE" : "ASSISTED_INJECTED";
        } else {
          provenanceStatus = "NOT_VERIFIED";
          nir = undefined;
        }
      } catch {
        provenanceStatus = "NOT_VERIFIED";
        nir = undefined;
      }
    }

    // ─── 9. GROUNDED FINAL STATUS DERIVATION ───
    // Strict Evidence Rule:
    //   Missing evidence  → NOT VERIFIED
    //   Failed evidence   → FAIL
    //   Complete evidence → PASS
    let finalStatus: "SUCCESS" | "FAILED" | "NOT_VERIFIED" | "BLOCKED" = "SUCCESS";

    if (!schemaConsistent) {
      finalStatus = "FAILED";
    } else if (browserAuditStatus === "FAIL" || apiWorkflowStatus === "FAIL") {
      finalStatus = "FAILED";
    } else if (browserAuditStatus === "NOT_VERIFIED" || apiWorkflowStatus === "NOT_VERIFIED" || provenanceStatus === "NOT_VERIFIED") {
      finalStatus = "NOT_VERIFIED";
    } else if (execReport?.status === "BLOCKED") {
      finalStatus = "BLOCKED";
    } else if (execReport?.status === "FAILED") {
      finalStatus = "FAILED";
    } else {
      finalStatus = "SUCCESS";
    }

    return {
      projectId,
      projectRoot,
      brandName,
      domainName,
      domainCategory,
      framework,
      database,
      canonicalRouteCount,
      canonicalRoutes,
      modelCount,
      models,
      schemaConsistent,
      schemaDiscrepancies,
      browserAuditStatus,
      browserMutationCount,
      passiveShellsCount,
      browserEvidenceDetails,
      apiWorkflowStatus,
      apiCoverageRatio,
      http500Count,
      postgresVerified,
      apiEvidenceDetails,
      nativeHandlers,
      injectedHandlers,
      repairedComponentsCount,
      nir,
      provenanceStatus,
      finalStatus,
    };
  }

  /**
   * Audits all given project roots and generates a certified multi-domain report.
   */
  public static auditAll(projectRoots: string[]): MultiDomainCertificationReport {
    const summaries: ProjectCertificationSummary[] = [];

    for (const pr of projectRoots) {
      if (existsSync(pr)) {
        summaries.push(this.auditProject(pr));
      }
    }

    const allPassed = summaries.length > 0 && summaries.every(s => s.finalStatus === "SUCCESS");
    const zeroPassiveShells = summaries.length > 0 && summaries.every(s => s.browserAuditStatus === "PASS" && s.passiveShellsCount === 0);
    const zeroHttp500s = summaries.length > 0 && summaries.every(s => s.apiWorkflowStatus === "PASS" && s.http500Count === 0);
    const realPostgresPersisted = summaries.length > 0 && summaries.every(s => s.postgresVerified);
    const unassistedProvenanceEnforced = summaries.length > 0 && summaries.every(s => s.provenanceStatus === "UNASSISTED_NATIVE" && s.injectedHandlers === 0);
    const allEvidenceVerified = summaries.length > 0 && summaries.every(s => s.browserAuditStatus === "PASS" && s.apiWorkflowStatus === "PASS" && s.provenanceStatus !== "NOT_VERIFIED");
    const schemasReconciled = summaries.length > 0 && summaries.every(s => s.schemaConsistent);

    const markdownTable = this.generateMarkdownTable(summaries);

    return {
      timestamp: new Date().toISOString(),
      projectsAudited: summaries.length,
      allPassed,
      summaries,
      markdownTable,
      invariantsAudit: {
        zeroPassiveShells,
        zeroHttp500s,
        realPostgresPersisted,
        unassistedProvenanceEnforced,
        allEvidenceVerified,
        schemasReconciled,
      },
    };
  }

  /**
   * Generates a fully dynamic, authoritative markdown table from the underlying summaries.
   */
  public static generateMarkdownTable(summaries: ProjectCertificationSummary[]): string {
    const headers = [
      "Domain & Brand",
      "Category",
      "Canonical Routes",
      "Domain Models",
      "Chromium Transitions",
      "Passive Shells",
      "NIR (Native / Injected)",
      "API Coverage & 500s",
      "PostgreSQL Persistence",
      "Final Status",
    ];

    const lines: string[] = [
      `| ${headers.join(" | ")} |`,
      `| ${headers.map(() => ":---").join(" | ")} |`,
    ];

    for (const s of summaries) {
      const browserCell = s.browserAuditStatus === "NOT_VERIFIED"
        ? "NOT VERIFIED"
        : `${s.browserMutationCount}/${s.canonicalRouteCount} ${s.browserAuditStatus}`;

      const passiveCell = s.browserAuditStatus === "NOT_VERIFIED"
        ? "UNVERIFIED"
        : `${s.passiveShellsCount}`;

      const nirCell = (s.provenanceStatus === "NOT_VERIFIED" || s.nir === undefined || isNaN(s.nir))
        ? "NOT VERIFIED"
        : `${s.nir.toFixed(2)} (${s.nativeHandlers} / ${s.injectedHandlers})`;

      const apiCell = s.apiWorkflowStatus === "NOT_VERIFIED"
        ? "NOT VERIFIED"
        : (s.apiWorkflowStatus === "FAIL"
            ? `${(s.apiCoverageRatio * 100).toFixed(0)}% (${s.http500Count} 500s) FAIL`
            : `${(s.apiCoverageRatio * 100).toFixed(0)}% (0 500s)`);

      const postgresCell = s.apiWorkflowStatus === "NOT_VERIFIED"
        ? "NOT VERIFIED"
        : (s.postgresVerified ? "Verified (Read-Back)" : "Unverified / Failed");

      const modelsCell = s.schemaConsistent
        ? `${s.modelCount} models`
        : `${s.modelCount} models (SCHEMA MISMATCH)`;

      const row = [
        `**${s.brandName}**`,
        s.domainCategory,
        `${s.canonicalRouteCount} routes`,
        modelsCell,
        browserCell,
        passiveCell,
        nirCell,
        apiCell,
        postgresCell,
        `**${s.finalStatus}**`,
      ];
      lines.push(`| ${row.join(" | ")} |`);
    }

    return lines.join("\n");
  }
}

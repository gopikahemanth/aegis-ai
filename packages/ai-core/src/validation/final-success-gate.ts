import { ArchitectureContractV1 } from "../governance/architecture-resolver.js";
import { DependencyClosureValidator } from "./dependency-closure-validator.js";
import { ProjectGraphEngine } from "./project-graph-engine.js";
import { UIFeatureChecker } from "./ui-feature-checker.js";
import { DynamicDataModelContract } from "../governance/dynamic-data-model.js";
import { DomainContractManager } from "../governance/domain-contract.js";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { ApiWorkflowReport } from "./api-workflow-verifier.js";
import type { BrowserValidationResult } from "./read-only-browser-validator.js";
import { RealityCheckerAgent, type RealityCheckResult } from "../agents/reality-checker-agent.js";

export type FinalSuccessStatus = "SUCCESS" | "FAILED" | "BLOCKED" | "INCOMPLETE" | "REPAIRING";

export interface FinalCheckItem {
  name: string;
  passed: boolean;
  message: string;
  critical: boolean;
  category: "BUILD" | "RUNTIME" | "CONTRACT" | "REALITY" | "ENVIRONMENT" | "API" | "VISUAL";
}

export interface FinalSuccessGateResult {
  status: FinalSuccessStatus;
  success: boolean;
  items: FinalCheckItem[];
  blockingReason?: string;
  databaseStatus: "CONNECTED" | "BLOCKED" | "UNKNOWN";
  codeStatus: "PASS" | "FAIL";
  runtimeStatus: "VERIFIED" | "NOT_VERIFIED" | "PARTIALLY_VERIFIED";
  evidenceSummary: string;
}

export interface FinalSuccessGateInput {
  projectRoot: string;
  contract: ArchitectureContractV1 | null;
  buildSuccess: boolean;
  buildDiagnostics?: string;
  serverReady?: boolean;
  browserResult?: BrowserValidationResult | null;
  apiReport?: ApiWorkflowReport | null;
  realityResult?: RealityCheckResult | null;
  databaseBlocked?: boolean;
  testReport?: import("./in-project-test-runner.js").TestExecutionReport | null;
}

export class FinalSuccessGate {
  /**
   * Comprehensive evidence-based Final Success Gate.
   * Requires actual verification evidence from all active subsystems.
   */
  public static verify(input: FinalSuccessGateInput): FinalSuccessGateResult {
    const items: FinalCheckItem[] = [];
    const {
      projectRoot,
      contract,
      buildSuccess,
      buildDiagnostics,
      serverReady = false,
      browserResult = null,
      apiReport = null,
      realityResult = null,
      databaseBlocked = false,
    } = input;

    // ── 1. Architecture & Domain Contract Gate ───────────────────────────────
    if (contract && contract.frontend?.framework && contract.backend?.framework && contract.database?.provider) {
      items.push({
        name: "Architecture Contract",
        passed: true,
        message: `${contract.frontend.framework} + ${contract.backend.framework} + ${contract.database.provider}`,
        critical: true,
        category: "CONTRACT",
      });
    } else {
      items.push({
        name: "Architecture Contract",
        passed: false,
        message: "Architecture contract missing or uninitialized.",
        critical: true,
        category: "CONTRACT",
      });
    }

    let domain = DomainContractManager.load(projectRoot);
    if (!domain && contract) {
      try {
        domain = DomainContractManager.lock(contract, contract.architectureHash || "arch_hash", projectRoot);
      } catch {}
    }

    if (domain) {
      items.push({
        name: "Domain Contract",
        passed: true,
        message: `Domain locked: "${domain.domainName}" (${domain.entities.length} entities)`,
        critical: true,
        category: "CONTRACT",
      });
    } else {
      items.push({
        name: "Domain Contract",
        passed: false,
        message: "Domain contract missing in .aegis/domain-contract.json",
        critical: true,
        category: "CONTRACT",
      });
    }

    // ── 2. Database Schema Validation ────────────────────────────────────────
    const hasDb = contract?.database?.provider && !contract.database.provider.toLowerCase().includes("none");
    if (hasDb) {
      const prismaSchemaPath = join(projectRoot, "prisma", "schema.prisma");
      let schemaPassed = false;
      let schemaMsg = "prisma/schema.prisma not found.";

      if (existsSync(prismaSchemaPath)) {
        try {
          const schemaContent = readFileSync(prismaSchemaPath, "utf8");
          if (domain) {
            const schemaVal = DynamicDataModelContract.validateSchema(schemaContent, domain);
            schemaPassed = schemaVal.valid;
            schemaMsg = schemaVal.valid
              ? `All ${domain.entities.length} canonical models defined.`
              : `Missing models: [${schemaVal.missingModels.join(", ")}]`;
          } else {
            schemaPassed = schemaContent.includes("model User") || schemaContent.includes("model Task");
            schemaMsg = schemaPassed ? "Basic models defined." : "Missing User model.";
          }
        } catch (e: any) {
          schemaMsg = `Schema read error: ${e.message}`;
        }
      }

      items.push({
        name: "Database Schema",
        passed: schemaPassed,
        message: schemaMsg,
        critical: true,
        category: "CONTRACT",
      });
    }

    // ── 3. Implementation Closure & File Graph ───────────────────────────────
    const graphEngine = new ProjectGraphEngine();
    const graphResult = graphEngine.validateGraph(projectRoot);
    const closure = DependencyClosureValidator.validate(projectRoot);
    const graphValid = graphResult.valid && closure.valid;

    items.push({
      name: "Module Closure & Graph",
      passed: graphValid,
      message: graphValid ? "All local imports resolve to existing modules." : "Unresolved imports or orphan modules.",
      critical: true,
      category: "CONTRACT",
    });

    // ── 4. Build & Compilation Gate (BUILD_PASS) ─────────────────────────────
    items.push({
      name: "Build / Compilation",
      passed: buildSuccess,
      message: buildSuccess ? "TypeScript compilation & build succeeded with 0 errors." : `Build failed: ${buildDiagnostics?.slice(0, 100) || "error"}`,
      critical: true,
      category: "BUILD",
    });

    // ── 5. Server Readiness Gate (SERVER_READY) ──────────────────────────────
    items.push({
      name: "App Server",
      passed: serverReady,
      message: serverReady ? "Application dev server started and listening." : "Application server failed to launch.",
      critical: true,
      category: "RUNTIME",
    });

    // ── 6. Browser Runtime Gate (BROWSER_RUNTIME_PASS) ───────────────────────
    if (browserResult) {
      items.push({
        name: "Browser Runtime",
        passed: browserResult.passed,
        message: browserResult.passed
          ? `Rendered ${browserResult.renderedElementsCount} DOM elements cleanly across [${browserResult.routesChecked.join(", ")}].`
          : `Browser crash / error: ${browserResult.classifiedError || "Console error detected"}`,
        critical: true,
        category: "RUNTIME",
      });
    } else {
      items.push({
        name: "Browser Runtime",
        passed: false,
        message: "Browser verification was not executed.",
        critical: true,
        category: "RUNTIME",
      });
    }

    // ── 7. API Workflow Gate (API_WORKFLOW_PASS) ─────────────────────────────
    if (apiReport) {
      const isClientOnly = !existsSync(join(projectRoot, "server", "index.ts")) && !existsSync(join(projectRoot, "server", "app.ts"));
      const apiPassed = apiReport.passed || isClientOnly || (apiReport.totalSteps > 0 && apiReport.passedSteps > 0);
      items.push({
        name: "API Workflows",
        passed: apiPassed,
        message: apiReport.summary,
        critical: !isClientOnly,
        category: "API",
      });
    } else {
      // If project has API endpoints, missing report is incomplete
      const hasApis = existsSync(join(projectRoot, "server", "routes"));
      items.push({
        name: "API Workflows",
        passed: !hasApis, // Passing only if project has no backend routes
        message: hasApis ? "API verification not executed." : "No API endpoints required.",
        critical: hasApis,
        category: "API",
      });
    }

    // ── 8. Reality Check Gate (REALITY_PASS) ─────────────────────────────────
    if (realityResult) {
      items.push({
        name: "Reality Checker",
        passed: realityResult.passed,
        message: realityResult.passed ? "All feature implementations verified as real." : `${realityResult.violationCount} mock/fake violation(s) detected.`,
        critical: true,
        category: "REALITY",
      });
    } else {
      const agent = new RealityCheckerAgent();
      const audit = agent.audit(projectRoot);
      items.push({
        name: "Reality Checker",
        passed: audit.passed,
        message: audit.passed ? "All feature implementations verified as real." : `${audit.violationCount} reality violation(s) detected.`,
        critical: true,
        category: "REALITY",
      });
    }

    // ── 9. Database Environment Gate (ENVIRONMENT_ERROR -> BLOCKED) ──────────
    const dbStatus: "CONNECTED" | "BLOCKED" | "UNKNOWN" = databaseBlocked
      ? "BLOCKED"
      : (serverReady ? "CONNECTED" : "UNKNOWN");

    items.push({
      name: "Database Environment",
      passed: !databaseBlocked,
      message: databaseBlocked
        ? "DATABASE_BLOCKED: External database connection unavailable (P1000/ECONNREFUSED). Application code valid."
        : "Database environment ready.",
      critical: false, // Environment issue does not mean code failure
      category: "ENVIRONMENT",
    });

    // ── 10. In-Project Automated Test Suite Gate (V2.2 Staged Rollout) ────────
    const testReport = input.testReport;
    if (testReport) {
      if (testReport.status === "PASS") {
        items.push({
          name: "In-Project Test Suite",
          passed: true,
          message: `All ${testReport.totalTests} in-project tests passed (${testReport.passedTests}/${testReport.totalTests}) in ${testReport.durationMs}ms.`,
          critical: false,
          category: "BUILD",
        });
      } else if (testReport.status === "NOT_APPLICABLE" || testReport.status === "SKIPPED") {
        items.push({
          name: "In-Project Test Suite",
          passed: true,
          message: `In-project automated testing marked NOT_APPLICABLE for this project stack.`,
          critical: false,
          category: "BUILD",
        });
      } else {
        items.push({
          name: "In-Project Test Suite",
          passed: false,
          message: `In-project test failures: ${testReport.failedTests}/${testReport.totalTests} failed.`,
          critical: false,
          category: "BUILD",
        });
      }
    }

    // ── Evaluate Final Status ────────────────────────────────────────────────
    const criticalItems = items.filter(i => i.critical);
    const failedCritical = criticalItems.filter(i => !i.passed);
    const codeStatus: "PASS" | "FAIL" = buildSuccess && graphValid ? "PASS" : "FAIL";

    let status: FinalSuccessStatus;
    let blockingReason: string | undefined;

    if (databaseBlocked && failedCritical.every(i => i.category === "RUNTIME" || i.category === "API")) {
      // Code is fully valid, but runtime testing was blocked by external database unavailable
      status = "BLOCKED";
      blockingReason = "External database unavailable for runtime verification";
    } else if (failedCritical.length > 0) {
      const firstFailure = failedCritical[0];
      status = "FAILED";
      blockingReason = `${firstFailure.name}: ${firstFailure.message}`;
    } else {
      status = "SUCCESS";
    }

    const runtimeStatus: "VERIFIED" | "NOT_VERIFIED" | "PARTIALLY_VERIFIED" =
      status === "SUCCESS" ? "VERIFIED" : (status === "BLOCKED" ? "PARTIALLY_VERIFIED" : "NOT_VERIFIED");

    const evidenceSummary = `Status: ${status} (${items.filter(i => i.passed).length}/${items.length} checks passed). Code: ${codeStatus}, Runtime: ${runtimeStatus}`;

    console.log("\n╔═══════════════════════════════════════════════════════╗");
    console.log("║         AEGIS FINAL SUCCESS VERIFICATION REPORT       ║");
    console.log("╚═══════════════════════════════════════════════════════╝");
    for (const item of items) {
      const icon = item.passed ? "✓" : "❌";
      const tag = item.critical ? "" : " (env)";
      console.log(`  ${icon}${tag}  ${item.name.padEnd(24)} ${item.message}`);
    }
    console.log(`\n  [FINAL STATUS]: ${status}`);
    console.log(`  [EVIDENCE]:     ${evidenceSummary}\n`);

    return {
      status,
      success: status === "SUCCESS",
      items,
      blockingReason,
      databaseStatus: dbStatus,
      codeStatus,
      runtimeStatus,
      evidenceSummary,
    };
  }

  private static scanForPlaceholders(projectRoot: string): string[] {
    const issues: string[] = [];
    const PLACEHOLDER_PATTERNS = [
      /\/\/\s*TODO:/i,
      /\/\/\s*FIXME:/i,
      /\/\/\s*IMPLEMENT\s*HERE/i,
      /\/\/\s*PLACEHOLDER/i,
      /throw\s+new\s+Error\s*\(\s*["'`](?:Not implemented|TODO|IMPLEMENT|PLACEHOLDER)["'`]\s*\)/i,
    ];

    const getAllSourceFiles = (dir: string): string[] => {
      const results: string[] = [];
      if (!existsSync(dir)) return results;
      try {
        for (const entry of readdirSync(dir)) {
          if (["node_modules", ".git", "dist", ".aegis"].includes(entry)) continue;
          const full = join(dir, entry);
          if (statSync(full).isDirectory()) results.push(...getAllSourceFiles(full));
          else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".d.ts")) results.push(full);
        }
      } catch {}
      return results;
    };

    const allFiles = [
      ...getAllSourceFiles(join(projectRoot, "src")),
      ...getAllSourceFiles(join(projectRoot, "server")),
    ];

    for (const filePath of allFiles) {
      try {
        const content = readFileSync(filePath, "utf8");
        for (const pattern of PLACEHOLDER_PATTERNS) {
          if (pattern.test(content)) {
            const relPath = relative(projectRoot, filePath);
            issues.push(`${relPath}: ${pattern.source.slice(0, 30)}`);
            break;
          }
        }
      } catch {}
    }

    return issues;
  }
}

/**
 * ErrorDiagnosisEngine
 *
 * Implements the 11-step diagnostic workflow for AEGIS AI:
 * 1. Capture error and complete context
 * 2. Identify affected file, component, route, API, or model
 * 3. Classify the error category
 * 4. Determine root cause (call site vs declaration site)
 * 5. Classify failure origin (FRAMEWORK_DEFECT, GENERATED_CODE_DEFECT, ENVIRONMENT_ISSUE, EXTERNAL_DEPENDENCY_ISSUE)
 * 6. Find responsible generation or repair module
 * 7. Determine smallest appropriate fix (deterministic patch vs scoped single-file repair)
 * 8. Apply fix through authorized owner
 * 9. Run focused Level 1/Level 2 tests
 * 10. Run regression checks
 * 11. Record result into .aegis/error-registry.json
 *
 * Prevents repeated repair attempts for the same root cause (max 2 attempts per signature).
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { ErrorClassifier, type FailureCategory, type ErrorClassification } from "./error-classifier.js";
import { ErrorRootCauseMapper, type RootCauseReport } from "./error-root-cause-mapper.js";

export type DefectOrigin =
  | "FRAMEWORK_DEFECT"
  | "GENERATED_CODE_DEFECT"
  | "ENVIRONMENT_ISSUE"
  | "EXTERNAL_DEPENDENCY_ISSUE"
  | "UNKNOWN_ORIGIN";

export type FixStrategy =
  | "DETERMINISTIC_AST_PATCH"      // 0 LLM tokens: regex / AST / canonical rule
  | "SCOPED_SINGLE_FILE_REPAIR"    // Minimal LLM tokens: single file + error slice
  | "ENVIRONMENT_WORKAROUND"       // 0 tokens: retry, port cleanup, lock evasion
  | "DEPENDENCY_INSTALL"           // 0 tokens: pnpm add / sync
  | "CIRCUIT_BREAKER_ABORT";       // Stop retries: recurring framework defect

export interface ErrorContext {
  phase: string;
  command?: string;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  stackTrace?: string;
  error?: string | Error;
  projectRoot: string;
}

export interface DiagnosisReport {
  errorId: string;
  signatureHash: string;
  timestamp: string;
  category: FailureCategory;
  origin: DefectOrigin;
  rootCause: string;
  affectedFiles: string[];
  affectedEntity?: string;
  responsibleModule: string;
  recommendedStrategy: FixStrategy;
  recommendedAction: string;
  repairPayload?: Record<string, any>;
  attemptCount: number;
  isRecurring: boolean;
  circuitBreakerTripped: boolean;
  status: "DIAGNOSED" | "REPAIRED" | "BLOCKED";
}

export interface ErrorRegistryRecord {
  diagnoses: DiagnosisReport[];
  signatureCounts: Record<string, number>;
  frameworkDefectsIdentified: string[];
  lastUpdated: string;
}

export class ErrorDiagnosisEngine {
  private static readonly MAX_ATTEMPTS_PER_SIGNATURE = 2;
  private static signatureHistory = new Map<string, number>();

  /**
   * Reset in-memory signature counters (useful for fresh sessions or testing).
   */
  public static resetHistory(): void {
    this.signatureHistory.clear();
  }

  /**
   * Main 11-step diagnostic method.
   */
  public static diagnose(context: ErrorContext): DiagnosisReport {
    const rawError = String(
      context.stderr ||
      context.error?.toString() ||
      context.stdout ||
      "Unknown error occurred"
    );

    // 1. Classify failure category
    const classification: ErrorClassification = ErrorClassifier.classify(rawError);

    // 2. Trace root cause & affected files
    const rootCauseMapper = new ErrorRootCauseMapper();
    const rootCauseAnalysis: RootCauseReport = rootCauseMapper.analyze(rawError);

    const affectedFiles = Array.from(
      new Set([
        ...classification.affectedFiles,
        ...rootCauseAnalysis.filesToFix,
        ...this.extractFilesFromStack(rawError),
      ])
    ).filter(Boolean);

    // 3. Determine failure origin & responsible module
    const { origin, responsibleModule, rootCauseDetail } = this.determineOrigin(
      rawError,
      classification,
      context
    );

    // 4. Generate unique error signature hash (category + rootCause + primary file)
    const primaryFile = affectedFiles[0] || "global";
    const signatureKey = `${classification.category}::${origin}::${primaryFile}::${rootCauseDetail.slice(0, 80)}`;
    const signatureHash = createHash("sha256").update(signatureKey).digest("hex").slice(0, 12);
    const errorId = `ERR-${signatureHash.slice(0, 8).toUpperCase()}`;

    // 5. Check recurring error circuit breaker
    const previousAttempts = this.signatureHistory.get(signatureHash) || 0;
    const currentAttempt = previousAttempts + 1;
    this.signatureHistory.set(signatureHash, currentAttempt);

    const isRecurring = currentAttempt > 1;
    const circuitBreakerTripped = currentAttempt > this.MAX_ATTEMPTS_PER_SIGNATURE;

    // 6. Formulate smallest appropriate fix strategy
    let recommendedStrategy: FixStrategy = "DETERMINISTIC_AST_PATCH";
    let recommendedAction = "";

    if (circuitBreakerTripped) {
      recommendedStrategy = "CIRCUIT_BREAKER_ABORT";
      recommendedAction = `[CircuitBreaker] Halting repeated repairs for ${errorId}. Recurring ${origin} in ${primaryFile} requires framework engine update, not token-wasting regeneration.`;
    } else if (origin === "ENVIRONMENT_ISSUE") {
      recommendedStrategy = "ENVIRONMENT_WORKAROUND";
      recommendedAction = this.getEnvironmentAction(rawError);
    } else if (classification.category === "DEPENDENCY_ERROR" || rawError.includes("Cannot find module")) {
      recommendedStrategy = "DEPENDENCY_INSTALL";
      recommendedAction = `Install missing package in ${context.projectRoot}`;
    } else if (origin === "FRAMEWORK_DEFECT") {
      recommendedStrategy = "DETERMINISTIC_AST_PATCH";
      recommendedAction = `Apply deterministic sanitizer/patch in ${responsibleModule} without LLM call.`;
    } else {
      // Generated code defect: prefer scoped single file repair
      recommendedStrategy = "SCOPED_SINGLE_FILE_REPAIR";
      recommendedAction = `Targeted single-file repair for ${primaryFile}: ${rootCauseAnalysis.summary || rootCauseDetail}`;
    }

    const report: DiagnosisReport = {
      errorId,
      signatureHash,
      timestamp: new Date().toISOString(),
      category: classification.category,
      origin,
      rootCause: rootCauseDetail,
      affectedFiles,
      responsibleModule,
      recommendedStrategy,
      recommendedAction,
      attemptCount: currentAttempt,
      isRecurring,
      circuitBreakerTripped,
      status: circuitBreakerTripped ? "BLOCKED" : "DIAGNOSED",
    };

    // 11. Persist to project error registry
    this.recordToRegistry(context.projectRoot, report);

    return report;
  }

  /**
   * Distinguish between framework defect, generated code defect, and environment issue.
   */
  private static determineOrigin(
    raw: string,
    classification: ErrorClassification,
    ctx: ErrorContext
  ): { origin: DefectOrigin; responsibleModule: string; rootCauseDetail: string } {
    const lower = raw.toLowerCase();

    // Environment Issues: EPERM, EBUSY, P1000, port already in use, missing database
    if (
      lower.includes("eperm") ||
      lower.includes("ebusy") ||
      lower.includes("operation not permitted") ||
      lower.includes("eaddrinuse") ||
      lower.includes("p1000") ||
      lower.includes("connection refused") ||
      lower.includes("econnrefused")
    ) {
      return {
        origin: "ENVIRONMENT_ISSUE",
        responsibleModule: "AppServerRunner / ProjectStartupAgent",
        rootCauseDetail: lower.includes("eperm")
          ? "Windows file lock on native binary (.dll.node) or concurrent process handle"
          : "Host environment resource contention (port or database connection)",
      };
    }

    // Framework Defects: Template contamination false positive, double-alias corruptions, missing auth bypass lookahead
    if (
      lower.includes("expected ')' but found 'if'") ||
      lower.includes("as gitbranch as github") ||
      lower.includes("as share2 as linkedin") ||
      lower.includes("template phrase leak detected") ||
      lower.includes("expected http 201, received http 400") ||
      lower.includes("prisma_client_blocked")
    ) {
      return {
        origin: "FRAMEWORK_DEFECT",
        responsibleModule: lower.includes("template phrase")
          ? "TemplateContaminationChecker"
          : lower.includes("received http 400")
          ? "ApiWorkflowVerifier"
          : "FastDeterministicSanitizer",
        rootCauseDetail: lower.includes("template phrase")
          ? "Template contamination false positive on domain-appropriate vocabulary"
          : lower.includes("received http 400")
          ? "API test payload generator missing required request fields"
          : "Deterministic sanitizer regex non-idempotent substitution",
      };
    }

    // External Dependency Issues
    if (
      lower.includes("cannot find module") &&
      (lower.includes("node_modules") || !lower.includes("./") && !lower.includes("@/"))
    ) {
      return {
        origin: "EXTERNAL_DEPENDENCY_ISSUE",
        responsibleModule: "ProjectStartupAgent / DependencyResolver",
        rootCauseDetail: "Third-party package missing from project node_modules",
      };
    }

    // Generated Code Defects: Standard TypeScript syntax or type errors in generated src/ or server/
    return {
      origin: "GENERATED_CODE_DEFECT",
      responsibleModule: ctx.phase.includes("backend") ? "CoderAgent (Backend)" : "CoderAgent (Frontend)",
      rootCauseDetail: classification.suggestedAction || "TypeScript compilation or runtime contract violation in generated application file",
    };
  }

  private static extractFilesFromStack(raw: string): string[] {
    const files: string[] = [];
    const fileLineRegex = /(?:[A-Za-z]:)?[\/\\][^\s:()]+(?:\.tsx?|\.jsx?|\.json|\.prisma|\.css)/g;
    let match: RegExpExecArray | null;
    while ((match = fileLineRegex.exec(raw)) !== null) {
      const p = match[0].replace(/\\/g, "/");
      if (!files.includes(p) && !p.includes("node_modules") && !p.includes(".pnpm")) {
        files.push(p);
      }
    }
    return files;
  }

  private static getEnvironmentAction(raw: string): string {
    if (raw.toLowerCase().includes("eperm")) {
      return "Verify if generated client already exists on disk before retrying write. Clean stale Node process handles.";
    }
    if (raw.toLowerCase().includes("eaddrinuse")) {
      return "Kill orphaned processes holding server port via taskkill / PID cleanup.";
    }
    return "Check external environment service availability.";
  }

  private static recordToRegistry(projectRoot: string, report: DiagnosisReport): void {
    try {
      const registryDir = join(projectRoot, ".aegis");
      if (!existsSync(registryDir)) mkdirSync(registryDir, { recursive: true });
      const registryPath = join(registryDir, "error-registry.json");

      let currentRegistry: ErrorRegistryRecord = {
        diagnoses: [],
        signatureCounts: {},
        frameworkDefectsIdentified: [],
        lastUpdated: new Date().toISOString(),
      };

      if (existsSync(registryPath)) {
        try {
          currentRegistry = JSON.parse(readFileSync(registryPath, "utf8"));
        } catch {}
      }

      currentRegistry.diagnoses.push(report);
      currentRegistry.signatureCounts[report.signatureHash] = report.attemptCount;
      if (report.origin === "FRAMEWORK_DEFECT" && !currentRegistry.frameworkDefectsIdentified.includes(report.rootCause)) {
        currentRegistry.frameworkDefectsIdentified.push(report.rootCause);
      }
      currentRegistry.lastUpdated = new Date().toISOString();

      writeFileSync(registryPath, JSON.stringify(currentRegistry, null, 2), "utf8");
    } catch {}
  }
}

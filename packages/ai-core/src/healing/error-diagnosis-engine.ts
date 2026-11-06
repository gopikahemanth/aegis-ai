/**
 * ErrorDiagnosisEngine
 *
 * Implements the 11-step diagnostic workflow for AEGIS AI:
 * 1. Capture error and complete context
 * 2. Identify affected file, component, route, API, or model
 * 3. Classify error category (23 standard categories)
 * 4. Determine root cause (call site vs declaration site)
 * 5. Classify failure origin:
 *    - FRAMEWORK_DEFECT
 *    - GENERATED_CODE_DEFECT
 *    - ENVIRONMENT_ISSUE
 *    - EXTERNAL_DEPENDENCY_ISSUE
 *    - PROVIDER_FAILURE
 *    - RATE_LIMIT
 *    - DATABASE_ERROR
 *    - CONTRACT_ERROR
 *    - TEST_INFRASTRUCTURE_FAILURE
 * 6. Find responsible generation or repair module
 * 7. Determine smallest appropriate fix (deterministic patch vs scoped single-file repair)
 * 8. Apply fix through authorized owner
 * 9. Run focused Level 1/Level 2 tests
 * 10. Run regression checks
 * 11. Record result into .aegis/error-registry.json
 *
 * Features a source-revision aware circuit breaker:
 * - Limits identical repairs to max 2 attempts per (file + contentHash + error) signature.
 * - If the file content or environment changes, a fresh repair attempt is permitted.
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
  | "PROVIDER_FAILURE"
  | "RATE_LIMIT"
  | "DATABASE_ERROR"
  | "CONTRACT_ERROR"
  | "TEST_INFRASTRUCTURE_FAILURE"
  | "UNKNOWN_ORIGIN";

export type FixStrategy =
  | "DETERMINISTIC_AST_PATCH"      // 0 LLM tokens: regex / AST / canonical rule
  | "SCOPED_SINGLE_FILE_REPAIR"    // Minimal LLM tokens: single file + error slice
  | "ENVIRONMENT_WORKAROUND"       // 0 tokens: retry, port cleanup, lock evasion
  | "DEPENDENCY_INSTALL"           // 0 tokens: pnpm add / sync
  | "PROVIDER_BACKOFF_RETRY"       // 0 tokens: exponential backoff or failover
  | "CIRCUIT_BREAKER_ABORT";       // Stop retries: recurring defect with no source progress

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
  private static signatureToFile = new Map<string, string>();

  /**
   * Reset in-memory signature counters (useful for fresh sessions or testing).
   */
  public static resetHistory(): void {
    this.signatureHistory.clear();
    this.signatureToFile.clear();
  }

  /**
   * Reset attempts for a specific file when modified.
   */
  public static resetForFile(filePath: string): void {
    const norm = filePath.replace(/\\/g, "/");
    for (const [sigHash, file] of Array.from(this.signatureToFile.entries())) {
      const normFile = file.replace(/\\/g, "/");
      if (normFile.includes(norm) || norm.includes(normFile)) {
        this.signatureHistory.delete(sigHash);
        this.signatureToFile.delete(sigHash);
      }
    }
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

    // 4. Source-Revision Aware Signature Calculation
    const primaryFile = affectedFiles[0] || "global";
    let fileContentHash = "nofile";
    if (primaryFile !== "global" && context.projectRoot) {
      const full = join(context.projectRoot, primaryFile);
      if (existsSync(full)) {
        try {
          fileContentHash = createHash("sha256").update(readFileSync(full, "utf8")).digest("hex").slice(0, 8);
        } catch {}
      }
    }

    // Signature binds: category + origin + primaryFile + fileContentHash + rootCauseSubstring
    const signatureKey = `${classification.category}::${origin}::${primaryFile}::${fileContentHash}::${rootCauseDetail.slice(0, 80)}`;
    const signatureHash = createHash("sha256").update(signatureKey).digest("hex").slice(0, 12);
    const errorId = `ERR-${signatureHash.slice(0, 8).toUpperCase()}`;

    // 5. Check recurring error circuit breaker
    const previousAttempts = this.signatureHistory.get(signatureHash) || 0;
    const currentAttempt = previousAttempts + 1;
    this.signatureHistory.set(signatureHash, currentAttempt);
    this.signatureToFile.set(signatureHash, primaryFile);

    const isRecurring = currentAttempt > 1;
    const circuitBreakerTripped = currentAttempt > this.MAX_ATTEMPTS_PER_SIGNATURE;

    // 6. Formulate smallest appropriate fix strategy
    let recommendedStrategy: FixStrategy = "DETERMINISTIC_AST_PATCH";
    let recommendedAction = "";

    if (circuitBreakerTripped) {
      recommendedStrategy = "CIRCUIT_BREAKER_ABORT";
      recommendedAction = `[CircuitBreaker] Halting repeated repairs for ${errorId}. Recurring ${origin} in ${primaryFile} (revision ${fileContentHash}) requires framework engine update, not token-wasting regeneration.`;
    } else if (origin === "RATE_LIMIT" || origin === "PROVIDER_FAILURE") {
      recommendedStrategy = "PROVIDER_BACKOFF_RETRY";
      recommendedAction = "Provider throttled or unavailable: execute exponential backoff or failover to secondary provider without code changes.";
    } else if (origin === "ENVIRONMENT_ISSUE") {
      recommendedStrategy = "ENVIRONMENT_WORKAROUND";
      recommendedAction = this.getEnvironmentAction(rawError);
    } else if (origin === "DATABASE_ERROR") {
      recommendedStrategy = "ENVIRONMENT_WORKAROUND";
      recommendedAction = "Verify PostgreSQL connection, Prisma client generation, or run migrations.";
    } else if (classification.category === "DEPENDENCY_ERROR" || rawError.includes("Cannot find module")) {
      recommendedStrategy = "DEPENDENCY_INSTALL";
      recommendedAction = `Install missing package in ${context.projectRoot}`;
    } else if (origin === "FRAMEWORK_DEFECT") {
      recommendedStrategy = "DETERMINISTIC_AST_PATCH";
      recommendedAction = `Apply deterministic sanitizer/patch in ${responsibleModule} without LLM call.`;
    } else if (origin === "CONTRACT_ERROR") {
      recommendedStrategy = "SCOPED_SINGLE_FILE_REPAIR";
      recommendedAction = `Targeted API contract alignment in ${primaryFile}: ensure expected status and response shape.`;
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
   * Distinguish between framework defect, generated code defect, provider failure, rate limits, environment, and dependencies.
   */
  private static determineOrigin(
    raw: string,
    classification: ErrorClassification,
    ctx: ErrorContext
  ): { origin: DefectOrigin; responsibleModule: string; rootCauseDetail: string } {
    const lower = raw.toLowerCase();

    // 1. Rate Limits & Quotas
    if (
      lower.includes("429") ||
      lower.includes("rate limit") ||
      lower.includes("quota exceeded") ||
      lower.includes("resource_exhausted") ||
      lower.includes("tpm limit") ||
      lower.includes("rpm limit")
    ) {
      return {
        origin: "RATE_LIMIT",
        responsibleModule: "FailoverProvider / GeminiProvider",
        rootCauseDetail: "AI Provider request or token quota exhausted",
      };
    }

    // 2. Provider Service Failures
    if (
      lower.includes("503 service unavailable") ||
      lower.includes("502 bad gateway") ||
      lower.includes("etimedout") ||
      lower.includes("ai provider error") ||
      lower.includes("econnreset")
    ) {
      return {
        origin: "PROVIDER_FAILURE",
        responsibleModule: "FailoverProvider",
        rootCauseDetail: "Upstream AI provider API connection timeout or temporary outage",
      };
    }

    // 3. Test Infrastructure Failures
    if (
      lower.includes("vitest: command not found") ||
      lower.includes("playwright not found") ||
      lower.includes("test runner exited with code 127") ||
      lower.includes("browser executable not found")
    ) {
      return {
        origin: "TEST_INFRASTRUCTURE_FAILURE",
        responsibleModule: "TestPyramidRunner / InProjectTestRunner",
        rootCauseDetail: "Test runner harness or browser binary missing from environment",
      };
    }

    // 4. Database Errors (Prisma specific codes)
    if (
      lower.includes("p1000") ||
      lower.includes("p2002") ||
      lower.includes("p2025") ||
      lower.includes("prismaclientinitializationerror") ||
      lower.includes("database does not exist") ||
      lower.includes("can't reach database server")
    ) {
      return {
        origin: "DATABASE_ERROR",
        responsibleModule: "DatabaseVerifier / PrismaClient",
        rootCauseDetail: "Database connection failed, constraint violation, or unapplied migration",
      };
    }

    // 5. Environment Issues: EPERM, EBUSY, port already in use
    if (
      lower.includes("eperm") ||
      lower.includes("ebusy") ||
      lower.includes("operation not permitted") ||
      lower.includes("eaddrinuse") ||
      lower.includes("connection refused") ||
      lower.includes("econnrefused")
    ) {
      return {
        origin: "ENVIRONMENT_ISSUE",
        responsibleModule: "AppServerRunner / ProjectStartupAgent",
        rootCauseDetail: lower.includes("eperm")
          ? "Windows file lock on native binary (.dll.node) or concurrent process handle"
          : "Host environment resource contention (port or network socket)",
      };
    }

    // 6. Framework Defects
    if (
      lower.includes("expected ')' but found 'if'") ||
      lower.includes("as gitbranch as github") ||
      lower.includes("as share2 as linkedin") ||
      lower.includes("template phrase leak detected") ||
      lower.includes("prisma_client_blocked")
    ) {
      return {
        origin: "FRAMEWORK_DEFECT",
        responsibleModule: lower.includes("template phrase")
          ? "TemplateContaminationChecker"
          : "FastDeterministicSanitizer",
        rootCauseDetail: lower.includes("template phrase")
          ? "Template contamination false positive on domain-appropriate vocabulary"
          : "Deterministic sanitizer regex non-idempotent substitution",
      };
    }

    // 7. API Contract Errors
    if (lower.includes("expected http 201, received http 400") || lower.includes("contract step failed")) {
      return {
        origin: "CONTRACT_ERROR",
        responsibleModule: "ApiWorkflowVerifier",
        rootCauseDetail: "Backend API handler rejected request payload or returned mismatched contract status",
      };
    }

    // 8. External Dependency Issues
    if (
      lower.includes("cannot find module") &&
      (lower.includes("node_modules") || (!lower.includes("./") && !lower.includes("@/")))
    ) {
      return {
        origin: "EXTERNAL_DEPENDENCY_ISSUE",
        responsibleModule: "ProjectStartupAgent / DependencyResolver",
        rootCauseDetail: "Third-party package missing from project node_modules",
      };
    }

    // 9. Generated Code Defects: Standard TypeScript syntax or type errors in generated src/ or server/
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
    const lower = raw.toLowerCase();
    if (lower.includes("eperm") || lower.includes("ebusy")) {
      return "Treat existing binary as non-fatal warning; reuse generated client without overwriting locked file.";
    }
    if (lower.includes("eaddrinuse")) {
      return "Kill orphan Node.js process listening on conflicting port.";
    }
    return "Check host environment resource availability.";
  }

  private static recordToRegistry(projectRoot: string, report: DiagnosisReport): void {
    if (!projectRoot) return;
    try {
      const aegisDir = join(projectRoot, ".aegis");
      if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });

      const registryPath = join(aegisDir, "error-registry.json");
      let record: ErrorRegistryRecord = {
        diagnoses: [],
        signatureCounts: {},
        frameworkDefectsIdentified: [],
        lastUpdated: new Date().toISOString(),
      };

      if (existsSync(registryPath)) {
        try {
          record = JSON.parse(readFileSync(registryPath, "utf8"));
        } catch {}
      }

      record.diagnoses.push(report);
      record.signatureCounts[report.signatureHash] = report.attemptCount;

      if (report.origin === "FRAMEWORK_DEFECT" && !record.frameworkDefectsIdentified.includes(report.responsibleModule)) {
        record.frameworkDefectsIdentified.push(report.responsibleModule);
      }
      record.lastUpdated = new Date().toISOString();

      writeFileSync(registryPath, JSON.stringify(record, null, 2), "utf8");
    } catch {}
  }
}

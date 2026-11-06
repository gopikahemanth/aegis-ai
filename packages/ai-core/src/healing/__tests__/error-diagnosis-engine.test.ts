import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { ErrorDiagnosisEngine } from "../error-diagnosis-engine.js";
import { existsSync, rmSync } from "node:fs";

describe("ErrorDiagnosisEngine — 11-Step Intelligent Diagnosis & Circuit Breaker", () => {
  beforeEach(() => {
    ErrorDiagnosisEngine.resetHistory();
  });

  afterAll(() => {
    if (existsSync("./test-project")) {
      rmSync("./test-project", { recursive: true, force: true });
    }
  });

  it("Step 1-6: Correctly classifies a Windows EPERM as ENVIRONMENT_ISSUE and suggests lock evasion", () => {
    const errorText = "Error: EPERM: operation not permitted, rename '...\\query_engine-windows.dll.node.tmp19992' -> '...\\query_engine-windows.dll.node'";
    const report = ErrorDiagnosisEngine.diagnose({
      phase: "Stage 9: Database Setup",
      stderr: errorText,
      projectRoot: "./test-project",
    });

    expect(report.origin).toBe("ENVIRONMENT_ISSUE");
    expect(report.category).toBe("ENVIRONMENT_ERROR");
    expect(report.recommendedStrategy).toBe("ENVIRONMENT_WORKAROUND");
    expect(report.responsibleModule).toContain("ProjectStartupAgent");
    expect(report.attemptCount).toBe(1);
    expect(report.circuitBreakerTripped).toBe(false);
  });

  it("Step 1-6: Correctly diagnoses framework sanitizer defect without wasting LLM calls", () => {
    const errorText = "server/middleware/auth.ts:19:2: ERROR: Expected ')' but found 'if'";
    const report = ErrorDiagnosisEngine.diagnose({
      phase: "Stage 10: Backend Verification",
      stderr: errorText,
      projectRoot: "./test-project",
    });

    expect(report.origin).toBe("FRAMEWORK_DEFECT");
    expect(report.responsibleModule).toBe("FastDeterministicSanitizer");
    expect(report.recommendedStrategy).toBe("DETERMINISTIC_AST_PATCH");
    expect(report.affectedFiles).toContain("server/middleware/auth.ts");
    expect(report.attemptCount).toBe(1);
  });

  it("Correctly diagnoses Rate Limits as RATE_LIMIT with PROVIDER_BACKOFF_RETRY", () => {
    const errorText = "AI Provider Error: 429 Too Many Requests: Resource exhausted: quota exceeded for tokens per minute";
    const report = ErrorDiagnosisEngine.diagnose({
      phase: "Stage 3: Frontend Generation",
      stderr: errorText,
      projectRoot: "./test-project",
    });

    expect(report.origin).toBe("RATE_LIMIT");
    expect(report.recommendedStrategy).toBe("PROVIDER_BACKOFF_RETRY");
    expect(report.responsibleModule).toContain("GeminiProvider");
  });

  it("Correctly diagnoses Provider Outages as PROVIDER_FAILURE", () => {
    const errorText = "Error: 503 Service Unavailable: The model is overloaded. Please try again later. ETIMEDOUT";
    const report = ErrorDiagnosisEngine.diagnose({
      phase: "Stage 2: Architecture",
      stderr: errorText,
      projectRoot: "./test-project",
    });

    expect(report.origin).toBe("PROVIDER_FAILURE");
    expect(report.recommendedStrategy).toBe("PROVIDER_BACKOFF_RETRY");
  });

  it("Correctly diagnoses Prisma database errors as DATABASE_ERROR", () => {
    const errorText = "PrismaClientKnownRequestError: P2002 Unique constraint failed on the constraint: User_email_key";
    const report = ErrorDiagnosisEngine.diagnose({
      phase: "Stage 10: Backend API Verification",
      stderr: errorText,
      projectRoot: "./test-project",
    });

    expect(report.origin).toBe("DATABASE_ERROR");
    expect(report.responsibleModule).toContain("DatabaseVerifier");
  });

  it("Correctly diagnoses API contract mismatch as CONTRACT_ERROR", () => {
    const errorText = "API workflow contract step failed: Expected HTTP 201, received HTTP 400 from POST /api/contact";
    const report = ErrorDiagnosisEngine.diagnose({
      phase: "Stage 10: Backend API Verification",
      stderr: errorText,
      projectRoot: "./test-project",
    });

    expect(report.origin).toBe("CONTRACT_ERROR");
    expect(report.responsibleModule).toBe("ApiWorkflowVerifier");
    expect(report.recommendedStrategy).toBe("SCOPED_SINGLE_FILE_REPAIR");
  });

  it("Correctly diagnoses test runner harness absence as TEST_INFRASTRUCTURE_FAILURE", () => {
    const errorText = "vitest: command not found: test runner exited with code 127";
    const report = ErrorDiagnosisEngine.diagnose({
      phase: "Stage 11: Verification",
      stderr: errorText,
      projectRoot: "./test-project",
    });

    expect(report.origin).toBe("TEST_INFRASTRUCTURE_FAILURE");
    expect(report.responsibleModule).toContain("TestPyramidRunner");
  });

  it("Circuit Breaker: Halts after attempt 2, and recovers when file revision changes", () => {
    const errorText = "Template phrase leak detected in src/features/skill/index.tsx: 'filter pills'";

    // Attempt 1
    const rep1 = ErrorDiagnosisEngine.diagnose({
      phase: "FinalGate",
      stderr: errorText,
      projectRoot: "./test-project",
    });
    expect(rep1.attemptCount).toBe(1);
    expect(rep1.circuitBreakerTripped).toBe(false);

    // Attempt 2
    const rep2 = ErrorDiagnosisEngine.diagnose({
      phase: "FinalGate",
      stderr: errorText,
      projectRoot: "./test-project",
    });
    expect(rep2.attemptCount).toBe(2);
    expect(rep2.circuitBreakerTripped).toBe(false);

    // Attempt 3: Circuit Breaker TRIPS!
    const rep3 = ErrorDiagnosisEngine.diagnose({
      phase: "FinalGate",
      stderr: errorText,
      projectRoot: "./test-project",
    });
    expect(rep3.attemptCount).toBe(3);
    expect(rep3.circuitBreakerTripped).toBe(true);
    expect(rep3.recommendedStrategy).toBe("CIRCUIT_BREAKER_ABORT");
    expect(rep3.status).toBe("BLOCKED");

    // File revision change / recovery reset
    ErrorDiagnosisEngine.resetForFile("src/features/skill/index.tsx");
    const rep4 = ErrorDiagnosisEngine.diagnose({
      phase: "FinalGate",
      stderr: errorText,
      projectRoot: "./test-project",
    });
    // Fresh attempt allowed after file recovery
    expect(rep4.attemptCount).toBe(1);
    expect(rep4.circuitBreakerTripped).toBe(false);
  });

  it("Step 7: Recommends SCOPED_SINGLE_FILE_REPAIR for ordinary code defects", () => {
    const errorText = "src/components/Card.tsx(15,1): error TS2322: Type 'number' is not assignable to type 'string'.";
    const report = ErrorDiagnosisEngine.diagnose({
      phase: "Stage 3: Frontend",
      stderr: errorText,
      projectRoot: "./test-project",
    });

    expect(report.origin).toBe("GENERATED_CODE_DEFECT");
    expect(report.recommendedStrategy).toBe("SCOPED_SINGLE_FILE_REPAIR");
    expect(report.affectedFiles).toContain("src/components/Card.tsx");
  });
});

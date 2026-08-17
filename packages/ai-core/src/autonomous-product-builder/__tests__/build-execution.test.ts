import { describe, it, expect } from "vitest";
import { BuildExecutionEngine } from "../build-execution-engine.js";

describe("AEGIS Phase 46 — Build Execution Engine", () => {
  it("executes installation, typechecking, bundling, and testing, reporting accurate pass/fail statuses", () => {
    const passedReport = BuildExecutionEngine.executeBuildPipeline();
    expect(passedReport.status).toBe("BUILD_PASSED");
    expect(passedReport.steps.length).toBe(4);
    expect(passedReport.errors.length).toBe(0);

    const failedReport = BuildExecutionEngine.executeBuildPipeline([
      {
        step: "TYPECHECK",
        command: "tsc --noEmit",
        exitCode: 2,
        passed: false,
        stdout: "",
        stderr: "TS2304: Cannot find name 'UnknownVar'.",
        durationMs: 120,
      },
    ]);
    expect(failedReport.status).toBe("BUILD_FAILED");
    expect(failedReport.errors.length).toBe(1);
  });
});

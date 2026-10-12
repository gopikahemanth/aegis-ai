/**
 * pre-review-self-healing-integration.test.ts
 *
 * AEGIS AI — PRE-REVIEW SELF-HEALING INTEGRATION VERIFICATION SUITE
 *
 * Verifies that the Orchestrator's pre-review stage executes bounded,
 * transactional recovery on build failures, rejects regressions, halts safely
 * when unrecoverable, maintains provenance baselines, and applies type-safe AST transforms.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { Orchestrator } from "../orchestrator.js";
import { TransactionalRepairSystem } from "../../healing/transactional-repair.js";
import { InteractionProvenanceTracker } from "../../governance/interaction-provenance-tracker.js";
import { AstSafeTransformer } from "../../governance/ast-safe-transformer.js";
import { FastDeterministicSanitizer } from "../../governance/fast-sanitizer.js";

const TEST_DIR = join(process.cwd(), "temp-pre-review-healing-test");

describe("AEGIS AI — Pre-Review Self-Healing Integration Suite", () => {
  let orchestrator: Orchestrator;

  const safeCleanDir = (dir: string) => {
    if (existsSync(dir)) {
      try {
        rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
      } catch {}
    }
  };

  beforeEach(() => {
    TransactionalRepairSystem.reset();
    safeCleanDir(TEST_DIR);
    mkdirSync(join(TEST_DIR, "src", "features", "telemetry"), { recursive: true });
    mkdirSync(join(TEST_DIR, ".aegis"), { recursive: true });

    // Create a base package.json
    writeFileSync(
      join(TEST_DIR, "package.json"),
      JSON.stringify({
        name: "test-avionics",
        version: "0.0.1",
        scripts: { build: "tsc" },
        dependencies: { react: "^18.3.1" },
      }, null, 2),
      "utf8"
    );

    // Instantiate orchestrator with null/noop provider
    orchestrator = new Orchestrator({} as any);
  });

  afterEach(() => {
    safeCleanDir(TEST_DIR);
    TransactionalRepairSystem.reset();
    vi.restoreAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Recoverable initial build failure
  // ──────────────────────────────────────────────────────────────────────────
  it("1. Recoverable initial build failure: invokes repairCoordinator, applies fix, reruns build and succeeds", async () => {
    const brokenFile = "src/features/telemetry/index.tsx";
    const brokenCode = `
      import React from "react";
      export function TelemetryView() {
        const status = 'Nominal' ? 'a' : 'b' : 'c'; // BROKEN_TOKEN
        return <div>Status</div>;
      }
    `;
    writeFileSync(join(TEST_DIR, brokenFile), brokenCode, "utf8");

    const healedCode = `
      import React from "react";
      export function TelemetryView() {
        const status = 'Nominal' ? 'a' : 'b';
        return <div>Status: {status}</div>;
      }
    `;

    // Mock runVerification: fails as long as disk contains the broken syntax error
    (orchestrator as any).runVerification = vi.fn().mockImplementation(async () => {
      const code = readFileSync(join(TEST_DIR, brokenFile), "utf8");
      console.log("=== FULL CODE IN MOCK ===\n" + code);
      if (code.includes("BROKEN_TOKEN")) {
        return {
          success: false,
          stdout: `src/features/telemetry/index.tsx(4,45): error TS1005: '}' expected.`,
          stderr: `npm warn Unknown project config "confirm-modules-purge"`,
        };
      }
      return { success: true };
    });

    // Mock repairCoordinator: returns clean healed file
    (orchestrator as any).repairCoordinator.repair = vi.fn().mockResolvedValue(`
\`\`\`tsx
=== FILE: src/features/telemetry/index.tsx ===
${healedCode}
\`\`\`
    `);

    const result = await orchestrator.verifyAndHealPreReviewBuild(
      "Build avionics telemetry",
      "react-vite",
      TEST_DIR,
      null,
      [{ path: brokenFile, content: brokenCode }],
      ""
    );

    // Verification outcomes:
    expect(result.success).toBe(true);
    expect(result.attempts).toBe(1);
    expect((orchestrator as any).repairCoordinator.repair).toHaveBeenCalledTimes(1);

    // Verify repaired content was written to disk and sanitized
    const contentOnDisk = readFileSync(join(TEST_DIR, brokenFile), "utf8");
    expect(contentOnDisk).toContain("const status = 'Nominal' ? ('a' as const) : ('b' as const)");

    // Verify transactional checkpoint was committed
    const history = TransactionalRepairSystem.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].result).toBe("COMMITTED");
    expect(history[0].failureType).toBe("PRE_REVIEW_BUILD_ERROR");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Repair regression rejection & rollback
  // ──────────────────────────────────────────────────────────────────────────
  it("2. Repair regression: rejects candidate introducing regressions and rolls back to checkpoint", async () => {
    const targetFile = "src/features/telemetry/index.tsx";
    const initialCode = `
      import React from "react";
      export function TelemetryView() {
        const val: number = "string"; // 1 type error
        return <div>{val}</div>;
      }
    `;
    writeFileSync(join(TEST_DIR, targetFile), initialCode, "utf8");

    const regressiveCode = `
      import React from "react";
      export function TelemetryView() { return <div>1</div>; }
      export function TelemetryView() { return <div>2</div>; } // TS2300 duplicate identifier regression
      export const a: number = "bad1";
      export const b: number = "bad2";
    `;

    // runVerification: initial has 1 error, candidate repair has 3 errors (regression)
    (orchestrator as any).runVerification = vi.fn().mockImplementation(async () => {
      const currentCode = readFileSync(join(TEST_DIR, targetFile), "utf8");
      if (currentCode.includes("bad1")) {
        return {
          success: false,
          stdout: `src/features/telemetry/index.tsx(4,23): error TS2300: Duplicate identifier 'TelemetryView'.
src/features/telemetry/index.tsx(5,20): error TS2322: Type 'string' not assignable to 'number'.
src/features/telemetry/index.tsx(6,20): error TS2322: Type 'string' not assignable to 'number'.`,
        };
      }
      return {
        success: false,
        stdout: `src/features/telemetry/index.tsx(4,13): error TS2322: Type 'string' not assignable to 'number'.`,
      };
    });

    // Propose regressive patch on attempt 1, then halt
    (orchestrator as any).repairCoordinator.repair = vi.fn().mockResolvedValue(`
\`\`\`tsx
=== FILE: src/features/telemetry/index.tsx ===
${regressiveCode}
\`\`\`
    `);

    const result = await orchestrator.verifyAndHealPreReviewBuild(
      "Avionics Telemetry",
      "react-vite",
      TEST_DIR,
      null,
      [{ path: targetFile, content: initialCode }],
      ""
    );

    // Verification outcomes:
    expect(result.success).toBe(false);

    // Verify rollback restored the original disk content
    const diskContentAfterRollback = readFileSync(join(TEST_DIR, targetFile), "utf8");
    expect(diskContentAfterRollback).toBe(initialCode);
    expect(diskContentAfterRollback).not.toContain("bad1");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Unrecoverable build failure halts safely
  // ──────────────────────────────────────────────────────────────────────────
  it("3. Unrecoverable build failure: stops safely at attempt limit, preserves diagnostics and does not certify", async () => {
    const targetFile = "src/features/telemetry/index.tsx";
    const persistentBrokenCode = `
      export function Telemetry() { return <div>Fatal unrecoverable</div>; }
    `;
    writeFileSync(join(TEST_DIR, targetFile), persistentBrokenCode, "utf8");

    // runVerification always fails
    (orchestrator as any).runVerification = vi.fn().mockResolvedValue({
      success: false,
      stdout: `error TS2304: Cannot find name 'FatalComponent'.`,
      stderr: `Build failed with code 1`,
    });

    // repairCoordinator offers candidates that continue to fail
    let attemptCounter = 0;
    (orchestrator as any).repairCoordinator.repair = vi.fn().mockImplementation(async () => {
      attemptCounter++;
      return `
\`\`\`tsx
=== FILE: src/features/telemetry/index.tsx ===
// attempt ${attemptCounter}
export function Telemetry() { return <div>Attempt ${attemptCounter}</div>; }
\`\`\`
      `;
    });

    const result = await orchestrator.verifyAndHealPreReviewBuild(
      "Avionics Telemetry",
      "react-vite",
      TEST_DIR,
      null,
      [{ path: targetFile, content: persistentBrokenCode }],
      ""
    );

    // Must halt boundedly at 3 attempts
    expect(result.success).toBe(false);
    expect(result.attempts).toBe(3);
    expect((orchestrator as any).repairCoordinator.repair).toHaveBeenCalledTimes(3);
    expect(result.build.stdout).toContain("Cannot find name 'FatalComponent'");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Provenance integrity preserved across repair loops
  // ──────────────────────────────────────────────────────────────────────────
  it("4. Provenance integrity: interaction baseline is preserved, never fabricated or reset", () => {
    // 1. Create source file with genuine native interactive elements
    const flightFile = join(TEST_DIR, "src", "features", "flight", "index.tsx");
    mkdirSync(join(TEST_DIR, "src", "features", "flight"), { recursive: true });
    writeFileSync(
      flightFile,
      `
      import React, { useState } from "react";
      export function FlightControl() {
        const [active, setActive] = useState(false);
        return (
          <button id="btn-flight-init" onClick={() => setActive(true)}>
            Initialize Flight
          </button>
        );
      }
      `,
      "utf8"
    );

    // 2. Capture immutable baseline
    const baseline = InteractionProvenanceTracker.captureBaseline(TEST_DIR);
    expect(InteractionProvenanceTracker.hasBaseline(TEST_DIR)).toBe(true);
    expect(baseline.size).toBeGreaterThan(0);

    // 3. Perform simulated repair cycle
    const checkpointId = TransactionalRepairSystem.createCheckpoint(
      TEST_DIR,
      ["src/features/flight/index.tsx"],
      { failureType: "PRE_REVIEW_BUILD_ERROR" }
    );
    TransactionalRepairSystem.commit(checkpointId);

    // 4. Verify baseline remains intact and unaltered
    expect(InteractionProvenanceTracker.hasBaseline(TEST_DIR)).toBe(true);
    const auditReport = InteractionProvenanceTracker.audit(TEST_DIR);
    expect(auditReport.nativeHandlers).toBeGreaterThan(0);
    expect(auditReport.sanitizerInjectedHandlers).toBe(0);
    expect(auditReport.nir).toBe(1.0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: TypeScript normalization & AST Safety with real TypeScript compiler
  // ──────────────────────────────────────────────────────────────────────────
  describe("5. TypeScript normalization & AST Safety with compiler API", () => {
    it("preserves literal-union typing and prevents TS1355 & TS2345", () => {
      const code = `
        type NoticeStatus = 'Active' | 'Acknowledged' | 'Cancelled';
        interface Notice { id: string; status: NoticeStatus }
        const n: Notice = { id: 'N-101', status: 'Active' };

        export const updateStatus = () => {
          const nextStatus = n.status === 'Active' ? 'Acknowledged' : 'Active';
          const updated: Notice = { ...n, status: nextStatus };
          return updated;
        };
      `;

      const transformed = AstSafeTransformer.transform(code);

      // Verify each literal branch is typed with as const individually (avoiding TS1355)
      expect(transformed).toContain("('Acknowledged' as const)");
      expect(transformed).toContain("('Active' as const)");
      expect(transformed).not.toMatch(/\)\s*as const/);

      // Compile with real TypeScript compiler API (strict mode)
      const testFilePath = join(TEST_DIR, "src", "type-check-test.ts");
      writeFileSync(testFilePath, transformed, "utf-8");

      const program = ts.createProgram([testFilePath], {
        noEmit: true,
        strict: true,
        skipLibCheck: true,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
      });

      const diagnostics = ts.getPreEmitDiagnostics(program);
      const errors = diagnostics.filter(
        d => d.category === ts.DiagnosticCategory.Error && d.file?.fileName.includes("type-check-test")
      );
      expect(errors).toHaveLength(0);
    });

    it("normalizes illegal leading-zero numbers without corrupting strings, floats, hex, or octal", () => {
      const code = `
        export const telemetryConfig = {
          heading: 090,          // Illegal decimal literal -> must normalize to 90
          altitude: 080,         // Illegal decimal literal -> must normalize to 80
          label: "heading: 090", // String literal -> must preserve "heading: 090"
          frequency: 0.090,      // Float -> must preserve 0.090
          hexMask: 0x090,        // Hex -> must preserve 0x090
          octalMode: 0o70,       // Octal -> must preserve 0o70
          zeroValue: 0,          // Zero -> must preserve 0
        };
      `;

      const transformed = AstSafeTransformer.transform(code);

      expect(transformed).toContain("heading: 90");
      expect(transformed).toContain("altitude: 80");
      expect(transformed).toContain('"heading: 090"');
      expect(transformed).toContain("0.090");
      expect(transformed).toContain("0x090");
      expect(transformed).toContain("0o70");

      // Verify compilation with real TypeScript compiler
      const numTestFilePath = join(TEST_DIR, "src", "num-check-test.ts");
      writeFileSync(numTestFilePath, transformed, "utf-8");

      const program = ts.createProgram([numTestFilePath], {
        noEmit: true,
        strict: true,
        skipLibCheck: true,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
      });

      const diagnostics = ts.getPreEmitDiagnostics(program);
      const errors = diagnostics.filter(
        d => d.category === ts.DiagnosticCategory.Error && d.file?.fileName.includes("num-check-test")
      );
      expect(errors).toHaveLength(0);
    });
  });
});

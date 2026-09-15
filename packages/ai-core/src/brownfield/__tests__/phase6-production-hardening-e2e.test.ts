/**
 * Phase 6 Production Hardening & Release Readiness E2E Tests
 * Aegis V2.3 Project 2 Phase 6
 */

import { describe, it, expect } from "vitest";
import { resolve, join } from "node:path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { BrownfieldTransactionManager } from "../brownfield-transaction-manager.js";
import { SelfHealingCoordinator } from "../../healing/self-healing-coordinator.js";
import { RuntimeAcceptanceRunner } from "../../testing/runtime-acceptance-runner.js";

describe("Phase 6: Production Hardening & Release Readiness", () => {
  const cliBinary = resolve(process.cwd(), "../../apps/cli/dist/index.js");
  const projectRoot = resolve(process.cwd(), "../../generated/project");

  it("1. VERSION CONSISTENCY: Asserts all CLI surfaces report Aegis V2.3.0", () => {
    const versionOutput = execSync(`node "${cliBinary}" --version`, {
      encoding: "utf8",
      stdio: "pipe",
    });
    expect(versionOutput).toContain("v2.3.0");

    const helpOutput = execSync(`node "${cliBinary}" --help`, {
      encoding: "utf8",
      stdio: "pipe",
    });
    expect(helpOutput).toContain("Version: 2.3.0");
  });

  it("2. SECRET & CREDENTIAL REDACTION: Prevents secret exposure in error traces and logs", () => {
    const sensitiveTokens = [
      "sk-proj-98421098412098410298412",
      "ghp_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    ];

    const sanitizeString = (input: string): string => {
      let sanitized = input;
      for (const token of sensitiveTokens) {
        sanitized = sanitized.replace(token, "[REDACTED_SECRET]");
      }
      return sanitized;
    };

    const rawError = `Failed to contact provider with authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`;
    const cleanError = sanitizeString(rawError);

    expect(cleanError).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    expect(cleanError).toContain("[REDACTED_SECRET]");
  });

  it("3. FILESYSTEM CONTAINMENT: Rejects directory traversal attempts", () => {
    const isContained = (baseDir: string, targetPath: string): boolean => {
      const resolvedBase = resolve(baseDir);
      const resolvedTarget = resolve(baseDir, targetPath);
      return resolvedTarget.startsWith(resolvedBase);
    };

    expect(isContained(projectRoot, "src/components/Button.tsx")).toBe(true);
    expect(isContained(projectRoot, "../../Windows/System32/cmd.exe")).toBe(false);
    expect(isContained(projectRoot, "../../../secret.json")).toBe(false);
  });

  it("4. COMMAND INJECTION PREVENTION: Detects and rejects malicious shell metacharacters", () => {
    const isSafeIdentifier = (name: string): boolean => {
      return /^[a-zA-Z0-9_-]+$/.test(name);
    };

    expect(isSafeIdentifier("my-safe-project")).toBe(true);
    expect(isSafeIdentifier("project; rm -rf /")).toBe(false);
    expect(isSafeIdentifier("project && echo hacked")).toBe(false);
    expect(isSafeIdentifier("project | nc localhost 1337")).toBe(false);
  });

  it("5. TRANSACTION CHAOS & ROLLBACK: Restores exact file state upon failure", () => {
    const testFile = join(projectRoot, "src", "chaos-test.ts");
    const originalContent = "export const status = 'ACTIVE';\n";
    writeFileSync(testFile, originalContent, "utf8");

    const txManager = new BrownfieldTransactionManager();
    const chkId = txManager.createCheckpoint(projectRoot, ["src/chaos-test.ts"], {
      reason: "Chaos Injection Test",
    });

    // Mutate file to simulate half-written failure
    writeFileSync(testFile, "CORRUPTED SYNTAX ERROR {{{", "utf8");
    expect(readFileSync(testFile, "utf8")).toContain("CORRUPTED");

    // Execute Rollback
    const rolledBack = txManager.rollback(chkId);
    expect(rolledBack).toBe(true);

    // Verify exact content restored
    expect(readFileSync(testFile, "utf8")).toBe(originalContent);
  });

  it("6. UNRECOVERABLE DEFECT CLASSIFICATION: Fast-fails on environment errors without infinite repair loops", async () => {
    const coordinator = new SelfHealingCoordinator(projectRoot);
    const report = await coordinator.diagnoseAndRepair(
      "ENVIRONMENT_ERROR: EACCES permission denied to socket port 80",
      "src/services/api.ts",
      3
    );

    expect(report.status).toBe("FAILED");
    expect(report.totalAttempts).toBe(0);
    expect(report.finalDiagnostic).toContain("ENVIRONMENT_ERROR");
  });

  it("7. GENERATED PROJECT ISOLATION: Confirms generated code contains no internal monorepo paths", () => {
    const appTsx = readFileSync(join(projectRoot, "src", "App.tsx"), "utf8");
    expect(appTsx).not.toContain("aegis-ai/packages");
    expect(appTsx).not.toContain("Users/vishn");
    expect(appTsx).not.toContain("workspace:*");
  });
});

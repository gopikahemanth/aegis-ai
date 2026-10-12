import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FastDeterministicSanitizer } from "../fast-sanitizer.js";
import { InteractionProvenanceTracker } from "../interaction-provenance-tracker.js";
import { FinalSuccessGate } from "../../validation/final-success-gate.js";
import { PatchEngine } from "../../healing/patch-engine.js";

describe("Interaction Provenance & Post-Baseline Protection Regressions", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "aegis-prov-reg-"));
    mkdirSync(join(tempDir, "src"), { recursive: true });
    mkdirSync(join(tempDir, ".aegis"), { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it("REG-PROV-01: Pre-baseline auth hook is synthesized before baseline capture", () => {
    const srcDir = join(tempDir, "src");
    // Write prompt with auth requirement
    writeFileSync(join(tempDir, ".aegis", "prompt.txt"), "Build a platform with user login and authentication", "utf8");

    // Call pre-baseline auth hook synthesis
    FastDeterministicSanitizer.ensurePreBaselineAuthHook(srcDir);

    const authFile = join(srcDir, "hooks", "useAuth.tsx");
    expect(existsSync(authFile)).toBe(true);

    // Capture baseline
    InteractionProvenanceTracker.captureBaseline(tempDir);
    expect(InteractionProvenanceTracker.hasBaseline(tempDir)).toBe(true);

    // Audit immediately after baseline: NIR must be 1.00 with 0 injected handlers
    const report = InteractionProvenanceTracker.audit(tempDir);
    expect(report.sanitizerInjectedHandlers).toBe(0);
    expect(report.nativeHandlers).toBeGreaterThan(0);
    expect(report.nir).toBe(1.0);
  });

  it("REG-PROV-02: PatchEngine protects any file in src/ from post-approval overwrite", () => {
    const srcDir = join(tempDir, "src");
    const hooksDir = join(srcDir, "hooks");
    mkdirSync(hooksDir, { recursive: true });

    const authFile = join(hooksDir, "useAuth.tsx");
    writeFileSync(authFile, "export function useAuth() { return { user: null }; }", "utf8");

    // Capture baseline and set approved frontend review
    InteractionProvenanceTracker.captureBaseline(tempDir);
    writeFileSync(join(tempDir, ".aegis", "frontend-review.json"), JSON.stringify({ status: "APPROVED" }), "utf8");

    // Attempt to write new file in src/ via PatchEngine
    const patchEngine = new PatchEngine();
    const patchContent = `
===FILE: src/hooks/useAuth.tsx===
import { useState } from 'react';
export function useAuth() {
  const [token, setToken] = useState(null);
  return { token };
}
===FILE: server/routes/auth.routes.ts===
export const auth = true;
`;

    patchEngine.apply(patchContent, tempDir);

    // Post-approval write to src/ must have been rejected
    expect(existsSync(join(srcDir, "hooks", "useAuth.tsx"))).toBe(true);
    const content = require("fs").readFileSync(join(srcDir, "hooks", "useAuth.tsx"), "utf8");
    expect(content).toContain("return { user: null };");
    // Backend file outside src/ must have been allowed
    expect(existsSync(join(tempDir, "server", "routes", "auth.routes.ts"))).toBe(true);
  });

  it("REG-PROV-03: Post-baseline injected handlers strictly fail FinalSuccessGate under STRICT_UNASSISTED", () => {
    const srcDir = join(tempDir, "src");
    writeFileSync(
      join(srcDir, "App.tsx"),
      `import React, { useState } from 'react';
export default function App() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Click {count}</button>;
}`,
      "utf8"
    );

    // Baseline capture with 1 native handler
    InteractionProvenanceTracker.captureBaseline(tempDir);

    // Simulate post-baseline injection: an unauthorized file introduced into src
    const hooksDir = join(srcDir, "hooks");
    mkdirSync(hooksDir, { recursive: true });
    writeFileSync(
      join(hooksDir, "useInjected.tsx"),
      `import { useState } from 'react';
export function useInjected() {
  const [state, setState] = useState(false);
  return { state };
}`,
      "utf8"
    );

    const report = InteractionProvenanceTracker.audit(tempDir);
    expect(report.sanitizerInjectedHandlers).toBe(1);
    expect(report.nir).toBeLessThan(1.0);

    const validContract: any = {
      frontend: { framework: "React" },
      backend: { framework: "Express" },
      database: { provider: "PostgreSQL" },
    };

    // FinalSuccessGate must reject under STRICT_UNASSISTED
    const gateResult = FinalSuccessGate.verify({
      projectRoot: tempDir,
      contract: validContract,
      buildSuccess: true,
      provenancePolicy: "STRICT_UNASSISTED",
    });

    expect(gateResult.success).toBe(false);
    expect(gateResult.status).toBe("FAILED");
    const provItem = gateResult.items.find(i => i.name === "Interaction Provenance (NIR)");
    expect(provItem).toBeDefined();
    expect(provItem?.passed).toBe(false);
    expect(provItem?.message).toContain("STRICT_POLICY_REJECTED");
  });
});

import { describe, it, expect } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { PerformanceOptimizationGate } from "../performance-optimization-gate.js";
import { PerformanceAcceptanceEngine } from "../performance-acceptance-engine.js";
import { PerformanceRegressionEngine } from "../performance-regression-engine.js";
import { PerformanceBaselineEngine } from "../performance-baseline-engine.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";

describe("AEGIS Phase 59 — Performance Optimization Gate", () => {
  it("issues Tier 46 certificate backed by measurable before/after improvement evidence", () => {
    ProductCompletionLedger.reset();
    const tmpDir = path.join(os.tmpdir(), "aegis-perf-gate-test");
    fs.mkdirSync(tmpDir, { recursive: true });

    const before = PerformanceBaselineEngine.captureBaseline("GymMaster Pro", { hasDegradedPerformance: true });
    const after = PerformanceBaselineEngine.captureBaseline("GymMaster Pro", { hasDegradedPerformance: false });
    const comparison = PerformanceRegressionEngine.compare(before, after);

    const acceptance = PerformanceAcceptanceEngine.evaluate({
      baselineCaptured: true,
      frontendAnalyzed: true,
      backendAnalyzed: true,
      databaseAnalyzed: true,
      apiAnalyzed: true,
      networkAnalyzed: true,
      assetsAnalyzed: true,
      resourcesAnalyzed: true,
      bottlenecksDiagnosed: true,
      optimizationsApplied: true,
      buildPasses: true,
      functionalRegressionPasses: true,
      securityPreserved: true,
      browserPreserved: true,
      productionVerified: true,
      criticalRegressionsCount: 0,
    });

    const cert = PerformanceOptimizationGate.certify(
      "GymMaster Pro",
      tmpDir,
      acceptance,
      comparison
    );

    expect(cert.gate).toBe("PerformanceOptimizationGate");
    expect(cert.tier).toBe(46);
    expect(cert.status).toBe("PERFORMANCE_ACCEPTED");
    expect(cert.evidence.baselineCaptured).toBe(true);
    expect(cert.evidence.averageImprovementPercent).toBeGreaterThanOrEqual(50);
    expect(cert.evidence.criticalRegressions).toBe(0);
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("rejects certification when acceptance fails", () => {
    const before = PerformanceBaselineEngine.captureBaseline("GymMaster Pro");
    const comparison = PerformanceRegressionEngine.compare(before, before);

    const acceptance = PerformanceAcceptanceEngine.evaluate({
      baselineCaptured: false,
      frontendAnalyzed: false,
      backendAnalyzed: false,
      databaseAnalyzed: false,
      apiAnalyzed: false,
      networkAnalyzed: false,
      assetsAnalyzed: false,
      resourcesAnalyzed: false,
      bottlenecksDiagnosed: false,
      optimizationsApplied: false,
      buildPasses: false,
      functionalRegressionPasses: false,
      securityPreserved: false,
      browserPreserved: false,
      productionVerified: false,
      criticalRegressionsCount: 2,
    });

    const cert = PerformanceOptimizationGate.certify(
      "GymMaster Pro",
      "/tmp/no-dir",
      acceptance,
      comparison
    );

    expect(cert.status).toBe("PERFORMANCE_REJECTED");
  });
});

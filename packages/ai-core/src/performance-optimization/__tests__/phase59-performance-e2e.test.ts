import { describe, it, expect, beforeEach } from "vitest";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { PerformanceOptimizationOrchestrator } from "../performance-optimization-orchestrator.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";

describe("AEGIS Phase 59 — Master E2E Autonomous Product Performance & Optimization Engineering", () => {
  const tmpBase = path.join(os.tmpdir(), "aegis-p59-e2e");

  beforeEach(() => {
    ProductCompletionLedger.reset();
    if (fs.existsSync(tmpBase)) {
      fs.rmSync(tmpBase, { recursive: true, force: true });
    }
    fs.mkdirSync(tmpBase, { recursive: true });
  });

  it("takes unoptimized gym application, measures baseline, diagnoses N+1 bottleneck, safely optimizes, and certifies performance", async () => {
    const projectPath = path.join(tmpBase, "gym-perf-prod");
    fs.mkdirSync(projectPath, { recursive: true });

    // Execute Performance Optimization Orchestrator
    const result = await PerformanceOptimizationOrchestrator.executeOptimizationSession("GymMaster Pro", {
      projectPath,
      targetUrl: "https://aegisgym.com",
    });

    // 1. Lifecycle Verification
    expect(result.lifecycle).toBe("PERFORMANCE_ACCEPTED");
    expect(result.productName).toBe("GymMaster Pro");

    // 2. Pre-Optimization Baseline
    expect(result.baselineBefore.database.hasNPlusOneDetected).toBe(true);
    expect(result.baselineBefore.database.queryCountPerDashboardLoad).toBe(47);
    expect(result.baselineBefore.api.dashboardLatency.p95Ms).toBe(1850);
    expect(result.baselineBefore.frontend.jsBundleSizeKb).toBe(1420);

    // 3. Bottleneck Diagnosis
    expect(result.bottlenecks.hasBottlenecks).toBe(true);
    expect(result.bottlenecks.primaryBottleneck.category).toBe("DATABASE_QUERY_PATTERN");

    // 4. Optimization Strategy & Bounded Execution
    expect(result.strategyPlan.selectedStrategies.length).toBe(4);
    expect(result.optimizationReport?.isOptimized).toBe(true);
    expect(result.optimizationReport?.totalPatchesApplied).toBe(4);

    // 5. Post-Optimization Re-Benchmark & Comparison
    expect(result.baselineAfter?.database.queryCountPerDashboardLoad).toBe(3);
    expect(result.baselineAfter?.api.dashboardLatency.p95Ms).toBe(410);
    expect(result.baselineAfter?.frontend.jsBundleSizeKb).toBe(820);
    expect(result.comparisonReport.isOverallImproved).toBe(true);
    expect(result.comparisonReport.averageImprovementPercent).toBeGreaterThanOrEqual(50);

    // 6. Multi-Layer Verification
    expect(result.verificationReport?.isFullyVerified).toBe(true);
    expect(result.verificationReport?.functionalityPreserved).toBe(true);
    expect(result.verificationReport?.securityPreserved).toBe(true);
    expect(result.verificationReport?.uxPreserved).toBe(true);

    // 7. Live Production Verification & Gate Certification
    expect(result.productionReport?.isProductionHealthy).toBe(true);
    expect(result.acceptance.isAccepted).toBe(true);
    expect(result.acceptance.criticalRegressionsCount).toBe(0);
    expect(result.certificate.tier).toBe(46);
    expect(result.certificate.status).toBe("PERFORMANCE_ACCEPTED");

    // 8. Disk Certificate & Ledger Integrity
    const certPath = path.join(projectPath, ".aegis", "performance-optimization-certificate.json");
    expect(fs.existsSync(certPath)).toBe(true);
    const certOnDisk = JSON.parse(fs.readFileSync(certPath, "utf8"));
    expect(certOnDisk.status).toBe("PERFORMANCE_ACCEPTED");
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);
  });

  it("automatically rejects and rolls back an optimization when a functional regression is detected", async () => {
    const projectPath = path.join(tmpBase, "gym-perf-regression");
    fs.mkdirSync(projectPath, { recursive: true });

    const result = await PerformanceOptimizationOrchestrator.executeOptimizationSession("GymMaster Pro", {
      projectPath,
      simulateFunctionalBreakOnOptimization: true,
    });

    expect(result.lifecycle).toBe("ROLLED_BACK");
    expect(result.verificationReport?.isFullyVerified).toBe(false);
    expect(result.verificationReport?.functionalityPreserved).toBe(false);
    expect(result.acceptance.isAccepted).toBe(false);
    expect(result.certificate.status).toBe("PERFORMANCE_REJECTED");
  });
});

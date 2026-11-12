import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MasterGeneralizationHarness } from "../master-generalization-harness.js";
import * as fs from "fs";
import * as path from "path";

const TEST_DIR = path.join(process.cwd(), ".tmp_test_generalization_harness");

describe("Phase 12: MasterGeneralizationHarness", () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("successfully synthesizes and verifies a Healthcare Clinical Management application", async () => {
    const healthcareBenchmark = MasterGeneralizationHarness.TEST_BENCHMARKS[0];
    const result = await MasterGeneralizationHarness.evaluateDomain(healthcareBenchmark, TEST_DIR);

    expect(result.domain).toBe("Healthcare");
    expect(result.modelsCount).toBeGreaterThanOrEqual(1);
    expect(result.routesCount).toBeGreaterThanOrEqual(2);
    expect(result.integrationPassed).toBe(true);
    expect(result.acceptanceStatus).toBe("SUCCESS");
    expect(result.overallScore).toBeGreaterThanOrEqual(95);

    // Verify generated assets exist on disk
    const domainDir = path.join(TEST_DIR, "healthcare");
    expect(fs.existsSync(path.join(domainDir, "package.json"))).toBe(true);
    expect(fs.existsSync(path.join(domainDir, "prisma", "schema.prisma"))).toBe(true);
    expect(fs.existsSync(path.join(domainDir, "src", "App.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(domainDir, "server", "src", "index.ts"))).toBe(true);
    expect(fs.existsSync(path.join(domainDir, "setup.bat"))).toBe(true);
  });

  it("successfully synthesizes and verifies a Fintech Wealth Management application", async () => {
    const fintechBenchmark = MasterGeneralizationHarness.TEST_BENCHMARKS[1];
    const result = await MasterGeneralizationHarness.evaluateDomain(fintechBenchmark, TEST_DIR);

    expect(result.domain).toBe("Fintech");
    expect(result.integrationPassed).toBe(true);
    expect(result.acceptanceStatus).toBe("SUCCESS");
    expect(result.overallScore).toBeGreaterThanOrEqual(95);

    const domainDir = path.join(TEST_DIR, "fintech");
    expect(fs.existsSync(path.join(domainDir, "README.md"))).toBe(true);
    expect(fs.existsSync(path.join(domainDir, "server", "src", "routes", "api.ts"))).toBe(true);
  });

  it("successfully synthesizes and verifies a Logistics Fleet Dispatch application", async () => {
    const logisticsBenchmark = MasterGeneralizationHarness.TEST_BENCHMARKS[2];
    const result = await MasterGeneralizationHarness.evaluateDomain(logisticsBenchmark, TEST_DIR);

    expect(result.domain).toBe("Logistics");
    expect(result.integrationPassed).toBe(true);
    expect(result.acceptanceStatus).toBe("SUCCESS");
  });
});

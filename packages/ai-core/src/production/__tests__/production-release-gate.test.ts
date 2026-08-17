import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ProductionReleaseGate } from "../production-release-gate.js";
import type { ProductSuccessReport } from "../../product/product-success-gate.js";

const GATE_TEST_DIR = join(process.cwd(), ".tmp_test_p14_gate");

describe("AEGIS Phase 14 — Production Release Gate & Certificate Issuance", () => {
  beforeEach(() => {
    if (existsSync(GATE_TEST_DIR)) rmSync(GATE_TEST_DIR, { recursive: true, force: true });
    mkdirSync(GATE_TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(GATE_TEST_DIR)) rmSync(GATE_TEST_DIR, { recursive: true, force: true });
  });

  it("issues official release certificate when all production dimensions pass", async () => {
    writeFileSync(
      join(GATE_TEST_DIR, "package.json"),
      JSON.stringify({ dependencies: { express: "^4.19.2" } })
    );

    const mockProductSuccess: ProductSuccessReport = {
      status: "SUCCESS",
      specificationPassed: true,
      matrixPassed: true,
      goldenWorkflowsPassed: true,
      realityPassed: true,
      summary: "Product success confirmed.",
    };

    const cert = await ProductionReleaseGate.evaluate({
      projectPath: GATE_TEST_DIR,
      projectId: "gym_proj",
      generationId: "gen_g1",
      productSuccessReport: mockProductSuccess,
    });

    expect(cert.status).toBe("RELEASED");
    expect(cert.blockers.length).toBe(0);
    expect(existsSync(join(GATE_TEST_DIR, ".aegis", "release-certificate.json"))).toBe(true);
  });
});

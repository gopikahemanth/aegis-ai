import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ComplianceEvidenceEngine } from "../../compliance/compliance-evidence-engine.js";

const COMP_DIR = join(process.cwd(), ".tmp_test_p21_comp");

describe("AEGIS Phase 21 — Compliance Evidence Engine", () => {
  beforeEach(() => {
    if (existsSync(COMP_DIR)) rmSync(COMP_DIR, { recursive: true, force: true });
    mkdirSync(COMP_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(COMP_DIR)) rmSync(COMP_DIR, { recursive: true, force: true });
  });

  it("generates verified compliance certificate with SOC2 and ISO 27001 mappings", () => {
    const cert = ComplianceEvidenceEngine.generateComplianceCertificate(COMP_DIR);
    expect(cert.status).toBe("COMPLIANT");
    expect(cert.frameworksValidated).toContain("SOC2_TYPE_II");
    expect(cert.frameworksValidated).toContain("ISO_27001");
    expect(existsSync(join(COMP_DIR, ".aegis", "compliance-certificate.json"))).toBe(true);
  });
});

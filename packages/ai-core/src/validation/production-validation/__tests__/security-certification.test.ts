import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SecurityCertificationGate } from "../../../security/certification/security-certification-gate.js";

const SEC_DIR = join(process.cwd(), ".tmp_test_p19_sec");

describe("AEGIS Phase 19 — Security Certification Gate", () => {
  beforeEach(() => {
    if (existsSync(SEC_DIR)) rmSync(SEC_DIR, { recursive: true, force: true });
    mkdirSync(SEC_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(SEC_DIR)) rmSync(SEC_DIR, { recursive: true, force: true });
  });

  it("evaluates all 14 security dimensions and writes .aegis/security-certificate.json", () => {
    const cert = SecurityCertificationGate.evaluate(SEC_DIR);
    expect(cert.status).toBe("SECURITY_CERTIFIED");
    expect(cert.dimensionsAudited).toBe(14);
    expect(existsSync(join(SEC_DIR, ".aegis", "security-certificate.json"))).toBe(true);
  });
});

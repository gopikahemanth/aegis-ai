import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SecurityHardener } from "../security-hardener.js";

const SEC_TEST_DIR = join(process.cwd(), ".tmp_test_p14_sec");

describe("AEGIS Phase 14 — Security Hardening Static Audit", () => {
  beforeEach(() => {
    if (existsSync(SEC_TEST_DIR)) rmSync(SEC_TEST_DIR, { recursive: true, force: true });
    mkdirSync(SEC_TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(SEC_TEST_DIR)) rmSync(SEC_TEST_DIR, { recursive: true, force: true });
  });

  it("detects SQL injection and hardcoded secrets in source files", () => {
    writeFileSync(
      join(SEC_TEST_DIR, "server.ts"),
      'const secret = "sk-1234567890123456789012345";\nprisma.$queryRawUnsafe("SELECT * FROM users WHERE id = " + req.params.id);'
    );

    const audit = SecurityHardener.audit(SEC_TEST_DIR);
    expect(audit.status).toBe("FAIL");
    expect(audit.vulnerabilities.some((v) => v.category === "SECRET_LEAK")).toBe(true);
    expect(audit.vulnerabilities.some((v) => v.category === "SQL_INJECTION")).toBe(true);
  });
});

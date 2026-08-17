import { describe, it, expect } from "vitest";
import { DatabaseSecurityEngine } from "../database-security-engine.js";

describe("AEGIS Phase 58 — Database Security Engine", () => {
  it("verifies ORM parameterized SQL safety and enforced SSL/TLS connections", () => {
    const report = DatabaseSecurityEngine.auditDatabaseSecurity();
    expect(report.isDatabaseSecure).toBe(true);
    expect(report.sqlInjectionProtection).toBe(true);
    expect(report.sslModeEnabled).toBe(true);
  });
});

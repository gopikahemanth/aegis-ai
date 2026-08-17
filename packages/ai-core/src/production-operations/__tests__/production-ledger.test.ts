import { describe, it, expect, beforeEach } from "vitest";
import { ProductionIncidentLedger } from "../production-incident-ledger.js";

describe("AEGIS Phase 55 — Production Incident Ledger", () => {
  beforeEach(() => {
    ProductionIncidentLedger.reset();
  });

  it("appends entries and maintains cryptographic hash chaining", () => {
    const e1 = ProductionIncidentLedger.append("inc_1", "INCIDENT_DETECTED", { severity: "SEV1" });
    const e2 = ProductionIncidentLedger.append("inc_1", "DIAGNOSIS_COMPLETED", { rootCause: "DB Pool" });
    const e3 = ProductionIncidentLedger.append("inc_1", "RECOVERY_VERIFIED", { success: true });

    expect(ProductionIncidentLedger.getEntries()).toHaveLength(3);
    expect(e2.previousHash).toBe(e1.hash);
    expect(e3.previousHash).toBe(e2.hash);
    expect(ProductionIncidentLedger.verifyIntegrity()).toBe(true);
  });
});

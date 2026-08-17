import { describe, it, expect, beforeEach } from "vitest";
import { AutonomousExecutionLedger } from "../execution-ledger.js";

describe("AEGIS Phase 33 — Autonomous Execution Ledger", () => {
  beforeEach(() => {
    AutonomousExecutionLedger.reset();
  });

  it("records cryptographically chained append-only execution events", () => {
    const event = AutonomousExecutionLedger.recordEvent({
      actorId: "lead_1",
      organizationId: "org_alpha",
      projectId: "proj_api",
      environment: "production",
      executionId: "exec_1",
      eventType: "EXECUTION_CERTIFIED",
      evidenceSummary: "Execution verified across Technical, Operational, and Business dimensions.",
    });

    expect(event.entryHash).toBeDefined();
    expect(event.previousHash).toBe("GENESIS_EXECUTION_LEDGER_HASH");
    expect(AutonomousExecutionLedger.getEvents().length).toBe(1);
  });
});

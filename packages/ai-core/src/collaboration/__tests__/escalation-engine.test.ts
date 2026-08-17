import { describe, it, expect, beforeEach } from "vitest";
import { EscalationEngine } from "../escalation-engine.js";

describe("AEGIS Phase 22 — Escalation Engine", () => {
  beforeEach(() => {
    EscalationEngine.reset();
  });

  it("triggers automatic escalation upon approval expiration or SLO depletion", () => {
    const esc = EscalationEngine.triggerEscalation(
      "APPROVAL_EXPIRED",
      "appr_123",
      "Approval timed out after 24h",
      "PROJECT_ADMIN"
    );

    expect(esc.escalatedToRole).toBe("PROJECT_ADMIN");
    expect(EscalationEngine.listEscalations().length).toBe(1);
  });
});

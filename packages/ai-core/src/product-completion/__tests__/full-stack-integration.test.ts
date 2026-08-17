import { describe, it, expect } from "vitest";
import { FullStackIntegrationVerifier } from "../full-stack-integration-verifier.js";

describe("AEGIS Phase 45 — Full Stack Integration Verifier", () => {
  it("validates full-stack connectivity from UI through API, DB, and state synchronization", () => {
    const broken = FullStackIntegrationVerifier.verifyChain(true, false, true, true, true);
    expect(broken.isFullyIntegrated).toBe(false);
    expect(broken.apiToDatabaseConnected).toBe(false);

    const integrated = FullStackIntegrationVerifier.verifyChain(true, true, true, true, true);
    expect(integrated.isFullyIntegrated).toBe(true);
    expect(integrated.integrationScorePct).toBe(100);
  });
});

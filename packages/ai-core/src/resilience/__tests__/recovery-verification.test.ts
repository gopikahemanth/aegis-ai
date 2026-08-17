import { describe, it, expect } from "vitest";
import { RecoveryVerificationEngine } from "../recovery-verification-engine.js";

describe("AEGIS Phase 27 — Recovery Verification Engine", () => {
  it("verifies live restore and API execution without substituting plans for proof", () => {
    const verified = RecoveryVerificationEngine.verifyRecovery("proj_core", true, true, true);
    expect(verified.status).toBe("VERIFIED_RECOVERABLE");
    expect(verified.appServerRestarted).toBe(true);

    const failed = RecoveryVerificationEngine.verifyRecovery("proj_core", true, false, false);
    expect(failed.status).toBe("RECOVERY_FAILED");
  });
});

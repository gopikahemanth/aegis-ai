import { describe, it, expect } from "vitest";
import { WorkerManager } from "../../../platform/worker-manager.js";
import { IdentityManager } from "../../../identity/identity-manager.js";
import { SecretProvider } from "../../../security/secret-provider.js";
import { CiProvider } from "../../../integrations/cicd/ci-provider.js";

describe("AEGIS Phase 19 — Chaos Resilience Matrix & Failure Certification", () => {
  it("prevents duplicate worker collision and preserves single-owner mutations", () => {
    WorkerManager.reset();
    WorkerManager.heartbeat("w1");
    WorkerManager.heartbeat("w2");

    expect(WorkerManager.acquireLease("w1", "proj1", "job1")).toBe(true);
    expect(WorkerManager.acquireLease("w2", "proj1", "job2")).toBe(false);
  });

  it("safely denies cross-tenant access during unauthorized invocation", () => {
    IdentityManager.reset();
    IdentityManager.registerActor({
      userId: "u1",
      name: "Attacker",
      organizationId: "org_alpha",
      role: "DEVELOPER",
    });

    const auth = IdentityManager.authorizeOperation("u1", "CODE_EDIT", "org_beta");
    expect(auth.authorized).toBe(false);
  });

  it("redacts credentials from raw strings preventing secret exposure", () => {
    SecretProvider.clear();
    SecretProvider.setSecret("API_KEY", "sk-live-9999-secret");
    expect(SecretProvider.maskSecrets("Authorization: Bearer sk-live-9999-secret")).toBe(
      "Authorization: Bearer [REDACTED_SECRET]"
    );
  });
});

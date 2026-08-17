import { describe, it, expect } from "vitest";
import { EvidenceCollectionEngine } from "../evidence-collection-engine.js";

describe("AEGIS Phase 57 — Evidence Collection Engine", () => {
  it("collects multi-signal telemetry and redacts sensitive credentials", () => {
    const bundle = EvidenceCollectionEngine.collectEvidence();
    expect(bundle.totalSignals).toBeGreaterThanOrEqual(5);
    expect(bundle.redactedTokensCount).toBeGreaterThan(0);
    expect(bundle.primaryFailureSignature).toContain("FOREIGN_KEY");
    const networkSignal = bundle.signals.find((s) => s.source === "NETWORK");
    expect(networkSignal?.data.status).toBe(500);
    expect(JSON.stringify(networkSignal?.data)).not.toContain("sk_live_");
  });
});

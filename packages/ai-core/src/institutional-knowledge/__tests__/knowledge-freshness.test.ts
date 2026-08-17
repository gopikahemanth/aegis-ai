import { describe, it, expect } from "vitest";
import { KnowledgeFreshnessEngine } from "../knowledge-freshness-engine.js";

describe("AEGIS Phase 41 — Knowledge Freshness Engine", () => {
  it("tracks temporal decay and identifies stale knowledge requiring revalidation", () => {
    const current = KnowledgeFreshnessEngine.evaluateFreshness("k_recent", 15, false);
    expect(current.status).toBe("CURRENT");
    expect(current.revalidationRecommended).toBe(false);

    const stale = KnowledgeFreshnessEngine.evaluateFreshness("k_old", 220, false);
    expect(stale.status).toBe("STALE");
    expect(stale.revalidationRecommended).toBe(true);

    const changed = KnowledgeFreshnessEngine.evaluateFreshness("k_migrated", 30, true);
    expect(changed.status).toBe("REQUIRES_REVALIDATION");
    expect(changed.revalidationRecommended).toBe(true);
  });
});

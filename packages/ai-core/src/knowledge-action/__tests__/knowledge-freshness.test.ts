import { describe, it, expect } from "vitest";
import { KnowledgeFreshnessEngine } from "../knowledge-freshness-engine.js";

describe("AEGIS Phase 43 — Knowledge Freshness Engine", () => {
  it("enforces OLD KNOWLEDGE != CURRENT TRUTH and revokes authoritative status on expired/contradicted knowledge", () => {
    const fresh = KnowledgeFreshnessEngine.evaluateFreshness("ins_1", 10, false);
    expect(fresh.state).toBe("FRESH");
    expect(fresh.isAuthoritative).toBe(true);

    const stale = KnowledgeFreshnessEngine.evaluateFreshness("ins_2", 120, false);
    expect(stale.state).toBe("STALE");
    expect(stale.isAuthoritative).toBe(false);
    expect(stale.recommendedAction).toBe("REVALIDATE");

    const contradicted = KnowledgeFreshnessEngine.evaluateFreshness("ins_3", 15, true);
    expect(contradicted.state).toBe("CONTRADICTED");
    expect(contradicted.isAuthoritative).toBe(false);
  });
});

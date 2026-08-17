import { describe, it, expect } from "vitest";
import { KnowledgeRevalidationEngine } from "../knowledge-revalidation-engine.js";

describe("AEGIS Phase 44 — Knowledge Revalidation Engine", () => {
  it("detects stale and contradicted knowledge, revoking authoritative status", () => {
    const valid = KnowledgeRevalidationEngine.evaluateRevalidation("k_valid", 10, false, false);
    expect(valid.status).toBe("VALID");
    expect(valid.isAuthoritative).toBe(true);

    const stale = KnowledgeRevalidationEngine.evaluateRevalidation("k_stale", 100, false, false);
    expect(stale.status).toBe("STALE");
    expect(stale.isAuthoritative).toBe(false);

    const contradicted = KnowledgeRevalidationEngine.evaluateRevalidation("k_ctrd", 15, false, true);
    expect(contradicted.status).toBe("CONTRADICTED");
    expect(contradicted.isAuthoritative).toBe(false);
    expect(contradicted.recommendedAction).toBe("INVESTIGATE");
  });
});

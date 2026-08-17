import { describe, it, expect } from "vitest";
import { ChangeOpportunityEngine } from "../change-opportunity-engine.js";

describe("AEGIS Phase 39 — Change Opportunity Engine", () => {
  it("discovers system improvement opportunities from incidents, technical debt, and security audits", () => {
    const opps = ChangeOpportunityEngine.discoverOpportunities("proj_gym", 2, 0.3, 1);
    expect(opps.length).toBe(3);
    expect(opps.some((o) => o.source === "INCIDENT_RETROSPECTIVE")).toBe(true);
    expect(opps.some((o) => o.source === "CODEBASE_ANALYSIS")).toBe(true);
    expect(opps.some((o) => o.source === "SECURITY_AUDIT")).toBe(true);
    expect(opps[0].confidence).toBeGreaterThanOrEqual(0.9);
  });
});

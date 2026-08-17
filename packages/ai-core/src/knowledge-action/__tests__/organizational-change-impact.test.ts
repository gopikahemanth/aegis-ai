import { describe, it, expect } from "vitest";
import { OrganizationalChangeImpactEngine } from "../organizational-change-impact.js";

describe("AEGIS Phase 43 — Organizational Change Impact Engine", () => {
  it("evaluates organizational consequences with zero organizational mutations", () => {
    const impact = OrganizationalChangeImpactEngine.analyzeImpact(
      ["team_backend", "team_infra", "team_secops"],
      ["proj_gym", "proj_auth", "proj_billing"]
    );

    expect(impact.analysisId).toBeDefined();
    expect(impact.scope).toBe("MULTI_TEAM");
    expect(impact.trainingDocumentationRequired).toBe(true);
    expect(impact.affectedTeams.length).toBe(3);
  });
});

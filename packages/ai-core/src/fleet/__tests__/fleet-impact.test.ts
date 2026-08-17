import { describe, it, expect } from "vitest";
import { FleetImpactAnalyzer } from "../fleet-impact-analyzer.js";

describe("AEGIS Phase 16 — Fleet-Wide Impact Analysis", () => {
  it("confirms strictly local blast radius for project-specific files", () => {
    const report = FleetImpactAnalyzer.analyzeChange("gym_proj", ["src/features/members/MemberList.tsx"]);
    expect(report.blastRadius).toBe("LOCAL_PROJECT_ONLY");
    expect(report.affectedProjects).toEqual(["gym_proj"]);
    expect(report.crossProjectContamination).toBe(false);
  });

  it("identifies fleet-wide blast radius when shared workspace configuration changes", () => {
    const report = FleetImpactAnalyzer.analyzeChange("gym_proj", ["pnpm-workspace.yaml"]);
    expect(report.blastRadius).toBe("FLEET_WIDE");
  });
});

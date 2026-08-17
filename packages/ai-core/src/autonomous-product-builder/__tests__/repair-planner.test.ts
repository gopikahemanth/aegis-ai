import { describe, it, expect } from "vitest";
import { DefectDiagnosisEngine } from "../defect-diagnosis-engine.js";
import { RepairPlanner } from "../repair-planner.js";

describe("AEGIS Phase 46 — Repair Planner", () => {
  it("generates governed repair plans with risk assessment and atomic rollback guarantees", () => {
    const diagnosed = DefectDiagnosisEngine.diagnose("HTTP 404: Cannot POST /api/members", ["server/routes/member.routes.ts"]);
    const plan = RepairPlanner.planRepair(diagnosed);

    expect(plan.category).toBe("API_ERROR");
    expect(plan.affectedFiles).toContain("server/routes/member.routes.ts");
    expect(plan.rollbackAvailable).toBe(true);
    expect(plan.requiresHumanReview).toBe(false);
  });
});

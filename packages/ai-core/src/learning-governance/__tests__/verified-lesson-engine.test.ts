import { describe, it, expect } from "vitest";
import { VerifiedLessonEngine } from "../verified-lesson-engine.js";

describe("AEGIS Phase 44 — Verified Lesson Engine", () => {
  it("rejects simulated-only or unverified claims from becoming verified institutional lessons", () => {
    const simOnly = VerifiedLessonEngine.extractLesson({
      decisionId: "dec_1",
      actionId: "act_1",
      outcomeId: "out_1",
      evidenceIds: ["ev_sim"],
      isEmpiricallyVerified: false,
      isSimulatedOnly: true,
      actualBenefitScore: 90,
      title: "Simulated Memory Cache Optimization",
      description: "Simulation projected 40% memory reduction",
      category: "Performance",
      projects: ["proj_gym"],
      teams: ["team_backend"],
      domains: ["Engineering"],
    });
    expect(simOnly.isAccepted).toBe(false);
    expect(simOnly.verificationStatus).toBe("REJECTED");

    const realVerified = VerifiedLessonEngine.extractLesson({
      decisionId: "dec_2",
      actionId: "act_2",
      outcomeId: "out_2",
      evidenceIds: ["ev_telemetry_1", "ev_postmortem_2"],
      isEmpiricallyVerified: true,
      isSimulatedOnly: false,
      actualBenefitScore: 95,
      title: "Empirically Verified Pool Sizing",
      description: "Live cluster observed 58% latency reduction",
      category: "Reliability",
      projects: ["proj_gym"],
      teams: ["team_infra"],
      domains: ["Reliability"],
    });
    expect(realVerified.isAccepted).toBe(true);
    expect(realVerified.verificationStatus).toBe("VERIFIED");
    expect(realVerified.confidence).toBeGreaterThanOrEqual(0.9);
  });
});

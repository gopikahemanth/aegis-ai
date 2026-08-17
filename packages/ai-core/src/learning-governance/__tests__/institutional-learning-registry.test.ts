import { describe, it, expect, beforeEach } from "vitest";
import { InstitutionalLearningRegistry } from "../institutional-learning-registry.js";

describe("AEGIS Phase 44 — Institutional Learning Registry", () => {
  beforeEach(() => {
    InstitutionalLearningRegistry.reset();
  });

  it("registers organizational lessons preserving provenance and lifecycle transitions", () => {
    const lesson = InstitutionalLearningRegistry.registerLesson({
      sourceActionId: "act_pool_std",
      sourceDecisionId: "dec_pool_opt",
      sourceOutcomeId: "out_p99_58pct",
      evidenceReferences: ["ev_p99_metric", "ev_pool_sat_log"],
      lessonCategory: "Reliability",
      title: "Clustered Connection Pool Resiliency",
      description: "Setting pool limit to 50 stabilizes P99 under 20ms during bursty loads",
      confidence: 0.96,
      verificationStatus: "VERIFIED",
      affectedProjects: ["proj_gym", "proj_crm"],
      affectedTeams: ["team_backend", "team_infra"],
      affectedDomains: ["Engineering", "Reliability"],
    });

    expect(lesson.lessonId).toBeDefined();
    expect(lesson.verificationStatus).toBe("VERIFIED");
    expect(InstitutionalLearningRegistry.getAllLessons().length).toBe(1);

    InstitutionalLearningRegistry.updateStatus(lesson.lessonId, "ACTIVE");
    const updated = InstitutionalLearningRegistry.getLesson(lesson.lessonId);
    expect(updated?.verificationStatus).toBe("ACTIVE");
  });
});

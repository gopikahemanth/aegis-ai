import { describe, it, expect } from "vitest";
import { OrganizationalExperienceEngine } from "../organizational-experience-engine.js";

describe("AEGIS Phase 41 — Organizational Experience Engine", () => {
  it("structures raw historical events into verified organizational experiences", () => {
    const exp = OrganizationalExperienceEngine.createExperience(
      "org_global",
      "INCIDENT_POSTMORTEM",
      ["inc_88"],
      { concurrency: 120, dbDriver: "prisma" },
      ["High P99 Latency (>2000ms)", "Connection Pool Saturation"],
      "Prisma connection pool exhausted under concurrent traffic",
      ["Increased connection_limit from 10 to 50"],
      "P99 Latency restored to 18ms cleanly",
      ["ev_metric_p99_18ms", "ev_pool_stats"]
    );

    expect(exp.experienceId).toBeDefined();
    expect(exp.observedSymptoms.length).toBe(2);
    expect(exp.verified).toBe(true);
    expect(exp.confidence).toBeGreaterThanOrEqual(0.9);
  });
});

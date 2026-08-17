import { describe, it, expect } from "vitest";
import { EngineeringPatternEngine } from "../engineering-pattern-engine.js";

describe("AEGIS Phase 41 — Engineering Pattern Engine", () => {
  it("recognizes recurring engineering patterns and classifies recurrence confidence", () => {
    const pat = EngineeringPatternEngine.recognizePattern(
      "PERFORMANCE_BOTTLENECK",
      "Database Connection Starvation Under Concurrent WebSockets",
      6,
      ["proj_gym", "proj_cms"],
      ["team_backend", "team_infra"],
      ["ev_1", "ev_2", "ev_3"]
    );

    expect(pat.status).toBe("HIGH_CONFIDENCE");
    expect(pat.confidence).toBeGreaterThanOrEqual(0.95);
    expect(pat.affectedProjects.length).toBe(2);
  });
});

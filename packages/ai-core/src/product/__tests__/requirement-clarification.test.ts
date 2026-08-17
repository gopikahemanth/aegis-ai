import { describe, it, expect } from "vitest";
import { RequirementClarificationEngine } from "../requirement-clarification-engine.js";

describe("RequirementClarificationEngine", () => {
  it("distinguishes safe-to-proceed requests from blocking ambiguities", () => {
    // 1. Safe request
    const safeReport = RequirementClarificationEngine.evaluate("Build a gym management application with React and Express");
    expect(safeReport.status).toBe("SAFE_TO_PROCEED");
    expect(safeReport.isBlocking).toBe(false);

    // 2. Destructive / ambiguous request
    const blockingReport = RequirementClarificationEngine.evaluate("Delete database and wipe all data immediately");
    expect(blockingReport.status).toBe("NEEDS_CLARIFICATION");
    expect(blockingReport.isBlocking).toBe(true);
    expect(blockingReport.blockingAmbiguities.length).toBeGreaterThan(0);
  });
});

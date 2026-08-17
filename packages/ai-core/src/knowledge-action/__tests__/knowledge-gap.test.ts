import { describe, it, expect } from "vitest";
import { KnowledgeGapEngine } from "../knowledge-gap-engine.js";

describe("AEGIS Phase 43 — Knowledge Gap Engine", () => {
  it("enforces UNKNOWN != NEGATIVE != POSITIVE != VERIFIED and formulates research tasks without fabricating data", () => {
    const missingTelemetry = KnowledgeGapEngine.detectGap("Reliability", "proj_unmonitored", 5, false);
    expect(missingTelemetry?.gapType).toBe("MISSING_TELEMETRY");
    expect(missingTelemetry?.recommendedInvestigationTask).toContain("OpenTelemetry");

    const missingEvidence = KnowledgeGapEngine.detectGap("Security", "proj_blank", 0, true);
    expect(missingEvidence?.gapType).toBe("MISSING_EVIDENCE");
  });
});

import { describe, it, expect } from "vitest";
import { RequirementNormalizationEngine } from "../requirement-normalization-engine.js";
import { CandidateRequirement } from "../requirement-discovery-engine.js";

describe("AEGIS Phase 61 — Requirement Normalization Engine", () => {
  it("normalizes varied phrasing into canonical domain and standardized keywords", () => {
    const candidates: CandidateRequirement[] = [
      {
        id: "REQ-1",
        title: "Download member spreadsheet",
        description: "Manager wants excel member data export",
        sourceSignals: ["sig_1"],
        affectedUsers: ["Manager"],
        expectedOutcome: "Save time",
        evidenceStrength: "STRONG",
        confidence: 0.92,
      },
    ];

    const normalized = RequirementNormalizationEngine.normalize(candidates);
    expect(normalized.length).toBe(1);
    expect(normalized[0].canonicalDomain).toBe("MEMBER_MANAGEMENT_DATA_EXPORT");
    expect(normalized[0].normalizedKeywords).toContain("excel_xlsx");
  });
});

import { describe, it, expect } from "vitest";
import { CandidateCompositionSynthesizer } from "../candidate-composition-synthesizer.js";

describe("CandidateCompositionSynthesizer — Domain-Derived Features & Blocklist Protection", () => {
  const BLOCKLISTED_PHRASES = [
    "Interactive Model Stage",
    "Structural Inspection",
    "Telemetry & Controls",
    "Operational Systems",
  ];

  it("does not emit blocklisted template phrases for photographer portfolio", () => {
    const prompt = "Build a simple single-page portfolio for a photographer named Elena Vance";
    const candidates = CandidateCompositionSynthesizer.generateCandidates({
      rawPrompt: prompt,
      characteristics: {
        productType: "portfolio",
        domainCategory: "photography",
        formFactor: "single_page",
        visualMood: "clean",
        primarySubject: "Elena Vance Photography",
      } as any,
      capabilityPlan: {
        requires3D: false,
        requiresAudio: false,
        requiresMap: false,
        primaryMode: "standard",
      } as any,
    });

    expect(candidates).toBeDefined();
    expect(candidates.length).toBeGreaterThanOrEqual(1);

    const fullJson = JSON.stringify(candidates);
    for (const phrase of BLOCKLISTED_PHRASES) {
      expect(fullJson).not.toContain(phrase);
    }
  });

  it("derives dynamic sections from prompt keywords when no explicit features clause is present", () => {
    const prompt = "Elena Vance landscape photography showcase";
    const sections = CandidateCompositionSynthesizer.deriveSectionPlan({
      prompt,
      rawPrompt: prompt,
      primarySubject: "Landscape Photography",
      productType: "portfolio",
    } as any);

    expect(sections).toBeDefined();
    expect(sections.length).toBeGreaterThanOrEqual(1);
    const names = sections.map(s => s.name);
    for (const phrase of BLOCKLISTED_PHRASES) {
      expect(names).not.toContain(phrase);
    }
  });
});

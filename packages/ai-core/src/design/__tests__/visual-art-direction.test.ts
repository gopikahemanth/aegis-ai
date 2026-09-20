import { describe, it, expect } from "vitest";
import {
  deriveArtDirection,
  getContrastRatio,
  computeDeterministicHash,
  type VisualArtDirectionContract,
} from "../visual-art-direction.js";
import {
  DomainVisualContractGenerator,
} from "../domain-visual-contract.js";

describe("Visual Art Direction Architecture — Generic Visual Identity Contract", () => {
  const PROMPT_SOLAR =
    "Build a real-time SolarTelemetry operations platform monitoring solar inverter fleet status, photovoltaic panel arrays, string telemetry, energy yield metrics, and power grid dispatch.";

  const PROMPT_MARITIME =
    "Build a mission-critical maritime logistics hub managing vessel berthing schedules, port terminal berths, container cargo manifests, anchorage telemetry, and stevedore dispatches.";

  const PROMPT_CLINICAL =
    "Build a clinical laboratory diagnostic portal tracking biospecimen sample custody, surgical pathology panels, centrifuges, and urgent patient blood chemistry reports.";

  const PROMPT_SYNTH =
    "Build an artisanal analog synthesizer monograph cataloging discrete modular oscillators, wooden enclosure finishes, and harmonic filter auditions.";

  const PROMPT_FESTIVAL =
    "Build a live music festival stage operations console monitoring main stage decibel levels, artist rider checklists, performance countdowns, and arena crowd density.";

  it("1. Generates genuinely distinct visual identities across distinct domain prompts", () => {
    const vadSolar = deriveArtDirection(PROMPT_SOLAR);
    const vadMaritime = deriveArtDirection(PROMPT_MARITIME);
    const vadClinical = deriveArtDirection(PROMPT_CLINICAL);
    const vadSynth = deriveArtDirection(PROMPT_SYNTH);
    const vadFestival = deriveArtDirection(PROMPT_FESTIVAL);

    // Verify distinct archetypes
    const archetypes = new Set([
      vadSolar.archetype,
      vadMaritime.archetype,
      vadClinical.archetype,
      vadSynth.archetype,
      vadFestival.archetype,
    ]);
    expect(archetypes.size).toBeGreaterThanOrEqual(3);

    // Verify Maritime is NOT identical to Solar
    expect(vadMaritime.colorSystem.background).not.toBe(vadSolar.colorSystem.background);
    expect(vadMaritime.colorSystem.primaryHex).not.toBe(vadSolar.colorSystem.primaryHex);

    // Verify Clinical is light or distinct from dark industrial
    expect(vadClinical.colorSystem.mode).toBe("light");
    expect(vadClinical.colorSystem.background).not.toBe(vadMaritime.colorSystem.background);

    // Verify Synth is warm dark or editorial
    expect(vadSynth.colorSystem.mode).toMatch(/warm_dark|dark|deep_obsidian/);
  });

  it("2. Ensures 100% deterministic reproducibility for the same prompt", () => {
    const run1 = deriveArtDirection(PROMPT_MARITIME);
    const run2 = deriveArtDirection(PROMPT_MARITIME);
    const run3 = deriveArtDirection(PROMPT_MARITIME);

    expect(run1).toEqual(run2);
    expect(run2).toEqual(run3);
    expect(run1.colorSystem.primaryHex).toBe(run2.colorSystem.primaryHex);
    expect(run1.geometry.radiusMd).toBe(run2.geometry.radiusMd);
    expect(run1.typography.fontDisplay).toBe(run2.typography.fontDisplay);
  });

  it("3. Guarantees WCAG 2.1 AA mathematical contrast compliance across all archetypes", () => {
    const testPrompts = [
      PROMPT_SOLAR,
      PROMPT_MARITIME,
      PROMPT_CLINICAL,
      PROMPT_SYNTH,
      PROMPT_FESTIVAL,
      "An avant-garde architectural monograph showcasing minimalist brutalist concrete pavilions",
      "A high-frequency algorithmic quantitative trading desk with nanosecond execution feeds",
      "An artisanal ceramic studio and wheel-throwing glaze catalogue in Kyoto",
      "A public transit train dispatch network tracking locomotive signals and track switches",
    ];

    for (const prompt of testPrompts) {
      const vad = deriveArtDirection(prompt);
      const ratio = getContrastRatio(vad.colorSystem.textPrimary, vad.colorSystem.background);
      expect(
        ratio,
        `Contrast ratio for "${vad.name}" (${vad.colorSystem.textPrimary} on ${vad.colorSystem.background}) must satisfy WCAG AA >= 4.5:1`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("4. Eliminates default Slate-900 / dark blue bias for non-blue domains", () => {
    // SolarTelemetry should NOT have Slate-950 (#020617) as its background
    const vadSolar = deriveArtDirection(PROMPT_SOLAR);
    expect(vadSolar.colorSystem.background).not.toBe("#020617");
    expect(vadSolar.colorSystem.surface).not.toBe("rgba(15, 23, 42, 0.85)");

    // Clinical should NOT have dark navy background
    const vadClinical = deriveArtDirection(PROMPT_CLINICAL);
    expect(vadClinical.colorSystem.mode).toBe("light");
    expect(vadClinical.colorSystem.background).toMatch(/#f8fafc|#f1f5f9/);

    // Synth should NOT have dark navy background
    const vadSynth = deriveArtDirection(PROMPT_SYNTH);
    expect(vadSynth.colorSystem.background).not.toBe("#020617");
    expect(vadSynth.colorSystem.background).toMatch(/#141210|#0e0c0b|#0c0c0e/);
  });

  it("5. End-to-end integration: DomainVisualContractGenerator emits coherent, diverse CSS tokens", () => {
    const contractSolar = DomainVisualContractGenerator.deriveContract(PROMPT_SOLAR);
    const contractMaritime = DomainVisualContractGenerator.deriveContract(PROMPT_MARITIME);

    expect(contractSolar.artDirection).toBeDefined();
    expect(contractMaritime.artDirection).toBeDefined();

    const tokensSolar = DomainVisualContractGenerator.resolveCssTokens(contractSolar);
    const tokensMaritime = DomainVisualContractGenerator.resolveCssTokens(contractMaritime);

    // Backgrounds must be distinct
    expect(tokensSolar.backgroundColor).not.toBe(tokensMaritime.backgroundColor);

    // Primary colors must be distinct
    expect(tokensSolar.primaryColor).not.toBe(tokensMaritime.primaryColor);

    // Contrast on resolved tokens must pass WCAG AA
    const solarContrast = DomainVisualContractGenerator.getContrastRatio(
      tokensSolar.textPrimaryColor,
      tokensSolar.backgroundColor
    );
    const maritimeContrast = DomainVisualContractGenerator.getContrastRatio(
      tokensMaritime.textPrimaryColor,
      tokensMaritime.backgroundColor
    );

    expect(solarContrast).toBeGreaterThanOrEqual(4.5);
    expect(maritimeContrast).toBeGreaterThanOrEqual(4.5);
  });
});

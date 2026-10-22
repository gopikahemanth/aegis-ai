import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TemplateContaminationChecker } from "../template-contamination-checker.js";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Real Template-Contamination Checker (Phase 1 Step 2)", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `aegis-test-contamination-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(tempDir, "src", "features"), { recursive: true });
    mkdirSync(join(tempDir, "src", "content"), { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  it("loads the generated template blocklist successfully", () => {
    const blocklist = TemplateContaminationChecker.loadBlocklist();
    expect(Array.isArray(blocklist)).toBe(true);
    expect(blocklist.length).toBeGreaterThan(100);
    expect(blocklist).toContain("Day 21");
    expect(blocklist).toContain("Practical Execution");
    expect(blocklist).toContain("Telemetry & Operations Console");
  });

  it("flags hard-coded template phrases with TEMPLATE_PHRASE_LEAK and generates repair prompt", () => {
    // Write component containing hard-flagged phrases not in prompt or domain vocab
    const contaminatedComponent = `
      import React from "react";
      export function HabitatDeck() {
        return (
          <div>
            <h1>Thalassa Habitat</h1>
            <h2>Telemetry & Operations Console</h2>
            <span>Avionics Flight Deck</span>
            <p>Day 21 of underwater inspection.</p>
            <div>Grid Stability Index: 98%</div>
            <div>Practical Execution phase active.</div>
            <div>Renewable power source connected.</div>
          </div>
        );
      }
    `;
    writeFileSync(join(tempDir, "src", "features", "HabitatDeck.tsx"), contaminatedComponent);

    const contract = {
      prompt: "Create an underwater marine research habitat called Thalassa Habitat.",
      featureDescriptions: ["Deep ocean habitat exploration", "Environmental monitoring"],
      domainVocabulary: {
        terms: ["benthic", "hydrophone", "habitat module", "ballast"],
      },
    };

    const checker = new TemplateContaminationChecker(tempDir);
    const report = checker.audit("marine-research", contract);

    expect(report.clean).toBe(false);
    expect(report.status).toBe("FAIL");

    const leaks = report.violations.filter(v => v.issueType === "TEMPLATE_PHRASE_LEAK");
    expect(leaks.length).toBeGreaterThanOrEqual(6);

    const tokens = leaks.map(l => l.token);
    expect(tokens).toContain("Day 21");
    expect(tokens).toContain("Practical Execution");
    expect(tokens).toContain("Grid Stability Index");
    expect(tokens).toContain("Renewable");
    expect(tokens).toContain("Avionics Flight Deck");
    expect(tokens).toContain("Telemetry & Operations Console");

    expect(report.leakedPhrases).toBeDefined();
    expect(report.leakedPhrases).toContain("Day 21");
    expect(report.repairPrompt).toBeDefined();
    expect(report.repairPrompt).toContain("rewrite using domain vocabulary");
  });

  it("allows phrases if they are provenanced by prompt, featureDescriptions, domainVocabulary, or site-content", () => {
    // Write component using Renewable and Practical Execution, but they are provenanced
    const validComponent = `
      import React from "react";
      export function RenewableGrid() {
        return (
          <div>
            <h1>Renewable Clean Energy Microgrid</h1>
            <p>Practical execution plan for solar and wind arrays.</p>
          </div>
        );
      }
    `;
    writeFileSync(join(tempDir, "src", "features", "RenewableGrid.tsx"), validComponent);

    const contract = {
      prompt: "Build a renewable clean energy dashboard with practical execution guidelines.",
      featureDescriptions: ["Renewable asset tracking", "Practical execution workflow"],
      domainVocabulary: {
        terms: ["renewable energy", "inverter", "wind turbine"],
      },
    };

    const checker = new TemplateContaminationChecker(tempDir);
    const report = checker.audit("clean-energy", contract);

    const phraseLeaks = report.violations.filter(v => v.issueType === "TEMPLATE_PHRASE_LEAK");
    expect(phraseLeaks.length).toBe(0);
    expect(report.clean).toBe(true);
  });

  it("allows non-hardcoded blocklist phrases if provenanced by site-content.ts", () => {
    // Write site-content.ts containing a descriptive phrase
    const siteContent = `
      export const siteContent = {
        hero: {
          title: "Curated Contemporary Artwork Folios",
        }
      };
    `;
    writeFileSync(join(tempDir, "src", "content", "site-content.ts"), siteContent);

    // Write component rendering the phrase from site-content
    const component = `
      import React from "react";
      import { siteContent } from "../content/site-content";
      export function Hero() {
        return <h1>Curated Contemporary Artwork Folios</h1>;
      }
    `;
    writeFileSync(join(tempDir, "src", "features", "Hero.tsx"), component);

    const contract = {
      prompt: "Create an art museum website with gallery exhibitions and artwork collections.",
      featureDescriptions: ["Artwork folios"],
      domainVocabulary: {
        terms: ["artwork", "curator", "gallery"],
      },
    };

    const checker = new TemplateContaminationChecker(tempDir);
    const report = checker.audit("art-museum", contract);

    const phraseLeaks = report.violations.filter(
      v => v.issueType === "TEMPLATE_PHRASE_LEAK" && v.token === "Curated Contemporary Artwork Folios"
    );
    expect(phraseLeaks.length).toBe(0);
  });
});

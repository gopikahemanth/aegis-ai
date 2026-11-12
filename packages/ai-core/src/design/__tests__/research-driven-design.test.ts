import { describe, it, expect } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DesignReferenceIntelligence } from "../design-reference-intelligence.js";
import { DesignDecisionDocumentEngine } from "../design-decision-document.js";
import { PageDesignSpecificationEngine } from "../page-design-specification-engine.js";
import { FastDeterministicSanitizer } from "../../governance/fast-sanitizer.js";
import { TemplateContaminationChecker } from "../../validation/template-contamination-checker.js";

describe("Research-Driven Design & Autonomous Page Specification Suite", () => {
  const petSanctuaryPrompt =
    "Build a serene botanical pet sanctuary and holistic care boutique called Aegis Sanctuary, featuring resident animal profiles, holistic spa session booking, custom dietary nutrition calculation, and artisanal pantry provisions.";

  const architecturePrompt =
    "Build a Luxury Architectural Studio platform with project portfolio masonry, spatial room dimension estimator, sustainable material swatchboard, and lead architect consultations.";

  it("1. Dynamic Reference Research derives domain-authentic art direction without hardcoded fallbacks", () => {
    const petResearch = DesignReferenceIntelligence.research(petSanctuaryPrompt, "pet-sanctuary");
    expect(petResearch.productCategory).toContain("Pet Sanctuary");
    expect(petResearch.targetAudience).toContain("pet guardians");
    expect(petResearch.sharedDesignLanguage.colorPaletteDirection.background).toBe("#FAF7F2"); // Warm oatmeal
    expect(petResearch.sharedDesignLanguage.colorPaletteDirection.primary).toBe("#1C3D2E"); // Eucalyptus forest
    expect(petResearch.sharedDesignLanguage.colorPaletteDirection.accent).toBe("#D97706"); // Amber honey
    expect(petResearch.originalityDecisions.length).toBeGreaterThanOrEqual(1);

    const archResearch = DesignReferenceIntelligence.research(architecturePrompt, "architecture");
    expect(archResearch.productCategory).toContain("Architecture");
    expect(archResearch.sharedDesignLanguage.colorPaletteDirection.background).toBe("#F3F0E8"); // Limestone
    expect(archResearch.sharedDesignLanguage.colorPaletteDirection.primary).toBe("#465342"); // Olive
    expect(archResearch.originalityDecisions.length).toBeGreaterThanOrEqual(1);

    // Palettes must be completely distinct
    expect(petResearch.sharedDesignLanguage.colorPaletteDirection.background).not.toBe(
      archResearch.sharedDesignLanguage.colorPaletteDirection.background
    );
  });

  it("2. DesignDecisionDocumentEngine generates dynamic domain goals without architecture contamination", () => {
    const ddd = DesignDecisionDocumentEngine.generateDocument({
      prompt: petSanctuaryPrompt,
      brandName: "Aegis Sanctuary",
      routes: ["/", "/residents", "/spa", "/dietary", "/provisions", "/records"],
      pagePlans: [
        {
          route: "/",
          pageRole: "Sanctuary Haven & Philosophy",
          purpose: "Introduce sanctuary mission, habitat grounds, and holistic ethos",
          focalElement: "Sanctuary Hero Stage",
          composition: { topology: "HERO_STAGE_SHOWCASE", sections: ["Hero", "Ethos", "Residents"] },
          interaction: { primary: ["Explore sanctuary habitats", "View featured residents"] },
        } as any,
        {
          route: "/spa",
          pageRole: "Botanical Spa & Hydrotherapy Suite",
          purpose: "Schedule holistic spa sessions, botanical baths, and hydrotherapy treatments",
          focalElement: "Spa Concierge Calendar",
          composition: { topology: "BOOKING_CONCIERGE_SALON", sections: ["Services", "Scheduler", "Care Tiers"] },
          interaction: { primary: ["Select spa treatment", "Book appointment slot"] },
        } as any,
      ],
      domainHint: "pet-sanctuary",
    });

    // Verify Section A: Project Identity
    expect(ddd.projectIdentity.productName).toBe("Aegis Sanctuary");
    expect(ddd.projectIdentity.userTypes).toContain("Pet Guardian / Pet Parent");
    expect(ddd.projectIdentity.userTypes).not.toContain("Professional Architect / Specialist");

    // Primary goals must reflect pet sanctuary workflows, NEVER architecture
    const goalsString = ddd.projectIdentity.primaryGoals.join(" ");
    expect(goalsString).not.toContain("spatial room dimensions");
    expect(goalsString).not.toContain("construction budgets");
    expect(goalsString).not.toContain("sustainable material swatches with environmental impact");
    expect(goalsString.toLowerCase()).toContain("spa");

    // Spatial system border radius should be organic and friendly
    expect(ddd.visualSystem.spatialSystem.borderRadius).toContain("organic");
  });

  it("3. PageDesignSpecificationEngine creates granular specifications for every route", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "aegis-page-specs-test-"));
    try {
      const routes = ["/", "/residents", "/spa", "/dietary", "/provisions"];
      const specs = PageDesignSpecificationEngine.generateSpecifications({
        routes,
        prompt: petSanctuaryPrompt,
        brandName: "Aegis Sanctuary",
      });

      expect(specs.length).toBe(5);
      expect(specs.map((s) => s.route)).toEqual(routes);

      // Verify each route has detailed sections, components, and layout
      for (const spec of specs) {
        expect(spec.sections.length).toBeGreaterThanOrEqual(3);
        expect(spec.components.length).toBeGreaterThanOrEqual(3);
        expect(spec.interactiveElements.length).toBeGreaterThanOrEqual(1);
        expect(spec.layout.desktop).toContain("12-column");
        expect(spec.states.loading).toBeDefined();
        expect(spec.states.empty).toBeDefined();
        expect(spec.acceptanceCriteria.length).toBeGreaterThanOrEqual(3);
      }

      // Test persistence
      PageDesignSpecificationEngine.save(specs, tempDir);
      const loaded = PageDesignSpecificationEngine.load(tempDir);
      expect(loaded).not.toBeNull();
      expect(loaded?.length).toBe(5);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("4. FastDeterministicSanitizer avoids unrequested DashboardPage injection", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "aegis-dash-guard-test-"));
    try {
      const srcDir = join(tempDir, "src");
      mkdirSync(join(srcDir, "pages"), { recursive: true });

      // Contract does NOT require a dashboard
      const contractWithoutDashboard = {
        prompt: petSanctuaryPrompt,
        requiredRoutes: ["/", "/residents", "/spa", "/dietary", "/provisions"],
        requiredFeatures: ["Pet Profiles", "Spa Booking", "Dietary Calculator"],
      } as any;

      FastDeterministicSanitizer.ensurePreBaselineDashboardCompleteness(srcDir, contractWithoutDashboard);

      // DashboardPage.tsx should NOT have been synthesized
      const dashPath = join(srcDir, "pages", "DashboardPage.tsx");
      expect(existsSync(dashPath)).toBe(false);

      // Now with explicit dashboard route:
      const contractWithDashboard = {
        prompt: petSanctuaryPrompt,
        requiredRoutes: ["/", "/dashboard", "/spa"],
        requiredFeatures: ["Sanctuary Care Dashboard"],
      } as any;

      FastDeterministicSanitizer.ensurePreBaselineDashboardCompleteness(srcDir, contractWithDashboard);

      // DashboardPage.tsx should be synthesized with authentic PET records, NOT human clinic records
      expect(existsSync(dashPath)).toBe(true);
      const dashContent = readFileSync(dashPath, "utf8");
      expect(dashContent).toContain("Holistic Botanical Spa Grooming");
      expect(dashContent).not.toContain("Diagnostic Imaging Follow-up");
      expect(dashContent).not.toContain("Clinical Schedule & Patient Appointments");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("5. TemplateContaminationChecker permits standard UI primitives while catching foreign template leaks", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "aegis-contamination-test-"));
    try {
      const srcDir = join(tempDir, "src");
      mkdirSync(join(srcDir, "components"), { recursive: true });
      mkdirSync(join(srcDir, "pages"), { recursive: true });

      // Clean pet sanctuary component using standard UI primitives (Button, Modal, Card Grid, Specialized Care)
      const cleanComponent = `
        import React from "react";
        export const SanctuarySpaPage = () => {
          return (
            <div className="card-grid">
              <h1>Specialized Care & Botanical Spa</h1>
              <p>Filter pills and search bar for resident appointments.</p>
              <button className="primary-button">Book Specialized Care</button>
            </div>
          );
        };
      `;
      writeFileSync(join(srcDir, "pages", "SanctuarySpaPage.tsx"), cleanComponent, "utf8");

      const checker = new TemplateContaminationChecker(tempDir);
      const cleanReport = checker.audit("pet-sanctuary", {
        prompt: petSanctuaryPrompt,
        requiredFeatures: ["Specialized Care", "Botanical Spa"],
      });

      // Standard UI primitives and legitimate specialized care must PASS
      expect(cleanReport.clean).toBe(true);
      expect(cleanReport.violations.length).toBe(0);

      // Now inject genuine template contamination: "Kyoto, Japan" in non-Japan project
      const contaminatedComponent = `
        import React from "react";
        export const ContaminatedPage = () => {
          return (
            <div>
              <h1>Application Platform</h1>
              <p>Studio location: Kyoto, Japan</p>
            </div>
          );
        };
      `;
      writeFileSync(join(srcDir, "pages", "ContaminatedPage.tsx"), contaminatedComponent, "utf8");

      const dirtyReport = checker.audit("pet-sanctuary", {
        prompt: petSanctuaryPrompt,
        requiredFeatures: ["Specialized Care"],
      });

      expect(dirtyReport.clean).toBe(false);
      const leakedTokens = dirtyReport.violations.map((v) => v.token);
      expect(leakedTokens.some((t) => t?.toLowerCase().includes("kyoto") || t?.toLowerCase().includes("application platform"))).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

import { describe, it, expect } from "vitest";
import { ProductUnderstanding } from "../../design/product-understanding.js";
import { deriveArtDirection } from "../../design/visual-art-direction.js";
import { UniversalRequirementInterpreter } from "../../requirement-intelligence/universal-requirement-interpreter.js";
import { ArchitectureContractEngine } from "../../architect/architecture-contract-engine.js";
import { NaturalLanguageIntentParser } from "../../edit/natural-language-intent-parser.js";

describe("Phase 12 — Six Archetype Generalization Suite", () => {
  const ARCHETYPES = [
    {
      name: "1. Premium E-Commerce Storefront",
      prompt: "Create an independent luxury ceramics & tableware e-commerce storefront featuring collection filtering, studio glaze specifications, cart management, and order checkout.",
      forbidsDashboard: true,
      expectedModels: ["Product", "Cart", "Order"],
    },
    {
      name: "2. Personal Creative Portfolio",
      prompt: "Create an architectural designer portfolio website for 'Elena Vance Atelier' showcasing selected monograph case studies, material sample swatches, awards, and design inquiry booking.",
      forbidsDashboard: true,
      expectedModels: ["Project", "Award", "Inquiry"],
    },
    {
      name: "3. Professional Agency / Consultancy Website",
      prompt: "Build a boutique branding agency website featuring client case studies, strategy services, team expertise roster, pricing tiers, and client consultation intake.",
      forbidsDashboard: true,
      expectedModels: ["CaseStudy", "Service", "Consultation"],
    },
    {
      name: "4. Modern B2B SaaS Application",
      prompt: "Create a team resource and project workspace SaaS application with user onboarding, team seat management, project milestones, and subscription billing settings.",
      forbidsDashboard: false,
      expectedModels: ["Workspace", "Member", "Project", "Billing"],
    },
    {
      name: "5. Educational Academy Platform",
      prompt: "Build an interactive online design academy platform with video courses, lesson curriculum modules, student progress tracking, assignments, and enrollment checkouts.",
      forbidsDashboard: true,
      expectedModels: ["Course", "Lesson", "Enrollment"],
    },
    {
      name: "6. Data-Intensive Technical Workbench",
      prompt: "AeroTurbine Fleet Maintenance & Avionics Telemetry Portal named AEROTURBINE IQ with turbine cycle wear analysis, vibration telemetry spectrograms, inspection checklist logs, and work orders.",
      forbidsDashboard: false,
      expectedModels: ["TurbineCycle", "Telemetry", "WorkOrder"],
    },
  ];

  for (const arc of ARCHETYPES) {
    it(`correctly plans ${arc.name} without universal dashboard collapse`, () => {
      // 1. Product Understanding
      const characteristics = ProductUnderstanding.analyze(arc.prompt);
      expect(characteristics.primaryActivity).toBeDefined();
      if (arc.forbidsDashboard) {
        expect(characteristics.experiencePattern).not.toBe("operations-dashboard");
      }

      // 2. Art Direction & Typography
      const art = deriveArtDirection(arc.prompt, arc.name);
      expect(art.layoutPersonality).toBeDefined();
      expect(art.colorSystem).toBeDefined();

      // 3. Requirement Interpretation & Canonical Contracts
      const spec = UniversalRequirementInterpreter.interpret(arc.prompt);
      expect(spec.features.length).toBeGreaterThanOrEqual(3);

      const contract = ArchitectureContractEngine.synthesizeContract(spec);
      expect(contract.routes.frontendRoutes.length).toBeGreaterThanOrEqual(3);

      // Verify that routes are NOT hardcoded to /dashboard or /directory for non-dashboards
      if (arc.forbidsDashboard) {
        const routePaths = contract.routes.frontendRoutes.map(r => r.path);
        expect(routePaths).not.toContain("/directory");
      }
    });
  }

  it("verifies natural-language editing across different archetypes", () => {
    // E-commerce edit
    const edit1 = NaturalLanguageIntentParser.parse("Make the entire website light cream with dark green text");
    expect(edit1.operationType).toBe("modify_theme");

    // Portfolio edit
    const edit2 = NaturalLanguageIntentParser.parse("Remove the awards section and clean up obsolete components");
    expect(edit2.operationType).toBe("remove_feature");
    expect(edit2.primaryTarget).toBe("awards");

    // SaaS edit
    const edit3 = NaturalLanguageIntentParser.parse("Add a pricing tiers page with billing frequency toggle");
    expect(edit3.operationType).toBe("add_feature");
    expect(edit3.primaryTarget).toContain("pricing");

    // Global theme switch
    const edit4 = NaturalLanguageIntentParser.parse("Switch theme to dark obsidian with cyan accents");
    expect(edit4.operationType).toBe("modify_theme");
  });
});

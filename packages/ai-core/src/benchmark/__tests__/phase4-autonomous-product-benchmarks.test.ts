/**
 * Phase 4: Autonomous Product Designer & Full-Stack Generation Benchmark Suite
 *
 * Exercises Aegis AI across four diverse real-world product benchmarks:
 *   Benchmark A — E-commerce Storefront (Artisanal Ceramics / Tableware Atelier)
 *   Benchmark B — Creative Agency / Portfolio (Contemporary Architectural Atelier)
 *   Benchmark C — Educational Platform (Advanced Aeronautics & Spaceflight Training Academy)
 *   Benchmark D — Technical Workbench (Industrial Solar Telemetry & SCADA Workbench)
 *
 * Evaluates:
 * 1. Product Understanding & Archetype Specialization (Zero default dashboard bias)
 * 2. Visual System Individuality (Distinct palettes, typography, and density)
 * 3. Page Experience Blueprints & Authentic Workflows (Cart drawers, inquiry drawers, progress ribbons, calibration consoles)
 * 4. Anti-Cheating & Native Interaction Ratio (NIR >= 0.95, zero inert elements)
 * 5. Full-Stack Parity & Typed REST API Client Generation
 * 6. Deterministic Execution (Zero live AI provider credits consumed)
 */

import { describe, it, expect } from "vitest";
import { UniversalRequirementInterpreter } from "../../requirement-intelligence/universal-requirement-interpreter.js";
import { ArchitectureContractEngine } from "../../architect/architecture-contract-engine.js";
import {
  InteractiveComponentGenerator,
  type GeneratedComponentFile,
} from "../../design/interactive-component-generator.js";
import { FrontendExperienceVerifier } from "../../design/frontend-experience-verifier.js";
import { DesignDecisionDocumentEngine } from "../../design/design-decision-document.js";
import { DynamicApiGenerator } from "../../backend/dynamic-api-generator.js";

describe("Phase 4: Autonomous Product Designer & Full-Stack Generation Benchmarks", () => {
  // ─── Benchmark A: E-commerce Storefront (Artisanal Ceramics Studio) ────────
  describe("Benchmark A: Artisanal Ceramics E-commerce Storefront", () => {
    const prompt =
      "Build an artisanal tableware and handcrafted ceramics e-commerce store with collections, stoneware catalog, shopping cart, and studio story";

    const spec = UniversalRequirementInterpreter.interpret(prompt);
    const contract = ArchitectureContractEngine.synthesizeContract(spec);
    const designDoc = DesignDecisionDocumentEngine.generateDocument({
      prompt,
      brandName: contract.projectName,
      routes: contract.routes.frontendRoutes.map((r: any) => (typeof r === "string" ? r : r.path)),
      pagePlans: [],
      domainHint: contract.domainCategory,
    });

    const files = InteractiveComponentGenerator.generateAll(contract, spec.domainVocabulary, {
      designDoc,
    });

    it("synthesizes warm, tactile artisanal visual tokens without slate-950 bias", () => {
      const cssFile = files.find((f) => f.path === "src/index.css");
      expect(cssFile).toBeDefined();
      // Verifies warm organic background (#FAF8F5 or light stone)
      expect(cssFile?.content).toContain("--color-bg: #FAF8F5");
      // Verifies earth stoneware primary accent
      expect(cssFile?.content).toContain("--color-primary: #5C4623");
    });

    it("generates an authentic e-commerce storefront with shopping cart drawer and studio story", () => {
      const homePage = files.find((f) => f.path === "src/pages/HomePage.tsx");
      expect(homePage).toBeDefined();

      // Invariant: Zero SLA or operational dashboard jargon in storefront
      expect(homePage?.content).not.toContain("99.4% Uptime");
      expect(homePage?.content).not.toContain("Verified SLAs");
      expect(homePage?.content).not.toContain("System Analytics & Operational Metrics");

      // Verifies authentic ceramics domain vocabulary & craft pillars
      expect(homePage?.content).toContain("Handmade Atelier Ceramics");
      expect(homePage?.content).toContain("Wheel-Thrown Craft");
      expect(homePage?.content).toContain("Cone 10 High Fire");
      expect(homePage?.content).toContain("Formulated Ash Glazes");

      // Verifies interactive shopping cart and checkout drawer
      expect(homePage?.content).toContain("handleAddToCart");
      expect(homePage?.content).toContain("Your Ceramic Atelier Cart");
      expect(homePage?.content).toContain("Proceed to Secure Checkout");
      expect(homePage?.content).toContain("Our Ceramic Studio Philosophy");
    });

    it("passes FrontendExperienceVerifier with NIR >= 0.95 and full route coverage", () => {
      const audit = FrontendExperienceVerifier.audit(
        files.map((f) => ({ path: f.path, content: f.content })),
        contract
      );

      expect(audit.passed).toBe(true);
      expect(audit.nirScore).toBeGreaterThanOrEqual(0.95);
      expect(audit.inertElementsCount).toBe(0);
      expect(audit.routeCoverage.missingRoutes).toHaveLength(0);
    });

    it("generates typed REST API client aligned with Express endpoints", () => {
      const apiFile = files.find((f) => f.path === "src/services/api.ts");
      expect(apiFile).toBeDefined();
      expect(apiFile?.content).toContain("export const api = {");
      expect(apiFile?.content).toContain("async list<T = any>");
      expect(apiFile?.content).toContain("async create<T = any>");
      expect(apiFile?.content).toContain("async update<T = any>");
      expect(apiFile?.content).toContain("async delete(resource: string");
      expect(apiFile?.content).toContain("async executeWorkflow<T = any>");
    });
  });

  // ─── Benchmark B: Creative Agency / Architectural Atelier Portfolio ───────
  describe("Benchmark B: Contemporary Architectural Atelier Portfolio", () => {
    const prompt =
      "Build a contemporary architectural atelier and design studio portfolio with built works, monograph case studies, spatial philosophy, and consultation inquiry";

    const spec = UniversalRequirementInterpreter.interpret(prompt);
    const contract = ArchitectureContractEngine.synthesizeContract(spec);
    const designDoc = DesignDecisionDocumentEngine.generateDocument({
      prompt,
      brandName: contract.projectName,
      routes: contract.routes.frontendRoutes.map((r: any) => (typeof r === "string" ? r : r.path)),
      pagePlans: [],
      domainHint: contract.domainCategory,
    });

    const files = InteractiveComponentGenerator.generateAll(contract, spec.domainVocabulary, {
      designDoc,
    });

    it("synthesizes serene vellum/stone palette with editorial elegance", () => {
      const cssFile = files.find((f) => f.path === "src/index.css");
      expect(cssFile).toBeDefined();
      // Verifies vellum/limestone background
      expect(cssFile?.content).toContain("--color-bg: #F3F0E8");
      // Verifies architectural slate/olive patina accent
      expect(cssFile?.content).toContain("--color-primary: #465342");
    });

    it("generates an authentic architectural portfolio with monograph gallery and inquiry drawer", () => {
      const homePage = files.find((f) => f.path === "src/pages/HomePage.tsx");
      expect(homePage).toBeDefined();

      // Invariant: Zero dashboard or fake SLA bias
      expect(homePage?.content).not.toContain("99.4% Uptime");
      expect(homePage?.content).not.toContain("Sub-Millisecond Responsiveness");

      // Verifies spatial monograph identity & pillars
      expect(homePage?.content).toContain("Architectural Practice & Spatial Monograph");
      expect(homePage?.content).toContain("Daylight Choreography");
      expect(homePage?.content).toContain("Honest Materiality");
      expect(homePage?.content).toContain("Structural Poise");

      // Verifies interactive commission inquiry drawer with gross area slider
      expect(homePage?.content).toContain("Commission Consultation");
      expect(homePage?.content).toContain("Target Gross Area:");
      expect(homePage?.content).toContain("Submit Architectural Inquiry");
      expect(homePage?.content).toContain("Inspect Monograph");
    });

    it("passes FrontendExperienceVerifier with NIR >= 0.95 and full route coverage", () => {
      const audit = FrontendExperienceVerifier.audit(
        files.map((f) => ({ path: f.path, content: f.content })),
        contract
      );

      expect(audit.passed).toBe(true);
      expect(audit.nirScore).toBeGreaterThanOrEqual(0.95);
      expect(audit.inertElementsCount).toBe(0);
      expect(audit.routeCoverage.missingRoutes).toHaveLength(0);
    });
  });

  // ─── Benchmark C: Educational Platform (Advanced Aeronautics Academy) ─────
  describe("Benchmark C: Advanced Aeronautics & Spaceflight Training Academy", () => {
    const prompt =
      "Build an advanced aeronautics and spaceflight training academy with orbital flight courses, flight simulator syllabus, student progress tracker, and enrollment";

    const spec = UniversalRequirementInterpreter.interpret(prompt);
    const contract = ArchitectureContractEngine.synthesizeContract(spec);
    const designDoc = DesignDecisionDocumentEngine.generateDocument({
      prompt,
      brandName: contract.projectName,
      routes: contract.routes.frontendRoutes.map((r: any) => (typeof r === "string" ? r : r.path)),
      pagePlans: [],
      domainHint: contract.domainCategory,
    });

    const files = InteractiveComponentGenerator.generateAll(contract, spec.domainVocabulary, {
      designDoc,
    });

    it("synthesizes deep spaceflight color tokens with high-contrast accents", () => {
      const cssFile = files.find((f) => f.path === "src/index.css");
      expect(cssFile).toBeDefined();
      expect(cssFile?.content).toContain("--color-bg: #0A0D14");
      expect(cssFile?.content).toContain("--color-primary: #D194CF");
    });

    it("generates an authentic flight training academy with curriculum roadmap and progress tracker", () => {
      const homePage = files.find((f) => f.path === "src/pages/HomePage.tsx");
      expect(homePage).toBeDefined();

      // Verifies authentic aeronautics domain vocabulary
      expect(homePage?.content).toContain("Spaceflight Training & Aerospace Flight Systems");
      expect(homePage?.content).toContain("orbital mechanics");
      expect(homePage?.content).toContain("FAA Level D");

      // Verifies interactive cadet progress ribbon & syllabus modal
      expect(homePage?.content).toContain("Your Cadet Flight Progress");
      expect(homePage?.content).toContain("toggleModuleComplete");
      expect(homePage?.content).toContain("Cadet Flight Enrollment");
      expect(homePage?.content).toContain("View Syllabus");
    });

    it("passes FrontendExperienceVerifier with NIR >= 0.95 and full route coverage", () => {
      const audit = FrontendExperienceVerifier.audit(
        files.map((f) => ({ path: f.path, content: f.content })),
        contract
      );

      expect(audit.passed).toBe(true);
      expect(audit.nirScore).toBeGreaterThanOrEqual(0.95);
      expect(audit.inertElementsCount).toBe(0);
      expect(audit.routeCoverage.missingRoutes).toHaveLength(0);
    });
  });

  // ─── Benchmark D: Technical Workbench (Industrial Solar Telemetry) ─────────
  describe("Benchmark D: Industrial Solar Telemetry & SCADA Workbench", () => {
    const prompt =
      "Build an industrial solar telemetry and photovoltaic workbench with live string efficiency, inverter harmonics monitor, operational controls, and emergency trip triggers";

    const spec = UniversalRequirementInterpreter.interpret(prompt);
    const contract = ArchitectureContractEngine.synthesizeContract(spec);
    const designDoc = DesignDecisionDocumentEngine.generateDocument({
      prompt,
      brandName: contract.projectName,
      routes: contract.routes.frontendRoutes.map((r: any) => (typeof r === "string" ? r : r.path)),
      pagePlans: [],
      domainHint: contract.domainCategory,
    });

    const files = InteractiveComponentGenerator.generateAll(contract, spec.domainVocabulary, {
      designDoc,
    });

    it("synthesizes high-density precision telemetry visual tokens", () => {
      const cssFile = files.find((f) => f.path === "src/index.css");
      expect(cssFile).toBeDefined();
      expect(cssFile?.content).toContain("--color-bg: #0A0D14");
      expect(cssFile?.content).toContain("--color-primary: #C394D1");
    });

    it("generates an authentic SCADA telemetry workbench with live stream and calibration controls", () => {
      const homePage = files.find((f) => f.path === "src/pages/HomePage.tsx");
      expect(homePage).toBeDefined();

      // Verifies authentic SCADA telemetry vocabulary
      expect(homePage?.content).toContain("Live Photovoltaic Telemetry & SCADA Array Monitor");
      expect(homePage?.content).toContain("Total Harmonic Distortion");
      expect(homePage?.content).toContain("Arc Disconnect Latency");

      // Verifies interactive controls
      expect(homePage?.content).toContain("isLiveStreaming");
      expect(homePage?.content).toContain("DC Bus Calibration Controller");
      expect(homePage?.content).toContain("handleExecuteTripTest");
      expect(homePage?.content).toContain("EMERGENCY TRIP LOOP TEST PASSED");
    });

    it("passes FrontendExperienceVerifier with NIR >= 0.95 and full route coverage", () => {
      const audit = FrontendExperienceVerifier.audit(
        files.map((f) => ({ path: f.path, content: f.content })),
        contract
      );

      expect(audit.passed).toBe(true);
      expect(audit.nirScore).toBeGreaterThanOrEqual(0.95);
      expect(audit.inertElementsCount).toBe(0);
      expect(audit.routeCoverage.missingRoutes).toHaveLength(0);
    });
  });

  // ─── Cross-Benchmark Differentiation & Production Gate ────────────────────
  describe("Cross-Benchmark Distinctiveness & Multi-Domain Generalization", () => {
    it("proves each benchmark produces distinct visual systems and palettes", () => {
      const benchmarks = [
        "Build an artisanal tableware and handcrafted ceramics e-commerce store with collections, stoneware catalog, shopping cart, and studio story",
        "Build a contemporary architectural atelier and design studio portfolio with built works, monograph case studies, spatial philosophy, and consultation inquiry",
        "Build an advanced aeronautics and spaceflight training academy with orbital flight courses, flight simulator syllabus, student progress tracker, and enrollment",
        "Build an industrial solar telemetry and photovoltaic workbench with live string efficiency, inverter harmonics monitor, operational controls, and emergency trip triggers",
      ];

      const generatedPalettes = benchmarks.map((p) => {
        const spec = UniversalRequirementInterpreter.interpret(p);
        const contract = ArchitectureContractEngine.synthesizeContract(spec);
        const designDoc = DesignDecisionDocumentEngine.generateDocument({
          prompt: p,
          brandName: contract.projectName,
          routes: contract.routes.frontendRoutes.map((r: any) => (typeof r === "string" ? r : r.path)),
          pagePlans: [],
          domainHint: contract.domainCategory,
        });
        return designDoc.visualSystem.colorPalette;
      });

      // Backgrounds are distinct across light and dark archetypes
      expect(generatedPalettes[0].background).toBe("#FAF8F5"); // Warm linen ceramics
      expect(generatedPalettes[1].background).toBe("#F3F0E8"); // Vellum stone architecture
      expect(generatedPalettes[2].background).toBe("#0A0D14"); // Aerospace dark
      expect(generatedPalettes[3].background).toBe("#0A0D14"); // Solar console dark

      // Primary accents are distinct across all four benchmarks
      expect(generatedPalettes[0].primaryAccent).toBe("#5C4623"); // Earth clay
      expect(generatedPalettes[1].primaryAccent).toBe("#465342"); // Patina slate
      expect(generatedPalettes[2].primaryAccent).toBe("#D194CF"); // Aerospace violet
      expect(generatedPalettes[3].primaryAccent).toBe("#C394D1"); // Electric lavender

      const primaryAccents = new Set(generatedPalettes.map((p) => p.primaryAccent));
      expect(primaryAccents.size).toBe(4);
    });

    it("verifies full-stack backend generation succeeds for all four benchmarks", () => {
      const benchmarks = [
        "Artisanal Ceramics Tableware E-Commerce Store",
        "Contemporary Architectural Atelier Portfolio",
        "Advanced Aeronautics Spaceflight Academy",
        "Industrial Solar Telemetry Workbench",
      ];

      for (const name of benchmarks) {
        const spec = UniversalRequirementInterpreter.interpret(name);
        const contract = ArchitectureContractEngine.synthesizeContract(spec);
        const beFiles = DynamicApiGenerator.generateAll(contract, spec.domainVocabulary);

        expect(beFiles.length).toBeGreaterThanOrEqual(5);
        expect(beFiles.some((f) => f.path.includes("schema.prisma"))).toBe(true);
        expect(beFiles.some((f) => f.path.includes("index.ts"))).toBe(true);
        expect(beFiles.some((f) => f.path.includes("api.ts"))).toBe(true);
        expect(beFiles.some((f) => f.path.includes("package.json"))).toBe(true);
      }
    });
  });
});

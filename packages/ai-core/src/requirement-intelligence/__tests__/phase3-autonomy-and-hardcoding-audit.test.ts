import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { UniversalRequirementInterpreter } from "../universal-requirement-interpreter.js";
import { ProductUnderstanding } from "../../design/product-understanding.js";
import { UXArchitectureEngine } from "../../ui-intelligence/ux-architecture-engine.js";
import { AssetAcceptanceGate } from "../../validation/asset-acceptance-gate.js";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Phase 3: Core Reliability, Autonomy & Hardcoding Audit Verification", () => {
  describe("1. UniversalRequirementInterpreter Autonomy", () => {
    it("extracts domain-specific vocabulary and multiple entities for unseen domain without defaulting to 'Record'", () => {
      const prompt = "Artisanal specialty coffee roastery named 'Velvet Bean' with single-origin beans, tasting notes, and customer recurring subscriptions.";
      const spec = UniversalRequirementInterpreter.interpret(prompt);

      expect(spec.projectName).toBeDefined();
      expect(spec.domainVocabulary.entityName).not.toBe("Record");
      expect(spec.domainVocabulary.entityName.toLowerCase()).toMatch(/bean|coffee|roast|velvet/);
      expect(spec.entities.length).toBeGreaterThanOrEqual(2);
      expect(spec.entities.some(e => e.name !== "User" && e.name !== "Record")).toBe(true);
    });

    it("synthesizes related secondary entities with relations for complex requirements", () => {
      const prompt = "Ceramics atelier with bespoke glaze specifications, chef commissions, and studio workshop bookings.";
      const spec = UniversalRequirementInterpreter.interpret(prompt);

      const entityNames = spec.entities.map(e => e.name);
      expect(entityNames).toContain("User");
      // Secondary entities derived from prompt keywords
      expect(entityNames.some(n => /glaze|commission|workshop|booking/i.test(n))).toBe(true);
    });
  });

  describe("2. ProductUnderstanding Anti-Convergence", () => {
    it("classifies residential solar installation commercial company as storefront or showcase, NOT operations-dashboard", () => {
      const prompt = "A clean energy solar company website that showcases residential solar panel installations with customer case studies and quote booking";
      const characteristics = ProductUnderstanding.analyze(prompt);

      // Should not collapse into industrial operations-dashboard
      expect(characteristics.experiencePattern).not.toBe("operations-dashboard");
      expect(["storefront-commerce", "showcase-landing", "booking-flow", "catalog-browser"]).toContain(characteristics.experiencePattern);
    });

    it("correctly identifies true industrial telemetry SCADA console as operations-dashboard or realtime-console", () => {
      const prompt = "Megawatt power generation SCADA operations console with inverter telemetry curves and field technician dispatch work orders";
      const characteristics = ProductUnderstanding.analyze(prompt);

      expect(["operations-dashboard", "realtime-console"]).toContain(characteristics.experiencePattern);
    });
  });

  describe("3. UXArchitectureEngine Route Hygiene", () => {
    it("does NOT inject /dashboard or /directory on non-operational creative studio", () => {
      const plan = UXArchitectureEngine.planUX("Atelier Nocturne", "artisan-ceramic-studio");
      const allPaths = [...plan.publicPages, ...plan.authenticatedPages, ...plan.adminPages].map(p => p.path);

      expect(allPaths).not.toContain("/dashboard");
      expect(allPaths).not.toContain("/directory");
    });

    it("maintains /dashboard for genuine command-center / telemetry domains", () => {
      const plan = UXArchitectureEngine.planUX("AeroTurbine IQ", "telemetry-command-center");
      const allPaths = [...plan.publicPages, ...plan.authenticatedPages, ...plan.adminPages].map(p => p.path);

      expect(allPaths).toContain("/dashboard");
    });
  });

  describe("4. AssetAcceptanceGate Generalized Semantic Relevance", () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = join(tmpdir(), `aegis_asset_audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      mkdirSync(tmpDir, { recursive: true });
    });

    afterEach(() => {
      if (existsSync(tmpDir)) {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it("rejects fast food burger image in an aerospace telemetry engineering domain", () => {
      const aegisDir = join(tmpDir, ".aegis");
      mkdirSync(aegisDir, { recursive: true });
      const srcContent = join(tmpDir, "src", "content");
      mkdirSync(srcContent, { recursive: true });
      writeFileSync(join(srcContent, "site-assets.ts"), "export const siteAssets = {};\n", "utf8");

      const manifest = {
        manifestId: "test-man-01",
        domain: "aviation-turbine-telemetry",
        projectName: "AeroTurbine IQ",
        assets: [
          {
            id: "ast-hero",
            page: "/",
            section: "HeroLanding",
            purpose: "Showcase jet engine turbine blades",
            subject: "Delicious cheeseburger with french fries and ketchup",
            altText: "Close-up of a juicy cheeseburger with melted cheddar and fries",
            aspectRatio: "16:9",
            license: "Unsplash Commercial License",
            resolvedUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=1600",
          },
        ],
      };
      writeFileSync(join(aegisDir, "asset-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

      const report = AssetAcceptanceGate.audit(tmpDir);
      expect(report.passed).toBe(false);
      expect(report.violations.some(v => v.includes("ASSET_SEMANTIC_MISMATCH"))).toBe(true);
    });
  });
});

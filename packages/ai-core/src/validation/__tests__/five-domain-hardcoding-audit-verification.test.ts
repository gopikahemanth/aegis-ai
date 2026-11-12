import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ProductDiscoveryAgent } from "../../agents/product-discovery-agent.js";
import { ContentStrategistAgent } from "../../agents/content-strategist-agent.js";
import { ProductUnderstanding } from "../../design/product-understanding.js";
import { DesignDirector } from "../../design/design-director.js";
import { ThemeGenerator } from "../../design/theme-generator.js";
import { TypographyManager } from "../../design/typography-catalog.js";
import { FastDeterministicSanitizer } from "../../governance/fast-sanitizer.js";
import { TemplateContaminationChecker } from "../template-contamination-checker.js";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("Aegis AI — Five-Domain Hardcoding Audit & Dynamic Generalization Verification", () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), "aegis-5domain-test-"));
  });

  afterEach(() => {
    if (existsSync(tempRoot)) {
      try {
        rmSync(tempRoot, { recursive: true, force: true });
      } catch {}
    }
  });

  const domains = [
    {
      id: "bonsai-nursery",
      name: "Japanese Bonsai Nursery & Master Garden",
      prompt: "Build an authentic website for Kiri Bonsai Atelier, a traditional Japanese bonsai nursery offering master-pruned specimen trees, seasonal repotting workshops, and soil humidity telemetry tracking.",
      expectedNouns: ["bonsai", "tree", "workshop"],
      forbiddenTemplates: ["PAGE & PETAL", "Oakhaven", "Pip the mossling", "Kyoto, Japan", "Avionics Flight Deck"],
    },
    {
      id: "geothermal-energy",
      name: "Geothermal Power Station Telemetry",
      prompt: "Create an operations console for TerraCore Geothermal, monitoring subterranean magma steam turbines, borehole pressure sensors, megawatt grid distribution, and seismic fault line monitoring.",
      expectedNouns: ["geothermal", "turbine", "steam"],
      forbiddenTemplates: ["PAGE & PETAL", "Oakhaven", "The Overstory", "SavorLine", "Velora House"],
    },
    {
      id: "vintage-watch-restoration",
      name: "Vintage Mechanical Watch Restoration Atelier",
      prompt: "Design a bespoke showcase for ChronoRestor Atelier, specializing in vintage mechanical chronograph overhauls, balance wheel truing, archival provenance ledger certificates, and private restoration appointments.",
      expectedNouns: ["chronograph", "watch", "restoration"],
      forbiddenTemplates: ["PAGE & PETAL", "Pip the mossling", "Ceramic Shield Detail", "Ethiopia Yirgacheffe"],
    },
    {
      id: "artisan-creamery",
      name: "Artisan Goat Cheese Farm & Creamery",
      prompt: "Build an e-commerce storefront for MeadowMist Creamery, an artisan goat dairy producing aged chèvre rounds, raw-milk farmstead wheels, cheese cave aging subscriptions, and tasting barn reservations.",
      expectedNouns: ["cheese", "creamery", "dairy"],
      forbiddenTemplates: ["Avionics Flight Deck", "Oakhaven", "Telemetry & Operations Console", "Pip the mossling"],
    },
    {
      id: "aerospace-satellite-constellation",
      name: "Aerospace Micro-Satellite Constellation Operations",
      prompt: "Develop a ground station mission portal for OrbitalLink, tracking low-Earth orbit micro-satellite downlinks, space debris collision avoidance maneuvers, and radio frequency transponder telemetry.",
      expectedNouns: ["satellite", "orbit", "downlink"],
      forbiddenTemplates: ["PAGE & PETAL", "The Overstory", "Oakhaven Furniture", "Vincent van Gogh"],
    },
  ];

  it("1. ProductDiscoveryAgent generates authentic, differentiated features for all 5 unseen domains without hardcoded universe collapse", () => {
    const mockFailingProvider: any = {
      name: "mock-fallback",
      chat: async () => { throw new Error("API Offline for test verification"); },
    };
    const discoveryAgent = new ProductDiscoveryAgent(mockFailingProvider);

    const categoriesSeen = new Set<string>();

    for (const d of domains) {
      const chars = ProductUnderstanding.analyze(d.prompt);
      const matrix = discoveryAgent.fallback(d.prompt, chars, 100);

      expect(matrix).toBeDefined();
      expect(matrix.standardFeatures.length).toBeGreaterThan(0);
      expect(matrix.differentiatorFeatures.length).toBeGreaterThan(0);
      expect(matrix.corePages.length).toBeGreaterThan(0);

      // Verify zero contamination from canned fictional universes
      const matrixString = JSON.stringify(matrix);
      for (const forbidden of d.forbiddenTemplates) {
        expect(matrixString).not.toContain(forbidden);
      }

      categoriesSeen.add(matrix.category);
    }

    // Must not collapse into a single default category
    expect(categoriesSeen.size).toBeGreaterThanOrEqual(4);
  });

  it("2. ContentStrategistAgent derives authentic, unpolluted domain copy and models across all 5 domains", () => {
    const contentAgent = new ContentStrategistAgent({ name: "mock-offline", chat: async () => { throw new Error("Offline"); } } as any);

    for (const d of domains) {
      const chars = ProductUnderstanding.analyze(d.prompt);
      const mockMatrix = {
        category: d.name,
        corePages: ["/", "/catalog", "/schedule", "/status"],
        standardFeatures: [{ name: `${d.name} Hub`, description: d.prompt, requiredComponents: ["HubGrid"] }],
        differentiatorFeatures: [{ name: `${d.name} Specialist`, description: "Specialized service", requiredComponents: ["DetailCard"] }],
        dataModels: [{ name: "EntityRecord", fields: ["id", "title", "status", "category"] }],
      };
      const brief: any = {
        productCharacteristics: chars,
        brandName: d.name.split(" ")[0] + " Official",
        rawPrompt: d.prompt,
      };

      const content = contentAgent.fallbackContent(mockMatrix, brief);
      expect(content).toBeDefined();
      expect(content.brand.name).toBeDefined();

      const contentString = JSON.stringify(content);
      for (const forbidden of d.forbiddenTemplates) {
        expect(contentString).not.toContain(forbidden);
      }
      expect(content.testimonials.every(t => t.isPlaceholder === true)).toBe(true);
    }
  });

  it("3. DesignDirector and ThemeGenerator produce distinct color hues and typography across all 5 domains", () => {
    const huesSeen = new Set<number>();
    const pairingsSeen = new Set<string>();

    for (const d of domains) {
      const chars = ProductUnderstanding.analyze(d.prompt);
      const artDirection = DesignDirector.selectArtDirection(chars, 101, undefined, d.prompt);
      expect(artDirection).toBeDefined();

      const theme = ThemeGenerator.generateTheme({
        prompt: d.prompt,
        domain: d.id,
        seed: 101,
      });

      expect(theme.brandHue).toBeGreaterThanOrEqual(0);
      expect(theme.brandHue).toBeLessThan(360);
      huesSeen.add(Math.round(theme.brandHue / 15)); // group into 15-degree buckets

      const pairing = TypographyManager.selectPairing({
        prompt: d.prompt,
        domain: d.id,
        seed: 101,
      });
      pairingsSeen.add(pairing.id);
    }

    // Palette diversity: at least 4 distinct color families across 5 domains
    expect(huesSeen.size).toBeGreaterThanOrEqual(4);
    // Font diversity: at least 3 distinct font pairings
    expect(pairingsSeen.size).toBeGreaterThanOrEqual(3);
  });

  it("4. FastDeterministicSanitizer builds authentic route pages and prevents foreign telemetry/cart leakage across all 5 domains", () => {
    for (const d of domains) {
      const projDir = join(tempRoot, d.id);
      const srcDir = join(projDir, "src");
      const pagesDir = join(srcDir, "pages");
      mkdirSync(pagesDir, { recursive: true });

      const dashFile = join(pagesDir, "DashboardPage.tsx");
      writeFileSync(dashFile, "export const DashboardPage = () => <div>Incomplete</div>;", "utf8");

      FastDeterministicSanitizer.ensurePreBaselineDashboardCompleteness(srcDir, {
        prompt: d.prompt,
        requiredModels: [d.name.split(" ")[0]],
      } as any);

      const sanitizedDash = readFileSync(dashFile, "utf8");
      expect(sanitizedDash.length).toBeGreaterThan(100);

      // Verify zero template contamination in synthesized dashboard
      for (const forbidden of d.forbiddenTemplates) {
        expect(sanitizedDash).not.toContain(forbidden);
      }
    }
  });

  it("5. TemplateContaminationChecker verifies 100% clean passes for all 5 domains with zero false positives", () => {
    for (const d of domains) {
      const projDir = join(tempRoot, `audit-${d.id}`);
      const srcDir = join(projDir, "src");
      const pagesDir = join(srcDir, "pages");
      mkdirSync(pagesDir, { recursive: true });

      // Create realistic authentic page
      const samplePage = `
        import React from "react";
        export function ${d.id.replace(/-/g, "")}Page() {
          return (
            <div>
              <h1>${d.name}</h1>
              <p>${d.prompt}</p>
            </div>
          );
        }
      `;
      writeFileSync(join(pagesDir, "IndexPage.tsx"), samplePage, "utf8");

      const contract = {
        prompt: d.prompt,
        requiredFeatures: [`${d.name} Core Service`],
        requiredModels: [d.name.split(" ")[0]],
      };

      const checker = new TemplateContaminationChecker(projDir);
      const report = checker.audit(d.id, contract);

      expect(report.clean).toBe(true);
      expect(report.status).toBe("PASS");
      expect(report.violations.length).toBe(0);
    }
  });
});

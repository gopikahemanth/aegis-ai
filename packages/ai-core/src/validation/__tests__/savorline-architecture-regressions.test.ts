import { describe, it, expect } from "vitest";
import { NavigationDesignResolver } from "../../design/navigation-design.js";
import { DomainContractDeriver } from "../../governance/domain-contract.js";
import { ArchitecturePlanner } from "../../architect/planner.js";
import { PageExperiencePlanner } from "../../design/page-experience-plan.js";
import { ContentStrategistAgent } from "../../agents/content-strategist-agent.js";
import { PageExperienceQualityGate } from "../page-experience-quality-gate.js";
import { FastDeterministicSanitizer } from "../../governance/fast-sanitizer.js";
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Savorline Architecture Regression Suite", () => {
  const SAVORLINE_PROMPT =
    "Create a premium interactive culinary travel magazine called SAVORLINE. Cover regional food journeys, chef stories, destination guides, restaurant discoveries, recipes, seasonal ingredients, and curated trip itineraries. Include an immersive food story cover, an interactive destination explorer with terroir and regional guides, a curated recipe collection with serving scaler and step-by-step cooking mode, a personal saved discoveries hub to bookmark favorites, and a custom culinary itinerary builder to plan multi-day foodie trips. Avoid generic cards or SaaS dashboard layouts.";

  // TEST 1: Authoritative brand extraction extracts SAVORLINE and purges foreign brands
  it("TEST 1: Authoritative brand extraction extracts SAVORLINE and purges foreign brands", () => {
    const extracted = NavigationDesignResolver.extractBrandFromPrompt(SAVORLINE_PROMPT);
    expect(extracted).toBe("SAVORLINE");

    const mockContract = { prompt: SAVORLINE_PROMPT, name: "savorline" } as any;
    const domainName = DomainContractDeriver.inferDomainName(mockContract);
    expect(domainName).toBe("SAVORLINE");
    expect(domainName).not.toContain("AETHER SPRINT");
    expect(domainName).not.toContain("REVUE NOIR");

    const nav = NavigationDesignResolver.resolve(
      SAVORLINE_PROMPT,
      [
        "/",
        "/editorial-stories",
        "/explore-culinary-destinations",
        "/and-filter-recipes",
        "/saved-discoveries",
        "/build-custom-itinerary",
      ],
      "EDITORIAL_PUBLICATION",
      42,
      { domainName: "SAVORLINE", brandName: "SAVORLINE", name: "SAVORLINE" } as any
    );

    expect(nav.brandTreatment.name).toBe("SAVORLINE");
    expect(nav.brandTreatment.name).not.toBe("AETHER SPRINT");
    expect(nav.brandTreatment.name).not.toBe("REVUE NOIR");
  });

  // TEST 2: ContentStrategist produces SAVORLINE culinary content and never leaks sprint or arch brands
  it("TEST 2: ContentStrategist produces SAVORLINE culinary content and never leaks sprint or arch brands", () => {
    const agent = new ContentStrategistAgent(null as any);
    const mockBrief: any = {
      rawPrompt: SAVORLINE_PROMPT,
      userPrompt: SAVORLINE_PROMPT,
      productCharacteristics: {
        emotionalTone: { primary: "epicurean, refined" },
        experiencePattern: "craft-editorial",
      },
    };
    const mockMatrix: any = {
      category: "Culinary Travel Magazine & Gastronomic Journal",
      corePages: ["/", "/editorial-stories", "/explore-culinary-destinations", "/and-filter-recipes", "/saved-discoveries", "/build-custom-itinerary"],
      standardFeatures: [],
      differentiatorFeatures: [],
    };

    const fallback = agent.fallbackContent(mockMatrix, mockBrief);
    expect(fallback.brand.name).toBe("SAVORLINE");
    expect(fallback.brand.name).not.toContain("Aether Sprint");
    expect(fallback.brand.name).not.toContain("Revue Noir");

    const fullContent = JSON.stringify(fallback).toLowerCase();
    expect(fullContent).not.toContain("aether sprint");
    expect(fullContent).not.toContain("revue noir");
    expect(fullContent).not.toContain("story points");
    expect(fullContent).not.toContain("agile backlog");
  });

  // TEST 3: ArchitecturePlanner derives domain tables and does not inject tasks table
  it("TEST 3: ArchitecturePlanner derives domain tables and does not inject tasks table", () => {
    const planner = new ArchitecturePlanner();
    const culinarySpec: any = {
      name: "savorline",
      type: "website",
      frontend: "React",
      database: "PostgreSQL",
      language: "TypeScript",
      packageManager: "pnpm",
      features: ["editorial-stories", "destinations", "recipes", "saved-discoveries", "itinerary-planner"],
      dataModels: ["Article", "Destination", "Recipe", "SavedItem", "ItineraryDay", "ItineraryItem"],
    };

    const arch = planner.plan(culinarySpec);
    const tableNames = arch.plan.databaseSchema.map(t => t.name);

    expect(tableNames).toContain("articles");
    expect(tableNames).toContain("destinations");
    expect(tableNames).toContain("recipes");
    expect(tableNames).toContain("saveditems");
    expect(tableNames).toContain("itinerarydays");
    expect(tableNames).not.toContain("tasks");
  });

  // TEST 4: PageExperiencePlan assigns specialized domain roles for culinary travel routes
  it("TEST 4: PageExperiencePlan assigns specialized domain roles for culinary travel routes", () => {
    const routes = [
      "/",
      "/editorial-stories",
      "/explore-culinary-destinations",
      "/and-filter-recipes",
      "/saved-discoveries",
      "/build-custom-itinerary",
    ];

    const pagePlans = PageExperiencePlanner.planPages(
      SAVORLINE_PROMPT,
      { emotionalTone: { primary: "epicurean" }, experiencePattern: "craft-editorial" } as any,
      { genre: "EDITORIAL_PUBLICATION", brandIdentity: { name: "SAVORLINE" } } as any,
      { capabilities: [] } as any,
      routes
    );

    const destPage = pagePlans.find(p => p.route === "/explore-culinary-destinations");
    expect(destPage?.pageRole).toBe("Culinary Destination Explorer & Terroir Atlas");
    expect(destPage?.requiredCapabilities).toContain("destination-explorer");

    const recipePage = pagePlans.find(p => p.route === "/and-filter-recipes");
    expect(recipePage?.pageRole).toBe("Curated Recipe Collection & Kitchen Companion");
    expect(recipePage?.requiredCapabilities).toContain("recipe-scaler");

    const savedPage = pagePlans.find(p => p.route === "/saved-discoveries");
    expect(savedPage?.pageRole).toBe("Personal Saved Discoveries & Curated Collections");
    expect(savedPage?.requiredCapabilities).toContain("collection-folder-manager");
    expect(savedPage?.pageRole).not.toBe("Publication Folio Archive & Curatorial Index");

    const itinPage = pagePlans.find(p => p.route === "/build-custom-itinerary");
    expect(itinPage?.pageRole).toBe("Custom Culinary Itinerary & Journey Planner");
    expect(itinPage?.requiredCapabilities).toContain("interactive-itinerary-builder");
    expect(itinPage?.pageRole).not.toBe("Publication Folio Archive & Curatorial Index");
  });

  // TEST 5: PageExperienceQualityGate passes realistic culinary travel routes
  it("TEST 5: PageExperienceQualityGate passes realistic culinary travel routes", () => {
    const tempDir = join(tmpdir(), `aegis-savorline-test-${Date.now()}`);
    mkdirSync(join(tempDir, "src", "features"), { recursive: true });

    try {
      // Mock route files with genuine capability implementations
      writeFileSync(
        join(tempDir, "src", "App.tsx"),
        `import React from "react";\nexport function App() { return <div>Savorline Shell</div>; }`
      );

      writeFileSync(
        join(tempDir, "src", "features", "SavedDiscoveriesView.tsx"),
        `import React, { useState } from "react";
export function SavedDiscoveriesView() {
  const [activeFolder, setActiveFolder] = useState("all");
  const [savedItems, setSavedItems] = useState([
    { id: "1", title: "Nordic Chanterelles", folder: "recipes" }
  ]);
  return (
    <div data-workspace="saved-hub">
      <h1>Saved Collections & Bookmarks</h1>
      <div className="folder-tabs">
        <button onClick={() => setActiveFolder("recipes")}>Recipes</button>
      </div>
      <div className="items">
        {savedItems.map(item => <div key={item.id}>{item.title}</div>)}
      </div>
    </div>
  );
}`
      );

      writeFileSync(
        join(tempDir, "src", "features", "ItineraryBuilderView.tsx"),
        `import React, { useState } from "react";
export function ItineraryBuilderView() {
  const [activeDay, setActiveDay] = useState(1);
  const [stops, setStops] = useState([
    { id: "1", day: 1, time: "10:00 AM", title: "La Boqueria Market Tour" }
  ]);
  const addStop = () => {
    setStops([...stops, { id: "2", day: activeDay, time: "1:00 PM", title: "Tasting Menu" }]);
  };
  return (
    <div data-workspace="itinerary-planner">
      <h1>Custom Culinary Itinerary</h1>
      <div className="day-schedule-timeline">
        <button onClick={() => setActiveDay(1)}>Day 1</button>
      </div>
      <button onClick={addStop}>Add Culinary Stop</button>
      <div className="timeline-stops">
        {stops.map(s => <div key={s.id}>{s.time} - {s.title}</div>)}
      </div>
    </div>
  );
}`
      );

      const mockPlan: any = {
        pagePlans: [
          {
            route: "/saved-discoveries",
            pageRole: "Personal Saved Discoveries & Curated Collections",
            requiredCapabilities: ["collection-folder-manager", "discovery-bookmark-hub"],
            forbiddenPatterns: ["generic table", "generic search bar"],
          },
          {
            route: "/build-custom-itinerary",
            pageRole: "Custom Culinary Itinerary & Journey Planner",
            requiredCapabilities: ["interactive-itinerary-builder", "day-schedule-timeline"],
            forbiddenPatterns: ["generic table", "generic search bar"],
          },
        ],
      };

      const report = PageExperienceQualityGate.audit(tempDir, mockPlan);
      expect(report.status).toBe("PASS");
      expect(report.routesPassed).toBe(2);
      expect(report.routesEvaluated).toBe(2);
    } finally {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });

  // TEST 6: FastDeterministicSanitizer synthesizes authentic route page without foreign brand leakage
  it("TEST 6: FastDeterministicSanitizer synthesizes authentic route page without foreign brand leakage", () => {
    const tempDir = join(tmpdir(), `aegis-clean-gen-test-${Date.now()}`);
    mkdirSync(join(tempDir, "src", "pages"), { recursive: true });

    try {
      FastDeterministicSanitizer.synthesizeRoutePage(
        join(tempDir, "src"),
        "/saved-discoveries",
        "SavedDiscoveriesPage",
        SAVORLINE_PROMPT,
        42,
        {
          pageRole: "Personal Saved Discoveries & Curated Collections",
          purpose: "Personal hub organizing saved culinary stories, destination guides, and recipes into custom folders",
        } as any
      );

      const filePath = join(tempDir, "src", "pages", "SavedDiscoveriesPage.tsx");
      const content = readFileSync(filePath, "utf8");

      expect(content).toContain("SAVORLINE");
      expect(content).toContain("Personal Saved Discoveries");
      expect(content).not.toContain("AETHER SPRINT");
      expect(content).not.toContain("REVUE NOIR");
    } finally {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });

  // TEST 8: Full identity enforcement regression test: foreign brands are purged in sanitizer
  it("TEST 8: Full identity enforcement regression test: foreign brands are purged in sanitizer", () => {
    const tempDir = join(tmpdir(), `aegis-identity-enforce-test-${Date.now()}`);
    mkdirSync(join(tempDir, "src", "components"), { recursive: true });
    mkdirSync(join(tempDir, ".aegis"), { recursive: true });

    try {
      // Write metadata with authoritative brand SAVORLINE
      writeFileSync(
        join(tempDir, ".aegis", "product-experience-plan.json"),
        JSON.stringify({ brandIdentity: { name: "SAVORLINE" } })
      );
      writeFileSync(
        join(tempDir, ".aegis", "design-brief.json"),
        JSON.stringify({ brand: { name: "SAVORLINE" }, brandName: "SAVORLINE" })
      );

      // Write a component contaminated with foreign brand "AETHER SPRINT"
      writeFileSync(
        join(tempDir, "src", "components", "Navbar.tsx"),
        `import React from "react";
export function Navbar() {
  return (
    <nav>
      <span className="brand">AETHER SPRINT</span>
      <p>Technical architecture velocity metrics</p>
    </nav>
  );
}`
      );

      // Write index.html contaminated with foreign brand
      writeFileSync(
        join(tempDir, "index.html"),
        `<!DOCTYPE html><html><head><title>AETHER SPRINT</title></head><body><div id="root"></div></body></html>`
      );

      // Run FastDeterministicSanitizer.ensureDesignIntentCompliance
      FastDeterministicSanitizer.ensureDesignIntentCompliance(tempDir);

      const navContent = readFileSync(join(tempDir, "src", "components", "Navbar.tsx"), "utf8");
      expect(navContent).toContain("SAVORLINE");
      expect(navContent).not.toContain("AETHER SPRINT");

      const htmlContent = readFileSync(join(tempDir, "index.html"), "utf8");
      expect(htmlContent).toContain("<title>SAVORLINE</title>");
      expect(htmlContent).not.toContain("AETHER SPRINT");
    } finally {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });
});

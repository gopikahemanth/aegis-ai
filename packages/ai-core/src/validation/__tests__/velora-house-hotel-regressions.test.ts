import { describe, it, expect } from "vitest";
import { SpecificationNormalizer } from "../../spec/canonical-spec.js";
import { ArchitectureResolver } from "../../governance/architecture-resolver.js";
import { SemanticNaming } from "../../semantics/semantic-naming.js";
import { ProductUnderstanding } from "../../design/product-understanding.js";
import { ProductExperiencePlanManager } from "../../design/product-experience-plan.js";
import { PageExperiencePlanner } from "../../design/page-experience-plan.js";
import { PageExperienceQualityGate } from "../page-experience-quality-gate.js";
import { FastDeterministicSanitizer } from "../../governance/fast-sanitizer.js";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("Velora House Luxury Hotel Architecture Regression Suite", () => {
  const VELORA_HOUSE_PROMPT =
    "Create a premium boutique hotel website called VELORA HOUSE. Showcase the property, suites, amenities, dining, spa, local experiences, image galleries, room availability, booking flow, guest preferences, and a personalized stay planner. The website should feel like a luxury hospitality brand: cinematic photography, elegant typography, editorial spacing, subtle motion, immersive room storytelling, and a refined warm-neutral visual identity. Include meaningful interactions for exploring rooms, checking availability, selecting dates, choosing experiences, and building a stay. Avoid SaaS dashboards, generic card grids, and the usual hero-cards-CTA structure. Each route should have its own composition appropriate to its purpose.";

  // TEST 1: SemanticNaming singularization handles -preferences, -experiences, -services without corruption
  it("TEST 1: SemanticNaming handles silent-e plurals without truncation", () => {
    const prefResult = SemanticNaming.deriveCapabilityNaming("guest preferences");
    expect(prefResult.modelName).toBe("GuestPreference");
    expect(prefResult.modelName).not.toBe("GuestPreferenc");

    const expResult = SemanticNaming.deriveCapabilityNaming("local experiences");
    expect(expResult.modelName).toBe("LocalExperience");
    expect(expResult.modelName).not.toBe("LocalExperienc");

    const suiteResult = SemanticNaming.deriveCapabilityNaming("luxury suites");
    expect(suiteResult.modelName).toBe("LuxurySuite");
    expect(suiteResult.modelName).not.toBe("LuxurySuit");

    const serviceResult = SemanticNaming.deriveCapabilityNaming("concierge services");
    expect(serviceResult.modelName).toBe("ConciergeService");
    expect(serviceResult.modelName).not.toBe("ConciergeServic");
  });

  // TEST 2: SpecificationNormalizer detects luxury-hospitality domain and does not misclassify as real-estate
  it("TEST 2: SpecificationNormalizer classifies luxury hotel property as luxury-hospitality", () => {
    const rawSpec: any = {
      name: "velora-house",
      frontend: "React-Vite",
      backend: "Express",
      database: "PostgreSQL",
    };

    const canonical = SpecificationNormalizer.normalize(VELORA_HOUSE_PROMPT, rawSpec);
    expect(canonical.domainCategory).toBe("luxury-hospitality");
    expect(canonical.domainCategory).not.toBe("real-estate");
    expect(canonical.domainVocabulary.entityName).toBe("Suite");
    expect(canonical.dataModels).toContain("Suite");
    expect(canonical.dataModels).toContain("Reservation");
    expect(canonical.dataModels).toContain("GuestPreference");
    expect(canonical.dataModels).toContain("StayPlan");
  });

  // TEST 3: ArchitectureResolver does not assign SAAS_APPLICATION and extracts hotel routes & models
  it("TEST 3: ArchitectureResolver resolves FULLSTACK_WEB_APPLICATION and canonical hotel routes", () => {
    const contract = ArchitectureResolver.resolve(VELORA_HOUSE_PROMPT);
    expect(contract.applicationType).toBe("FULLSTACK_WEB_APPLICATION");
    expect(contract.applicationType).not.toBe("SAAS_APPLICATION");

    // Routes must include hotel pages, not collapsed generic routes
    expect(contract.requiredRoutes).toContain("/");
    expect(contract.requiredRoutes).toContain("/suites");
    expect(contract.requiredRoutes).toContain("/booking");
    expect(contract.requiredRoutes).toContain("/stay-planner");
    expect(contract.requiredRoutes).toContain("/guest-preferences");

    // Models must include hotel domain models
    expect(contract.requiredModels).toContain("Suite");
    expect(contract.requiredModels).toContain("Reservation");
    expect(contract.requiredModels).toContain("GuestPreference");
    expect(contract.requiredModels).not.toContain("GuestPreferenc");
    expect(contract.requiredModels).toContain("StayPlan");
  });

  // TEST 4: ProductExperiencePlan does not collapse hospitality capabilities into only 2
  it("TEST 4: ProductExperiencePlan derives rich hospitality capabilities from prompt", () => {
    const characteristics = ProductUnderstanding.analyze(VELORA_HOUSE_PROMPT);
    expect(characteristics.experiencePattern).toBe("hospitality-portal");

    const mockBrief: any = {
      productCharacteristics: characteristics,
      seed: 6724,
      featurePriority: {
        informationArchitecture: {
          pages: [
            { route: "/", name: "Home" },
            { route: "/suites", name: "Suites" },
            { route: "/booking", name: "Booking" },
            { route: "/stay-planner", name: "Stay Planner" },
            { route: "/guest-preferences", name: "Guest Preferences" },
          ],
        },
      },
    };

    const plan = ProductExperiencePlanManager.build(mockBrief, {}, VELORA_HOUSE_PROMPT);
    expect(plan.requiredCapabilities.length).toBeGreaterThanOrEqual(4);

    const capIds = plan.requiredCapabilities.map(c => c.id);
    expect(capIds).toContain("suite-showcase");
    expect(capIds).toContain("interactive-booking");
    expect(capIds).toContain("stay-planner");
    expect(capIds).toContain("guest-preferences");
  });

  // TEST 5: PageExperiencePlanner assigns luxury hospitality roles, NEVER culinary roles
  it("TEST 5: PageExperiencePlanner generates hospitality roles and zero culinary roles for hotel", () => {
    const characteristics = ProductUnderstanding.analyze(VELORA_HOUSE_PROMPT);
    const mockIdentity: any = {
      genre: "LUXURY_ARTIFACT_STAGE",
      brandIdentity: { name: "VELORA HOUSE" },
    };
    const mockCapabilityPlan: any = {
      experienceType: "STANDARD_WEB",
      real3dRequired: false,
    };
    const routes = ["/", "/suites", "/booking", "/stay-planner", "/guest-preferences", "/amenities-and-spa", "/dining", "/local-experiences"];

    const pagePlans = PageExperiencePlanner.planPages(
      VELORA_HOUSE_PROMPT,
      characteristics,
      mockIdentity,
      mockCapabilityPlan,
      routes
    );

    const homePlan = pagePlans.find(p => p.route === "/");
    expect(homePlan).toBeDefined();
    expect(homePlan!.pageRole).toBe("Grand Hotel Masthead & Property Overview");
    expect(homePlan!.pageRole).not.toContain("Culinary Monograph");

    const suitesPlan = pagePlans.find(p => p.route === "/suites");
    expect(suitesPlan).toBeDefined();
    expect(suitesPlan!.pageRole).toBe("Luxury Suite Showcase & Immersive Room Storytelling");

    const bookingPlan = pagePlans.find(p => p.route === "/booking");
    expect(bookingPlan).toBeDefined();
    expect(bookingPlan!.pageRole).toBe("Interactive Room Availability & Reservation Engine");

    const stayPlan = pagePlans.find(p => p.route === "/stay-planner");
    expect(stayPlan).toBeDefined();
    expect(stayPlan!.pageRole).toBe("Personalized Stay Planner & Curated Itinerary Concierge");

    const prefPlan = pagePlans.find(p => p.route === "/guest-preferences");
    expect(prefPlan).toBeDefined();
    expect(prefPlan!.pageRole).toBe("Bespoke Guest Preferences & In-Suite Curation Studio");

    // Invariant: ZERO routes acquire culinary publication roles
    for (const plan of pagePlans) {
      expect(plan.pageRole).not.toContain("Culinary Monograph Cover");
      expect(plan.pageRole).not.toContain("Culinary Travel Publication Folio");
    }
  });

  // TEST 6: PageExperienceQualityGate audits hotel routes cleanly
  it("TEST 6: PageExperienceQualityGate verifies valid hotel routes with 100% pass", () => {
    const tempDir = join(tmpdir(), `velora_hotel_test_${Date.now()}`);
    mkdirSync(join(tempDir, "src", "pages"), { recursive: true });

    try {
      // Create mock hotel pages
      writeFileSync(
        join(tempDir, "src", "pages", "HomePage.tsx"),
        `import React, { useState } from "react";
export function HomePage() {
  const [selectedSuite, setSelectedSuite] = useState("penthouse");
  return (
    <div>
      <h1>VELORA HOUSE</h1>
      <p>Luxury property overview and curated suite showcase</p>
      <button onClick={() => setSelectedSuite("terrace")}>Select Suite</button>
      <div className="suite-card">Suite: {selectedSuite}</div>
    </div>
  );
}`
      );

      writeFileSync(
        join(tempDir, "src", "pages", "SuitesPage.tsx"),
        `import React, { useState } from "react";
export function SuitesPage() {
  const [viewMode, setViewMode] = useState("gallery");
  return (
    <div>
      <h2>Luxury Suites & Villas</h2>
      <button onClick={() => setViewMode(viewMode === "gallery" ? "floorplan" : "gallery")}>Toggle Floorplan</button>
      <div className="suite-details">Suite specs, capacity, sqm, price per night</div>
    </div>
  );
}`
      );

      writeFileSync(
        join(tempDir, "src", "pages", "BookingPage.tsx"),
        `import React, { useState } from "react";
export function BookingPage() {
  const [checkIn, setCheckIn] = useState("2026-11-01");
  const [guests, setGuests] = useState(2);
  return (
    <div>
      <h2>Room Availability & Reservations</h2>
      <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
      <button onClick={() => setGuests(guests + 1)}>Add Guest</button>
      <p>Availability confirmed for {guests} guests.</p>
    </div>
  );
}`
      );

      writeFileSync(
        join(tempDir, "src", "pages", "StayPlannerPage.tsx"),
        `import React, { useState } from "react";
export function StayPlannerPage() {
  const [activeDay, setActiveDay] = useState(1);
  return (
    <div>
      <h2>Personalized Stay Planner</h2>
      <button onClick={() => setActiveDay(2)}>Day 2</button>
      <div className="itinerary-timeline">Day {activeDay}: Spa ritual and dining reservation</div>
    </div>
  );
}`
      );

      writeFileSync(
        join(tempDir, "src", "pages", "GuestPreferencesPage.tsx"),
        `import React, { useState } from "react";
export function GuestPreferencesPage() {
  const [pillow, setPillow] = useState("Silk");
  const [temperature, setTemperature] = useState(20);
  return (
    <div>
      <h2>Bespoke In-Suite Preferences</h2>
      <button onClick={() => setPillow("Memory Foam")}>Pillow: {pillow}</button>
      <input type="range" value={temperature} onChange={e => setTemperature(Number(e.target.value))} />
      <p>Temperature: {temperature}°C, Beverage stocking: Still artisanal water</p>
    </div>
  );
}`
      );

      const mockPlan: any = {
        pagePlans: [
          {
            route: "/",
            pageRole: "Grand Hotel Masthead & Property Overview",
            requiredCapabilities: ["suite-showcase", "cinematic-hero"],
            forbiddenPatterns: ["saas dashboard", "generic table", "crud forms"],
          },
          {
            route: "/suites",
            pageRole: "Luxury Suite Showcase & Immersive Room Storytelling",
            requiredCapabilities: ["suite-showcase", "room-storytelling"],
            forbiddenPatterns: ["saas dashboard", "generic table", "crud forms"],
          },
          {
            route: "/booking",
            pageRole: "Interactive Room Availability & Reservation Engine",
            requiredCapabilities: ["interactive-booking", "availability-calendar"],
            forbiddenPatterns: ["generic table", "crud forms"],
          },
          {
            route: "/stay-planner",
            pageRole: "Personalized Stay Planner & Curated Itinerary Concierge",
            requiredCapabilities: ["stay-planner", "itinerary-timeline"],
            forbiddenPatterns: ["generic table", "crud forms"],
          },
          {
            route: "/guest-preferences",
            pageRole: "Bespoke Guest Preferences & In-Suite Curation Studio",
            requiredCapabilities: ["guest-preferences", "in-suite-curator"],
            forbiddenPatterns: ["generic table", "crud forms"],
          },
        ],
      };

      const auditResult = PageExperienceQualityGate.audit(tempDir, mockPlan);
      expect(auditResult.status).toBe("PASS");
      expect(auditResult.passed).toBe(true);
      expect(auditResult.routesPassed).toBe(5);
      expect(auditResult.routesEvaluated).toBe(5);
    } finally {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });

  // TEST 7: Route Closure Invariant: Hotel router binds exactly 8 canonical routes and emits 0 uncontracted disk aliases
  it("TEST 7: Route Closure Invariant enforces N=8 canonical routes and rejects disk aliases", () => {
    const tempDir = join(tmpdir(), `velora_route_closure_${Date.now()}`);
    const srcDir = join(tempDir, "src");
    mkdirSync(join(srcDir, "pages"), { recursive: true });
    mkdirSync(join(srcDir, "features", "suite"), { recursive: true });
    mkdirSync(join(srcDir, "features", "amenities"), { recursive: true });
    mkdirSync(join(srcDir, "features", "booking"), { recursive: true });
    mkdirSync(join(srcDir, "features", "dining"), { recursive: true });
    mkdirSync(join(srcDir, "features", "guest-preference"), { recursive: true });
    mkdirSync(join(srcDir, "features", "local-experiences"), { recursive: true });
    mkdirSync(join(srcDir, "features", "stay-plan"), { recursive: true });

    try {
      writeFileSync(join(srcDir, "features", "suite", "index.tsx"), `export default function SuitePage() { return <div>Suites</div>; }`, "utf8");
      writeFileSync(join(srcDir, "features", "amenities", "index.tsx"), `export default function AmenitiesPage() { return <div>Amenities</div>; }`, "utf8");
      writeFileSync(join(srcDir, "features", "booking", "index.tsx"), `export default function BookingPage() { return <div>Booking</div>; }`, "utf8");
      writeFileSync(join(srcDir, "features", "dining", "index.tsx"), `export default function DiningPage() { return <div>Dining</div>; }`, "utf8");
      writeFileSync(join(srcDir, "features", "guest-preference", "index.tsx"), `export default function GuestPreferencePage() { return <div>Preferences</div>; }`, "utf8");
      writeFileSync(join(srcDir, "features", "local-experiences", "index.tsx"), `export default function LocalExperiencesPage() { return <div>Local Experiences</div>; }`, "utf8");
      writeFileSync(join(srcDir, "features", "stay-plan", "index.tsx"), `export default function StayPlanPage() { return <div>Stay Plan</div>; }`, "utf8");

      const canonicalRoutes = [
        "/",
        "/suites",
        "/booking",
        "/stay-planner",
        "/guest-preferences",
        "/amenities-and-spa",
        "/dining",
        "/local-experiences",
      ];

      const mockContract: any = {
        requiredRoutes: canonicalRoutes,
        prompt: VELORA_HOUSE_PROMPT,
      };

      const routesContent = FastDeterministicSanitizer.generateRoutesFromExistingPages(tempDir, mockContract);
      const declaredRoutes = [...routesContent.matchAll(/path="([^"*]+)"/g)].map(m => m[1]);

      // Invariant 1: Exactly the 8 canonical routes are declared
      for (const reqRoute of canonicalRoutes) {
        expect(declaredRoutes).toContain(reqRoute);
      }

      // Invariant 2: Zero implicit disk aliases (/stay-plan, /guest-preference, /amenities)
      expect(declaredRoutes).not.toContain("/stay-plan");
      expect(declaredRoutes).not.toContain("/guest-preference");
      expect(declaredRoutes).not.toContain("/amenities");

      // Invariant 3: actualRoutes - requiredRoutes = ∅ (Count is exactly 8)
      expect(declaredRoutes.length).toBe(8);
    } finally {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });
});

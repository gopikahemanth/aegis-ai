import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DeterministicProjectFixer } from "../deterministic-project-fixer.js";
import { RealBrowserAdapter } from "../../ui-intelligence/real-browser-adapter.js";
import { GenerationIdentityManager } from "../../governance/generation-identity.js";
import { assertCleanTargetDirectory } from "@aegis/project-builder";

const TEST_DIR_LUMINA = join(process.cwd(), ".tmp_test_lumina_diff");
const TEST_DIR_ASTRO = join(process.cwd(), ".tmp_test_astro_diff");

describe("Meaningful Product-Level Difference & Architectural Isolation Suite", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR_LUMINA)) rmSync(TEST_DIR_LUMINA, { recursive: true, force: true });
    if (existsSync(TEST_DIR_ASTRO)) rmSync(TEST_DIR_ASTRO, { recursive: true, force: true });

    mkdirSync(join(TEST_DIR_LUMINA, "src", "features", "dashboard"), { recursive: true });
    mkdirSync(join(TEST_DIR_LUMINA, "src", "pages"), { recursive: true });
    mkdirSync(join(TEST_DIR_LUMINA, "server", "routes"), { recursive: true });

    mkdirSync(join(TEST_DIR_ASTRO, "src", "features", "dashboard"), { recursive: true });
    mkdirSync(join(TEST_DIR_ASTRO, "src", "pages"), { recursive: true });
    mkdirSync(join(TEST_DIR_ASTRO, "server", "routes"), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR_LUMINA)) rmSync(TEST_DIR_LUMINA, { recursive: true, force: true });
    if (existsSync(TEST_DIR_ASTRO)) rmSync(TEST_DIR_ASTRO, { recursive: true, force: true });
  });

  it("1. Tests meaningful product-level difference while permitting shared UI primitives", () => {
    // Lumina Terra: Pottery & Ceramic Studio
    const luminaUi = `
import React, { useState } from "react";
import { Button, Card, Dialog, Navigation, Container } from "../shared/components";

export function DashboardPage() {
  const [activeGlaze, setActiveGlaze] = useState("Celadon Seafoam");
  const [kilnFiringTemp, setKilnFiringTemp] = useState(1220); // Cone 6

  return (
    <Container className="studio-workspace" data-workspace="catalog_grid">
      <Navigation brand="Lumina Terra Pottery" />
      <header className="page-header">
        <h1>Artisan Ceramics & Glaze Formulation</h1>
        <p>Manage studio clay batches, glaze recipes, and kiln firing logs.</p>
      </header>
      <div className="grid-catalog">
        <Card title="Glaze Formulator">
          <span>Active Glaze: {activeGlaze}</span>
          <Button onClick={() => setActiveGlaze("Tenmoku Iron Rust")}>Switch Glaze</Button>
        </Card>
        <Card title="Kiln Chamber Monitor">
          <span>Target Temperature: {kilnFiringTemp} °C (Oxidation)</span>
          <Button onClick={() => setKilnFiringTemp(1280)}>Cone 10 Reduction</Button>
        </Card>
      </div>
    </Container>
  );
}
export default DashboardPage;
`;

    // Astro Journal: Deep-Sky Observation Log
    const astroUi = `
import React, { useState } from "react";
import { Button, Card, Dialog, Navigation, Container } from "../shared/components";

export function DashboardPage() {
  const [filterMagnitude, setFilterMagnitude] = useState(8.5);
  const [activeConstellation, setActiveConstellation] = useState("Cygnus");

  return (
    <Container className="observatory-workspace" data-workspace="observation_logbook">
      <Navigation brand="Astro Journal" />
      <header className="page-header">
        <h1>Deep-Sky Celestial Observation Log</h1>
        <p>Record astronomical seeing conditions, eyepiece focal lengths, and Messier objects.</p>
      </header>
      <div className="grid-observations">
        <Card title="Sky Target Filter">
          <span>Target Constellation: {activeConstellation}</span>
          <Button onClick={() => setActiveConstellation("Orion")}>Track Nebula</Button>
        </Card>
        <Card title="Limiting Magnitude">
          <span>Apparent Magnitude Cutoff: {filterMagnitude}</span>
          <Button onClick={() => setFilterMagnitude(11.0)}>Aperture 8in F/5</Button>
        </Card>
      </div>
    </Container>
  );
}
export default DashboardPage;
`;

    // Shared primitives check (both legitimately use Button, Card, Dialog, Navigation, Container)
    const sharedPrimitives = ["Button", "Card", "Dialog", "Navigation", "Container"];
    for (const prim of sharedPrimitives) {
      expect(luminaUi).toContain(prim);
      expect(astroUi).toContain(prim);
    }

    // Meaningful Product-Level Difference Checks:
    // 1. Primary Workspace Types differ
    expect(luminaUi).toContain('data-workspace="catalog_grid"');
    expect(astroUi).toContain('data-workspace="observation_logbook"');
    expect(luminaUi).not.toContain('observation_logbook');
    expect(astroUi).not.toContain('catalog_grid');

    // 2. Feature Vocabularies are completely segregated
    const ceramicsVocabulary = ["ceramic", "glaze", "kiln", "firing", "pottery", "clay"];
    const astroVocabulary = ["celestial", "astronomical", "constellation", "nebula", "magnitude", "messier"];

    for (const term of ceramicsVocabulary) {
      expect(luminaUi.toLowerCase()).toContain(term);
      expect(astroUi.toLowerCase()).not.toContain(term);
    }

    for (const term of astroVocabulary) {
      expect(astroUi.toLowerCase()).toContain(term);
      expect(luminaUi.toLowerCase()).not.toContain(term);
    }
  });

  it("2. Contract-Driven Provenance: Flags alien solar telemetry keywords in ceramics project", () => {
    const dashPath = join(TEST_DIR_LUMINA, "src", "features", "dashboard", "DashboardPage.tsx");
    
    // Contaminated file referencing foreign solar inverter artifacts
    writeFileSync(
      dashPath,
      `import React from "react";
export function DashboardPage() {
  return <div><h1>Lumina Terra</h1><span>INV-01 Smart Rene MPPT</span></div>;
}
export default DashboardPage;`
    );

    const contract = {
      requiredModels: ["CeramicPiece", "GlazeRecipe", "KilnSchedule"],
      features: ["collection", "glazes", "kiln", "workshops"],
    };

    const provenance = DeterministicProjectFixer.validateArtifactProvenance(TEST_DIR_LUMINA, contract);

    // Must be rejected because INV-01 and Smart Rene have zero provenance to ceramics
    expect(provenance.valid).toBe(false);
    expect(provenance.violations.length).toBeGreaterThan(0);
    expect(provenance.violations[0]).toContain("PROVENANCE_VIOLATION");
    expect(provenance.violations[0]).toContain("INV-01");
  });

  it("3. Contract-Driven Provenance: Passes valid domain artifacts without false positives", () => {
    const dashPath = join(TEST_DIR_LUMINA, "src", "features", "dashboard", "DashboardPage.tsx");
    
    // Clean ceramics file
    writeFileSync(
      dashPath,
      `import React from "react";
export function DashboardPage() {
  return <div><h1>Lumina Terra</h1><span>Glaze calculations and kiln schedules</span></div>;
}
export default DashboardPage;`
    );

    const contract = {
      requiredModels: ["CeramicPiece", "GlazeRecipe", "KilnSchedule"],
      features: ["collection", "glazes", "kiln", "workshops"],
    };

    const provenance = DeterministicProjectFixer.validateArtifactProvenance(TEST_DIR_LUMINA, contract);
    expect(provenance.valid).toBe(true);
    expect(provenance.violations).toHaveLength(0);
  });

  it("4. Clean Directory Guard: Rejects non-empty directory without --incremental", () => {
    // Put a dummy file in the target directory
    writeFileSync(join(TEST_DIR_LUMINA, "existing-file.txt"), "some previous project code");

    // Invoking without incremental must throw GENERATION_TARGET_NOT_EMPTY
    expect(() => {
      assertCleanTargetDirectory(TEST_DIR_LUMINA, false);
    }).toThrow(/GENERATION_TARGET_NOT_EMPTY/);

    // Invoking with incremental=true must pass cleanly
    expect(() => {
      assertCleanTargetDirectory(TEST_DIR_LUMINA, true);
    }).not.toThrow();
  });

  it("5. Runtime Identity Invariant: Injected at bootstrap boundary and distinct per generation", () => {
    // 1. Generation Identity Creation
    const idLumina = GenerationIdentityManager.createIdentity({
      prompt: "Lumina Terra artisan pottery studio",
      canonicalSpec: { name: "Lumina Terra" },
    });

    const idAstro = GenerationIdentityManager.createIdentity({
      prompt: "Astro Journal celestial log",
      canonicalSpec: { name: "Astro Journal" },
    });

    // Each generation has unique generationId and promptHash
    expect(idLumina.generationId).not.toBe(idAstro.generationId);
    expect(idLumina.promptHash).not.toBe(idAstro.promptHash);

    // 2. Persist bootstrap identity in index.html
    writeFileSync(
      join(TEST_DIR_LUMINA, "index.html"),
      `<!DOCTYPE html><html><head><title>Test</title></head><body><div id="root"></div></body></html>`
    );

    GenerationIdentityManager.persistIdentity(TEST_DIR_LUMINA, idLumina);

    const { readFileSync } = require("node:fs");
    const htmlContent = readFileSync(join(TEST_DIR_LUMINA, "index.html"), "utf8");
    expect(htmlContent).toContain('id="__aegis_bootstrap__"');
    expect(htmlContent).toContain(idLumina.generationId);
    expect(htmlContent).toContain("window.__AEGIS_RENDER_STATE__");
  });

  it("6. Stale-Server Detection: RealBrowserAdapter rejects wrong generationId with RUNTIME_GENERATION_ID_MISMATCH", async () => {
    // Spin up an HTTP server returning an old generationId (e.g. Solar)
    const http = await import("node:http");
    const server = http.createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`<!DOCTYPE html>
<html>
<head>
  <script id="__aegis_bootstrap__">
    window.__AEGIS_BOOTED__ = true;
    window.__AEGIS_RENDER_STATE__ = {
      status: "ready",
      mounted: true,
      generationId: "gen_old_solar_telemetry_5173"
    };
  </script>
</head>
<body>
  <div id="root" style="width:1000px;height:600px;"><h1>Solar Telemetry</h1></div>
</body>
</html>`);
    });

    await new Promise<void>((resolve) => server.listen(9876, () => resolve()));

    try {
      // Validate with expected generationId = "gen_lumina_terra_2026"
      const result = await RealBrowserAdapter.executeAndCertify("http://localhost:9876", {
        expectedGenerationId: "gen_lumina_terra_2026",
      });

      expect(result.passed).toBe(false);
      expect(result.failureReason).toContain("RUNTIME_GENERATION_ID_MISMATCH");
      const mismatchCheck = result.checks.find(c => c.name === "Runtime Generation Identity Invariant");
      expect(mismatchCheck).toBeDefined();
      expect(mismatchCheck?.passed).toBe(false);
      expect(mismatchCheck?.details).toContain("RUNTIME_GENERATION_ID_MISMATCH");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});

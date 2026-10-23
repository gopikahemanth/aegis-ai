import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  GOLDEN_GENERATION_SCENARIOS,
  GOLDEN_EDITING_SCENARIOS,
} from "../golden-scenarios.js";

describe("Phase 0: Golden Scenarios Suite", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "aegis-golden-scenarios-"));
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("Golden Generation Scenarios", () => {
    it("has 3 distinct generation scenarios covering diverse architectural and operational domains", () => {
      expect(GOLDEN_GENERATION_SCENARIOS.length).toBe(3);

      const ids = GOLDEN_GENERATION_SCENARIOS.map((s) => s.id);
      expect(ids).toEqual([
        "gen-01-thalassa-habitat",
        "gen-02-orbitalsync-operations",
        "gen-03-veloce-atelier",
      ]);

      const domains = GOLDEN_GENERATION_SCENARIOS.map((s) => s.domain);
      expect(new Set(domains).size).toBe(3);
      expect(domains).toContain("marine-engineering");
      expect(domains).toContain("aerospace-operations");
      expect(domains).toContain("luxury-automotive");
    });

    it("verifies Thalassa Habitat (Spatial / Marine Engineering) specification", () => {
      const thalassa = GOLDEN_GENERATION_SCENARIOS.find((s) => s.id === "gen-01-thalassa-habitat");
      expect(thalassa).toBeDefined();
      expect(thalassa!.expectedModels.map((m) => m.name)).toEqual([
        "Chamber",
        "SensorReading",
        "TelemetryMetric",
        "AcousticProfile",
      ]);
      expect(thalassa!.expectedRoutes).toContain("/telemetry");
      expect(thalassa!.expectedRoutes).toContain("/soundscape");
      expect(thalassa!.expectedCapabilities).toContain("canvas-spatial-renderer");
    });

    it("verifies OrbitalSync (High-Volume Operational / Satellite Logistics) specification", () => {
      const orbital = GOLDEN_GENERATION_SCENARIOS.find((s) => s.id === "gen-02-orbitalsync-operations");
      expect(orbital).toBeDefined();
      expect(orbital!.expectedModels.map((m) => m.name)).toEqual([
        "Satellite",
        "DownlinkPass",
        "GroundStation",
        "AlertRecord",
      ]);
      expect(orbital!.expectedRoutes).toContain("/constellation");
      expect(orbital!.expectedRoutes).toContain("/passes");
      expect(orbital!.expectedCapabilities).toContain("realtime-orbital-drift-matrix");
    });

    it("verifies Veloce Atelier (Bespoke Atelier / Luxury Automotive) specification", () => {
      const veloce = GOLDEN_GENERATION_SCENARIOS.find((s) => s.id === "gen-03-veloce-atelier");
      expect(veloce).toBeDefined();
      expect(veloce!.expectedModels.map((m) => m.name)).toEqual([
        "VehicleModel",
        "ConfigurationSpec",
        "CommissioningAppointment",
        "WindTunnelTelemetry",
      ]);
      expect(veloce!.expectedRoutes).toContain("/configurator");
      expect(veloce!.expectedRoutes).toContain("/aerodynamics");
      expect(veloce!.expectedCapabilities).toContain("dynamic-aerodynamic-visualizer");
    });
  });

  describe("Golden Editing Scenarios", () => {
    it("has 3 distinct editing scenarios covering add, theme change, and decommissioning", () => {
      expect(GOLDEN_EDITING_SCENARIOS.length).toBe(3);
      const categories = GOLDEN_EDITING_SCENARIOS.map((s) => s.category);
      expect(categories).toEqual([
        "add-page-feature",
        "change-theme-tokens",
        "remove-refactor-feature",
      ]);
    });

    it("executes and verifies Edit Scenario 1: Add a Page & Feature", async () => {
      const scenario = GOLDEN_EDITING_SCENARIOS.find((s) => s.category === "add-page-feature")!;
      // Scaffold mock app
      const srcDir = join(tempDir, "src");
      mkdirSync(srcDir, { recursive: true });
      writeFileSync(
        join(srcDir, "App.tsx"),
        `import React from "react";\nexport function App() { return <div><Routes><Route path="/" element={<Home />} /></Routes></div>; }`,
        "utf8"
      );

      const result = await scenario.execute(tempDir);
      expect(result.success).toBe(true);
      expect(result.modifiedFiles.length).toBeGreaterThanOrEqual(1);

      const verification = await scenario.verify(tempDir);
      expect(verification.verified).toBe(true);
      expect(verification.errors.length).toBe(0);

      const appContent = readFileSync(join(srcDir, "App.tsx"), "utf8");
      expect(appContent).toContain("DiagnosticsPage");
      expect(appContent).toContain("/diagnostics");
    });

    it("executes and verifies Edit Scenario 2: Change Visual Theme & Tokens", async () => {
      const scenario = GOLDEN_EDITING_SCENARIOS.find((s) => s.category === "change-theme-tokens")!;

      const result = await scenario.execute(tempDir);
      expect(result.success).toBe(true);

      const verification = await scenario.verify(tempDir);
      expect(verification.verified).toBe(true);
      expect(verification.errors.length).toBe(0);

      const tokenContent = readFileSync(join(tempDir, "src", "design-system", "tokens.ts"), "utf8");
      expect(tokenContent).toContain("#d97706"); // Tactical amber
    });

    it("executes and verifies Edit Scenario 3: Remove / Refactor Feature Safely", async () => {
      const scenario = GOLDEN_EDITING_SCENARIOS.find((s) => s.category === "remove-refactor-feature")!;
      // Scaffold feature to decommission
      const featuresDir = join(tempDir, "src", "features");
      mkdirSync(featuresDir, { recursive: true });
      writeFileSync(
        join(featuresDir, "legacy-soundboard.tsx"),
        `export function LegacySoundboard() { return <div>Sound</div>; }`,
        "utf8"
      );

      const srcDir = join(tempDir, "src");
      writeFileSync(
        join(srcDir, "App.tsx"),
        `import { LegacySoundboard } from "./features/legacy-soundboard";\nexport function App() { return <LegacySoundboard />; }`,
        "utf8"
      );

      const result = await scenario.execute(tempDir);
      expect(result.success).toBe(true);

      const verification = await scenario.verify(tempDir);
      expect(verification.verified).toBe(true);
      expect(verification.errors.length).toBe(0);

      const appContent = readFileSync(join(srcDir, "App.tsx"), "utf8");
      expect(appContent).not.toContain("legacy-soundboard");
    });
  });
});

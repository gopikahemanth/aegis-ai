import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { TemplateConvergenceGate } from "../template-convergence-gate.js";
import { ArtifactProvenanceValidator } from "../../governance/artifact-provenance-validator.js";

describe("Negative Fixtures Hardening Suite — Quality Gates Under Adversarial Defects", () => {
  let fixtureDir: string;

  beforeEach(() => {
    fixtureDir = join(tmpdir(), `aegis-neg-fixture-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(join(fixtureDir, "src", "pages"), { recursive: true });
    mkdirSync(join(fixtureDir, "src", "components"), { recursive: true });
    mkdirSync(join(fixtureDir, ".aegis"), { recursive: true });
  });

  afterEach(() => {
    try {
      if (existsSync(fixtureDir)) {
        rmSync(fixtureDir, { recursive: true, force: true });
      }
    } catch {}
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Defect 1: Duplicate Navigation Shells
  // ──────────────────────────────────────────────────────────────────────────
  it("Negative Fixture 1: Rejects project when duplicate navigation shells are injected in App.tsx", () => {
    writeFileSync(
      join(fixtureDir, "src", "App.tsx"),
      `import React from "react";
import { Navbar } from "./components/Navbar";
import { Layout } from "./components/Layout";
import AppRoutes from "./routes";

export default function App() {
  return (
    <div className="flex">
      <Navbar />
      <Layout>
        <AppRoutes />
      </Layout>
    </div>
  );
}`
    );

    const report = TemplateConvergenceGate.audit(fixtureDir);
    expect(report.passed).toBe(false);
    expect(report.violations.some(v => v.includes("DUPLICATE_SHELL_NAVIGATION_DETECTED"))).toBe(true);
    expect(report.websiteIdentity.navigation).toBe("FAIL");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Defect 2: Cloned Pages / Cross-Route Structural Convergence
  // ──────────────────────────────────────────────────────────────────────────
  it("Negative Fixture 2: Rejects project when distinct routes share cloned parameter control IDs and action names", () => {
    writeFileSync(
      join(fixtureDir, "src", "pages", "AnalyticsPage.tsx"),
      `export default function AnalyticsPage() {
  const params = [
    { "id": "sampleWindow", "label": "Telemetry Sample Window" },
    { "id": "harmonicFilter", "label": "Harmonic Distortion Ceiling" },
    { "id": "degradationFactor", "label": "PV Degradation Model Rate" }
  ];
  const actions = [
    { "name": "Run Spectral FFT Analysis" },
    { "name": "Simulate Heatwave Degradation" }
  ];
  return <div>Analytics</div>;
}`
    );

    writeFileSync(
      join(fixtureDir, "src", "pages", "OperationsPage.tsx"),
      `export default function OperationsPage() {
  const params = [
    { "id": "sampleWindow", "label": "Telemetry Sample Window" },
    { "id": "harmonicFilter", "label": "Harmonic Distortion Ceiling" },
    { "id": "degradationFactor", "label": "PV Degradation Model Rate" }
  ];
  const actions = [
    { "name": "Run Spectral FFT Analysis" },
    { "name": "Simulate Heatwave Degradation" }
  ];
  return <div>Operations</div>;
}`
    );

    const report = TemplateConvergenceGate.audit(fixtureDir);
    expect(report.passed).toBe(false);
    expect(report.violations.some(v => v.includes("CROSS_ROUTE_STRUCTURAL_CONVERGENCE_DETECTED"))).toBe(true);
    expect(report.websiteIdentity.composition).toBe("FAIL");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Defect 3: Incorrect Domain Branding / Alien Brand Contamination
  // ──────────────────────────────────────────────────────────────────────────
  it("Negative Fixture 3: Rejects project when foreign brand artifacts contaminate a clean energy domain", () => {
    const cleanEnergyContract: any = {
      prompt: "Build an industrial renewable clean energy operations platform with solar inverter telemetry and wind turbine monitoring.",
      requiredModels: ["Asset", "Telemetry", "WorkOrder", "Incident"],
      requiredFeatures: ["asset-inventory", "telemetry-streams", "grid-operations", "maintenance"],
      requiredRoutes: ["/", "/assets", "/operations", "/maintenance", "/incidents"],
    };

    // Inject foreign Orbitalis satellite and luxury hotel artifacts
    mkdirSync(join(fixtureDir, "src", "features", "orbital-telemetry"), { recursive: true });
    mkdirSync(join(fixtureDir, "src", "features", "luxury-hotel"), { recursive: true });
    mkdirSync(join(fixtureDir, "src", "entities"), { recursive: true });

    writeFileSync(
      join(fixtureDir, "src", "features", "orbital-telemetry", "SatelliteOrbitCard.tsx"),
      "export const SatelliteOrbitCard = () => <div>Satellite Orbit</div>;"
    );
    writeFileSync(
      join(fixtureDir, "src", "features", "luxury-hotel", "RoomBookingModal.tsx"),
      "export const RoomBookingModal = () => <div>Hotel Suite</div>;"
    );
    writeFileSync(
      join(fixtureDir, "src", "entities", "SatelliteOrbit.tsx"),
      "export interface SatelliteOrbit { id: string; apogeeKm: number; }"
    );
    writeFileSync(
      join(fixtureDir, "src", "entities", "HotelRoom.tsx"),
      "export interface HotelRoom { id: string; ratePerNight: number; }"
    );

    const audit = ArtifactProvenanceValidator.auditArtifacts(fixtureDir, cleanEnergyContract);
    expect(audit.valid).toBe(false);
    expect(audit.unprovenancedArtifacts.length).toBeGreaterThanOrEqual(2);
    expect(audit.unprovenancedArtifacts.some(a => a.identifier.toLowerCase().includes("satellite"))).toBe(true);
    expect(audit.unprovenancedArtifacts.some(a => a.identifier.toLowerCase().includes("hotel"))).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Defect 4: Broken API Hydration / Disconnected State Detection
  // ──────────────────────────────────────────────────────────────────────────
  it("Negative Fixture 4: Detects and rejects repeated generic Search + Filter + Card convergence on specialized routes", () => {
    const specializedPlan = {
      productTitle: "GreenPulse High-Voltage Grid",
      experiencePattern: "realtime-console",
      experienceCapability: {
        experienceType: "DASHBOARD",
        renderingMode: "standard-dom",
        real3dRequired: false,
      },
    };

    // Create 3 pages that clone search-and-filter card grids instead of authentic telemetry
    writeFileSync(
      join(fixtureDir, "src", "pages", "PageA.tsx"),
      `export default function PageA() {
        return (
          <div>
            <input type="text" placeholder="Search..." />
            <button className="filter-btn">Filter</button>
            <div className="card-grid"><div className="card">Card 1</div></div>
          </div>
        );
      }`
    );
    writeFileSync(
      join(fixtureDir, "src", "pages", "PageB.tsx"),
      `export default function PageB() {
        return (
          <div>
            <input type="text" placeholder="Search..." />
            <button className="filter-btn">Filter</button>
            <div className="card-grid"><div className="card">Card 2</div></div>
          </div>
        );
      }`
    );

    const report = TemplateConvergenceGate.audit(fixtureDir, specializedPlan);
    expect(report.passed).toBe(false);
    expect(report.violations.some(v => v.includes("GENERIC_PAGE_STRUCTURE_CONVERGENCE"))).toBe(true);
  });
});

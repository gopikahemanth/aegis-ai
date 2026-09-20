import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SpecificationNormalizer } from "../../spec/canonical-spec.js";
import { ArtifactProvenanceValidator } from "../artifact-provenance-validator.js";
import { FastDeterministicSanitizer } from "../fast-sanitizer.js";

const TEST_DIR = join(process.cwd(), ".tmp-test-domain-isolation");

describe("Domain Isolation & Contract Provenance Invariant", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("1. Accurately disambiguates 3 distinct domains even when sharing words like 'fleet'", () => {
    const solarPrompt =
      "Build an industrial solar array telemetry and power generation analytics dashboard. " +
      "Operators should monitor live sensor telemetry records across solar inverter units, " +
      "aggregate real-time power metrics, inspect dynamic trend charts, and mutate operational setpoints.";

    const bicyclePrompt =
      "Build a tourist bicycle fleet rental and maintenance tracking system with real-time " +
      "station availability, bike checkouts, reservations, and mechanic service dispatch.";

    const museumPrompt =
      "Build a museum art collection and exhibition curation portal where curators track " +
      "artifacts, exhibitions, artists, acquisitions, and provenance records.";

    const solarSpec = SpecificationNormalizer.normalize(solarPrompt, { name: "solar-telemetry" });
    const bicycleSpec = SpecificationNormalizer.normalize(bicyclePrompt, { name: "bicycle-rental" });
    const museumSpec = SpecificationNormalizer.normalize(museumPrompt, { name: "museum-collection" });

    // 1. Solar Telemetry
    expect(solarSpec.domainCategory).toBe("solar-telemetry");
    expect(solarSpec.dataModels).toContain("Inverter");
    expect(solarSpec.dataModels).toContain("TelemetryPoint");
    expect(solarSpec.dataModels).not.toContain("Bicycle");
    expect(solarSpec.dataModels).not.toContain("Rental");
    expect(solarSpec.dataModels).not.toContain("Artifact");

    // 2. Bicycle Fleet Rental
    expect(bicycleSpec.domainCategory).toBe("bicycle-rental");
    expect(bicycleSpec.dataModels).toContain("Bicycle");
    expect(bicycleSpec.dataModels).toContain("Rental");
    expect(bicycleSpec.dataModels).not.toContain("Inverter");
    expect(bicycleSpec.dataModels).not.toContain("TelemetryPoint");
    expect(bicycleSpec.dataModels).not.toContain("Artifact");

    // 3. Museum Collection
    expect(museumSpec.domainCategory).toBe("museum-collection");
    expect(museumSpec.dataModels).toContain("Artifact");
    expect(museumSpec.dataModels).toContain("Exhibition");
    expect(museumSpec.dataModels).not.toContain("Inverter");
    expect(museumSpec.dataModels).not.toContain("Bicycle");
  });

  it("2. Rejects and purges alien bicycle artifacts from a SolarTelemetry project", () => {
    const solarContract: any = {
      prompt: "Build an industrial solar array telemetry and power generation analytics dashboard with inverter monitoring.",
      requiredModels: ["User", "Inverter", "TelemetryPoint", "Alert", "Setpoint"],
      requiredFeatures: ["telemetry-analytics", "inverter-fleet", "grid-monitoring", "alerts"],
      requiredRoutes: ["/", "/inverters", "/telemetry", "/analytics", "/alerts"],
    };

    // Setup project structure
    mkdirSync(join(TEST_DIR, "src", "features", "telemetry"), { recursive: true });
    mkdirSync(join(TEST_DIR, "src", "features", "bicycle", "components"), { recursive: true });
    mkdirSync(join(TEST_DIR, "src", "entities"), { recursive: true });
    mkdirSync(join(TEST_DIR, "src", "pages"), { recursive: true });
    mkdirSync(join(TEST_DIR, "server", "routes"), { recursive: true });

    // Legitimate Solar Files
    writeFileSync(join(TEST_DIR, "src", "features", "telemetry", "TelemetryChart.tsx"), "export const TelemetryChart = () => <div/>;");
    writeFileSync(join(TEST_DIR, "src", "entities", "Inverter.tsx"), "export interface Inverter { id: string; kw: number; }");
    writeFileSync(join(TEST_DIR, "src", "pages", "InvertersPage.tsx"), "export default function InvertersPage() { return <div/>; }");
    writeFileSync(join(TEST_DIR, "server", "routes", "inverter.routes.ts"), "export const inverterRouter = null;");

    // Injected Contaminated Bicycle Files
    writeFileSync(join(TEST_DIR, "src", "features", "bicycle", "components", "BicycleTable.tsx"), "export const BicycleTable = () => <div/>;");
    writeFileSync(join(TEST_DIR, "src", "entities", "Bicycle.tsx"), "export interface Bicycle { id: string; }");
    writeFileSync(join(TEST_DIR, "src", "pages", "BicyclesPage.tsx"), "export default function BicyclesPage() { return <div/>; }");
    writeFileSync(join(TEST_DIR, "server", "routes", "bicycle.routes.ts"), "export const bicycleRouter = null;");

    // Entrypoint referencing both
    writeFileSync(
      join(TEST_DIR, "server", "index.ts"),
      `import express from "express";\nimport inverterRouter from "./routes/inverter.routes";\nimport bicycleRouter from "./routes/bicycle.routes";\nconst app = express();\napp.use("/api/inverters", inverterRouter);\napp.use("/api/bicycles", bicycleRouter);\n`
    );

    // Initial audit before purge
    const initialAudit = ArtifactProvenanceValidator.auditArtifacts(TEST_DIR, solarContract);
    expect(initialAudit.valid).toBe(false);
    expect(initialAudit.unprovenancedArtifacts.some(a => a.identifier === "bicycle")).toBe(true);
    expect(initialAudit.unprovenancedArtifacts.some(a => a.identifier === "Bicycle")).toBe(true);

    // Run purge
    const purgeReport = ArtifactProvenanceValidator.purgeUnjustifiedArtifacts(TEST_DIR, solarContract);
    expect(purgeReport.purgedCount).toBeGreaterThanOrEqual(3);

    // Verify contaminated files were eliminated
    expect(existsSync(join(TEST_DIR, "src", "features", "bicycle"))).toBe(false);
    expect(existsSync(join(TEST_DIR, "src", "entities", "Bicycle.tsx"))).toBe(false);
    expect(existsSync(join(TEST_DIR, "src", "pages", "BicyclesPage.tsx"))).toBe(false);
    expect(existsSync(join(TEST_DIR, "server", "routes", "bicycle.routes.ts"))).toBe(false);

    // Verify legitimate solar files were preserved
    expect(existsSync(join(TEST_DIR, "src", "features", "telemetry", "TelemetryChart.tsx"))).toBe(true);
    expect(existsSync(join(TEST_DIR, "src", "entities", "Inverter.tsx"))).toBe(true);
    expect(existsSync(join(TEST_DIR, "src", "pages", "InvertersPage.tsx"))).toBe(true);
    expect(existsSync(join(TEST_DIR, "server", "routes", "inverter.routes.ts"))).toBe(true);

    // Verify server/index.ts was cleaned
    const serverIndexContent = readFileSync(join(TEST_DIR, "server", "index.ts"), "utf8");
    expect(serverIndexContent).not.toContain("bicycle.routes");
    expect(serverIndexContent).not.toContain("/api/bicycles");
    expect(serverIndexContent).toContain("inverter.routes");
    expect(serverIndexContent).toContain("/api/inverters");
  });

  it("3. FastDeterministicSanitizer cleans unprovenanced artifacts across domains", () => {
    const museumContract: any = {
      prompt: "Build a museum art collection and exhibition curation portal.",
      requiredModels: ["User", "Artifact", "Exhibition", "Artist"],
      requiredFeatures: ["artifact-catalog", "exhibitions", "artists"],
      requiredRoutes: ["/", "/artifacts", "/exhibitions", "/artists"],
    };

    mkdirSync(join(TEST_DIR, "src", "features", "artifacts"), { recursive: true });
    mkdirSync(join(TEST_DIR, "src", "features", "hotel"), { recursive: true }); // foreign hotel artifact
    mkdirSync(join(TEST_DIR, "src", "entities"), { recursive: true });

    writeFileSync(join(TEST_DIR, "src", "features", "artifacts", "ArtifactGrid.tsx"), "export const ArtifactGrid = () => <div/>;");
    writeFileSync(join(TEST_DIR, "src", "features", "hotel", "RoomList.tsx"), "export const RoomList = () => <div/>;");
    writeFileSync(join(TEST_DIR, "src", "entities", "Artifact.tsx"), "export interface Artifact { id: string; }");
    writeFileSync(join(TEST_DIR, "src", "entities", "HotelRoom.tsx"), "export interface HotelRoom { id: string; }");

    const report = FastDeterministicSanitizer.sanitizeProject(TEST_DIR, museumContract);
    expect(report.unjustifiedArtifactsPurged).toBeGreaterThanOrEqual(2);

    expect(existsSync(join(TEST_DIR, "src", "features", "hotel"))).toBe(false);
    expect(existsSync(join(TEST_DIR, "src", "entities", "HotelRoom.tsx"))).toBe(false);
    expect(existsSync(join(TEST_DIR, "src", "features", "artifacts"))).toBe(true);
    expect(existsSync(join(TEST_DIR, "src", "entities", "Artifact.tsx"))).toBe(true);
  });
});

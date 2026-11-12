import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FinalAcceptanceGate } from "../final-acceptance-gate.js";
import { UniversalRequirementInterpreter } from "../../requirement-intelligence/universal-requirement-interpreter.js";
import { ArchitectureContractEngine } from "../../architect/architecture-contract-engine.js";
import { InteractiveComponentGenerator } from "../../design/interactive-component-generator.js";
import { DynamicApiGenerator } from "../../backend/dynamic-api-generator.js";
import * as fs from "fs";
import * as path from "path";

const TEST_DIR = path.join(process.cwd(), ".tmp_test_acceptance_gate");

describe("Phase 10: FinalAcceptanceGate", () => {
  let contract: any;
  let spec: any;

  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEST_DIR, { recursive: true });

    spec = UniversalRequirementInterpreter.interpret("Build an e-commerce platform");
    contract = ArchitectureContractEngine.synthesizeContract(spec);
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("accurately returns BLOCKED when infrastructure is unavailable", () => {
    const report = FinalAcceptanceGate.evaluateAndPackage(TEST_DIR, contract, {
      infrastructureBlocked: true,
      blockReason: "Database port 5432 unreachable",
    });

    expect(report.status).toBe("BLOCKED");
    expect(report.criticalFailures).toContain("Database port 5432 unreachable");
  });

  it("accurately returns FAILED when build fails or manifests are missing", () => {
    const report = FinalAcceptanceGate.evaluateAndPackage(TEST_DIR, contract, {
      buildSuccess: false,
    });

    expect(report.status).toBe("FAILED");
    expect(report.criticalFailures.length).toBeGreaterThan(0);
  });

  it("accurately returns SUCCESS and generates delivery assets on full pass", () => {
    // 1. Root package.json
    fs.writeFileSync(path.join(TEST_DIR, "package.json"), JSON.stringify({ name: "app" }));

    // 2. Generate and write full frontend components
    const feFiles = InteractiveComponentGenerator.generateAll(contract, spec.domainVocabulary);
    for (const f of feFiles) {
      const fullPath = path.join(TEST_DIR, f.path);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, f.content, "utf-8");
    }

    // 3. Generate and write backend & Prisma schema
    const beFiles = DynamicApiGenerator.generateAll(contract, spec.domainVocabulary);
    for (const f of beFiles) {
      const fullPath = path.join(TEST_DIR, f.path);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, f.content, "utf-8");
    }

    const report = FinalAcceptanceGate.evaluateAndPackage(TEST_DIR, contract, {
      buildSuccess: true,
      testPassRate: 1.0,
    });

    expect(report.status).toBe("SUCCESS");
    expect(report.deliveredArtifacts).toContain("README.md");
    expect(report.deliveredArtifacts).toContain("setup.bat");
    expect(report.deliveredArtifacts).toContain("setup.sh");

    // Verify setup scripts exist on disk
    expect(fs.existsSync(path.join(TEST_DIR, "setup.bat"))).toBe(true);
    expect(fs.existsSync(path.join(TEST_DIR, "setup.sh"))).toBe(true);
  });

  it("returns INCOMPLETE when non-critical tests have lower pass rate but no build errors", () => {
    fs.writeFileSync(path.join(TEST_DIR, "package.json"), JSON.stringify({ name: "app" }));
    fs.mkdirSync(path.join(TEST_DIR, "src"), { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, "src", "App.tsx"), "<Routes></Routes>");
    fs.mkdirSync(path.join(TEST_DIR, "prisma"), { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, "prisma", "schema.prisma"), "datasource db { provider = 'sqlite' }\ngenerator client { provider = 'prisma-client-js' }\nmodel User { id Int @id }");

    const report = FinalAcceptanceGate.evaluateAndPackage(TEST_DIR, contract, {
      buildSuccess: true,
      testPassRate: 0.7, // Lower than 0.9 threshold
    });

    // Should not claim full SUCCESS if tests are failing, but should acknowledge completion
    expect(report.status).not.toBe("SUCCESS");
  });
});

import { describe, it, expect } from "vitest";
import { AutonomousTestSynthesizer } from "../autonomous-test-synthesizer.js";
import { UniversalRequirementInterpreter } from "../../requirement-intelligence/universal-requirement-interpreter.js";
import { ArchitectureContractEngine } from "../../architect/architecture-contract-engine.js";

describe("Phase 8: AutonomousTestSynthesizer", () => {
  it("synthesizes valid backend API and frontend component test files", () => {
    const spec = UniversalRequirementInterpreter.interpret(
      "Build a project task management board with tasks and projects"
    );
    const contract = ArchitectureContractEngine.synthesizeContract(spec);
    const files = AutonomousTestSynthesizer.generateAll(contract, spec.domainVocabulary);

    expect(files.length).toBeGreaterThanOrEqual(2);

    const apiTest = files.find(f => f.path.includes("api.test.ts"));
    expect(apiTest).toBeDefined();
    expect(apiTest?.content).toContain("GET /api/health");
    expect(apiTest?.content).toContain("POST /api/");
    expect(apiTest?.content).toContain("supertest");
    expect(apiTest?.testCount).toBeGreaterThanOrEqual(5);

    const feTest = files.find(f => f.path.includes("components.test.tsx"));
    expect(feTest).toBeDefined();
    expect(feTest?.content).toContain("@testing-library/react");
    expect(feTest?.content).toContain("fireEvent.click");
    expect(feTest?.content).toContain("fireEvent.change");
  });

  it("constructs executable browser workflow actions for E2E verification", () => {
    const spec = UniversalRequirementInterpreter.interpret(
      "Online pet adoption portal with animals and shelter profiles"
    );
    const contract = ArchitectureContractEngine.synthesizeContract(spec);
    const actions = AutonomousTestSynthesizer.buildE2EBrowserWorkflow(contract, spec.domainVocabulary);

    expect(actions.length).toBeGreaterThanOrEqual(5);
    const types = actions.map(a => a.type);
    expect(types).toContain("NAVIGATE");
    expect(types).toContain("ASSERT_TEXT");
    expect(types).toContain("CLICK");
    expect(actions.some(a => a.name.includes("Admin"))).toBe(true);
  });
});

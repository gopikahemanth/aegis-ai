import { describe, it, expect } from "vitest";
import { UniversalRequirementInterpreter } from "../universal-requirement-interpreter.js";
import { UniversalArchitecturePlanner } from "../universal-architecture-planner.js";
import { UniversalGenerationOrchestrator } from "../universal-generation-orchestrator.js";

describe("AEGIS Phase 48 — Universal Generation Orchestrator", () => {
  it("synthesizes full file tree including package.json, prisma schema, express routes, and React UI", () => {
    const spec = UniversalRequirementInterpreter.interpret("Build an LMS course platform");
    const blueprint = UniversalArchitecturePlanner.planArchitecture(spec);
    const project = UniversalGenerationOrchestrator.generateProject(spec, blueprint);

    expect(project.totalFiles).toBeGreaterThanOrEqual(4);
    expect(project.files["package.json"]).toBeDefined();
    expect(project.files["prisma/schema.prisma"]).toContain("model Course");
    expect(project.files["server/index.ts"]).toContain("/api/courses");
    expect(project.files["src/App.tsx"]).toContain("AegisLMSPlatform");
  });
});

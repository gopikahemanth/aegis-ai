import { describe, it, expect } from "vitest";
import { UniversalRequirementInterpreter } from "../universal-requirement-interpreter.js";
import { RequirementClarificationEngine } from "../requirement-clarification-engine.js";

describe("RequirementClarificationEngine — Ambiguity & Conflict Analysis", () => {
  it("detects underspecified database and applies documented SQLite default", () => {
    const spec = UniversalRequirementInterpreter.interpret("Build a task management dashboard with team workspaces");
    const report = RequirementClarificationEngine.analyze(spec);

    expect(report.isExecutionSafe).toBe(true);
    expect(report.totalClarifications).toBeGreaterThan(0);

    const dbItem = report.items.find(i => i.field === "databaseEngine");
    expect(dbItem).toBeDefined();
    expect(dbItem?.resolvedValue).toBe("sqlite");
    expect(dbItem?.isAutonomouslyResolved).toBe(true);
    expect(dbItem?.rationale).toContain("SQLite");
  });

  it("detects underspecified authentication for fullstack apps and defaults to JWT", () => {
    const spec = UniversalRequirementInterpreter.interpret("Build an online learning platform with student courses");
    const report = RequirementClarificationEngine.analyze(spec);

    const authItem = report.items.find(i => i.field === "authStrategy");
    expect(authItem).toBeDefined();
    expect(authItem?.resolvedValue).toBe("jwt");
    expect(authItem?.options.length).toBeGreaterThanOrEqual(2);
  });

  it("detects and resolves conflicts between static site and backend persistence", () => {
    const spec = UniversalRequirementInterpreter.interpret("Build a static client-only site with PostgreSQL database backend");
    const report = RequirementClarificationEngine.analyze(spec);

    const conflictItem = report.items.find(i => i.field === "architectureConflict");
    expect(conflictItem).toBeDefined();
    expect(conflictItem?.resolvedValue).toBe("fullstack");
  });

  it("flags very short prompts informatively while providing autonomous resolution", () => {
    const spec = UniversalRequirementInterpreter.interpret("Todo app");
    const report = RequirementClarificationEngine.analyze(spec);

    const infoItem = report.items.find(i => i.field === "promptCompleteness");
    expect(infoItem).toBeDefined();
    expect(infoItem?.severity).toBe("INFORMATIONAL");
    expect(report.isExecutionSafe).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { ProductArchitecturePlanner } from "../architecture-planner.js";
import { GenerationOrchestrator } from "../generation-orchestrator.js";

describe("AEGIS Phase 46 — Generation Orchestrator", () => {
  it("scaffolds package.json, prisma schema, express server, and react frontend files", () => {
    const plan = ProductArchitecturePlanner.planArchitecture("GymPortal", "Gym management with members");
    const payload = GenerationOrchestrator.generateFullStackProject(plan, "./test-output");

    expect(payload.totalFiles).toBeGreaterThanOrEqual(5);
    expect(payload.filesGenerated["package.json"]).toBeDefined();
    expect(payload.filesGenerated["prisma/schema.prisma"]).toContain("model Member");
    expect(payload.filesGenerated["server/index.ts"]).toContain("express");
    expect(payload.filesGenerated["src/App.tsx"]).toContain("GymPortal");
  });
});

import { describe, it, expect } from "vitest";
import { DatabaseEvolutionEngine } from "../database-evolution-engine.js";

describe("AEGIS Phase 56 — Database Evolution Engine", () => {
  it("safely evolves schema with new models, foreign keys, and indexes while preserving data", () => {
    const result = DatabaseEvolutionEngine.evolveSchema();
    expect(result.isSchemaValid).toBe(true);
    expect(result.isMigrationSuccessful).toBe(true);
    expect(result.existingDataPreserved).toBe(true);
    expect(result.newModelsCreated).toContain("Payment");
    expect(result.relationsAdded.length).toBeGreaterThan(0);
    expect(result.indexesCreated.length).toBeGreaterThan(0);
  });

  it("handles migration failure cleanly", () => {
    const result = DatabaseEvolutionEngine.evolveSchema({ simulateMigrationFailure: true });
    expect(result.isMigrationSuccessful).toBe(false);
  });
});

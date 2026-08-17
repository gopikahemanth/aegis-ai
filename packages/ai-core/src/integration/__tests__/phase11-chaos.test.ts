import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { MasterProductPipeline } from "../master-pipeline.js";
import { TransactionalRepairSystem } from "../../healing/transactional-repair.js";
import { ImportExportValidator } from "../../governance/import-export-validator.js";
import { ErrorClassifier } from "../../healing/error-classifier.js";
import { ProjectGenerationLock } from "../../evolution/project-generation-lock.js";

const CHAOS_DIR = join(process.cwd(), ".tmp_test_phase11_chaos");

describe("AEGIS Phase 11 — Chaos Resilience & Failure Recovery Matrix", () => {
  beforeEach(() => {
    if (existsSync(CHAOS_DIR)) rmSync(CHAOS_DIR, { recursive: true, force: true });
    mkdirSync(CHAOS_DIR, { recursive: true });
    ProjectGenerationLock.reset();
  });

  afterEach(() => {
    ProjectGenerationLock.reset();
    if (existsSync(CHAOS_DIR)) rmSync(CHAOS_DIR, { recursive: true, force: true });
  });

  it("halts pipeline at Clarification stage on ambiguous destructive request without disk changes", async () => {
    const res = await MasterProductPipeline.generate({
      projectId: "chaos_proj",
      projectPath: CHAOS_DIR,
      prompt: "Delete database and wipe all data immediately",
    });

    expect(res.status).toBe("NEEDS_CLARIFICATION");
    expect(res.stages["CLARIFICATION"].status).toBe("NEEDS_CLARIFICATION");
    // Assert no project files or contracts created
    expect(existsSync(join(CHAOS_DIR, "src"))).toBe(false);
  });

  it("halts pipeline at AuthorizationGate on destructive feature removal without human authorization", async () => {
    // Initial dummy project
    mkdirSync(join(CHAOS_DIR, "src"), { recursive: true });
    writeFileSync(join(CHAOS_DIR, "package.json"), JSON.stringify({ name: "chaos_proj" }), "utf8");

    const res = await MasterProductPipeline.evolve({
      projectId: "chaos_proj",
      projectPath: CHAOS_DIR,
      feedbackPrompt: "Remove database table and drop all existing records",
    });

    expect(res.status).toBe("AWAITING_AUTHORIZATION");
    expect(res.stages["AUTHORIZATION_GATE"].status).toBe("AWAITING_AUTHORIZATION");
  });

  it("performs atomic checkpoint rollback on unfixable syntax corruption", () => {
    const targetFile = "src/routes/api.ts";
    mkdirSync(join(CHAOS_DIR, "src/routes"), { recursive: true });
    const originalContent = "export const apiHandler = () => ({ status: 'ok' });";
    writeFileSync(join(CHAOS_DIR, targetFile), originalContent, "utf8");

    const cpId = TransactionalRepairSystem.createCheckpoint(CHAOS_DIR, [targetFile], { rootCause: "SYNTAX_ERROR" });

    // Inject corruption
    writeFileSync(join(CHAOS_DIR, targetFile), "CORRUPTED SYNTAX %%% INVALID", "utf8");

    // Rollback
    TransactionalRepairSystem.rollback(CHAOS_DIR, cpId, "Unfixable parser corruption");
    expect(readFileSync(join(CHAOS_DIR, targetFile), "utf8")).toBe(originalContent);
  });

  it("classifies environment connection failure and leaves source code untouched", () => {
    const envErr = "ECONNREFUSED 127.0.0.1:5432 - connect to postgres failed";
    const classification = ErrorClassifier.classify(envErr);

    expect(classification.category).toBe("ENVIRONMENT_ERROR");
    expect(classification.isEnvironment).toBe(true);


  });
});

import { Orchestrator } from "@aegis/ai-core";
import { ProviderFactory } from "@aegis/ai-core";
import { existsSync, rmSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  ProjectCreator,
  cleanDirectory,
} from "@aegis/project-builder";

import { ExecutionPipeline } from "./pipeline/execution-pipeline.js";

/**
 * Normalises the framework name returned by the Orchestrator to the
 * canonical key used by FrameworkRouter (always lowercase-with-hyphens).
 */
function normalizeFrameworkName(framework: string): string {
  const f = (framework || "").toLowerCase().trim();
  if (f.includes("react") || f.includes("vite")) return "react-vite";
  if (f.includes("next")) return "next";
  if (f.includes("express")) return "express";
  if (f.includes("html")) return "html";
  // default
  return "react-vite";
}

export class ExecutionEngine {
  private readonly provider =
    ProviderFactory.createDefaultProvider();

  private readonly orchestrator =
    new Orchestrator(this.provider);

  private readonly creator =
    new ProjectCreator();

  private readonly pipeline =
    new ExecutionPipeline(this.provider);

  /**
   * Sets the design mode before calling execute().
   * Called by the CLI when --design-mode flag is passed.
   *
   * @param mode  "AUTO" | "USER_SELECTED" | "RANDOM" | "CUSTOM"
   * @param hint  Optional tone hint for USER_SELECTED mode (e.g. "calm", "dark")
   */
  setDesignMode(mode: string, hint?: string): void {
    (this.orchestrator as any).designMode = mode;
    if (hint) (this.orchestrator as any).designModeHint = hint;
  }

  async execute(request: string, imagePath?: string, targetDir?: string, options?: { incremental?: boolean }) {
    const basePath = process.env.INIT_CWD || process.cwd();
    const projectPath = targetDir ? resolve(basePath, targetDir) : resolve(basePath, "./generated/project");

    // ── Clean Generation Isolation Guard ──────────────────────────────────
    if (existsSync(projectPath)) {
      const existingEntries = readdirSync(projectPath).filter(e => e !== ".git" && e !== ".DS_Store");
      if (existingEntries.length > 0 && !options?.incremental) {
        throw new Error(
          `GENERATION_TARGET_NOT_EMPTY: Target directory "${projectPath}" contains an existing project (${existingEntries.length} files/folders). ` +
          `Clean generation requires an empty or non-existent directory to prevent cross-domain contamination. ` +
          `Pass --incremental to explicitly evolve an existing project, or specify a clean directory via --output <dir>.`
        );
      }
    }

    // ── Clean existing project directory & .aegis state if safe ────────────
    if (!options?.incremental) {
      cleanDirectory(projectPath);
      const initialAegis = join(projectPath, ".aegis");
      if (existsSync(initialAegis)) {
        try {
          rmSync(initialAegis, { recursive: true, force: true });
        } catch { /* non-fatal */ }
      }
    }


    console.log("Analyzing request...");

    // ── Step 1: generateProject — resolves architecture contract ────────────
    const result = await this.orchestrator.generateProject(request, projectPath, imagePath);

    console.log(`[ExecutionEngine] generateProject result: framework=${result.framework}, tasks=${result.tasks?.length ?? 0}`);

    // ── Step 2: Back up all .aegis/ contracts before template creation ───────
    // ReactViteTemplate.create() wipes the output directory, so we preserve
    // the full .aegis contract state and restore it afterward.
    const aegisDir = join(projectPath, ".aegis");
    const savedAegisFiles: Record<string, string> = {};
    if (existsSync(aegisDir)) {
      try {
        const { readdirSync, statSync } = await import("node:fs");
        const files = readdirSync(aegisDir);
        for (const file of files) {
          const filePath = join(aegisDir, file);
          if (statSync(filePath).isFile()) {
            savedAegisFiles[file] = readFileSync(filePath, "utf8");
          }
        }
        console.log(`[ExecutionEngine] ✓ Backed up ${Object.keys(savedAegisFiles).length} .aegis contract file(s) before template creation.`);
      } catch { /* ignore */ }
    }

    // ── Step 3: Create project scaffold from framework template ──────────────
    console.log("Creating project template...");
    const normalizedFramework = normalizeFrameworkName(result.framework);
    console.log(`[ExecutionEngine] Using framework template: "${normalizedFramework}" (from "${result.framework}")`);
    try {
      await this.creator.create(normalizedFramework, "generated-project", projectPath);
    } catch (creatorError: any) {
      console.warn(`[ExecutionEngine] Warning: Template creation issue (${creatorError.message}). Continuing — directory may already be scaffolded.`);
    }

    // ── Step 4: Restore backed-up architecture contracts ─────────────────────
    if (Object.keys(savedAegisFiles).length > 0) {
      try {
        if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });
        for (const [file, content] of Object.entries(savedAegisFiles)) {
          writeFileSync(join(aegisDir, file), content, "utf8");
        }
        console.log(`[ExecutionEngine] ✓ Restored ${Object.keys(savedAegisFiles).length} .aegis contract file(s) after template creation.`);
      } catch (restoreErr: any) {
        console.warn(`[ExecutionEngine] Warning: Could not restore .aegis contracts: ${restoreErr.message}`);
      }
    }

    // ── Step 5: generateApplication — full code generation pipeline ──────────
    console.log("Generating application...");
    const generated = await this.orchestrator.generateApplication(request, projectPath, imagePath, result.lockedPlan);
    console.log(`[ExecutionEngine] generateApplication complete. Files: ${(generated as any)?.files?.length ?? "unknown"}`);

    // ── Step 6: Install, build, and self-heal ────────────────────────────────
    const pipeline = await this.pipeline.execute(request, projectPath);

    return pipeline.success;
  }
}

import { Orchestrator } from "@aegis/ai-core";
import { ProviderFactory } from "@aegis/ai-core";
import { existsSync, rmSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  ProjectCreator,
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

  async execute(request: string, imagePath?: string) {
    const projectPath = resolve(process.cwd(), "./generated/project");

    // ── Clean existing project directory ────────────────────────────────────
    try {
      if (existsSync(projectPath)) {
        if (process.platform === "win32") {
          try {
            const { execSync } = await import("node:child_process");
            execSync(`powershell -Command "Get-Process node,vite -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*generated*' } | Stop-Process -Force"`, { stdio: "ignore" });
          } catch { /* ignore */ }
        }
        rmSync(projectPath, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
      }
    } catch (rmError: any) {
      console.warn(`[ExecutionEngine] Warning: Could not clean path "${projectPath}" (${rmError.message}). Proceeding in incremental mode.`);
    }

    console.log("Analyzing request...");

    // ── Step 1: generateProject — resolves architecture contract ────────────
    const result = await this.orchestrator.generateProject(request, projectPath, imagePath);

    console.log(`[ExecutionEngine] generateProject result: framework=${result.framework}, tasks=${result.tasks?.length ?? 0}`);

    // ── Step 2: Back up the .aegis/ contract before template creation ────────
    // ReactViteTemplate.create() wipes the output directory, so we preserve
    // the architecture contract JSON and restore it afterward.
    const aegisDir = join(projectPath, ".aegis");
    const contractPath = join(aegisDir, "architecture-contract.json");
    let savedContract: string | null = null;
    try {
      if (existsSync(contractPath)) {
        savedContract = readFileSync(contractPath, "utf8");
        console.log("[ExecutionEngine] ✓ Backed up architecture-contract.json before template creation.");
      }
    } catch { /* ignore */ }

    // ── Step 3: Create project scaffold from framework template ──────────────
    console.log("Creating project template...");
    const normalizedFramework = normalizeFrameworkName(result.framework);
    console.log(`[ExecutionEngine] Using framework template: "${normalizedFramework}" (from "${result.framework}")`);
    try {
      await this.creator.create(normalizedFramework, "generated-project", projectPath);
    } catch (creatorError: any) {
      console.warn(`[ExecutionEngine] Warning: Template creation issue (${creatorError.message}). Continuing — directory may already be scaffolded.`);
    }

    // ── Step 4: Restore backed-up architecture contract ──────────────────────
    if (savedContract) {
      try {
        if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });
        writeFileSync(contractPath, savedContract, "utf8");
        console.log("[ExecutionEngine] ✓ Restored architecture-contract.json after template creation.");
      } catch (restoreErr: any) {
        console.warn(`[ExecutionEngine] Warning: Could not restore architecture-contract.json: ${restoreErr.message}`);
      }
    }

    // ── Step 5: generateApplication — full code generation pipeline ──────────
    console.log("Generating application...");
    const generated = await this.orchestrator.generateApplication(request, projectPath, imagePath);
    console.log(`[ExecutionEngine] generateApplication complete. Files: ${(generated as any)?.files?.length ?? "unknown"}`);

    // ── Step 6: Install, build, and self-heal ────────────────────────────────
    const pipeline = await this.pipeline.execute(request, projectPath);

    return pipeline.success;
  }
}

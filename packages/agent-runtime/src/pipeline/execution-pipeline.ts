import { DependencyInstaller } from "@aegis/project-builder";
import { BuildRunner } from "@aegis/project-builder";
import { ErrorAnalyzer } from "@aegis/project-builder";

import { SelfHealer } from "@aegis/ai-core";
import type { AIProvider } from "@aegis/ai-core";
import { DependencyResolver } from "@aegis/project-builder";
import type { PipelineResult } from "./pipeline-result.js";

export class ExecutionPipeline {
  private readonly installer = new DependencyInstaller();
  private readonly builder = new BuildRunner();
  private readonly analyzer = new ErrorAnalyzer();
  private readonly dependencyResolver = new DependencyResolver();
  private readonly healer: SelfHealer;
  private readonly maxRetries = 3;

  constructor(provider: AIProvider) {
    this.healer = new SelfHealer(provider);
  }

  async execute(
    request: string,
    projectPath: string,
  ): Promise<PipelineResult> {

    console.log("Installing dependencies...");
    const install = await this.installer.install("pnpm", projectPath);
    console.log(`[Install] Exit code: ${install.exitCode}`);

    let healingAttempts = 0; // Only incremented for real code repair attempts (not PROVIDER_QUOTA)

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      console.log(`\nBuild attempt ${attempt}/${this.maxRetries}`);

      const build = await this.builder.build("pnpm", projectPath);

      if (build.success) {
        console.log("✅ Build succeeded.");
        return { success: true, attempts: attempt };
      }

      console.log(`❌ Build failed.`);

      const diagnostics = [build.stderr || "", build.stdout || ""].filter(Boolean).join("\n");
      const error = this.analyzer.analyze(build.stderr, build.stdout);

      // ── Classify the error before deciding on action ──────────────────────
      const isProviderQuota = diagnostics.includes("429") || diagnostics.includes("RESOURCE_EXHAUSTED") || diagnostics.includes("Too Many Requests");
      const isArchitectureError = (
        diagnostics.includes("ARCHITECTURE_CONFLICT") ||
        diagnostics.includes("CONTRACT_CONFLICT") ||
        diagnostics.includes("DATABASE_CONFIGURATION_CONFLICT") ||
        diagnostics.includes("ORM_INCOMPATIBILITY") ||
        diagnostics.includes("CONTRACT_GATE_FAILED")
      );
      const isEnvironmentError = (
        diagnostics.includes("P1000") ||
        diagnostics.includes("DATABASE_URL") ||
        diagnostics.includes("datasource provider") ||
        diagnostics.includes("ECONNREFUSED")
      );

      // ARCHITECTURE and ENVIRONMENT errors cannot be fixed by AI code repair
      if (isArchitectureError || isEnvironmentError) {
        console.error(`[Pipeline] ❌ BLOCKING: Build failure is classified as ${isArchitectureError ? "ARCHITECTURE" : "ENVIRONMENT"} error.`);
        console.error(`[Pipeline] Self-healer will NOT run — these errors must be fixed in the architecture contract or environment config.`);
        return { success: false, attempts: attempt };
      }

      // PROVIDER_QUOTA: 429 rate limit — failover only, do NOT count as healing attempt
      if (isProviderQuota) {
        console.warn(`[Pipeline] ⚠️ PROVIDER_QUOTA: AI provider returned 429. Attempt does NOT count as a healing attempt.`);
        console.warn(`[Pipeline] Retrying build after provider quota error (attempt ${attempt} not consumed)...`);
        continue; // Retry build without consuming a healing attempt
      }

      // ── Try dependency resolution first (fast path) ──────────────────────
      const packages = this.dependencyResolver.resolve(error.details);
      if (packages.length > 0) {
        console.log(`[DependencyResolver] Installing missing packages: ${packages.join(", ")}`);
        await this.installer.installPackages("pnpm", projectPath, packages);
        continue; // Retry build after install
      }

      // ── Model escalation for code repair ─────────────────────────────────
      // Only count actual AI repair calls against the healing budget
      healingAttempts++;
      if (healingAttempts > this.maxRetries) {
        console.error(`[Pipeline] Max healing attempts (${this.maxRetries}) reached. Stopping pipeline.`);
        return { success: false, attempts: attempt };
      }

      const escalationLevel = healingAttempts === 1 ? "fast" : healingAttempts === 2 ? "balanced" : "strong";
      console.log(`[Repair] Healing attempt ${healingAttempts} — escalation level: ${escalationLevel}`);

      await this.healer.heal(
        request,
        error,
        projectPath,
        escalationLevel,
      );
    }

    return { success: false, attempts: this.maxRetries };
  }
}

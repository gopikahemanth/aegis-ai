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

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      console.log(`\nBuild attempt ${attempt}/${this.maxRetries}`);

      const build = await this.builder.build("pnpm", projectPath);

      if (build.success) {
        console.log("✅ Build succeeded.");
        return { success: true, attempts: attempt };
      }

      console.log(`❌ Build failed.`);

      const error = this.analyzer.analyze(build.stderr, build.stdout);

      // ── Try dependency resolution first (fast path) ──────────────────────
      const packages = this.dependencyResolver.resolve(error.details);
      if (packages.length > 0) {
        console.log(`[DependencyResolver] Installing missing packages: ${packages.join(", ")}`);
        await this.installer.installPackages("pnpm", projectPath, packages);
        continue; // Retry build after install
      }

      // ── Model escalation ─────────────────────────────────────────────────
      // Attempt 1: fast model (gemini-flash-lite or equivalent)
      // Attempt 2: balanced model
      // Attempt 3: strongest model available
      const escalationLevel = attempt === 1 ? "fast" : attempt === 2 ? "balanced" : "strong";
      console.log(`[Repair] Attempt ${attempt} — escalation level: ${escalationLevel}`);

      await this.healer.heal(
        request,
        error,
        projectPath,
        escalationLevel,   // passed through to provider options
      );
    }

    return { success: false, attempts: this.maxRetries };
  }
}

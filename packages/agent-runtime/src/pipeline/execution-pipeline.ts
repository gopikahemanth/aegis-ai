import { DependencyInstaller } from "@aegis/project-builder";
import { BuildRunner } from "@aegis/project-builder";
import { ErrorAnalyzer } from "@aegis/project-builder";

import { SelfHealer } from "@aegis/ai-core";
import type { AIProvider } from "@aegis/ai-core";

import type { PipelineResult } from "./pipeline-result.js";

export class ExecutionPipeline {
  private readonly installer = new DependencyInstaller();

  private readonly builder = new BuildRunner();

  private readonly analyzer = new ErrorAnalyzer();

  private readonly healer: SelfHealer;

  private readonly maxRetries = 3;

  constructor(
    provider: AIProvider,
  ) {
    this.healer = new SelfHealer(provider);
  }

  async execute(
    request: string,
    projectPath: string,
  ): Promise<PipelineResult> {

    console.log("Installing dependencies...");

    const install = await this.installer.install(
      "pnpm",
      projectPath,
    );

    console.log(install.exitCode);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {

      console.log(
        `Build attempt ${attempt}/${this.maxRetries}`
      );

      const build = await this.builder.build(
        "pnpm",
        projectPath,
      );

      if (build.success) {

        console.log("✅ Build succeeded.");

        return {
          success: true,
          attempts: attempt,
        };
      }

      console.log("❌ Build failed.");

      const error = this.analyzer.analyze(
        build.stderr,
        build.stdout,
      );

      console.log(error);

      await this.healer.heal(
        request,
        error,
        projectPath,
      );
    }

    return {
      success: false,
      attempts: this.maxRetries,
    };
  }
}

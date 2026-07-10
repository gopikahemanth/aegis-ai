import { BuildRunner } from "@aegis/project-builder";

import { EditEngine } from "@aegis/ai-core";
import type { AIProvider } from "@aegis/ai-core";

import type { PipelineResult } from "./pipeline-result.js";
import { ErrorAnalyzer } from "@aegis/project-builder";
import { SelfHealer } from "@aegis/ai-core";
export class EditPipeline {
  private readonly editor: EditEngine;

  private readonly builder =
    new BuildRunner();
  private readonly analyzer =
  new ErrorAnalyzer();

private readonly healer: SelfHealer;

private readonly maxRetries = 3;
 constructor(
  provider: AIProvider,
) {
  this.editor =
    new EditEngine(
      provider,
    );

  this.healer =
    new SelfHealer(
      provider,
    );
}
async execute(
  request: string,
  projectPath: string,
): Promise<PipelineResult> {

    console.log(
    "Editing project...",
  );

  await this.editor.edit(
    request,
    projectPath,
  );

  for (
    let attempt = 1;
    attempt <= this.maxRetries;
    attempt++
  ) {
    console.log(
      `Build attempt ${attempt}/${this.maxRetries}`,
    );

    const build =
      await this.builder.build(
        "pnpm",
        projectPath,
      );

    if (build.success) {
      console.log(
        "✅ Build succeeded.",
      );

      return {
        success: true,
        attempts: attempt,
      };
    }

    console.log(
      "❌ Build failed.",
    );

    const error =
      this.analyzer.analyze(
        build.stderr,
        build.stdout,
      );

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

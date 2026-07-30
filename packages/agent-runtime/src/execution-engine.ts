import { Orchestrator } from "@aegis/ai-core";
import { ProviderFactory } from "@aegis/ai-core";
import { existsSync, rmSync } from "node:fs";

import {
  ProjectCreator,
} from "@aegis/project-builder";

import { ExecutionPipeline } from "./pipeline/execution-pipeline.js";

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
    const projectPath = "./generated/project";
    try {
      if (existsSync(projectPath)) {
        rmSync(projectPath, {
          recursive: true,
          force: true,
        });
      }
    } catch (rmError: any) {
      console.warn(`[ExecutionEngine] Warning: Could not clean path "${projectPath}" (${rmError.message}). Proceeding in incremental mode.`);
    }
    console.log("Analyzing request...");

    const result =
      await this.orchestrator.generateProject(
        request,
        projectPath,
        imagePath,
      );

    console.log(result);

    console.log(
      "Creating project template..."
    );

    await this.creator.create(
      result.framework,
      "generated-project",
      projectPath,
    );
    console.log(
  "Generating application..."
);

const generated =
  await this.orchestrator.generateApplication(
    request,
    projectPath,
    imagePath,
  );

console.log(generated);

    console.log(
      "Template created."
    );

    const pipeline =
      await this.pipeline.execute(
        request,
        projectPath,
      );

    return pipeline.success;
  }
}

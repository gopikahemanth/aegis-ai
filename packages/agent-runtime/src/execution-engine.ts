import { Orchestrator } from "@aegis/ai-core";
import { ProviderFactory } from "@aegis/ai-core";

import { ExecutionPipeline } from "./pipeline/execution-pipeline.js";

export class ExecutionEngine {
  private readonly provider =
    ProviderFactory.createDefaultProvider();

  private readonly orchestrator =
    new Orchestrator(this.provider);

  private readonly pipeline =
    new ExecutionPipeline(this.provider);

  async execute(request: string) {
    const projectPath = "./generated/project";

    console.log("Generating project...");

    const result =
      await this.orchestrator.generateProject(
        request,
        projectPath,
      );

    console.log(result);

    const pipeline =
      await this.pipeline.execute(
        request,
        projectPath,
      );

    return pipeline.success;
  }
}

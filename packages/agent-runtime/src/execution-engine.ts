import { Orchestrator } from "@aegis/ai-core";
import { GroqProvider } from "@aegis/ai-core";

import { DependencyInstaller } from "@aegis/project-builder";
import { BuildRunner } from "@aegis/project-builder";
import { ErrorAnalyzer } from "@aegis/project-builder";

export class ExecutionEngine {
  private readonly provider = new GroqProvider();

  private readonly orchestrator = new Orchestrator(this.provider);

  private readonly installer = new DependencyInstaller();

  private readonly builder = new BuildRunner();

  private readonly analyzer = new ErrorAnalyzer();

  async execute(request: string) {
    console.log("Generating project...");

    const result = await this.orchestrator.generateProject(
      request,
      "./generated/project"
    );

    console.log(result);

    console.log("Installing dependencies...");

    const install = await this.installer.install(
      "pnpm",
      "./generated/project"
    );

    console.log(install.exitCode);

    console.log("Building project...");

    const build = await this.builder.build(
      "pnpm",
      "./generated/project"
    );

    console.log(build);

    if (!build.success) {
      const error = this.analyzer.analyze(
        build.stderr,
        build.stdout
      );

      console.log(error);
    }

    return build.success;
  }
}

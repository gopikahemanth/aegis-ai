import { Orchestrator } from "@aegis/ai-core";
import { ProviderFactory } from "@aegis/ai-core";

import { DependencyInstaller } from "@aegis/project-builder";
import { BuildRunner } from "@aegis/project-builder";
import { ErrorAnalyzer } from "@aegis/project-builder";
import { SelfHealer } from "@aegis/ai-core";
export class ExecutionEngine {
private readonly provider = ProviderFactory.createDefaultProvider();

  private readonly orchestrator = new Orchestrator(this.provider);

  private readonly installer = new DependencyInstaller();

  private readonly builder = new BuildRunner();

  private readonly analyzer = new ErrorAnalyzer();

private readonly healer = new SelfHealer(this.provider);

  private readonly maxRetries = 3;

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

   for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
  console.log(`Build attempt ${attempt}/${this.maxRetries}`);

  const build = await this.builder.build(
    "pnpm",
    "./generated/project"
  );

  if (build.success) {
    console.log("✅ Build succeeded.");
    return true;
  }

  console.log("❌ Build failed.");

  const error = this.analyzer.analyze(
    build.stderr,
    build.stdout
  );

  console.log(error);
const report = await this.healer.heal(
  request,
  error,
  "./generated/project",
);

console.log(report);

console.log(report);

   console.log(report);

  if (attempt === this.maxRetries) {
    console.log("Maximum retry limit reached.");
    return false;
  }

  console.log("Retrying build...");
}

return false;
  }
}

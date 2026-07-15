import { BuildRunner } from "./build-runner.js";

export class BuildOrchestrator {
  private readonly runner =
    new BuildRunner();

  async verify(
    projectPath: string,
  ) {
    const result =
      await this.runner.run(
        projectPath,
      );

    if (result.success) {
      console.log(
        "✓ Build succeeded.",
      );
    } else {
      console.log(
        "✗ Build failed.",
      );
    }

    return result;
  }
}

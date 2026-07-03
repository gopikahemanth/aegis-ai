import { TerminalRunner } from "@aegis/project-builder";

import { FrameworkDetector } from "./detector.js";

export class ProjectExecutor {
  private readonly terminal = new TerminalRunner();

  private readonly detector = new FrameworkDetector();

  async execute(project: string) {
    const commands = this.detector.detect(project);

    if (commands.install) {
      await this.terminal.run(
        commands.install.command,
        commands.install.args,
        project
      );
    }

    if (commands.build) {
      return this.terminal.run(
        commands.build.command,
        commands.build.args,
        project
      );
    }

    return {
      stdout: "",
      stderr: "",
      exitCode: 0,
    };
  }
}

import { TerminalRunner } from "./terminal.js";

export class BuildRunner {
  private readonly terminal = new TerminalRunner();

  async build(
    packageManager: "npm" | "pnpm" | "yarn",
    cwd: string,
  ) {
    const command = packageManager;

    const args =
      packageManager === "npm"
        ? ["run", "build"]
        : ["build"];

const result = await this.terminal.run(command, args, cwd);

return {
  success: result.exitCode === 0,
  ...result,
};
  }
}

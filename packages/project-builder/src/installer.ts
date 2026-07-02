import { TerminalRunner } from "./terminal.js";

export class DependencyInstaller {
  private readonly terminal = new TerminalRunner();

  async install(
    packageManager: "npm" | "pnpm" | "yarn",
    cwd: string,
  ) {
    const args =
      packageManager === "npm"
        ? ["install"]
        : ["install"];

    return this.terminal.run(packageManager, args, cwd);
  }
}

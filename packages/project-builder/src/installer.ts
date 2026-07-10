import { TerminalRunner } from "./terminal.js";

export class DependencyInstaller {
  private readonly terminal = new TerminalRunner();

  async install(
    packageManager: "npm" | "pnpm" | "yarn",
    cwd: string,
  ) {
    const args =
      packageManager === "pnpm"
        ? ["install", "--ignore-workspace"]
        : ["install"];

    return this.terminal.run(
      packageManager,
      args,
      cwd,
    );
  }

  async installPackages(
    packageManager: "npm" | "pnpm" | "yarn",
    cwd: string,
    packages: string[],
  ) {
    if (packages.length === 0) {
      return;
    }

    const args =
      packageManager === "npm"
        ? ["install", ...packages]
        : ["add", ...packages];

    return this.terminal.run(
      packageManager,
      args,
      cwd,
    );
  }
}

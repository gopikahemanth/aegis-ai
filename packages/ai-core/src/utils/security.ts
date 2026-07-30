import { resolve, normalize, relative } from "node:path";

export class SecurityGuard {
  private static readonly COMMAND_WHITELIST = [
    "npm",
    "pnpm",
    "yarn",
    "git",
    "docker",
    "npx"
  ];

  // Sanitizes a shell command string to prevent execution hijacking via metacharacters
  static sanitizeCommand(cmd: string): string {
    // Strip metacharacters that allow chaining (;, &, |, `, $, etc.)
    const cleanCmd = cmd
      .replace(/[;&|`$<>]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Verify command prefix matches whitelist
    const firstWord = cleanCmd.split(" ")[0];
    if (!this.COMMAND_WHITELIST.includes(firstWord)) {
      throw new Error(`Security Violation: Command prefix "${firstWord}" is not in the whitelist.`);
    }

    return cleanCmd;
  }

  // Asserts that a target path is securely locked inside a base directory, preventing traversal escapes
  static validateSafePath(basePath: string, targetPath: string): string {
    const absoluteBase = resolve(basePath);
    const absoluteTarget = resolve(targetPath);

    // Get the relative path from base to target
    const rel = relative(absoluteBase, absoluteTarget);

    // If rel path starts with '..' or is absolute root escapes, throw error
    if (rel.startsWith("..") || normalize(rel).startsWith("/")) {
      throw new Error(`Security Violation: Path traversal detected outside execution boundary. Base: [${basePath}], Target: [${targetPath}]`);
    }

    return absoluteTarget;
  }
}

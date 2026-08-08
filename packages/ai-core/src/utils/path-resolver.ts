import { resolve, normalize, isAbsolute } from "node:path";

export class ProjectPathResolver {
  public static resolveProjectFile(projectRoot: string, targetPath: string): string {
    const normalizedRoot = normalize(projectRoot).replace(/\\/g, "/");
    let normalizedTarget = normalize(targetPath).replace(/\\/g, "/");

    // Remove leading ./ or ../ prefixes
    normalizedTarget = normalizedTarget.replace(/^(\.\/|\.\.\/)+/, "");

    // Hard Assertion: Check for duplicate project root artifact
    if (normalizedTarget.includes("generated/project/generated/project") || normalizedTarget.includes("generated\\project\\generated\\project")) {
      console.warn(`[ProjectPathGuard] ⚠️ DUPLICATE PROJECT ROOT DETECTED in targetPath: "${targetPath}". Cleaning up...`);
      normalizedTarget = normalizedTarget.replace("generated/project/generated/project", "generated/project");
      normalizedTarget = normalizedTarget.replace("generated\\project\\generated\\project", "generated\\project");
    }

    // Strip leading "generated/project/" if projectRoot already ends with "generated/project"
    if (normalizedRoot.endsWith("generated/project") && normalizedTarget.startsWith("generated/project/")) {
      normalizedTarget = normalizedTarget.replace(/^generated\/project\//, "");
    }

    // 1. If targetPath already starts with normalizedRoot, return as-is
    if (normalizedTarget.startsWith(normalizedRoot)) {
      return normalizedTarget;
    }

    if (isAbsolute(normalizedTarget)) {
      return normalizedTarget;
    }

    return normalize(resolve(projectRoot, normalizedTarget)).replace(/\\/g, "/");
  }

  public static resolveProjectPath(projectRoot: string, targetPath: string): string {
    return this.resolveProjectFile(projectRoot, targetPath);
  }
}

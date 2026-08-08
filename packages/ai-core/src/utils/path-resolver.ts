import { resolve, normalize, isAbsolute } from "node:path";

export class ProjectPathResolver {
  public static resolveProjectPath(projectRoot: string, targetPath: string): string {
    const normalizedRoot = normalize(projectRoot).replace(/\\/g, "/");
    let normalizedTarget = normalize(targetPath).replace(/\\/g, "/");

    // Remove leading slashes/dots if relative
    normalizedTarget = normalizedTarget.replace(/^(\.\/|\.\.\\)+/, "");

    // Check if targetPath already contains projectRoot to prevent path duplication
    if (normalizedTarget.startsWith(normalizedRoot)) {
      return normalizedTarget;
    }

    // Check duplicated folder segment (e.g., generated/project/generated/project)
    const rootBase = normalizedRoot.split("/").pop();
    if (rootBase && normalizedTarget.includes(`${rootBase}/${rootBase}`)) {
      normalizedTarget = normalizedTarget.replace(`${rootBase}/${rootBase}`, rootBase);
      if (normalizedTarget.startsWith(normalizedRoot)) {
        return normalizedTarget;
      }
    }

    if (isAbsolute(normalizedTarget)) {
      return normalizedTarget;
    }

    return normalize(resolve(projectRoot, normalizedTarget)).replace(/\\/g, "/");
  }
}

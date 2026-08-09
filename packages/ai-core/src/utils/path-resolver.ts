import { resolve, normalize, isAbsolute, dirname, join } from "node:path";
import { existsSync } from "node:fs";

export class DuplicateProjectRootError extends Error {
  constructor(path: string) {
    super(`DUPLICATE_PROJECT_ROOT: Path contains duplicate root segment: "${path}"`);
    this.name = "DuplicateProjectRootError";
  }
}

/**
 * ProjectRootSingleton — canonical absolute project root, set once.
 * All pipeline components should use this to avoid path concatenation bugs.
 */
export class ProjectRootSingleton {
  private static _root: string | null = null;

  public static setRoot(absolutePath: string): void {
    const abs = resolve(absolutePath);
    ProjectRootSingleton._root = abs;
  }

  public static getRoot(): string | null {
    return ProjectRootSingleton._root;
  }

  public static reset(): void {
    ProjectRootSingleton._root = null;
  }
}

export class ProjectPathResolver {
  /**
   * Assert that a path does not contain duplicate root segments.
   * Throws DuplicateProjectRootError if it does.
   */
  public static assertNoDuplicateRoot(path: string): void {
    const normalized = path.replace(/\\/g, "/");
    if (
      normalized.includes("generated/project/generated/project") ||
      normalized.includes("generated\\project\\generated\\project")
    ) {
      console.error(`[ProjectPathGuard] DUPLICATE PROJECT ROOT DETECTED: ${path}`);
      throw new DuplicateProjectRootError(path);
    }
  }

  /**
   * Remove duplicate root segments from a path.
   * e.g. "/root/generated/project/generated/project/src/App.tsx"
   *   → "/root/generated/project/src/App.tsx"
   */
  public static deduplicateRoot(path: string, rootFragment: string): string {
    const normalized = path.replace(/\\/g, "/");
    const frag = rootFragment.replace(/\\/g, "/").replace(/\/$/, "");
    const doubled = frag + "/" + frag.split("/").pop() + "/";
    if (normalized.includes(doubled)) {
      return normalized.replace(doubled, frag + "/");
    }
    // Also handle the full doubled path
    const doubled2 = frag + "/" + frag + "/";
    if (normalized.includes(doubled2)) {
      return normalized.replace(doubled2, frag + "/");
    }
    return path;
  }

  public static resolveProjectFile(projectRoot: string, targetPath: string): string {
    const normalizedRoot = normalize(projectRoot).replace(/\\/g, "/");
    let normalizedTarget = normalize(targetPath).replace(/\\/g, "/");

    // Remove leading ./ or ../ prefixes
    normalizedTarget = normalizedTarget.replace(/^(\.\/|\.\.\/)+/, "");

    // Hard Assertion & Error Guard for duplicate project root
    if (
      normalizedTarget.includes("generated/project/generated/project") ||
      normalizedTarget.includes("generated\\project\\generated\\project")
    ) {
      console.error(`[ProjectPathGuard] DUPLICATE PROJECT ROOT DETECTED: ${targetPath}`);
      throw new DuplicateProjectRootError(targetPath);
    }

    // Strip leading "generated/project/" if projectRoot already ends with "generated/project"
    if (normalizedRoot.endsWith("generated/project") && normalizedTarget.startsWith("generated/project/")) {
      normalizedTarget = normalizedTarget.replace(/^generated\/project\//, "");
    }

    // If targetPath already starts with normalizedRoot, return as-is
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

  /**
   * Extension-Aware Module Resolution:
   * Resolves local imports (e.g. ./routes, @/shared/components/Button) by checking:
   * 1. exact file
   * 2. .ts
   * 3. .tsx
   * 4. .js
   * 5. .jsx
   * 6. index.ts / index.tsx / index.js / index.jsx inside directory
   */
  public static resolveModule(projectRoot: string, importerPath: string, importSpecifier: string): string | null {
    const root = normalize(projectRoot).replace(/\\/g, "/");
    let baseDir = root;

    if (importerPath) {
      const fullImporter = this.resolveProjectFile(root, importerPath);
      baseDir = dirname(fullImporter);
    }

    let targetPath = importSpecifier;
    if (importSpecifier.startsWith("@/")) {
      targetPath = join(root, "src", importSpecifier.slice(2)).replace(/\\/g, "/");
    } else if (importSpecifier.startsWith(".")) {
      targetPath = join(baseDir, importSpecifier).replace(/\\/g, "/");
    } else {
      targetPath = join(root, importSpecifier).replace(/\\/g, "/");
    }

    const candidateExtensions = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js", "/index.jsx"];

    for (const ext of candidateExtensions) {
      const candidate = targetPath + ext;
      if (existsSync(candidate)) {
        return candidate;
      }
    }

    return null;
  }
}

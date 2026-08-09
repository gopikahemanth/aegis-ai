import { resolve, normalize, isAbsolute, dirname, join } from "node:path";
import { existsSync, statSync } from "node:fs";

export class DuplicateProjectRootError extends Error {
  constructor(path: string) {
    super(`DUPLICATE_PROJECT_ROOT: Path contains duplicate root segment: "${path}"`);
    this.name = "DuplicateProjectRootError";
  }
}

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

/**
 * ImportResolver — Centralized resolution and extension normalization engine.
 * Handles relative imports, tsconfig @/ path aliases, extension normalization (.tsxx -> .tsx),
 * and directory index file resolution across all Aegis pipeline subsystems.
 */
export class ImportResolver {
  public static readonly EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

  /**
   * Normalize path string to remove doubled/invalid extensions.
   * e.g. "AnalysisList.tsxx" -> "AnalysisList.tsx"
   *      "Foo.jsxx"         -> "Foo.jsx"
   */
  public static normalizeExtension(path: string): string {
    if (!path) return path;
    let normalized = path.replace(/\\/g, "/");

    // Repair .tsxx, .tsxxx, .jsxx, .jsxxy
    normalized = normalized.replace(/\.tsx+$/i, ".tsx");
    normalized = normalized.replace(/\.jsx+$/i, ".jsx");
    normalized = normalized.replace(/\.ts{2,}$/i, ".ts");
    normalized = normalized.replace(/\.js{2,}$/i, ".js");

    return normalized;
  }

  /**
   * Resolve an import specifier relative to project root and importing file.
   * Checks exact path, extension variations, and directory index files.
   */
  public static resolve(projectRoot: string, importerPath: string, importSpecifier: string): string | null {
    const root = normalize(projectRoot).replace(/\\/g, "/");
    let cleanSpecifier = ImportResolver.normalizeExtension(importSpecifier);

    if (!cleanSpecifier.startsWith(".") && !cleanSpecifier.startsWith("/") && !cleanSpecifier.startsWith("@/")) {
      return "external";
    }

    let baseDir = root;
    if (importerPath) {
      const fullImporter = ImportResolver.normalizeExtension(resolve(root, importerPath));
      baseDir = dirname(fullImporter);
    }

    let targetBasePath: string;
    if (cleanSpecifier.startsWith("@/")) {
      targetBasePath = join(root, "src", cleanSpecifier.slice(2)).replace(/\\/g, "/");
    } else if (cleanSpecifier.startsWith(".")) {
      targetBasePath = join(baseDir, cleanSpecifier).replace(/\\/g, "/");
    } else {
      targetBasePath = join(root, cleanSpecifier).replace(/\\/g, "/");
    }

    // 1. Direct file check
    if (existsSync(targetBasePath)) {
      try {
        if (statSync(targetBasePath).isFile()) return targetBasePath;
      } catch {}
    }

    // 2. Extension checks (.ts, .tsx, .js, .jsx)
    for (const ext of ImportResolver.EXTENSIONS) {
      const candidate = targetBasePath + ext;
      if (existsSync(candidate)) {
        try {
          if (statSync(candidate).isFile()) return candidate;
        } catch {}
      }
    }

    // 3. Directory index checks
    for (const ext of ImportResolver.EXTENSIONS) {
      const candidate = join(targetBasePath, `index${ext}`).replace(/\\/g, "/");
      if (existsSync(candidate)) {
        try {
          if (statSync(candidate).isFile()) return candidate;
        } catch {}
      }
    }

    return null;
  }
}

export class ProjectPathResolver {
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

  public static deduplicateRoot(path: string, rootFragment: string): string {
    const normalized = path.replace(/\\/g, "/");
    const frag = rootFragment.replace(/\\/g, "/").replace(/\/$/, "");
    const doubled = frag + "/" + frag.split("/").pop() + "/";
    if (normalized.includes(doubled)) {
      return normalized.replace(doubled, frag + "/");
    }
    const doubled2 = frag + "/" + frag + "/";
    if (normalized.includes(doubled2)) {
      return normalized.replace(doubled2, frag + "/");
    }
    return path;
  }

  public static resolveProjectFile(projectRoot: string, targetPath: string): string {
    const normalizedRoot = normalize(projectRoot).replace(/\\/g, "/");
    let normalizedTarget = ImportResolver.normalizeExtension(normalize(targetPath).replace(/\\/g, "/"));

    normalizedTarget = normalizedTarget.replace(/^(\.\/|\.\.\/)+/, "");

    if (
      normalizedTarget.includes("generated/project/generated/project") ||
      normalizedTarget.includes("generated\\project\\generated\\project")
    ) {
      console.error(`[ProjectPathGuard] DUPLICATE PROJECT ROOT DETECTED: ${targetPath}`);
      throw new DuplicateProjectRootError(targetPath);
    }

    if (normalizedRoot.endsWith("generated/project") && normalizedTarget.startsWith("generated/project/")) {
      normalizedTarget = normalizedTarget.replace(/^generated\/project\//, "");
    }

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

  public static resolveModule(projectRoot: string, importerPath: string, importSpecifier: string): string | null {
    return ImportResolver.resolve(projectRoot, importerPath, importSpecifier);
  }
}

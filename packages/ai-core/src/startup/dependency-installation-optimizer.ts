import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

export interface DependencyCacheState {
  dependencyHash: string;
  lockfileHash: string;
  packageManager: "pnpm" | "npm" | "yarn";
  installMethod: "prefer-offline" | "offline" | "full" | "cached";
  installedAt: string;
  verified: boolean;
  packageCount: number;
}

export interface SyncCheckResult {
  synchronized: boolean;
  reason: string;
  dependencyHash: string;
  lockfileHash: string;
  missingPackages?: string[];
}

export class DependencyInstallationOptimizer {
  /**
   * Computes a deterministic SHA256 fingerprint for a project's dependency manifest
   */
  public static computeDependencyHash(packageJsonContent: string | Record<string, any>, packageManager: string = "pnpm"): string {
    try {
      const parsed = typeof packageJsonContent === "string" ? JSON.parse(packageJsonContent) : packageJsonContent;
      const deps = parsed.dependencies || {};
      const devDeps = parsed.devDependencies || {};
      const peerDeps = parsed.peerDependencies || {};

      // Sort keys deterministically
      const sortedDeps = Object.keys(deps).sort().reduce((acc, key) => { acc[key] = deps[key]; return acc; }, {} as any);
      const sortedDevDeps = Object.keys(devDeps).sort().reduce((acc, key) => { acc[key] = devDeps[key]; return acc; }, {} as any);
      const sortedPeerDeps = Object.keys(peerDeps).sort().reduce((acc, key) => { acc[key] = peerDeps[key]; return acc; }, {} as any);

      const normalized = JSON.stringify({
        packageManager,
        dependencies: sortedDeps,
        devDependencies: sortedDevDeps,
        peerDependencies: sortedPeerDeps,
      });

      return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
    } catch {
      return createHash("sha256").update(String(packageJsonContent)).digest("hex").slice(0, 16);
    }
  }

  /**
   * Computes a lockfile fingerprint
   */
  public static computeLockfileHash(cwd: string): string {
    const pnpmLock = join(cwd, "pnpm-lock.yaml");
    const npmLock = join(cwd, "package-lock.json");

    if (existsSync(pnpmLock)) {
      try {
        return createHash("sha256").update(readFileSync(pnpmLock, "utf8")).digest("hex").slice(0, 16);
      } catch {
        return "pnpm-lock-read-err";
      }
    } else if (existsSync(npmLock)) {
      try {
        return createHash("sha256").update(readFileSync(npmLock, "utf8")).digest("hex").slice(0, 16);
      } catch {
        return "npm-lock-read-err";
      }
    }
    return "no-lockfile";
  }

  /**
   * Verifies if declared dependencies actually exist on disk in node_modules
   */
  public static checkMissingInstalledPackages(cwd: string, declaredPackages: string[]): string[] {
    const nodeModules = join(cwd, "node_modules");
    if (!existsSync(nodeModules)) return declaredPackages;

    const missing: string[] = [];
    for (const pkg of declaredPackages) {
      const pkgPath = join(nodeModules, pkg);
      if (!existsSync(pkgPath)) {
        missing.push(pkg);
      }
    }
    return missing;
  }

  /**
   * Checks whether the target directory's dependencies are already synchronized
   */
  public static checkSynchronization(cwd: string, packageManager: "pnpm" | "npm" | "yarn" = "pnpm"): SyncCheckResult {
    const pkgPath = join(cwd, "package.json");
    if (!existsSync(pkgPath)) {
      return { synchronized: true, reason: "No package.json present", dependencyHash: "none", lockfileHash: "none" };
    }

    const pkgContent = readFileSync(pkgPath, "utf8");
    const dependencyHash = DependencyInstallationOptimizer.computeDependencyHash(pkgContent, packageManager);
    const lockfileHash = DependencyInstallationOptimizer.computeLockfileHash(cwd);

    const nodeModulesPath = join(cwd, "node_modules");
    if (!existsSync(nodeModulesPath)) {
      return {
        synchronized: false,
        reason: "node_modules directory does not exist",
        dependencyHash,
        lockfileHash,
      };
    }

    // Check .aegis/dependency-cache.json
    const cacheFile = join(cwd, ".aegis/dependency-cache.json");
    if (existsSync(cacheFile)) {
      try {
        const cache: DependencyCacheState = JSON.parse(readFileSync(cacheFile, "utf8"));
        if (cache.verified && cache.dependencyHash === dependencyHash && cache.packageManager === packageManager) {
          let parsed: any = {};
          try { parsed = JSON.parse(pkgContent); } catch {}
          const allDeclared = [...Object.keys(parsed.dependencies || {}), ...Object.keys(parsed.devDependencies || {})];
          
          // Spot-check top packages
          const spotCheck = allDeclared.slice(0, 10);
          const missing = DependencyInstallationOptimizer.checkMissingInstalledPackages(cwd, spotCheck);
          
          if (missing.length === 0) {
            return {
              synchronized: true,
              reason: `Dependencies synchronized and verified (Hash: ${dependencyHash})`,
              dependencyHash,
              lockfileHash,
            };
          } else {
            return {
              synchronized: false,
              reason: `Cached state matched but missing packages in node_modules: ${missing.join(", ")}`,
              dependencyHash,
              lockfileHash,
              missingPackages: missing,
            };
          }
        }
      } catch {}
    }

    // Fallback: If node_modules exists, check if all declared packages exist
    try {
      const parsed = JSON.parse(pkgContent);
      const allDeclared = [...Object.keys(parsed.dependencies || {}), ...Object.keys(parsed.devDependencies || {})];
      if (allDeclared.length === 0) {
        return { synchronized: true, reason: "No dependencies declared", dependencyHash, lockfileHash };
      }
      const missing = DependencyInstallationOptimizer.checkMissingInstalledPackages(cwd, allDeclared);
      if (missing.length === 0) {
        DependencyInstallationOptimizer.saveCache(cwd, dependencyHash, lockfileHash, packageManager, "cached", allDeclared.length);
        return {
          synchronized: true,
          reason: `All ${allDeclared.length} declared packages verified in node_modules`,
          dependencyHash,
          lockfileHash,
        };
      }
      return {
        synchronized: false,
        reason: `${missing.length} declared package(s) missing from node_modules: ${missing.slice(0, 5).join(", ")}`,
        dependencyHash,
        lockfileHash,
        missingPackages: missing,
      };
    } catch {
      return { synchronized: false, reason: "Could not parse package.json", dependencyHash, lockfileHash };
    }
  }

  /**
   * Saves dependency cache state to .aegis/dependency-cache.json
   */
  public static saveCache(
    cwd: string,
    dependencyHash: string,
    lockfileHash: string,
    packageManager: "pnpm" | "npm" | "yarn",
    installMethod: "prefer-offline" | "offline" | "full" | "cached" = "prefer-offline",
    packageCount: number = 0
  ): void {
    const aegisDir = join(cwd, ".aegis");
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });

    const state: DependencyCacheState = {
      dependencyHash,
      lockfileHash,
      packageManager,
      installMethod,
      installedAt: new Date().toISOString(),
      verified: true,
      packageCount,
    };

    writeFileSync(join(aegisDir, "dependency-cache.json"), JSON.stringify(state, null, 2), "utf8");
  }

  /**
   * Invalidates cache
   */
  public static invalidateCache(cwd: string): void {
    const cacheFile = join(cwd, ".aegis/dependency-cache.json");
    if (existsSync(cacheFile)) {
      try {
        writeFileSync(cacheFile, JSON.stringify({ verified: false }, null, 2), "utf8");
      } catch {}
    }
  }
}

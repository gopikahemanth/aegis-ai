import { TerminalRunner } from "./terminal.js";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

export class DependencyInstaller {
  private readonly terminal = new TerminalRunner();

  /**
   * Computes a deterministic hash of declared dependencies in package.json
   */
  public computeDependencyHash(cwd: string, packageManager: string = "pnpm"): string {
    const pkgPath = join(cwd, "package.json");
    if (!existsSync(pkgPath)) return "no-package-json";

    try {
      const parsed = JSON.parse(readFileSync(pkgPath, "utf8"));
      const deps = parsed.dependencies || {};
      const devDeps = parsed.devDependencies || {};
      const peerDeps = parsed.peerDependencies || {};

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
      return "invalid-package-json";
    }
  }

  /**
   * Checks if dependencies in cwd are already synchronized
   */
  public isSynchronized(cwd: string, packageManager: "npm" | "pnpm" | "yarn" = "pnpm"): boolean {
    const nodeModules = join(cwd, "node_modules");
    if (!existsSync(nodeModules)) return false;

    const pkgPath = join(cwd, "package.json");
    if (!existsSync(pkgPath)) return true;

    const cachePath = join(cwd, ".aegis/dependency-cache.json");
    const currentHash = this.computeDependencyHash(cwd, packageManager);

    if (existsSync(cachePath)) {
      try {
        const cache = JSON.parse(readFileSync(cachePath, "utf8"));
        if (cache.verified && cache.dependencyHash === currentHash && cache.packageManager === packageManager) {
          return true;
        }
      } catch {}
    }

    return false;
  }

  /**
   * Saves dependency synchronization cache
   */
  public saveCache(cwd: string, packageManager: "npm" | "pnpm" | "yarn" = "pnpm", installMethod: string = "prefer-offline"): void {
    const aegisDir = join(cwd, ".aegis");
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });

    const dependencyHash = this.computeDependencyHash(cwd, packageManager);
    const pnpmLock = join(cwd, "pnpm-lock.yaml");
    let lockfileHash = "no-lock";
    if (existsSync(pnpmLock)) {
      try { lockfileHash = createHash("sha256").update(readFileSync(pnpmLock, "utf8")).digest("hex").slice(0, 16); } catch {}
    }

    const state = {
      dependencyHash,
      lockfileHash,
      packageManager,
      installMethod,
      installedAt: new Date().toISOString(),
      verified: true,
    };

    writeFileSync(join(aegisDir, "dependency-cache.json"), JSON.stringify(state, null, 2), "utf8");
  }

  async install(
    packageManager: "npm" | "pnpm" | "yarn",
    cwd: string,
    options?: { force?: boolean }
  ) {
    // 1. Fast path: check if dependencies are already synchronized
    if (!options?.force && this.isSynchronized(cwd, packageManager)) {
      console.log(`[DependencyInstaller] ⚡ Dependencies already synchronized in ${cwd} — skipping full install.`);
      return { exitCode: 0, stdout: "Dependencies already synchronized (cache hit)", stderr: "" };
    }

    // 2. Fast cached install with --prefer-offline if pnpm
    if (packageManager === "pnpm") {
      try {
        const fastArgs = [
          "install",
          "--ignore-workspace",
          "--config.minimum-release-age=0",
          "--prefer-offline",
          "--no-frozen-lockfile",
        ];
        console.log(`[DependencyInstaller] Running fast dependency synchronization (--prefer-offline)...`);
        const result = await this.terminal.run("pnpm", fastArgs, cwd);
        if (result.exitCode === 0 && existsSync(join(cwd, "node_modules"))) {
          this.saveCache(cwd, packageManager, "prefer-offline");
          return result;
        }
        console.warn(`[DependencyInstaller] fast install returned non-zero (${result.exitCode}). Falling back to standard install...`);
      } catch (err: any) {
        console.warn(`[DependencyInstaller] fast install failed: ${err.message}. Falling back to standard install...`);
      }
    }

    // 3. Standard full install fallback
    const args =
      packageManager === "pnpm"
        ? ["install", "--ignore-workspace", "--config.minimum-release-age=0", "--no-frozen-lockfile"]
        : ["install", "--legacy-peer-deps", "--silent"];

    const result = await this.terminal.run(
      packageManager,
      args,
      cwd,
    );

    if (result.exitCode === 0) {
      this.saveCache(cwd, packageManager, "full");
    }

    return result;
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
        ? ["install", "--legacy-peer-deps", ...packages]
        : ["add", "--prefer-offline", ...packages];

    const res = await this.terminal.run(
      packageManager,
      args,
      cwd,
    );

    if (res.exitCode === 0) {
      this.saveCache(cwd, packageManager, "incremental");
    }

    return res;
  }
}

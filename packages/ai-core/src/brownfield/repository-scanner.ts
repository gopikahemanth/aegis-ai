import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { execSync } from "node:child_process";
import type {
  BrownfieldProjectContract,
  GenerationMode,
  GitWorkingState,
  TestInventory,
} from "./brownfield-contract.js";

export class RepositoryScanner {
  /**
   * Detects whether the target directory is GREENFIELD (empty/new) or BROWNFIELD (existing code/package.json).
   */
  public static detectMode(projectRoot: string): GenerationMode {
    if (!existsSync(projectRoot)) return "GREENFIELD";

    const pkgPath = join(projectRoot, "package.json");
    const srcPath = join(projectRoot, "src");
    const serverPath = join(projectRoot, "server");
    const gitPath = join(projectRoot, ".git");

    if (existsSync(pkgPath) || existsSync(srcPath) || existsSync(serverPath) || existsSync(gitPath)) {
      try {
        const files = readdirSync(projectRoot).filter(f => f !== ".git" && f !== ".aegis" && f !== "node_modules");
        if (files.length > 0) return "BROWNFIELD";
      } catch {
        return "GREENFIELD";
      }
    }

    return "GREENFIELD";
  }

  /**
   * Scans Git state and working directory changes.
   */
  public static scanGitState(projectRoot: string): GitWorkingState {
    const gitDir = join(projectRoot, ".git");
    if (!existsSync(gitDir)) {
      return {
        isGitRepo: false,
        branch: "",
        headCommit: "",
        isClean: true,
        dirtyFiles: [],
        untrackedFiles: [],
      };
    }

    try {
      const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: projectRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
      const headCommit = execSync("git rev-parse HEAD", { cwd: projectRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
      const statusOutput = execSync("git status --porcelain", { cwd: projectRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });

      const dirtyFiles: string[] = [];
      const untrackedFiles: string[] = [];

      for (const line of statusOutput.split(/\r?\n/)) {
        if (!line.trim()) continue;
        const status = line.slice(0, 2);
        const file = line.slice(3).trim().replace(/^"|"$/g, "").replace(/\\/g, "/");
        if (status === "??") {
          untrackedFiles.push(file);
        } else {
          dirtyFiles.push(file);
        }
      }

      return {
        isGitRepo: true,
        branch,
        headCommit,
        isClean: dirtyFiles.length === 0 && untrackedFiles.length === 0,
        dirtyFiles,
        untrackedFiles,
      };
    } catch {
      return {
        isGitRepo: true,
        branch: "main",
        headCommit: "unknown",
        isClean: true,
        dirtyFiles: [],
        untrackedFiles: [],
      };
    }
  }

  /**
   * Discovers existing test files and configuration.
   */
  public static scanTestInventory(projectRoot: string): TestInventory {
    const testFiles: string[] = [];
    const collectTests = (dir: string) => {
      if (!existsSync(dir)) return;
      for (const item of readdirSync(dir)) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          if (item !== "node_modules" && item !== "dist" && item !== ".aegis") {
            collectTests(fullPath);
          }
        } else if (/\.(test|spec)\.(ts|tsx|js|jsx)$/i.test(item)) {
          const rel = fullPath.substring(projectRoot.length).replace(/^[\\\/]+/, "").replace(/\\/g, "/");
          testFiles.push(rel);
        }
      }
    };

    collectTests(projectRoot);

    let framework: "vitest" | "jest" | "none" = "none";
    let testCommand = "npm test";

    const pkgPath = join(projectRoot, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        if (pkg.scripts?.test) testCommand = pkg.scripts.test;
        if (pkg.devDependencies?.vitest || pkg.dependencies?.vitest || existsSync(join(projectRoot, "vitest.config.ts"))) {
          framework = "vitest";
        } else if (pkg.devDependencies?.jest || pkg.dependencies?.jest || existsSync(join(projectRoot, "jest.config.js"))) {
          framework = "jest";
        }
      } catch {}
    }

    return {
      framework,
      testFiles,
      testCommand,
      baselinePassedTests: 0,
      baselineTotalTests: 0,
      baselineExitCode: 0,
    };
  }

  /**
   * Scans an existing repository and builds the canonical BrownfieldProjectContract.
   */
  public static scan(projectRoot: string, userRequest: string = ""): BrownfieldProjectContract {
    const mode = this.detectMode(projectRoot);
    const gitState = this.scanGitState(projectRoot);
    const testInventory = this.scanTestInventory(projectRoot);

    let framework = "react-vite";
    let packageManager: "pnpm" | "npm" | "yarn" = "pnpm";
    let buildTool = "vite";
    let hasTypeScript = false;

    if (existsSync(join(projectRoot, "pnpm-lock.yaml"))) packageManager = "pnpm";
    else if (existsSync(join(projectRoot, "yarn.lock"))) packageManager = "yarn";
    else if (existsSync(join(projectRoot, "package-lock.json"))) packageManager = "npm";

    if (existsSync(join(projectRoot, "tsconfig.json"))) hasTypeScript = true;

    const pkgPath = join(projectRoot, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        if (pkg.dependencies?.next) framework = "nextjs";
        else if (pkg.dependencies?.express && pkg.dependencies?.react) framework = "fullstack-react-express";
        else if (pkg.dependencies?.react) framework = "react-vite";
        else if (pkg.dependencies?.express) framework = "express";
      } catch {}
    }

    // Architecture discovery
    const entryPoints: string[] = [];
    for (const candidate of ["src/main.tsx", "src/index.tsx", "src/App.tsx", "server/index.ts", "server/server.ts", "src/index.ts"]) {
      if (existsSync(join(projectRoot, candidate))) entryPoints.push(candidate);
    }

    let routerFile: string | undefined;
    for (const candidate of ["src/routes.tsx", "src/routes.ts", "src/App.tsx", "src/router.tsx", "src/routes/index.tsx"]) {
      if (existsSync(join(projectRoot, candidate))) {
        routerFile = candidate;
        break;
      }
    }

    const routes: string[] = [];
    if (routerFile && existsSync(join(projectRoot, routerFile))) {
      try {
        const content = readFileSync(join(projectRoot, routerFile), "utf8");
        const pathRegex = /path:\s*["']([^"']+)["']/g;
        let m: RegExpExecArray | null;
        while ((m = pathRegex.exec(content)) !== null) {
          if (!routes.includes(m[1])) routes.push(m[1]);
        }
      } catch {}
    }

    // Prisma / database discovery
    let schemaPath: string | undefined;
    const models: string[] = [];
    const prismaCandidate = join(projectRoot, "prisma", "schema.prisma");
    if (existsSync(prismaCandidate)) {
      schemaPath = "prisma/schema.prisma";
      try {
        const schemaContent = readFileSync(prismaCandidate, "utf8");
        const modelRegex = /model\s+([A-Za-z0-9_$]+)\s*\{/g;
        let m: RegExpExecArray | null;
        while ((m = modelRegex.exec(schemaContent)) !== null) {
          models.push(m[1]);
        }
      } catch {}
    }

    // API endpoints discovery
    const apiEndpoints: string[] = [];
    const serverRoutesDir = join(projectRoot, "server", "routes");
    if (existsSync(serverRoutesDir)) {
      try {
        for (const file of readdirSync(serverRoutesDir)) {
          if (file.endsWith(".ts") || file.endsWith(".js")) {
            const content = readFileSync(join(serverRoutesDir, file), "utf8");
            const epRegex = /router\.(get|post|put|delete|patch)\(\s*["']([^"']+)["']/gi;
            let m: RegExpExecArray | null;
            while ((m = epRegex.exec(content)) !== null) {
              apiEndpoints.push(`${m[1].toUpperCase()} ${m[2]}`);
            }
          }
        }
      } catch {}
    }

    return {
      mode,
      repository: {
        rootPath: projectRoot,
        gitState,
      },
      stack: {
        framework,
        packageManager,
        buildTool,
        hasTypeScript,
      },
      architecture: {
        entryPoints,
        routerFile,
        routes,
        models,
        schemaPath,
        apiEndpoints,
      },
      testInventory,
      userRequest: {
        rawPrompt: userRequest,
        featureSummary: userRequest.slice(0, 100),
        inferredEntities: [],
      },
      impactSet: {
        mustChange: [],
        mayChange: [],
        readOnly: [],
        protected: ["package.json", "tsconfig.json", ".git", ".env"],
      },
      plannedPatches: [],
    };
  }
}

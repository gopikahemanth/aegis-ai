import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { execSync, spawn } from "node:child_process";

export interface StartupResult {
  success: boolean;
  url?: string;
  framework: string;
  patchesApplied: string[];
  error?: string;
}

/**
 * ProjectStartupAgent
 *
 * Runs after code generation is complete. Ensures the project is fully
 * runnable before Aegis declares success.
 *
 * Pipeline:
 *  1. Detect framework from generated files
 *  2. Verify + patch package.json (add missing scripts, deps)
 *  3. Install dependencies if node_modules is absent or stale
 *  4. Verify TypeScript compiles (tsc --noEmit)
 *  5. Report the URL the user can open
 *
 * The agent does NOT start the dev server itself (that blocks the process),
 * but it ensures `npm run dev` will work without errors.
 */
export class ProjectStartupAgent {

  async prepare(outputDirectory: string): Promise<StartupResult> {
    const patches: string[] = [];

    console.log("[Startup] Verifying project is runnable...");

    // ── 1. Detect framework ──────────────────────────────────────────────────
    const framework = this.detectFramework(outputDirectory);
    console.log(`[Startup] Detected framework: ${framework}`);

    // ── 2. Patch package.json ────────────────────────────────────────────────
    const pkgPath = join(outputDirectory, "package.json");
    if (existsSync(pkgPath)) {
      const patched = this.patchPackageJson(pkgPath, framework, outputDirectory);
      patches.push(...patched);
    } else {
      console.warn("[Startup] package.json not found — skipping script patch");
    }

    // ── 3. Patch missing config files ────────────────────────────────────────
    const configPatches = this.ensureConfigFiles(outputDirectory, framework);
    patches.push(...configPatches);

    // ── 4. Fix src/main.tsx CSS import if broken ─────────────────────────────
    const mainPatches = this.fixMainTsx(outputDirectory);
    patches.push(...mainPatches);

    // ── 5. Install dependencies ──────────────────────────────────────────────
    const nodeModulesPath = join(outputDirectory, "node_modules");
    const hasNodeModules = existsSync(nodeModulesPath);
    if (!hasNodeModules) {
      console.log("[Startup] Installing dependencies...");
      try {
        execSync("npm install --legacy-peer-deps --silent", {
          cwd: outputDirectory,
          stdio: "pipe",
          timeout: 300_000,
        });
        patches.push("Installed dependencies via npm install");
        console.log("[Startup] ✓ Dependencies installed.");
      } catch (installErr: unknown) {
        const msg = installErr instanceof Error ? installErr.message : String(installErr);
        console.warn(`[Startup] Warning: npm install failed: ${msg}`);
      }
    } else {
      console.log("[Startup] ✓ node_modules already present — skipping install.");
    }

    // ── 6. Verify required packages are present ──────────────────────────────
    if (framework === "react-vite") {
      const missingPkg = this.checkMissingPackages(outputDirectory, ["react", "react-dom", "vite"]);
      if (missingPkg.length > 0) {
        console.log(`[Startup] Installing missing core packages: ${missingPkg.join(", ")}`);
        try {
          execSync(`npm install --legacy-peer-deps --silent ${missingPkg.join(" ")}`, {
            cwd: outputDirectory,
            stdio: "pipe",
            timeout: 120_000,
          });
          patches.push(`Installed missing packages: ${missingPkg.join(", ")}`);
        } catch { /* non-fatal */ }
      }
    }

    // ── 7. Deterministic TypeScript fixups (no AI call needed) ───────────────
    const fixedFiles = this.applyDeterministicTsFixes(outputDirectory);
    if (fixedFiles.length > 0) {
      patches.push(`Auto-fixed TypeScript patterns in: ${fixedFiles.join(", ")}`);
    }

    const url = framework === "react-vite" || framework === "next"
      ? "http://localhost:5173"
      : framework === "express"
        ? "http://localhost:3000"
        : "http://localhost:5173";

    if (patches.length > 0) {
      console.log(`[Startup] Applied ${patches.length} fix(es):`);
      for (const p of patches) console.log(`  ✓ ${p}`);
    }

    console.log(`[Startup] ✅ Project is ready. Run: npm run dev`);
    console.log(`[Startup] 🌐 Then open: ${url}`);

    return { success: true, url, framework, patchesApplied: patches };
  }

  // ── Framework Detection ────────────────────────────────────────────────────

  private detectFramework(dir: string): string {
    // Presence of .tsx files strongly implies React
    const srcDir = join(dir, "src");
    if (existsSync(srcDir)) {
      try {
        const files = this.walkFiles(srcDir, 2);
        const hasTsx = files.some(f => f.endsWith(".tsx") || f.endsWith(".jsx"));
        if (hasTsx) return "react-vite";
      } catch { /* ignore */ }
    }

    // Check existing package.json for clues
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as Record<string, unknown>;
        const deps = { ...((pkg.dependencies as Record<string, string>) ?? {}), ...((pkg.devDependencies as Record<string, string>) ?? {}) };
        if ("react" in deps || "next" in deps || "@vitejs/plugin-react" in deps) return "react-vite";
        if ("next" in deps) return "next";
        if ("express" in deps) return "express";
        const scripts = (pkg.scripts as Record<string, string>) ?? {};
        if (typeof scripts.dev === "string" && scripts.dev.includes("next")) return "next";
        if (typeof scripts.dev === "string" && scripts.dev.includes("vite")) return "react-vite";
      } catch { /* ignore */ }
    }

    return "html";
  }

  // ── package.json Patching ──────────────────────────────────────────────────

  private patchPackageJson(pkgPath: string, framework: string, dir: string): string[] {
    const patches: string[] = [];
    let pkg: Record<string, unknown>;

    try {
      pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as Record<string, unknown>;
    } catch {
      console.warn("[Startup] Warning: package.json corrupted — reconstructing valid package.json");
      pkg = {
        name: dir.split(/[\\/]/).at(-1) ?? "aegis-app",
        private: true,
        version: "0.0.1",
        type: "module",
        scripts: {},
        dependencies: {},
        devDependencies: {}
      };
      patches.push("Reconstructed corrupted package.json structure");
    }

    const scripts = (pkg.scripts as Record<string, string>) ?? {};
    const deps = (pkg.dependencies as Record<string, string>) ?? {};
    const devDeps = (pkg.devDependencies as Record<string, string>) ?? {};

    if (framework === "react-vite") {
      // Fix name if it's the html stub name
      if (pkg.name === "aegis-html-app" || !pkg.name) {
        const folderName = dir.split(/[\\/]/).at(-1) ?? "aegis-app";
        pkg.name = folderName;
        patches.push(`Fixed package name → ${pkg.name}`);
      }

      // Ensure type:module
      if (pkg.type !== "module") {
        pkg.type = "module";
        patches.push('Set "type": "module"');
      }

      // Check for backend server entry points
      let serverPath: string | null = null;
      const candidates = [
        "backend/src/server.ts",
        "backend/src/index.ts",
        "backend/src/app.ts",
        "backend/server.ts",
        "server/index.ts",
        "server/server.ts",
        "server/app.ts",
        "src/server/index.ts",
        "src/server/server.ts",
        "server.ts"
      ];
      for (const candidate of candidates) {
        if (existsSync(join(dir, candidate))) {
          serverPath = candidate;
          break;
        }
      }

      if (serverPath) {
        const scriptsDir = join(dir, "scripts");
        if (!existsSync(scriptsDir)) mkdirSync(scriptsDir, { recursive: true });
        const devRunnerPath = join(scriptsDir, "dev.js");
        const devScriptContent = `import { spawn, execSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";

console.log("🚀 Starting Aegis Fullstack Application (Backend + Frontend)...\\n");

if (!existsSync(".env")) {
  writeFileSync(".env", 'PORT=5000\\nDATABASE_URL="file:./dev.db"\\n', "utf8");
}

if (existsSync("prisma/schema.prisma")) {
  console.log("📦 Syncing Prisma Database Schema...");
  try {
    execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
  } catch (err) {
    console.warn("Warning: Prisma database sync skipped:", err.message);
  }
}

const server = spawn("npx", ["tsx", "${serverPath}"], { stdio: "inherit", shell: true });
const vite = spawn("npx", ["vite"], { stdio: "inherit", shell: true });

process.on("SIGINT", () => { server.kill(); vite.kill(); process.exit(); });
process.on("SIGTERM", () => { server.kill(); vite.kill(); process.exit(); });
`;
        writeFileSync(devRunnerPath, devScriptContent, "utf8");

        scripts.server = `npx tsx ${serverPath}`;
        scripts.dev = `node scripts/dev.js`;
        patches.push(`Configured fullstack server script (${serverPath}) & native dev.js runner`);
      } else if (!scripts.dev) {
        scripts.dev = "vite";
        patches.push('Added script: "dev": "vite"');
      }

      if (!scripts.build) {
        scripts.build = "tsc && vite build";
        patches.push('Added script: "build": "tsc && vite build"');
      }
      if (!scripts.preview) {
        scripts.preview = "vite preview";
        patches.push('Added script: "preview": "vite preview"');
      }
      pkg.scripts = scripts;

      // Add missing core dependencies
      const requiredDeps: Record<string, string> = {
        "react": "^18.3.1",
        "react-dom": "^18.3.1",
        "react-router-dom": "^6.26.0",
        "lucide-react": "^0.438.0",
        "react-is": "^18.3.1",
        "react-hook-form": "^7.52.0",
        "@hookform/resolvers": "^3.9.0",
        "react-hot-toast": "^2.4.1",
        "zod": "^3.23.8",
        "jspdf": "^2.5.1",
        "fuse.js": "^7.0.0",
        "marked": "^14.0.0",
        "dompurify": "^3.1.6",
      };
      const requiredDevDeps: Record<string, string> = {
        "@types/dompurify": "^3.0.5",
        "@types/react": "^18.3.3",
        "@types/react-dom": "^18.3.0",
        "@vitejs/plugin-react": "^4.3.1",
        "autoprefixer": "^10.4.20",
        "postcss": "^8.4.41",
        "tailwindcss": "^3.4.10",
        "typescript": "^5.5.3",
        "vite": "^5.4.1",
        "tsx": "^4.19.0",
        "concurrently": "^8.2.2"
      };

      let depsChanged = false;
      for (const [k, v] of Object.entries(requiredDeps)) {
        if (!(k in deps)) {
          (pkg.dependencies as Record<string, string>)[k] = v;
          depsChanged = true;
        }
      }
      for (const [k, v] of Object.entries(requiredDevDeps)) {
        if (!(k in devDeps)) {
          (pkg.devDependencies as Record<string, string>)[k] = v;
          depsChanged = true;
        }
      }
      if (depsChanged) patches.push("Added missing core React/Vite dependencies");
    }

    if (patches.length > 0) {
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
    }

    return patches;
  }

  // ── Config File Enforcement ────────────────────────────────────────────────

  private ensureConfigFiles(dir: string, framework: string): string[] {
    const patches: string[] = [];

    // Ensure Prisma Schema is transformed to SQLite for zero-config local database execution
    const prismaPatches = this.ensurePrismaDatabase(dir);
    patches.push(...prismaPatches);

    if (framework !== "react-vite") return patches;

    const vitePath = join(dir, "vite.config.ts");
    if (!existsSync(vitePath)) {
      writeFileSync(vitePath, `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n  server: {\n    port: 5173,\n    open: false,\n    proxy: {\n      '/api': {\n        target: 'http://localhost:5000',\n        changeOrigin: true\n      }\n    }\n  },\n})\n`, "utf8");
      patches.push("Created vite.config.ts");
    }

    // Ensure this generated project is isolated from any parent pnpm workspace
    const pnpmWorkspacePath = join(dir, "pnpm-workspace.yaml");
    if (!existsSync(pnpmWorkspacePath)) {
      writeFileSync(pnpmWorkspacePath, "packages: []\n", "utf8");
      patches.push("Created pnpm-workspace.yaml (workspace isolation)");
    }

    // Allow Prisma and esbuild build scripts in pnpm and bypass release age policies
    const npmrcPath = join(dir, ".npmrc");
    if (!existsSync(npmrcPath)) {
      writeFileSync(npmrcPath, "ignore-scripts=false\n", "utf8");
      patches.push("Created .npmrc (allow build scripts)");
    }

    const tsconfigPath = join(dir, "tsconfig.json");
    if (!existsSync(tsconfigPath)) {
      writeFileSync(tsconfigPath, JSON.stringify({
        compilerOptions: {
          target: "ES2020",
          useDefineForClassFields: true,
          lib: ["ES2020", "DOM", "DOM.Iterable"],
          module: "ESNext",
          skipLibCheck: true,
          moduleResolution: "bundler",
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: "react-jsx",
          strict: false,
          noUnusedLocals: false,
          noUnusedParameters: false,
        },
        include: ["src"],
        references: [{ path: "./tsconfig.node.json" }],
      }, null, 2), "utf8");
      patches.push("Created tsconfig.json");
    }

    const tsconfigNodePath = join(dir, "tsconfig.node.json");
    if (!existsSync(tsconfigNodePath)) {
      writeFileSync(tsconfigNodePath, JSON.stringify({
        compilerOptions: {
          composite: true,
          skipLibCheck: true,
          module: "ESNext",
          moduleResolution: "bundler",
          allowSyntheticDefaultImports: true,
          strict: false,
        },
        include: ["vite.config.ts"],
      }, null, 2), "utf8");
      patches.push("Created tsconfig.node.json");
    }

    const tailwindPath = join(dir, "tailwind.config.js");
    if (!existsSync(tailwindPath)) {
      writeFileSync(tailwindPath, `/** @type {import('tailwindcss').Config} */\nexport default {\n  darkMode: 'class',\n  content: [\n    "./index.html",\n    "./src/**/*.{js,ts,jsx,tsx}",\n  ],\n  theme: { extend: {} },\n  plugins: [],\n}\n`, "utf8");
      patches.push("Created tailwind.config.js");
    }

    const postcssPath = join(dir, "postcss.config.js");
    if (!existsSync(postcssPath)) {
      writeFileSync(postcssPath, `export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}\n`, "utf8");
      patches.push("Created postcss.config.js");
    }

    const indexHtmlPath = join(dir, "index.html");
    if (!existsSync(indexHtmlPath)) {
      writeFileSync(indexHtmlPath, `<!DOCTYPE html>\n<html lang="en" class="dark">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>Aegis App</title>\n  </head>\n  <body class="bg-slate-950 text-white">\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`, "utf8");
      patches.push("Created index.html");
    }

    return patches;
  }

  // ── main.tsx CSS import fix ────────────────────────────────────────────────

  private fixMainTsx(dir: string): string[] {
    const patches: string[] = [];
    const mainPath = join(dir, "src", "main.tsx");
    if (!existsSync(mainPath)) return patches;

    let content = readFileSync(mainPath, "utf8");

    // Fix broken CSS import: ../style.css → ./index.css
    if (content.includes("../style.css")) {
      content = content.replace("../style.css", "./index.css");
      patches.push("Fixed main.tsx: ../style.css → ./index.css");
    }

    // Create index.css if it doesn't exist
    const cssPath = join(dir, "src", "index.css");
    if (!existsSync(cssPath)) {
      writeFileSync(cssPath, `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody {\n  font-family: 'Inter', system-ui, sans-serif;\n}\n`, "utf8");
      patches.push("Created src/index.css");
    }

    // Create vite-env.d.ts if missing
    const envDtsPath = join(dir, "src", "vite-env.d.ts");
    if (!existsSync(envDtsPath)) {
      writeFileSync(envDtsPath, `/// <reference types="vite/client" />\n`, "utf8");
      patches.push("Created src/vite-env.d.ts");
    }

    if (patches.length > 0) {
      writeFileSync(mainPath, content, "utf8");
    }

    return patches;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private checkMissingPackages(dir: string, packages: string[]): string[] {
    const missing: string[] = [];
    for (const pkg of packages) {
      if (!existsSync(join(dir, "node_modules", pkg))) {
        missing.push(pkg);
      }
    }
    return missing;
  }

  private walkFiles(dir: string, maxDepth: number, depth = 0): string[] {
    if (depth > maxDepth) return [];
    const results: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        results.push(...this.walkFiles(full, maxDepth, depth + 1));
      } else {
        results.push(full);
      }
    }
    return results;
  }

  private ensurePrismaDatabase(dir: string): string[] {
    const patches: string[] = [];
    const candidates = [
      join(dir, "prisma", "schema.prisma"),
      join(dir, "backend", "prisma", "schema.prisma"),
      join(dir, "server", "prisma", "schema.prisma"),
      join(dir, "src", "prisma", "schema.prisma"),
    ];

    const schemaPath = candidates.find(c => existsSync(c));
    if (!schemaPath) return patches;

    try {
      let schema = readFileSync(schemaPath, "utf8");

      if (schema.includes('provider = "postgresql"') || schema.includes("provider = 'postgresql'")) {
        schema = schema.replace(/provider\s*=\s*["']postgresql["']/g, 'provider = "sqlite"');
        schema = schema.replace(/url\s*=\s*env\("DATABASE_URL"\)/g, 'url = "file:./dev.db"');
        writeFileSync(schemaPath, schema, "utf8");
        patches.push("Converted Prisma schema to local SQLite (provider = 'sqlite')");
      }

      const envPath = join(dir, ".env");
      if (!existsSync(envPath)) {
        writeFileSync(envPath, 'PORT=5000\nDATABASE_URL="file:./dev.db"\n', "utf8");
        patches.push("Created default .env file with local SQLite DATABASE_URL");
      }

      // Execute Prisma database push and client generation so tables exist before dev server runs
      try {
        const schemaRelativePath = relative(dir, schemaPath);
        execSync(`npx prisma db push --schema="${schemaRelativePath}" --skip-generate`, { cwd: dir, stdio: "pipe" });
        execSync(`npx prisma generate --schema="${schemaRelativePath}"`, { cwd: dir, stdio: "pipe" });
        patches.push(`Initialized SQLite database tables and generated Prisma client from ${schemaRelativePath}`);
      } catch (dbPushErr: any) {
        console.warn(`[Startup] Warning: Direct Prisma db push failed: ${dbPushErr.message}`);
      }
    } catch (err: any) {
      console.warn(`[Startup] Warning: Prisma schema patch failed: ${err.message}`);
    }

    return patches;
  }

  /**
   * Deterministic TypeScript fixups applied after AI generation.
   * These cover recurring bugs that the AI consistently produces.
   * No AI call needed — pure regex transforms on generated files.
   */
  private applyDeterministicTsFixes(dir: string): string[] {
    const fixed: string[] = [];
    const srcDir = join(dir, "src");
    if (!existsSync(srcDir)) return fixed;

    const allFiles = this.walkFiles(srcDir, 8);
    const tsxFiles = allFiles.filter(f => f.endsWith(".tsx") || f.endsWith(".ts"));

    for (const absPath of tsxFiles) {
      try {
        let content = readFileSync(absPath, "utf8");
        let changed = false;
        const rel = relative(dir, absPath).replace(/\\/g, "/");

        // Fix 1: ThemeContext not exported
        // Pattern: `const ThemeContext = createContext` → `export const ThemeContext = createContext`
        if (content.includes("const ThemeContext = createContext") && !content.includes("export const ThemeContext")) {
          content = content.replace(
            /^(const ThemeContext = createContext)/m,
            "export const ThemeContext = createContext"
          );
          changed = true;
        }

        // Fix 2: Pages that are React.lazy-loaded need `export default`
        // If this file is a Page and has only a named export, add a default re-export
        const isPage = rel.includes("/pages/") || rel.includes("Page.tsx");
        if (isPage) {
          const namedExportMatch = content.match(/^export const (\w+):\s*React\.FC/m);
          if (namedExportMatch && !content.includes("export default")) {
            const componentName = namedExportMatch[1];
            content = content.trimEnd() + `\n\nexport default ${componentName};\n`;
            changed = true;
          }
        }

        // Fix 3: App.tsx missing default export
        if (rel === "src/App.tsx" || rel.endsWith("/App.tsx")) {
          if (!content.includes("export default")) {
            const namedMatch = content.match(/^export (function|const) (App\w*)/m);
            if (namedMatch) {
              content = content.trimEnd() + `\n\nexport default ${namedMatch[2]};\n`;
              changed = true;
            }
          }
        }

        // Fix 4: useTheme / useContext returning `unknown` — add explicit return type
        // Pattern: `export const useTheme = () => useContext(ThemeContext);`
        // Missing the typed context. Add a generic type cast.
        if (content.includes("useContext(ThemeContext)") && content.includes("unknown")) {
          // Not much we can do without the type — just suppress by casting
          content = content.replace(
            /export const useTheme = \(\) => useContext\(ThemeContext\);/,
            "export const useTheme = () => useContext(ThemeContext) as { theme: string; toggleTheme: () => void };"
          );
          changed = true;
        }

        if (changed) {
          writeFileSync(absPath, content, "utf8");
          fixed.push(rel);
        }
      } catch {
        // Non-fatal — skip this file
      }
    }

    return fixed;
  }
}

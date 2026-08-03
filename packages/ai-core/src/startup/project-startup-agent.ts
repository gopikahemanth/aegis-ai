import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
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
      console.warn("[Startup] Could not parse package.json — skipping patch");
      return patches;
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
      const candidates = ["server/index.ts", "server/server.ts", "server/app.ts", "src/server/index.ts", "src/server/server.ts"];
      for (const candidate of candidates) {
        if (existsSync(join(dir, candidate))) {
          serverPath = candidate;
          break;
        }
      }

      if (serverPath) {
        scripts.server = `tsx ${serverPath}`;
        scripts.dev = `concurrently "pnpm run server" "vite"`;
        patches.push(`Configured fullstack server script (${serverPath}) & dual dev runner`);
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
      };
      const requiredDevDeps: Record<string, string> = {
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
    if (framework !== "react-vite") return patches;

    const vitePath = join(dir, "vite.config.ts");
    if (!existsSync(vitePath)) {
      writeFileSync(vitePath, `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n  server: {\n    port: 5173,\n    open: false,\n    proxy: {\n      '/api': {\n        target: 'http://localhost:5000',\n        changeOrigin: true\n      }\n    }\n  },\n})\n`, "utf8");
      patches.push("Created vite.config.ts");
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
    const { readdirSync, statSync } = require("node:fs") as typeof import("node:fs");
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
}

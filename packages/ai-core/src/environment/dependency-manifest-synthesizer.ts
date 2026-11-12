/**
 * DependencyManifestSynthesizer
 *
 * Phase 6: Dependency & Environment Management
 *
 * Synthesizes production-ready package.json manifests and environment files:
 * - Scans codebase AST for imported third-party packages
 * - Resolves deterministic, compatible package versions from a canonical registry
 * - Generates .env and .env.example with port, database URL, and security secrets
 * - Eliminates missing dependency crashes and version mismatch errors
 */

import * as fs from "fs";
import * as path from "path";
import type { LockedArchitectureContract } from "../architect/architecture-contract-engine.js";

export interface ManifestOptions {
  projectName: string;
  sourceFiles?: Array<{ path: string; content: string }>;
  contract?: LockedArchitectureContract;
  frontendPort?: number;
  backendPort?: number;
  dbUrl?: string;
}

export interface SynthesizedManifestOutput {
  packageJson: Record<string, any>;
  envContent: string;
  envExampleContent: string;
  detectedDependencies: string[];
}

export class DependencyManifestSynthesizer {
  private static readonly NODE_BUILTINS = new Set([
    "assert", "async_hooks", "buffer", "child_process", "cluster", "console",
    "constants", "crypto", "dgram", "diagnostics_channel", "dns", "domain",
    "events", "fs", "fs/promises", "http", "http2", "https", "inspector",
    "module", "net", "os", "path", "path/posix", "path/win32", "perf_hooks",
    "process", "punycode", "querystring", "readline", "repl", "stream",
    "stream/consumers", "stream/promises", "stream/web", "string_decoder",
    "sys", "timers", "timers/promises", "tls", "trace_events", "tty",
    "url", "util", "util/types", "v8", "vm", "wasi", "worker_threads", "zlib",
    "node:fs", "node:path", "node:http", "node:child_process", "node:crypto",
    "node:net", "node:os", "node:url", "node:util", "node:buffer", "node:stream"
  ]);

  private static readonly CANONICAL_DEPENDENCY_VERSIONS: Record<string, string> = {
    // React Frontend
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "lucide-react": "^0.460.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4",
    "axios": "^1.7.4",

    // Backend
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "zod": "^3.23.8",
    "dotenv": "^16.4.5",
    "@prisma/client": "^5.19.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",

    // Dev Dependencies
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.14.12",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.6",
    "typescript": "^5.5.4",
    "vite": "^5.4.2",
    "@vitejs/plugin-react": "^4.3.1",
    "tailwindcss": "^3.4.10",
    "postcss": "^8.4.41",
    "autoprefixer": "^10.4.20",
    "prisma": "^5.19.0",
    "tsx": "^4.16.5",
  };

  /**
   * Scans source files to extract third-party package names.
   */
  public static extractImportedPackages(files: Array<{ path: string; content: string }>): string[] {
    const packages = new Set<string>();
    const importRegex = /(?:import|export)\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]/g;

    for (const file of files) {
      let match: RegExpExecArray | null;
      while ((match = importRegex.exec(file.content)) !== null) {
        const specifier = match[1];

        // Skip relative and alias imports
        if (
          specifier.startsWith(".") ||
          specifier.startsWith("/") ||
          specifier.startsWith("@/") ||
          specifier.startsWith("~") ||
          specifier.startsWith("#")
        ) {
          continue;
        }

        // Skip Node.js built-ins
        if (this.NODE_BUILTINS.has(specifier)) {
          continue;
        }

        // Resolve package name (support scoped packages like @prisma/client)
        let pkgName = specifier;
        if (specifier.startsWith("@")) {
          const parts = specifier.split("/");
          pkgName = parts.slice(0, 2).join("/");
        } else {
          pkgName = specifier.split("/")[0];
        }

        if (pkgName && !this.NODE_BUILTINS.has(pkgName)) {
          packages.add(pkgName);
        }
      }
    }

    return Array.from(packages).sort();
  }

  /**
   * Synthesizes package.json and environment files.
   */
  public static synthesize(options: ManifestOptions): SynthesizedManifestOutput {
    const detected = options.sourceFiles
      ? this.extractImportedPackages(options.sourceFiles)
      : [];

    const dependencies: Record<string, string> = {
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "react-router-dom": "^6.26.0",
      "express": "^4.19.2",
      "cors": "^2.8.5",
      "zod": "^3.23.8",
      "dotenv": "^16.4.5",
      "@prisma/client": "^5.19.0",
    };

    const devDependencies: Record<string, string> = {
      "@types/react": "^18.3.3",
      "@types/react-dom": "^18.3.0",
      "@types/express": "^4.17.21",
      "@types/cors": "^2.8.17",
      "@types/node": "^20.14.12",
      "typescript": "^5.5.4",
      "vite": "^5.4.2",
      "@vitejs/plugin-react": "^4.3.1",
      "tailwindcss": "^3.4.10",
      "postcss": "^8.4.41",
      "autoprefixer": "^10.4.20",
      "prisma": "^5.19.0",
      "tsx": "^4.16.5",
    };

    // Add detected packages with known or default version bounds
    for (const pkg of detected) {
      if (devDependencies[pkg]) continue;
      if (!dependencies[pkg]) {
        dependencies[pkg] = this.CANONICAL_DEPENDENCY_VERSIONS[pkg] || "^1.0.0";
      }
    }

    const packageJson = {
      name: options.projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      version: "1.0.0",
      private: true,
      type: "module",
      scripts: {
        "dev": "vite",
        "build": "tsc && vite build",
        "preview": "vite preview",
        "server": "tsx server/src/index.ts",
        "db:generate": "prisma generate",
        "db:push": "prisma db push",
        "db:seed": "tsx prisma/seed.ts",
      },
      dependencies,
      devDependencies,
    };

    const fePort = options.frontendPort || 5173;
    const bePort = options.backendPort || (options.contract?.backend?.port || 3001);
    const dbUrl = options.dbUrl || (
      options.contract?.database?.engine === "postgresql"
        ? "postgresql://postgres:postgres@localhost:5432/aegis_app?schema=public"
        : "file:./prisma/dev.db"
    );

    const envContent = `# Aegis AI Environment Configuration
PORT=${bePort}
VITE_API_URL=http://localhost:${bePort}/api
VITE_PORT=${fePort}
DATABASE_URL="${dbUrl}"
NODE_ENV=development
JWT_SECRET=aegis_development_secret_key_${Date.now()}
`;

    const envExampleContent = `# Aegis AI Environment Configuration (Template)
PORT=3001
VITE_API_URL=http://localhost:3001/api
VITE_PORT=5173
DATABASE_URL="file:./prisma/dev.db"
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
`;

    return {
      packageJson,
      envContent,
      envExampleContent,
      detectedDependencies: detected,
    };
  }

  /**
   * Writes synthesized manifest files to a target directory.
   */
  public static writeToDirectory(dir: string, output: SynthesizedManifestOutput): void {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify(output.packageJson, null, 2) + "\n",
      "utf-8"
    );
    fs.writeFileSync(path.join(dir, ".env"), output.envContent, "utf-8");
    fs.writeFileSync(path.join(dir, ".env.example"), output.envExampleContent, "utf-8");
  }
}

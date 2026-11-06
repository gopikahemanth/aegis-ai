import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export interface WorkspaceIndex {
  files: string[];
  dependencies: string[];
  exports: { file: string; symbol: string; type: string }[];
  prismaModels: string[];
  endpoints: { file: string; method: string; path: string }[];
}

export interface TaskIntelligenceScope {
  ownedFiles?: string[];
  taskTitle?: string;
  stage?: string;
  taskKeywords?: string[];
}

export class WorkspaceIntelligenceEngine {
  scan(projectDirectory: string): WorkspaceIndex {
    const files = this.walk(projectDirectory);
    const relativeFiles = files.map(f => f.replace(projectDirectory, "").replace(/^[/\\]+/, "").replace(/\\/g, "/"));

    const dependencies = this.extractDependencies(projectDirectory);
    const prismaModels = this.extractPrismaModels(projectDirectory);
    const exports = this.indexExports(projectDirectory, files);
    const endpoints = this.indexEndpoints(files);

    return {
      files: relativeFiles,
      dependencies,
      exports,
      prismaModels,
      endpoints,
    };
  }

  private walk(dir: string): string[] {
    const results: string[] = [];
    if (!existsSync(dir)) return results;

    const list = readdirSync(dir);
    for (const file of list) {
      if (
        file === "node_modules" ||
        file === ".git" ||
        file === "dist" ||
        file === ".aegis" ||
        file === ".turbo"
      ) {
        continue;
      }
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results.push(...this.walk(fullPath));
      } else {
        results.push(fullPath);
      }
    }
    return results;
  }

  private extractDependencies(dir: string): string[] {
    const pkgPath = join(dir, "package.json");
    if (!existsSync(pkgPath)) return [];
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      return [
        ...Object.keys(pkg.dependencies ?? {}),
        ...Object.keys(pkg.devDependencies ?? {}),
      ];
    } catch {
      return [];
    }
  }

  private extractPrismaModels(dir: string): string[] {
    const prismaSchemaPath = join(dir, "prisma", "schema.prisma");
    if (!existsSync(prismaSchemaPath)) return [];
    try {
      const content = readFileSync(prismaSchemaPath, "utf8");
      const modelRegex = /model\s+(\w+)\s*\{/g;
      const models: string[] = [];
      let match;
      while ((match = modelRegex.exec(content)) !== null) {
        models.push(match[1]);
      }
      return models;
    } catch {
      return [];
    }
  }

  private indexExports(projectDir: string, files: string[]): { file: string; symbol: string; type: string }[] {
    const list: { file: string; symbol: string; type: string }[] = [];
    const tsFiles = files.filter(f => f.endsWith(".ts") || f.endsWith(".tsx"));

    // Simple regexes to find TS exports
    const exportRegexes = [
      { regex: /export\s+interface\s+(\w+)/g, type: "interface" },
      { regex: /export\s+type\s+(\w+)/g, type: "type" },
      { regex: /export\s+class\s+(\w+)/g, type: "class" },
      { regex: /export\s+const\s+(\w+)\s*:/g, type: "constant" },
      { regex: /export\s+function\s+(\w+)/g, type: "function" },
      { regex: /export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\(/g, type: "arrow-function" },
    ];

    for (const file of tsFiles) {
      try {
        const content = readFileSync(file, "utf8");
        const relPath = file.replace(projectDir, "").replace(/^[/\\]+/, "").replace(/\\/g, "/");

        for (const entry of exportRegexes) {
          entry.regex.lastIndex = 0;
          let match;
          while ((match = entry.regex.exec(content)) !== null) {
            list.push({
              file: relPath,
              symbol: match[1],
              type: entry.type,
            });
          }
        }
      } catch {
        // ignore read errors
      }
    }
    return list;
  }

  private indexEndpoints(files: string[]): { file: string; method: string; path: string }[] {
    const list: { file: string; method: string; path: string }[] = [];
    const serverFiles = files.filter(f => f.includes("server") || f.includes("api") || f.endsWith(".ts") || f.endsWith(".js"));

    const endpointRegex = /(app|router|route)\.(get|post|put|delete|patch)\(\s*['"]([^'"]+)['"]/g;

    for (const file of serverFiles) {
      try {
        const content = readFileSync(file, "utf8");
        const relPath = file.split(/[/\\]/).slice(-2).join("/"); // just filename/parent for display

        endpointRegex.lastIndex = 0;
        let match;
        while ((match = endpointRegex.exec(content)) !== null) {
          list.push({
            file: relPath,
            method: match[2].toUpperCase(),
            path: match[3],
          });
        }
      } catch {
        // ignore read errors
      }
    }
    return list;
  }

  formatAsMarkdown(index: WorkspaceIndex, scope?: TaskIntelligenceScope): string {
    const sections: string[] = [];

    // 1. Dependencies — filter build tooling if scoped
    let deps = index.dependencies;
    if (scope) {
      const ignored = ["@types/", "@vitejs/", "vite", "typescript", "eslint", "postcss", "autoprefixer", "vitest", "prettier", "turbo", "@tailwindcss/"];
      deps = deps.filter(d => !ignored.some(ig => d.startsWith(ig) || d === ig)).slice(0, 10);
    }
    if (deps.length > 0) {
      sections.push(`### 📦 Project Dependencies\n${deps.map(d => `- \`${d}\``).join("\n")}`);
    }

    // 2. Database Models (Prisma) — task-scoped
    if (index.prismaModels.length > 0) {
      const isDbRelevant = !scope || scope.stage === "Database" || scope.stage === "Backend" || /prisma|database|schema|model/i.test(scope.taskTitle || "");
      if (isDbRelevant) {
        sections.push(`### 🗄️ Database Models (Prisma Schema)\n${index.prismaModels.map(m => `- Model: \`${m}\``).join("\n")}`);
      }
    }

    // 3. REST API Endpoints — task-scoped
    if (index.endpoints.length > 0) {
      const isApiRelevant = !scope || scope.stage === "Backend" || /api|backend|rest|endpoint|fetch/i.test(scope.taskTitle || "");
      if (isApiRelevant) {
        const epList = scope ? index.endpoints.slice(0, 6) : index.endpoints;
        sections.push(`### 🌐 REST API Endpoints\n${epList.map(e => `- \`${e.method}\` \`${e.path}\` (defined in \`${e.file}\`)`).join("\n")}`);
      }
    }

    // 4. TypeScript Symbols & Exports — task-scoped
    if (index.exports.length > 0) {
      // Group exports by file
      const grouped: Record<string, typeof index.exports> = {};
      for (const exp of index.exports) {
        grouped[exp.file] ??= [];
        grouped[exp.file].push(exp);
      }

      let fileEntries = Object.entries(grouped);

      if (scope) {
        const ownedSet = new Set((scope.ownedFiles || []).map(f => f.replace(/\\/g, "/")));
        const keywords = (scope.taskKeywords || []).map(k => k.toLowerCase());

        // Prioritize: owned files, shared UI/design-system, services, and files matching keywords
        fileEntries = fileEntries.filter(([file]) => {
          const normFile = file.replace(/\\/g, "/").toLowerCase();
          if (ownedSet.has(normFile)) return true;
          if (normFile.includes("design-system") || normFile.includes("shared/components")) return true;
          if (normFile.includes("services/api")) return true;
          if (keywords.some(k => normFile.includes(k))) return true;
          return false;
        }).slice(0, 8); // cap to at most 8 task-relevant files
      } else {
        fileEntries = fileEntries.slice(0, 30);
      }

      if (fileEntries.length > 0) {
        const maxSymbolsPerFile = scope ? 5 : 8;
        const exportLines = fileEntries.map(([file, symbols]) => {
          const symStr = symbols.slice(0, maxSymbolsPerFile).map(s => `\`${s.symbol}\` (${s.type})`).join(", ");
          const overflow = symbols.length > maxSymbolsPerFile ? ` (+${symbols.length - maxSymbolsPerFile} more)` : "";
          return `- File \`${file}\`: ${symStr}${overflow}`;
        });

        sections.push(`### 🧩 TypeScript Symbols & Exports (Task-Relevant)\n${exportLines.join("\n")}`);
      }
    }

    return sections.join("\n\n");
  }
}

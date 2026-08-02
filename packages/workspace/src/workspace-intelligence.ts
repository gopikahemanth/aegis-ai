import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export interface WorkspaceIndex {
  files: string[];
  dependencies: string[];
  exports: { file: string; symbol: string; type: string }[];
  prismaModels: string[];
  endpoints: { file: string; method: string; path: string }[];
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

  formatAsMarkdown(index: WorkspaceIndex): string {
    const sections: string[] = [];

    sections.push(`### 📦 Project Dependencies
${index.dependencies.length > 0 ? index.dependencies.map(d => `- \`${d}\``).join("\n") : "None"}`);

    if (index.prismaModels.length > 0) {
      sections.push(`### 🗄️ Database Models (Prisma Schema)
${index.prismaModels.map(m => `- Model: \`${m}\``).join("\n")}`);
    }

    if (index.endpoints.length > 0) {
      sections.push(`### 🌐 REST API Endpoints
${index.endpoints.map(e => `- \`${e.method}\` \`${e.path}\` (defined in \`${e.file}\`)`).join("\n")}`);
    }

    if (index.exports.length > 0) {
      // Group exports by file
      const grouped: Record<string, typeof index.exports> = {};
      for (const exp of index.exports) {
        grouped[exp.file] ??= [];
        grouped[exp.file].push(exp);
      }

      const exportLines = Object.entries(grouped)
        .slice(0, 30) // cap to avoid context size explosion
        .map(([file, symbols]) => {
          const symStr = symbols.slice(0, 8).map(s => `\`${s.symbol}\` (${s.type})`).join(", ");
          const overflow = symbols.length > 8 ? ` (+${symbols.length - 8} more)` : "";
          return `- File \`${file}\`: ${symStr}${overflow}`;
        });

      sections.push(`### 🧩 TypeScript Symbols & Exports
${exportLines.join("\n")}`);
    }

    return sections.join("\n\n");
  }
}

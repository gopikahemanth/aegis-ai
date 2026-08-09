import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";

export interface SymbolEntry {
  symbol: string;
  file: string;
  isExported: boolean;
  layer: "server" | "client" | "shared" | "prisma";
}

export class SymbolRegistry {
  private static instance: SymbolRegistry;
  private symbols: Map<string, SymbolEntry[]> = new Map();

  public static getInstance(): SymbolRegistry {
    if (!SymbolRegistry.instance) {
      SymbolRegistry.instance = new SymbolRegistry();
    }
    return SymbolRegistry.instance;
  }

  public registerProject(projectRoot: string): void {
    this.symbols.clear();
    const files = this.collectFiles(projectRoot);

    for (const relPath of files) {
      const fullPath = join(projectRoot, relPath);
      let content = "";
      try { content = readFileSync(fullPath, "utf8"); } catch { continue; }

      const layer = relPath.startsWith("server") ? "server" :
                    relPath.startsWith("prisma") ? "prisma" :
                    relPath.includes("shared") ? "shared" : "client";

      const symbolRegex = /(?:export\s+)?(?:const|let|var|function|class)\s+([a-zA-Z0-9_$]+)/g;
      let match: RegExpExecArray | null;

      while ((match = symbolRegex.exec(content)) !== null) {
        const sym = match[1];
        const isExported = match[0].startsWith("export");
        const entryList = this.symbols.get(sym) || [];
        entryList.push({ symbol: sym, file: relPath.replace(/\\/g, "/"), isExported, layer });
        this.symbols.set(sym, entryList);
      }
    }
  }

  public hasConflict(symbol: string, currentFile: string): boolean {
    const existing = this.symbols.get(symbol);
    if (!existing) return false;
    const normalizedFile = currentFile.replace(/\\/g, "/");
    return existing.some(e => e.file !== normalizedFile && e.isExported);
  }

  private collectFiles(dir: string, files: string[] = [], baseDir = dir): string[] {
    if (!existsSync(dir)) return files;
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry === ".git" || entry === "dist" || entry === ".aegis") continue;
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        this.collectFiles(full, files, baseDir);
      } else if ([".ts", ".tsx", ".js", ".jsx"].includes(extname(entry))) {
        files.push(relative(baseDir, full));
      }
    }
    return files;
  }
}

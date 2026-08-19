/**
 * TsSymbolRepairEngine
 *
 * Provides focused deterministic diagnosis and minimal repairs for TypeScript
 * symbol, export, import, and casing mismatches:
 * - TS2724: Symbol not exported, "Did you mean '...'?"
 * - TS2305: Module has no exported member
 * - TS2551: Property does not exist, "Did you mean '...'?"
 * - TS2614: Incorrect named import for default export
 * - TS2304: Unresolved name
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname, resolve, extname } from "node:path";

export interface SymbolRepairAction {
  fileToModify: string;
  originalContent: string;
  modifiedContent: string;
  description: string;
  applied: boolean;
}

export interface TsErrorParsed {
  code: "TS2724" | "TS2305" | "TS2551" | "TS2614" | "TS2304" | string;
  importerFile: string;
  line: number;
  col: number;
  message: string;
  moduleSpecifier?: string;
  requestedSymbol?: string;
  suggestedSymbol?: string;
}

export class TsSymbolRepairEngine {
  /**
   * Parse a TS compiler stderr and apply deterministic symbol/casing/export fixes.
   * Returns list of repair actions executed.
   */
  public static repair(
    projectRoot: string,
    diagnosticsText: string
  ): SymbolRepairAction[] {
    const parsedErrors = this.parseErrors(diagnosticsText);
    const actions: SymbolRepairAction[] = [];

    for (const err of parsedErrors) {
      try {
        const action = this.attemptRepair(projectRoot, err);
        if (action && action.applied) {
          actions.push(action);
        }
      } catch (err: any) {
        console.warn(`[TsSymbolRepairEngine] Warning during symbol repair: ${err.message}`);
      }
    }

    return actions;
  }

  /**
   * Parse TS2724, TS2305, TS2551, TS2614, TS2304 from diagnostics.
   */
  public static parseErrors(text: string): TsErrorParsed[] {
    const lines = (text || "").split(/\r?\n/);
    const results: TsErrorParsed[] = [];

    const cleanQuotes = (s: string) => (s || "").replace(/^['"]+|['"]+$/g, "").replace(/^['"]+|['"]+$/g, "").trim();

    for (const line of lines) {
      // TS2724: '"../hooks/use-kanban-dnd"' has no exported member named 'useKanbanDnd'. Did you mean 'use_kanban_dnd'?
      const ts2724Match = line.match(/^([^(]+)\((\d+),(\d+)\):\s+error\s+(TS2724):\s+(.+?)\s+has no exported member named\s+(.+?)\.\s+Did you mean\s+(.+?)\?/);
      if (ts2724Match) {
        results.push({
          importerFile: ts2724Match[1].trim().replace(/\\/g, "/"),
          line: parseInt(ts2724Match[2], 10),
          col: parseInt(ts2724Match[3], 10),
          code: "TS2724",
          moduleSpecifier: cleanQuotes(ts2724Match[5]),
          requestedSymbol: cleanQuotes(ts2724Match[6]),
          suggestedSymbol: cleanQuotes(ts2724Match[7]),
          message: line,
        });
        continue;
      }

      // TS2305: Module '"../components/Card"' has no exported member 'GlassCard'.
      const ts2305Match = line.match(/^([^(]+)\((\d+),(\d+)\):\s+error\s+(TS2305):\s+Module\s+(.+?)\s+has no exported member\s+(.+?)\.?$/);
      if (ts2305Match) {
        results.push({
          importerFile: ts2305Match[1].trim().replace(/\\/g, "/"),
          line: parseInt(ts2305Match[2], 10),
          col: parseInt(ts2305Match[3], 10),
          code: "TS2305",
          moduleSpecifier: cleanQuotes(ts2305Match[5]),
          requestedSymbol: cleanQuotes(ts2305Match[6]),
          message: line,
        });
        continue;
      }

      // TS2614: Module '"./Button"' has no exported member 'Button'. Did you mean to use 'import Button from "./Button"' instead?
      const ts2614Match = line.match(/^([^(]+)\((\d+),(\d+)\):\s+error\s+(TS2614):\s+Module\s+(.+?)\s+has no exported member\s+(.+?)\.\s+Did you mean to use\s+['"]?import\s+([a-zA-Z0-9_]+)\s+from/);
      if (ts2614Match) {
        results.push({
          importerFile: ts2614Match[1].trim().replace(/\\/g, "/"),
          line: parseInt(ts2614Match[2], 10),
          col: parseInt(ts2614Match[3], 10),
          code: "TS2614",
          moduleSpecifier: cleanQuotes(ts2614Match[5]),
          requestedSymbol: cleanQuotes(ts2614Match[6]),
          suggestedSymbol: cleanQuotes(ts2614Match[7]),
          message: line,
        });
        continue;
      }

      // TS2551: Property 'task_list' does not exist on type 'TaskListProps'. Did you mean 'taskList'?
      const ts2551Match = line.match(/^([^(]+)\((\d+),(\d+)\):\s+error\s+(TS2551):\s+Property\s+(.+?)\s+does not exist on type\s+(.+?)\.\s+Did you mean\s+(.+?)\?/);
      if (ts2551Match) {
        results.push({
          importerFile: ts2551Match[1].trim().replace(/\\/g, "/"),
          line: parseInt(ts2551Match[2], 10),
          col: parseInt(ts2551Match[3], 10),
          code: "TS2551",
          requestedSymbol: cleanQuotes(ts2551Match[5]),
          suggestedSymbol: cleanQuotes(ts2551Match[7]),
          message: line,
        });
        continue;
      }
    }

    return results;
  }

  private static attemptRepair(
    projectRoot: string,
    err: TsErrorParsed
  ): SymbolRepairAction | null {
    // 1. Handle TS2614 (Named import used for default export)
    if (err.code === "TS2614" && err.moduleSpecifier && err.requestedSymbol) {
      return this.fixDefaultVsNamedImport(projectRoot, err);
    }

    // 2. Handle TS2724 (Explicit suggestion from TypeScript compiler, e.g. use_kanban_dnd vs useKanbanDnd)
    if (err.code === "TS2724" && err.moduleSpecifier && err.requestedSymbol && err.suggestedSymbol) {
      return this.fixCasingMismatchWithSuggestion(projectRoot, err);
    }

    // 3. Handle TS2305 (Missing export in target module: check for casing alias or barrel re-export)
    if (err.code === "TS2305" && err.moduleSpecifier && err.requestedSymbol) {
      return this.fixMissingExportInModule(projectRoot, err);
    }

    // 4. Handle TS2551 (Property name mismatch in caller)
    if (err.code === "TS2551" && err.requestedSymbol && err.suggestedSymbol) {
      return this.fixPropertyMismatch(projectRoot, err);
    }

    return null;
  }

  /**
   * Fix TS2724 by adding compatibility alias to target module or updating import.
   */
  private static fixCasingMismatchWithSuggestion(
    projectRoot: string,
    err: TsErrorParsed
  ): SymbolRepairAction | null {
    const targetModuleAbs = this.resolveModulePath(projectRoot, err.importerFile, err.moduleSpecifier!);
    if (!targetModuleAbs || !existsSync(targetModuleAbs)) {
      // Fallback: fix in caller file
      return this.fixImportSymbolInCaller(projectRoot, err.importerFile, err.requestedSymbol!, err.suggestedSymbol!);
    }

    const content = readFileSync(targetModuleAbs, "utf8");
    const requested = err.requestedSymbol!;
    const suggested = err.suggestedSymbol!;

    // If target module already contains suggested symbol export, add alias export for requested symbol
    if (content.includes(suggested)) {
      if (content.includes(`export const ${requested}`) || content.includes(`export function ${requested}`)) {
        return null; // Already present
      }

      const aliasShim = `\n// Compatibility alias for ${requested}\nexport const ${requested} = ${suggested};\n`;
      const newContent = content + aliasShim;
      writeFileSync(targetModuleAbs, newContent, "utf8");

      console.log(`[TsSymbolRepairEngine] ✓ Added symbol compatibility alias '${requested} = ${suggested}' to ${targetModuleAbs}`);
      return {
        fileToModify: targetModuleAbs,
        originalContent: content,
        modifiedContent: newContent,
        description: `Added export alias '${requested} = ${suggested}' to target module`,
        applied: true,
      };
    }

    // Otherwise replace in importer file
    return this.fixImportSymbolInCaller(projectRoot, err.importerFile, requested, suggested);
  }

  /**
   * Fix TS2305 by discovering casing differences or adding missing re-export.
   */
  private static fixMissingExportInModule(
    projectRoot: string,
    err: TsErrorParsed
  ): SymbolRepairAction | null {
    const targetModuleAbs = this.resolveModulePath(projectRoot, err.importerFile, err.moduleSpecifier!);
    if (!targetModuleAbs || !existsSync(targetModuleAbs)) {
      return null;
    }

    const content = readFileSync(targetModuleAbs, "utf8");
    const requested = err.requestedSymbol!;
    const normRequested = this.normalizeToken(requested);

    // Extract all declared identifiers and exports from target module
    const declaredExports = this.extractDeclaredExports(content);

    // Look for case-insensitive / token-normalized match
    for (const exp of declaredExports) {
      if (this.normalizeToken(exp) === normRequested && exp !== requested) {
        // Found matching casing variant! Add alias shim
        const aliasShim = `\nexport const ${requested} = ${exp};\n`;
        const newContent = content + aliasShim;
        writeFileSync(targetModuleAbs, newContent, "utf8");

        console.log(`[TsSymbolRepairEngine] ✓ Normalized casing: added '${requested} = ${exp}' alias to ${targetModuleAbs}`);
        return {
          fileToModify: targetModuleAbs,
          originalContent: content,
          modifiedContent: newContent,
          description: `Added casing alias '${requested} = ${exp}' to target module`,
          applied: true,
        };
      }
    }

    // Check if target module has a default export that matches requested
    if (content.includes("export default")) {
      const defaultMatch = content.match(/export\s+default\s+(?:function\s+)?([a-zA-Z0-9_]+)/);
      if (defaultMatch) {
        const defaultName = defaultMatch[1];
        if (this.normalizeToken(defaultName) === normRequested || defaultName === requested) {
          const aliasShim = `\nexport const ${requested} = ${defaultName};\n`;
          const newContent = content + aliasShim;
          writeFileSync(targetModuleAbs, newContent, "utf8");
          return {
            fileToModify: targetModuleAbs,
            originalContent: content,
            modifiedContent: newContent,
            description: `Exported named alias '${requested}' for default export '${defaultName}'`,
            applied: true,
          };
        }
      }
    }

    return null;
  }

  /**
   * Fix TS2614: named import for a default export.
   */
  private static fixDefaultVsNamedImport(
    projectRoot: string,
    err: TsErrorParsed
  ): SymbolRepairAction | null {
    const absImporter = join(projectRoot, err.importerFile);
    if (!existsSync(absImporter)) return null;

    const content = readFileSync(absImporter, "utf8");
    const symbol = err.requestedSymbol!;
    const mod = err.moduleSpecifier!;

    // Find import { Symbol } from "mod" -> import Symbol from "mod"
    const namedImportRegex = new RegExp(`import\\s*\\{\\s*${symbol}\\s*\\}\\s*from\\s*['"]${this.escapeRegex(mod)}['"]`, "g");
    if (namedImportRegex.test(content)) {
      const newContent = content.replace(namedImportRegex, `import ${symbol} from "${mod}"`);
      writeFileSync(absImporter, newContent, "utf8");
      console.log(`[TsSymbolRepairEngine] ✓ Converted named import to default import in ${absImporter}`);
      return {
        fileToModify: absImporter,
        originalContent: content,
        modifiedContent: newContent,
        description: `Converted { ${symbol} } to default import in ${err.importerFile}`,
        applied: true,
      };
    }

    return null;
  }

  /**
   * Fix TS2551: property mismatch in caller file.
   */
  private static fixPropertyMismatch(
    projectRoot: string,
    err: TsErrorParsed
  ): SymbolRepairAction | null {
    const absImporter = join(projectRoot, err.importerFile);
    if (!existsSync(absImporter)) return null;

    const content = readFileSync(absImporter, "utf8");
    const requested = err.requestedSymbol!;
    const suggested = err.suggestedSymbol!;

    const propRegex = new RegExp(`\\b${this.escapeRegex(requested)}\\b`, "g");
    if (propRegex.test(content)) {
      const newContent = content.replace(propRegex, suggested);
      writeFileSync(absImporter, newContent, "utf8");
      console.log(`[TsSymbolRepairEngine] ✓ Corrected property '${requested}' -> '${suggested}' in ${absImporter}`);
      return {
        fileToModify: absImporter,
        originalContent: content,
        modifiedContent: newContent,
        description: `Corrected property '${requested}' to '${suggested}' in ${err.importerFile}`,
        applied: true,
      };
    }

    return null;
  }

  /**
   * Fix import symbol name directly in caller.
   */
  private static fixImportSymbolInCaller(
    projectRoot: string,
    importerRelPath: string,
    oldSymbol: string,
    newSymbol: string
  ): SymbolRepairAction | null {
    const absImporter = join(projectRoot, importerRelPath);
    if (!existsSync(absImporter)) return null;

    const content = readFileSync(absImporter, "utf8");
    const importSymbolRegex = new RegExp(`\\b${this.escapeRegex(oldSymbol)}\\b`, "g");
    if (importSymbolRegex.test(content)) {
      const newContent = content.replace(importSymbolRegex, newSymbol);
      writeFileSync(absImporter, newContent, "utf8");
      console.log(`[TsSymbolRepairEngine] ✓ Updated symbol '${oldSymbol}' -> '${newSymbol}' in ${absImporter}`);
      return {
        fileToModify: absImporter,
        originalContent: content,
        modifiedContent: newContent,
        description: `Updated symbol '${oldSymbol}' to '${newSymbol}' in ${importerRelPath}`,
        applied: true,
      };
    }

    return null;
  }

  /**
   * Resolve relative module path to an existing absolute file on disk.
   */
  private static resolveModulePath(
    projectRoot: string,
    importerRelFile: string,
    moduleSpecifier: string
  ): string | null {
    const importerDir = dirname(join(projectRoot, importerRelFile));
    let rawTarget = resolve(importerDir, moduleSpecifier);

    const extensions = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js", "/index.jsx"];
    for (const ext of extensions) {
      const candidate = rawTarget + ext;
      if (existsSync(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Extract all declared function / const / type / interface exports from source code.
   */
  private static extractDeclaredExports(content: string): string[] {
    const exports = new Set<string>();
    const matches = content.matchAll(/export\s+(?:const|function|class|type|interface|let|var)\s+([a-zA-Z0-9_]+)/g);
    for (const m of matches) {
      exports.add(m[1]);
    }

    const namedBlockMatches = content.matchAll(/export\s*\{([^}]+)\}/g);
    for (const m of namedBlockMatches) {
      const items = m[1].split(",");
      for (const item of items) {
        const parts = item.trim().split(/\s+as\s+/);
        const name = (parts[1] || parts[0] || "").trim();
        if (name) exports.add(name);
      }
    }

    return Array.from(exports);
  }

  private static normalizeToken(s: string): string {
    return (s || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  }

  private static escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}

/**
 * ImportExportValidator
 *
 * Statically analyzes TypeScript and JavaScript source files for import/export consistency,
 * missing exports, unresolved local modules, case-sensitivity collisions, and server/client boundary violations.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, basename, extname } from "node:path";
import { SymbolRegistry } from "./symbol-registry.js";

export const SERVER_ONLY_MODULES = [
  "@prisma/client",
  "fs",
  "node:fs",
  "child_process",
  "node:child_process",
  "pg",
  "mysql2",
  "sqlite3",
  "mongoose",
  "jsonwebtoken",
  "bcrypt",
  "bcryptjs",
];


export type ImportExportViolationType =
  | "MISSING_EXPORT"
  | "INVALID_EXPORT"
  | "MISSING_IMPORT"
  | "UNRESOLVED_MODULE"
  | "INVALID_IMPORT_PATH"
  | "CASE_MISMATCH"
  | "SERVER_CLIENT_BOUNDARY_VIOLATION"
  | "SYMBOL_CONTRACT_CONFLICT";

export interface ImportExportViolation {
  type: ImportExportViolationType;
  file: string;
  symbol?: string;
  importPath?: string;
  message: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
}

export interface ImportExportValidationResult {
  isValid: boolean;
  violations: ImportExportViolation[];
  exportedSymbols: string[];
  importedSymbols: Array<{ symbol: string; source: string }>;
}

export class ImportExportValidator {
  /**
   * Validate a single file's content and its imports/exports against the project and task requirements.
   */
  public static validateFile(
    projectRoot: string,
    relativeFilePath: string,
    fileContent: string,
    options: {
      requiredExports?: string[];
      requiredImports?: string[];
      isFrontend?: boolean;
    } = {}
  ): ImportExportValidationResult {
    const violations: ImportExportViolation[] = [];
    const normalizedRelPath = relativeFilePath.replace(/\\/g, "/");
    const isFrontend = options.isFrontend ?? (normalizedRelPath.startsWith("src/") || normalizedRelPath.includes("/client/"));

    // 1. Extract Actual Exports
    const exportedSymbols = this.extractExports(fileContent);

    // Check against TaskContract.requiredExports
    if (options.requiredExports) {
      for (const req of options.requiredExports) {
        if (!exportedSymbols.includes(req)) {
          violations.push({
            type: "MISSING_EXPORT",
            file: normalizedRelPath,
            symbol: req,
            message: `Required export "${req}" is missing from "${normalizedRelPath}". Found exports: [${exportedSymbols.join(", ")}]`,
            severity: "CRITICAL",
          });
        }
      }
    }

    // 2. Extract and Validate Imports
    const importedSymbols = this.extractImports(fileContent);

    for (const imp of importedSymbols) {
      // Check Server/Client Boundary Violations
      if (isFrontend) {
        const isServerModule =
          SERVER_ONLY_MODULES.includes(imp.source as any) ||
          imp.source === "@prisma/client" ||
          imp.source === "fs" ||
          imp.source === "child_process" ||
          imp.source.startsWith("server/");

        if (isServerModule) {
          violations.push({
            type: "SERVER_CLIENT_BOUNDARY_VIOLATION",
            file: normalizedRelPath,
            symbol: imp.symbol,
            importPath: imp.source,
            message: `Frontend component "${normalizedRelPath}" forbiddenly imports server-only module "${imp.source}".`,
            severity: "CRITICAL",
          });
          continue;
        }
      }

      // Check Local Relative Imports (e.g. ./routes, ../services/api)
      if (imp.source.startsWith(".")) {
        const fullDir = join(projectRoot, dirname(normalizedRelPath));
        const resolvedPath = this.resolveLocalImport(fullDir, imp.source);

        if (!resolvedPath.exists) {
          violations.push({
            type: "UNRESOLVED_MODULE",
            file: normalizedRelPath,
            symbol: imp.symbol,
            importPath: imp.source,
            message: `Cannot resolve local import "${imp.source}" from "${normalizedRelPath}". File does not exist on disk.`,
            severity: "HIGH",
          });
        } else if (resolvedPath.caseMismatch) {
          violations.push({
            type: "CASE_MISMATCH",
            file: normalizedRelPath,
            symbol: imp.symbol,
            importPath: imp.source,
            message: `Import path "${imp.source}" has a case-sensitivity mismatch with actual file "${resolvedPath.actualName}".`,
            severity: "HIGH",
          });
        }
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      exportedSymbols,
      importedSymbols,
    };
  }

  /**
   * Extract all exported symbols from TypeScript/JavaScript source.
   */
  public static extractExports(content: string): string[] {
    const exports: string[] = [];

    // export const / function / class / interface / type / enum
    const namedDeclRegex = /export\s+(?:const|let|var|function|class|interface|type|enum|default)\s+([a-zA-Z0-9_$]+)/g;
    let match: RegExpExecArray | null;
    while ((match = namedDeclRegex.exec(content)) !== null) {
      if (match[1]) exports.push(match[1]);
    }

    // export { Foo, Bar as Baz }
    const listExportRegex = /export\s+\{([^}]+)\}/g;
    while ((match = listExportRegex.exec(content)) !== null) {
      const symbols = match[1].split(",").map(s => {
        const parts = s.trim().split(/\s+as\s+/);
        return parts[parts.length - 1].trim();
      }).filter(Boolean);
      exports.push(...symbols);
    }

    // export default function / class
    if (content.includes("export default") && !exports.includes("default")) {
      exports.push("default");
    }

    return Array.from(new Set(exports));
  }

  /**
   * Extract all imported symbols and source modules.
   */
  public static extractImports(content: string): Array<{ symbol: string; source: string }> {
    const imports: Array<{ symbol: string; source: string }> = [];

    // import { A, B as C } from "module"
    const namedImportRegex = /import\s+\{([^}]+)\}\s+from\s+["']([^"']+)["']/g;
    let match: RegExpExecArray | null;
    while ((match = namedImportRegex.exec(content)) !== null) {
      const rawSymbols = match[1].split(",").map(s => s.trim()).filter(Boolean);
      const source = match[2];
      for (const raw of rawSymbols) {
        const sym = raw.split(/\s+as\s+/)[0].trim();
        imports.push({ symbol: sym, source });
      }
    }

    // import DefaultName from "module"
    const defaultImportRegex = /import\s+([a-zA-Z0-9_$]+)\s+from\s+["']([^"']+)["']/g;
    while ((match = defaultImportRegex.exec(content)) !== null) {
      if (!match[1].startsWith("{")) {
        imports.push({ symbol: match[1], source: match[2] });
      }
    }

    // import * as StarName from "module"
    const starImportRegex = /import\s+\*\s+as\s+([a-zA-Z0-9_$]+)\s+from\s+["']([^"']+)["']/g;
    while ((match = starImportRegex.exec(content)) !== null) {
      imports.push({ symbol: match[1], source: match[2] });
    }

    return imports;
  }

  /**
   * Resolve a local import path and check for exact case match on disk.
   */
  private static resolveLocalImport(fromDir: string, importPath: string): { exists: boolean; caseMismatch?: boolean; actualName?: string } {
    const targetBase = resolve(fromDir, importPath);
    const extensions = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js"];

    for (const ext of extensions) {
      const candidate = targetBase + ext;
      if (existsSync(candidate)) {
        // Check case sensitivity in the directory
        const parentDir = dirname(candidate);
        const expectedBaseName = basename(candidate);
        try {
          const dirEntries = readdirSync(parentDir);
          const exactMatch = dirEntries.includes(expectedBaseName);
          const caseInsensitiveMatch = dirEntries.find(e => e.toLowerCase() === expectedBaseName.toLowerCase());

          if (!exactMatch && caseInsensitiveMatch) {
            return { exists: true, caseMismatch: true, actualName: caseInsensitiveMatch };
          }
        } catch {}

        return { exists: true, caseMismatch: false };
      }
    }

    return { exists: false };
  }
}

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CanonicalFileGraph, CanonicalModuleRegistry } from "./canonical-file-graph.js";

export interface SymbolValidationError {
  sourceFile: string;
  targetFile: string;
  importedSymbol: string;
  isNamed: boolean;
  message: string;
}

export interface SymbolValidationReport {
  valid: boolean;
  totalImportsChecked: number;
  errors: SymbolValidationError[];
}

export class SymbolContractValidator {
  public static validateFile(sourcePath: string, content: string, projectRoot: string): SymbolValidationError[] {
    const errors: SymbolValidationError[] = [];
    const importRegex = /import\s+(?:({[^}]+})|([a-zA-Z0-9_$]+)|(\*\s+as\s+[a-zA-Z0-9_$]+))(?:\s*,\s*(?:({[^}]+})|([a-zA-Z0-9_$]+)))?\s+from\s+['"]([^'"]+)['"]/g;

    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(content)) !== null) {
      const namedBraces1 = match[1];
      const defaultImport1 = match[2];
      const namedBraces2 = match[4];
      const defaultImport2 = match[5];
      const importPath = match[6];

      if (importPath.startsWith("node:") || (!importPath.startsWith(".") && !importPath.startsWith("@/") && !importPath.startsWith("src/") && !importPath.startsWith("server/"))) continue;

      const modRes = CanonicalModuleRegistry.resolveImport(sourcePath, importPath);
      if (!modRes.resolvedPath) continue;

      const targetAbs = join(projectRoot, modRes.resolvedPath);
      if (!existsSync(targetAbs)) continue;

      const targetContent = readFileSync(targetAbs, "utf8");
      const targetExports = this.parseExports(targetContent);

      const namedGroup = namedBraces1 || namedBraces2;
      if (namedGroup) {
        const symbols = namedGroup
          .replace(/[{}]/g, "")
          .split(",")
          .map(s => s.trim().split(/\s+as\s+/)[0])
          .filter(Boolean);

        for (const sym of symbols) {
          if (!targetExports.named.has(sym)) {
            errors.push({
              sourceFile: sourcePath,
              targetFile: modRes.resolvedPath,
              importedSymbol: sym,
              isNamed: true,
              message: `EXPORT_SYMBOL_MISSING: Named export "${sym}" requested by ${sourcePath} is not exported by target canonical module ${modRes.resolvedPath}. Available named exports: [${Array.from(targetExports.named).join(", ")}]`,
            });
          }
        }
      }

      const defGroup = defaultImport1 || defaultImport2;
      if (defGroup && !namedBraces1 && !namedBraces2) {
        if (!targetExports.hasDefault) {
          errors.push({
            sourceFile: sourcePath,
            targetFile: modRes.resolvedPath,
            importedSymbol: defGroup,
            isNamed: false,
            message: `EXPORT_SYMBOL_MISSING: Default export "${defGroup}" requested by ${sourcePath} is not provided by target canonical module ${modRes.resolvedPath}.`,
          });
        }
      }
    }

    return errors;
  }

  public static parseExports(content: string): { named: Set<string>; hasDefault: boolean } {
    const named = new Set<string>();
    let hasDefault = false;

    if (/export\s+default\s+/.test(content)) {
      hasDefault = true;
    }

    const namedFuncMatch = content.matchAll(/export\s+(?:async\s+)?function\s+([a-zA-Z0-9_$]+)/g);
    for (const m of namedFuncMatch) named.add(m[1]);

    const namedConstMatch = content.matchAll(/export\s+(?:const|let|var)\s+([a-zA-Z0-9_$]+)/g);
    for (const m of namedConstMatch) named.add(m[1]);

    const namedTypeMatch = content.matchAll(/export\s+(?:interface|type|class|enum)\s+([a-zA-Z0-9_$]+)/g);
    for (const m of namedTypeMatch) named.add(m[1]);

    const exportListMatch = content.matchAll(/export\s+{([^}]+)}/g);
    for (const m of exportListMatch) {
      const syms = m[1].split(",").map(s => s.trim().split(/\s+as\s+/)[0]).filter(Boolean);
      for (const s of syms) named.add(s);
    }

    return { named, hasDefault };
  }

  public static validateProject(projectRoot: string): SymbolValidationReport {
    const canonicalPaths = CanonicalFileGraph.getAllPaths();
    const errors: SymbolValidationError[] = [];
    let totalImportsChecked = 0;

    for (const relPath of canonicalPaths) {
      const abs = join(projectRoot, relPath);
      if (!existsSync(abs)) continue;
      const content = readFileSync(abs, "utf8");
      const errs = this.validateFile(relPath, content, projectRoot);
      errors.push(...errs);
      totalImportsChecked++;
    }

    const valid = errors.length === 0;

    console.log("\n[SYMBOL CONTRACT]");
    console.log(`Modules checked: ${totalImportsChecked}`);
    console.log(`Symbol mismatches: ${errors.length}`);
    console.log(`Status: ${valid ? "PASS" : "FAIL"}\n`);

    return {
      valid,
      totalImportsChecked,
      errors,
    };
  }
}

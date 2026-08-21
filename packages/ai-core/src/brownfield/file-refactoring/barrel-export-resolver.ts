/**
 * BarrelExportResolver — Aegis V2.3 Project 2 Phase 5
 *
 * Inspects and updates barrel re-export files (`index.ts`, `index.tsx`),
 * rewriting module specifiers when exported target files are renamed or moved,
 * while strictly preserving unrelated exports.
 */

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import { ImportPathRewriter } from "./import-path-rewriter.js";
import type { AstPatchOperation } from "../ast-symbol-patch-planner.js";

export interface BarrelPatchResult {
  barrelFile: string;
  patches: AstPatchOperation[];
}

export class BarrelExportResolver {
  private readonly projectRoot: string;
  private readonly resolver: SymbolReferenceResolver;

  constructor(projectRoot: string, resolver?: SymbolReferenceResolver) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.resolver = resolver || new SymbolReferenceResolver(this.projectRoot);
  }

  /**
   * Resolves and plans barrel export updates for a moved/renamed target file.
   */
  public planBarrelUpdates(
    barrelFile: string,
    oldTargetPath: string,
    newTargetPath: string
  ): BarrelPatchResult {
    const fullPath = resolve(this.projectRoot, barrelFile);
    if (!existsSync(fullPath)) {
      return { barrelFile, patches: [] };
    }

    const content = readFileSync(fullPath, "utf8");
    const isTsx = barrelFile.endsWith(".tsx") || barrelFile.endsWith(".jsx");
    const sf = ts.createSourceFile(
      barrelFile,
      content,
      ts.ScriptTarget.Latest,
      true,
      isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const patches: AstPatchOperation[] = [];

    ts.forEachChild(sf, node => {
      if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const spec = node.moduleSpecifier.text;
        const resolved = this.resolver.resolveModulePath(barrelFile, spec);

        if (resolved === oldTargetPath) {
          const newSpecifier = ImportPathRewriter.computeRelativeSpecifier(
            barrelFile,
            newTargetPath,
            spec
          );

          const patch = ImportPathRewriter.createImportPatch(
            barrelFile,
            node.moduleSpecifier,
            newSpecifier,
            sf,
            `Update barrel re-export to "${newSpecifier}"`
          );
          patches.push(patch);
        }
      }
    });

    return { barrelFile, patches };
  }
}

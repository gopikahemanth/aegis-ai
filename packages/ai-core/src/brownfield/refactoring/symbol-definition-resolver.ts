/**
 * SymbolDefinitionResolver — Aegis V2.3 Project 2 Phase 3
 *
 * Resolves the exact AST definition node for a target symbol within a source file.
 * NEVER identifies symbols solely by name string match — inspects AST node kind,
 * identifier span, export status, and container/scope identity.
 */

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { SymbolKind } from "../symbol-reference-resolver.js";
import type { ResolvedSymbolDefinition } from "./symbol-rename-contract.js";

export class SymbolDefinitionResolver {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Resolves the exact AST definition for a given symbol name and optional kind within a file.
   */
  public resolveDefinition(
    filePath: string,
    symbolName: string,
    expectedKind?: SymbolKind
  ): ResolvedSymbolDefinition | null {
    const relPath = filePath.replace(/\\/g, "/").replace(/^(\/|\\)+/, "");
    const fullPath = resolve(this.projectRoot, relPath);

    if (!existsSync(fullPath)) {
      return null;
    }

    try {
      const content = readFileSync(fullPath, "utf8");
      const isTsx = relPath.endsWith(".tsx") || relPath.endsWith(".jsx");
      const sourceFile = ts.createSourceFile(
        relPath,
        content,
        ts.ScriptTarget.Latest,
        true,
        isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );

      const definitions: ResolvedSymbolDefinition[] = [];

      const visit = (node: ts.Node, currentContainer?: string, scopeDepth = 0) => {
        // 1. Function Declaration
        if (ts.isFunctionDeclaration(node) && node.name && node.name.text === symbolName) {
          const isExported = this.hasExportModifier(node);
          const isDefaultExport = this.hasDefaultModifier(node);
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.name.getStart(sourceFile));
          definitions.push({
            symbolId: `${relPath}#${symbolName}@${line + 1}:${character + 1}`,
            filePath: relPath,
            name: symbolName,
            kind: this.isReactComponent(node) ? "component" : "function",
            isExported,
            isDefaultExport,
            startPos: node.getStart(sourceFile),
            endPos: node.getEnd(),
            nameStartPos: node.name.getStart(sourceFile),
            nameEndPos: node.name.getEnd(),
            line: line + 1,
            col: character + 1,
            scopeId: scopeDepth === 0 ? "global" : `scope_${scopeDepth}`,
            containerName: currentContainer,
          });
        }

        // 2. Class Declaration
        else if (ts.isClassDeclaration(node) && node.name && node.name.text === symbolName) {
          const isExported = this.hasExportModifier(node);
          const isDefaultExport = this.hasDefaultModifier(node);
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.name.getStart(sourceFile));
          definitions.push({
            symbolId: `${relPath}#${symbolName}@${line + 1}:${character + 1}`,
            filePath: relPath,
            name: symbolName,
            kind: "class",
            isExported,
            isDefaultExport,
            startPos: node.getStart(sourceFile),
            endPos: node.getEnd(),
            nameStartPos: node.name.getStart(sourceFile),
            nameEndPos: node.name.getEnd(),
            line: line + 1,
            col: character + 1,
            scopeId: scopeDepth === 0 ? "global" : `scope_${scopeDepth}`,
            containerName: currentContainer,
          });
        }

        // 3. Interface Declaration
        else if (ts.isInterfaceDeclaration(node) && node.name.text === symbolName) {
          const isExported = this.hasExportModifier(node);
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.name.getStart(sourceFile));
          definitions.push({
            symbolId: `${relPath}#${symbolName}@${line + 1}:${character + 1}`,
            filePath: relPath,
            name: symbolName,
            kind: "interface",
            isExported,
            isDefaultExport: false,
            startPos: node.getStart(sourceFile),
            endPos: node.getEnd(),
            nameStartPos: node.name.getStart(sourceFile),
            nameEndPos: node.name.getEnd(),
            line: line + 1,
            col: character + 1,
            scopeId: scopeDepth === 0 ? "global" : `scope_${scopeDepth}`,
            containerName: currentContainer,
          });
        }

        // 4. Type Alias Declaration
        else if (ts.isTypeAliasDeclaration(node) && node.name.text === symbolName) {
          const isExported = this.hasExportModifier(node);
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.name.getStart(sourceFile));
          definitions.push({
            symbolId: `${relPath}#${symbolName}@${line + 1}:${character + 1}`,
            filePath: relPath,
            name: symbolName,
            kind: "type",
            isExported,
            isDefaultExport: false,
            startPos: node.getStart(sourceFile),
            endPos: node.getEnd(),
            nameStartPos: node.name.getStart(sourceFile),
            nameEndPos: node.name.getEnd(),
            line: line + 1,
            col: character + 1,
            scopeId: scopeDepth === 0 ? "global" : `scope_${scopeDepth}`,
            containerName: currentContainer,
          });
        }

        // 5. Enum Declaration
        else if (ts.isEnumDeclaration(node) && node.name.text === symbolName) {
          const isExported = this.hasExportModifier(node);
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.name.getStart(sourceFile));
          definitions.push({
            symbolId: `${relPath}#${symbolName}@${line + 1}:${character + 1}`,
            filePath: relPath,
            name: symbolName,
            kind: "enum",
            isExported,
            isDefaultExport: false,
            startPos: node.getStart(sourceFile),
            endPos: node.getEnd(),
            nameStartPos: node.name.getStart(sourceFile),
            nameEndPos: node.name.getEnd(),
            line: line + 1,
            col: character + 1,
            scopeId: scopeDepth === 0 ? "global" : `scope_${scopeDepth}`,
            containerName: currentContainer,
          });
        }

        // 6. Variable Statement / Declaration
        else if (ts.isVariableStatement(node)) {
          const isExported = this.hasExportModifier(node);
          for (const decl of node.declarationList.declarations) {
            if (ts.isIdentifier(decl.name) && decl.name.text === symbolName) {
              const { line, character } = sourceFile.getLineAndCharacterOfPosition(decl.name.getStart(sourceFile));
              const kind = this.inferVariableKind(decl);
              definitions.push({
                symbolId: `${relPath}#${symbolName}@${line + 1}:${character + 1}`,
                filePath: relPath,
                name: symbolName,
                kind,
                isExported,
                isDefaultExport: false,
                startPos: decl.getStart(sourceFile),
                endPos: decl.getEnd(),
                nameStartPos: decl.name.getStart(sourceFile),
                nameEndPos: decl.name.getEnd(),
                line: line + 1,
                col: character + 1,
                scopeId: scopeDepth === 0 ? "global" : `scope_${scopeDepth}`,
                containerName: currentContainer,
              });
            }
          }
        }

        // 7. Method Declaration (inside Class)
        else if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === symbolName) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.name.getStart(sourceFile));
          definitions.push({
            symbolId: `${relPath}#${currentContainer || "Class"}.${symbolName}@${line + 1}:${character + 1}`,
            filePath: relPath,
            name: symbolName,
            kind: "method",
            isExported: false,
            isDefaultExport: false,
            startPos: node.getStart(sourceFile),
            endPos: node.getEnd(),
            nameStartPos: node.name.getStart(sourceFile),
            nameEndPos: node.name.getEnd(),
            line: line + 1,
            col: character + 1,
            scopeId: `class_${currentContainer || "anon"}`,
            containerName: currentContainer,
          });
        }

        // Recurse into child nodes with updated container/depth
        let nextContainer = currentContainer;
        let nextDepth = scopeDepth;

        if (ts.isClassDeclaration(node) && node.name) {
          nextContainer = node.name.text;
        }
        if (ts.isBlock(node) || ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node)) {
          nextDepth = scopeDepth + 1;
        }

        ts.forEachChild(node, child => visit(child, nextContainer, nextDepth));
      };

      visit(sourceFile);

      if (definitions.length === 0) {
        return null;
      }

      // If expectedKind is provided, prefer matching kind
      if (expectedKind) {
        const exact = definitions.find(d => d.kind === expectedKind);
        if (exact) return exact;
      }

      // Default: prefer top-level exported symbol if multiple, else top-level
      const exportedTopLevel = definitions.find(d => d.isExported && d.scopeId === "global");
      if (exportedTopLevel) return exportedTopLevel;

      const topLevel = definitions.find(d => d.scopeId === "global");
      if (topLevel) return topLevel;

      return definitions[0];
    } catch {
      return null;
    }
  }

  // ── Helper predicates ──────────────────────────────────────────────────────────

  private hasExportModifier(node: ts.Node): boolean {
    const modifiers = (node as any).modifiers as ts.NodeArray<ts.ModifierLike> | undefined;
    if (!modifiers) return false;
    return modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
  }

  private hasDefaultModifier(node: ts.Node): boolean {
    const modifiers = (node as any).modifiers as ts.NodeArray<ts.ModifierLike> | undefined;
    if (!modifiers) return false;
    return modifiers.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);
  }

  private isReactComponent(node: ts.FunctionDeclaration | ts.VariableDeclaration): boolean {
    if (ts.isFunctionDeclaration(node) && node.name) {
      const name = node.name.text;
      return /^[A-Z]/.test(name);
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const name = node.name.text;
      return /^[A-Z]/.test(name);
    }
    return false;
  }

  private inferVariableKind(decl: ts.VariableDeclaration): SymbolKind {
    if (ts.isIdentifier(decl.name) && /^[A-Z]/.test(decl.name.text)) {
      if (decl.initializer && (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))) {
        return "component";
      }
    }
    if (ts.isIdentifier(decl.name) && decl.name.text.startsWith("use") && /^[a-z]use[A-Z]/.test("a" + decl.name.text)) {
      return "hook";
    }
    if (decl.parent && decl.parent.flags & ts.NodeFlags.Const) {
      return "constant";
    }
    return "variable";
  }
}

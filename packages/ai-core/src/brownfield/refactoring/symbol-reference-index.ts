/**
 * SymbolReferenceIndex — Aegis V2.3 Project 2 Phase 3
 *
 * Scans the project AST graph to discover all resolved references, call sites,
 * type references, JSX usages, import/export bindings, and barrel re-exports.
 *
 * SAFETY INVARIANTS:
 * 1. Scope/Shadowing isolation: Local declarations shadowing the symbol name are excluded.
 * 2. Alias preservation: `import { foo as bar }` renames `foo` in the specifier, leaving `bar` unchanged.
 * 3. Barrel preservation: `export { foo as publicFoo }` preserves `publicFoo`.
 * 4. AST node ranges only: Never performs string matching on comments or string literals.
 */

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import type {
  ResolvedSymbolDefinition,
  SymbolReferenceLocation,
  SymbolReferenceKind,
} from "./symbol-rename-contract.js";

export class SymbolReferenceIndex {
  private readonly projectRoot: string;
  private readonly resolver: SymbolReferenceResolver;

  constructor(projectRoot: string, resolver?: SymbolReferenceResolver) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.resolver = resolver || new SymbolReferenceResolver(this.projectRoot);
  }

  /**
   * Discovers all references to the target symbol across the entire project.
   */
  public discoverReferences(target: ResolvedSymbolDefinition): SymbolReferenceLocation[] {
    const summaryMap = this.resolver.parseProject();
    const candidateFiles = Array.from(summaryMap.keys());
    return this.findReferences(target, candidateFiles, target.name);
  }

  /**
   * Discovers all references to the target symbol across all candidate files.
   */
  public findReferences(
    target: ResolvedSymbolDefinition,
    candidateFiles: string[],
    newName: string
  ): SymbolReferenceLocation[] {
    const references: SymbolReferenceLocation[] = [];

    for (const rawFile of candidateFiles) {
      const relPath = rawFile.replace(/\\/g, "/").replace(/^(\/|\\)+/, "");
      const fullPath = resolve(this.projectRoot, relPath);

      if (!existsSync(fullPath)) continue;

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

        const isDefFile = relPath === target.filePath;
        const fileRefs = this.findReferencesInFile(sourceFile, relPath, target, isDefFile, newName);
        references.push(...fileRefs);
      } catch {
        // Continue safely
      }
    }

    // Sort deterministically by file, then startPos ascending
    return references.sort((a, b) => {
      const fileCmp = a.filePath.localeCompare(b.filePath);
      if (fileCmp !== 0) return fileCmp;
      return a.startPos - b.startPos;
    });
  }

  private findReferencesInFile(
    sourceFile: ts.SourceFile,
    relPath: string,
    target: ResolvedSymbolDefinition,
    isDefFile: boolean,
    newName: string
  ): SymbolReferenceLocation[] {
    const refs: SymbolReferenceLocation[] = [];

    // Track import bindings in this file for target symbol
    let localAliasName: string | null = null;
    let isImportedDirectly = false;
    let isNamespaceImported = false;
    let namespaceName: string | null = null;
    let isReExported = false;

    // First pass: scan top-level imports and exports
    ts.forEachChild(sourceFile, node => {
      if (ts.isImportDeclaration(node)) {
        const specifier = node.moduleSpecifier;
        if (ts.isStringLiteral(specifier)) {
          const resolvedPath = this.resolver.resolveModulePath(relPath, specifier.text);
          if (resolvedPath === target.filePath) {
            // Check clause
            const importClause = node.importClause;
            if (importClause) {
              // 1. Default import
              if (importClause.name && target.isDefaultExport) {
                localAliasName = importClause.name.text;
                isImportedDirectly = true;
                const { line, character } = sourceFile.getLineAndCharacterOfPosition(importClause.name.getStart(sourceFile));
                refs.push({
                  filePath: relPath,
                  kind: "DEFAULT_IMPORT",
                  startPos: importClause.name.getStart(sourceFile),
                  endPos: importClause.name.getEnd(),
                  line: line + 1,
                  col: character + 1,
                  matchedText: importClause.name.text,
                  replacementText: newName,
                  scopeId: "global",
                });
              }

              // 2. Named or namespace bindings
              if (importClause.namedBindings) {
                // Namespace: import * as utils from "./target"
                if (ts.isNamespaceImport(importClause.namedBindings)) {
                  isNamespaceImported = true;
                  namespaceName = importClause.namedBindings.name.text;
                }

                // Named: import { foo, foo as bar } from "./target"
                if (ts.isNamedImports(importClause.namedBindings)) {
                  for (const element of importClause.namedBindings.elements) {
                    // element.propertyName is original symbol, element.name is local alias
                    const importedSymbolName = element.propertyName ? element.propertyName.text : element.name.text;
                    if (importedSymbolName === target.name) {
                      isImportedDirectly = true;
                      if (element.propertyName) {
                        // import { foo as bar } -> rename propertyName 'foo' to newName, leave 'bar' intact!
                        localAliasName = element.name.text;
                        const { line, character } = sourceFile.getLineAndCharacterOfPosition(element.propertyName.getStart(sourceFile));
                        refs.push({
                          filePath: relPath,
                          kind: "ALIASED_IMPORT",
                          startPos: element.propertyName.getStart(sourceFile),
                          endPos: element.propertyName.getEnd(),
                          line: line + 1,
                          col: character + 1,
                          matchedText: element.propertyName.text,
                          replacementText: newName,
                          scopeId: "global",
                          isAliased: true,
                          aliasName: element.name.text,
                        });
                      } else {
                        // import { foo } -> rename element.name 'foo' to newName
                        localAliasName = target.name;
                        const { line, character } = sourceFile.getLineAndCharacterOfPosition(element.name.getStart(sourceFile));
                        refs.push({
                          filePath: relPath,
                          kind: "NAMED_IMPORT",
                          startPos: element.name.getStart(sourceFile),
                          endPos: element.name.getEnd(),
                          line: line + 1,
                          col: character + 1,
                          matchedText: element.name.text,
                          replacementText: newName,
                          scopeId: "global",
                        });
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Check re-export declarations (e.g. in barrels: export { foo } from "./target" or export { foo as publicFoo } from "./target")
      if (ts.isExportDeclaration(node)) {
        const specifier = node.moduleSpecifier;
        if (specifier && ts.isStringLiteral(specifier)) {
          const resolvedPath = this.resolver.resolveModulePath(relPath, specifier.text);
          if (resolvedPath === target.filePath) {
            if (node.exportClause && ts.isNamedExports(node.exportClause)) {
              for (const element of node.exportClause.elements) {
                const exportedOriginalName = element.propertyName ? element.propertyName.text : element.name.text;
                if (exportedOriginalName === target.name) {
                  isReExported = true;
                  if (element.propertyName) {
                    // export { foo as publicFoo } from "./target" -> rename propertyName 'foo' to newName
                    const { line, character } = sourceFile.getLineAndCharacterOfPosition(element.propertyName.getStart(sourceFile));
                    refs.push({
                      filePath: relPath,
                      kind: "BARREL_RE_EXPORT",
                      startPos: element.propertyName.getStart(sourceFile),
                      endPos: element.propertyName.getEnd(),
                      line: line + 1,
                      col: character + 1,
                      matchedText: element.propertyName.text,
                      replacementText: newName,
                      scopeId: "global",
                      isAliased: true,
                      aliasName: element.name.text,
                    });
                  } else {
                    // export { foo } from "./target" -> rename element.name 'foo' to newName
                    const { line, character } = sourceFile.getLineAndCharacterOfPosition(element.name.getStart(sourceFile));
                    refs.push({
                      filePath: relPath,
                      kind: "BARREL_RE_EXPORT",
                      startPos: element.name.getStart(sourceFile),
                      endPos: element.name.getEnd(),
                      line: line + 1,
                      col: character + 1,
                      matchedText: element.name.text,
                      replacementText: newName,
                      scopeId: "global",
                    });
                  }
                }
              }
            }
          }
        } else if (!specifier && isDefFile) {
          // Local export statement in definition file: export { foo, foo as bar }
          if (node.exportClause && ts.isNamedExports(node.exportClause)) {
            for (const element of node.exportClause.elements) {
              const exportedName = element.propertyName ? element.propertyName.text : element.name.text;
              if (exportedName === target.name) {
                const targetNode = element.propertyName || element.name;
                const { line, character } = sourceFile.getLineAndCharacterOfPosition(targetNode.getStart(sourceFile));
                refs.push({
                  filePath: relPath,
                  kind: element.propertyName ? "ALIASED_EXPORT" : "NAMED_EXPORT",
                  startPos: targetNode.getStart(sourceFile),
                  endPos: targetNode.getEnd(),
                  line: line + 1,
                  col: character + 1,
                  matchedText: targetNode.text,
                  replacementText: newName,
                  scopeId: "global",
                  isAliased: !!element.propertyName,
                  aliasName: element.propertyName ? element.name.text : undefined,
                });
              }
            }
          }
        }
      }
    });

    // If not definition file and not importing/re-exporting target symbol, skip scanning identifiers
    if (!isDefFile && !isImportedDirectly && !isNamespaceImported && !isReExported) {
      return refs;
    }

    // Name that is used in this file's code (either target.name, or localAliasName if not aliased)
    const activeNameInFile = isDefFile ? target.name : (localAliasName === target.name ? target.name : null);

    // Second pass: AST traversal for identifier usages, calls, JSX, type references, member accesses
    // We maintain a stack of shadowed scopes
    const scopeShadowStack: Set<string>[] = [new Set()];

    const isShadowed = (name: string): boolean => {
      for (let i = scopeShadowStack.length - 1; i >= 1; i--) {
        if (scopeShadowStack[i].has(name)) return true;
      }
      return false;
    };

    const visit = (node: ts.Node) => {
      let pushedScope = false;

      // Detect scope creation (Functions, Blocks, ArrowFunctions, Methods, Catch)
      if (
        ts.isFunctionDeclaration(node) ||
        ts.isFunctionExpression(node) ||
        ts.isArrowFunction(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isCatchClause(node) ||
        ts.isBlock(node)
      ) {
        const newScope = new Set<string>();

        // Collect parameters
        if ("parameters" in node && Array.isArray(node.parameters)) {
          for (const param of node.parameters) {
            if (ts.isIdentifier(param.name)) {
              newScope.add(param.name.text);
            }
          }
        }
        // Catch clause variable
        if (ts.isCatchClause(node) && node.variableDeclaration && ts.isIdentifier(node.variableDeclaration.name)) {
          newScope.add(node.variableDeclaration.name.text);
        }

        scopeShadowStack.push(newScope);
        pushedScope = true;
      }

      // Collect block-scoped variable declarations into current local scope
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && scopeShadowStack.length > 1) {
        scopeShadowStack[scopeShadowStack.length - 1].add(node.name.text);
      }

      // Definition position in definition file
      if (isDefFile && node.getStart(sourceFile) === target.nameStartPos && node.getEnd() === target.nameEndPos) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(target.nameStartPos);
        refs.push({
          filePath: relPath,
          kind: "DEFINITION",
          startPos: target.nameStartPos,
          endPos: target.nameEndPos,
          line: line + 1,
          col: character + 1,
          matchedText: target.name,
          replacementText: newName,
          scopeId: target.scopeId,
        });
      }

      // 1. Namespace member access: utils.foo(...)
      if (
        isNamespaceImported &&
        namespaceName &&
        ts.isPropertyAccessExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === namespaceName &&
        node.name.text === target.name
      ) {
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.name.getStart(sourceFile));
        refs.push({
          filePath: relPath,
          kind: "NAMESPACE_MEMBER_ACCESS",
          startPos: node.name.getStart(sourceFile),
          endPos: node.name.getEnd(),
          line: line + 1,
          col: character + 1,
          matchedText: node.name.text,
          replacementText: newName,
          scopeId: "global",
        });
      }

      // 2. JSX Element references: <Foo />, <Foo>...</Foo>, <utils.Foo />
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tagName = node.tagName;
        if (ts.isIdentifier(tagName) && tagName.text === activeNameInFile && !isShadowed(tagName.text)) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(tagName.getStart(sourceFile));
          refs.push({
            filePath: relPath,
            kind: "JSX_ELEMENT",
            startPos: tagName.getStart(sourceFile),
            endPos: tagName.getEnd(),
            line: line + 1,
            col: character + 1,
            matchedText: tagName.text,
            replacementText: newName,
            scopeId: "jsx",
          });
        } else if (
          isNamespaceImported &&
          namespaceName &&
          ts.isPropertyAccessExpression(tagName) &&
          ts.isIdentifier(tagName.expression) &&
          tagName.expression.text === namespaceName &&
          tagName.name.text === target.name
        ) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(tagName.name.getStart(sourceFile));
          refs.push({
            filePath: relPath,
            kind: "JSX_ELEMENT",
            startPos: tagName.name.getStart(sourceFile),
            endPos: tagName.name.getEnd(),
            line: line + 1,
            col: character + 1,
            matchedText: tagName.name.text,
            replacementText: newName,
            scopeId: "jsx",
          });
        }
      }

      if (ts.isJsxClosingElement(node)) {
        const tagName = node.tagName;
        if (ts.isIdentifier(tagName) && tagName.text === activeNameInFile && !isShadowed(tagName.text)) {
          const { line, character } = sourceFile.getLineAndCharacterOfPosition(tagName.getStart(sourceFile));
          refs.push({
            filePath: relPath,
            kind: "JSX_ELEMENT",
            startPos: tagName.getStart(sourceFile),
            endPos: tagName.getEnd(),
            line: line + 1,
            col: character + 1,
            matchedText: tagName.text,
            replacementText: newName,
            scopeId: "jsx",
          });
        }
      }

      // 3. Identifier occurrences: Call expressions, Type references, Value usages
      if (activeNameInFile && ts.isIdentifier(node) && node.text === activeNameInFile) {
        // Skip definition node itself (already captured)
        const isSelfDef = isDefFile && node.getStart(sourceFile) === target.nameStartPos;
        // Skip import/export specifiers (already captured in first pass)
        const isImportSpec = ts.isImportSpecifier(node.parent) || ts.isImportClause(node.parent);
        const isExportSpec = ts.isExportSpecifier(node.parent);
        const isPropertyAssignmentKey = ts.isPropertyAssignment(node.parent) && node.parent.name === node;
        const isMethodNameDef = ts.isMethodDeclaration(node.parent) && node.parent.name === node && !isSelfDef;
        const isPropAccessMember = ts.isPropertyAccessExpression(node.parent) && node.parent.name === node && !ts.isIdentifier(node.parent.expression);

        if (!isSelfDef && !isImportSpec && !isExportSpec && !isPropertyAssignmentKey && !isMethodNameDef && !isPropAccessMember) {
          if (!isShadowed(activeNameInFile)) {
            let kind: SymbolReferenceKind = "IDENTIFIER_USAGE";
            if (ts.isCallExpression(node.parent) && node.parent.expression === node) {
              kind = "CALL_EXPRESSION";
            } else if (ts.isTypeReferenceNode(node.parent) || ts.isExpressionWithTypeArguments(node.parent)) {
              kind = "TYPE_REFERENCE";
            } else if (ts.isHeritageClause(node.parent?.parent)) {
              kind = "HERITAGE_CLAUSE";
            } else if (ts.isNewExpression(node.parent) && node.parent.expression === node) {
              kind = "NEW_EXPRESSION";
            }

            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
            refs.push({
              filePath: relPath,
              kind,
              startPos: node.getStart(sourceFile),
              endPos: node.getEnd(),
              line: line + 1,
              col: character + 1,
              matchedText: node.text,
              replacementText: newName,
              scopeId: scopeShadowStack.length > 1 ? `scope_${scopeShadowStack.length - 1}` : "global",
            });
          }
        }
      }

      ts.forEachChild(node, visit);

      if (pushedScope) {
        scopeShadowStack.pop();
      }
    };

    visit(sourceFile);

    // Deduplicate by startPos
    const uniqueRefs: SymbolReferenceLocation[] = [];
    const seenPos = new Set<number>();
    for (const ref of refs) {
      if (!seenPos.has(ref.startPos)) {
        seenPos.add(ref.startPos);
        uniqueRefs.push(ref);
      }
    }

    return uniqueRefs;
  }
}

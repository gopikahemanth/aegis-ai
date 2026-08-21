/**
 * ContractConsumerResolver — Aegis V2.3 Project 2 Phase 6
 *
 * Discovers and classifies all consumers of a contract across the repository:
 * - Function & method calls
 * - Property accesses & destructuring
 * - JSX element usages & Hook calls
 * - Test suite references
 */

import ts from "typescript";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { SymbolReferenceResolver } from "../symbol-reference-resolver.js";
import type { ContractDefinition, ContractConsumer } from "./contract-refactoring-contract.js";

export interface ConsumerDiscoveryResult {
  contract: ContractDefinition;
  consumers: ContractConsumer[];
  affectedFiles: string[];
}

export class ContractConsumerResolver {
  private readonly projectRoot: string;
  private readonly resolver: SymbolReferenceResolver;

  constructor(projectRoot: string, resolver?: SymbolReferenceResolver) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.resolver = resolver || new SymbolReferenceResolver(this.projectRoot);
  }

  /**
   * Discovers and classifies all consumers of the given contract.
   */
  public discoverConsumers(contract: ContractDefinition, fieldNameFilter?: string): ConsumerDiscoveryResult {
    const allFiles = this.discoverAllFiles(this.projectRoot);
    const consumers: ContractConsumer[] = [];
    const affectedFilesSet = new Set<string>([contract.filePath]);

    for (const file of allFiles) {
      const full = resolve(this.projectRoot, file);
      if (!existsSync(full)) continue;

      let content = "";
      try {
        content = readFileSync(full, "utf8");
      } catch {
        continue;
      }

      const matchesSymbol = content.includes(contract.symbolName);
      const matchesField = fieldNameFilter ? content.includes(fieldNameFilter) : false;

      if (!matchesSymbol && !matchesField) continue;

      const isTsx = file.endsWith(".tsx") || file.endsWith(".jsx");
      const isTest = file.includes("__tests__") || file.endsWith(".test.ts") || file.endsWith(".test.tsx") || file.endsWith(".spec.ts");
      const sf = ts.createSourceFile(
        file,
        content,
        ts.ScriptTarget.Latest,
        true,
        isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );

      const checkNode = (node: ts.Node) => {
        // 1. Function Call / Method Call
        if (ts.isCallExpression(node)) {
          let callIdent: ts.Identifier | null = null;
          if (ts.isIdentifier(node.expression)) {
            callIdent = node.expression;
          } else if (ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.name)) {
            callIdent = node.expression.name;
          }

          if (callIdent && callIdent.text === contract.symbolName) {
            const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
            consumers.push({
              filePath: file,
              symbolName: contract.symbolName,
              classification: isTest ? "PROTECTED" : "MUST_CHANGE",
              usageType: isTest ? "test" : contract.kind === "hook" ? "hook_call" : "call",
              startPos: node.getStart(sf),
              endPos: node.getEnd(),
              line: line + 1,
              col: character + 1,
            });
            affectedFilesSet.add(file);
          }
        }

        // 2. JSX Element usage
        if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ts.isIdentifier(node.tagName)) {
          if (node.tagName.text === contract.symbolName) {
            const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
            consumers.push({
              filePath: file,
              symbolName: contract.symbolName,
              classification: isTest ? "PROTECTED" : "MUST_CHANGE",
              usageType: "jsx",
              startPos: node.getStart(sf),
              endPos: node.getEnd(),
              line: line + 1,
              col: character + 1,
            });
            affectedFilesSet.add(file);
          }
        }

        // 3. Property Access / Destructuring
        if (ts.isPropertyAccessExpression(node)) {
          if (node.name.text === contract.symbolName || (fieldNameFilter && node.name.text === fieldNameFilter)) {
            const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
            consumers.push({
              filePath: file,
              symbolName: node.name.text,
              classification: "MUST_CHANGE",
              usageType: "property_access",
              startPos: node.getStart(sf),
              endPos: node.getEnd(),
              line: line + 1,
              col: character + 1,
            });
            affectedFilesSet.add(file);
          }
        }

        // 4. Import declaration
        if (ts.isImportDeclaration(node) && matchesSymbol) {
          affectedFilesSet.add(file);
        }

        ts.forEachChild(node, checkNode);
      };

      checkNode(sf);
    }

    return {
      contract,
      consumers,
      affectedFiles: [...affectedFilesSet].sort(),
    };
  }

  private discoverAllFiles(dir: string, baseDir: string = dir): string[] {
    const results: string[] = [];
    if (!existsSync(dir)) return results;

    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".aegis" || entry.name === "dist") {
          continue;
        }
        results.push(...this.discoverAllFiles(fullPath, baseDir));
      } else if (entry.isFile()) {
        if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          const rel = fullPath.replace(/\\/g, "/").replace(baseDir.replace(/\\/g, "/") + "/", "");
          results.push(rel);
        }
      }
    }
    return results;
  }
}

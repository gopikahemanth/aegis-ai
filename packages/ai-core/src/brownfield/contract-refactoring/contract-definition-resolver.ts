/**
 * ContractDefinitionResolver — Aegis V2.3 Project 2 Phase 6
 *
 * Discovers and parses exact contract definitions from TypeScript AST:
 * - Exported functions, service methods, API client methods, hooks
 * - Interfaces, types, DTOs, and component Props interfaces
 */

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ContractDefinition } from "./contract-refactoring-contract.js";

export class ContractDefinitionResolver {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Resolves exact contract definition for a target symbol in a source file.
   */
  public resolveContract(sourceFile: string, symbolName: string): ContractDefinition | null {
    const relSource = sourceFile.replace(/\\/g, "/").replace(/^(\/|\\)+/, "");
    const fullPath = resolve(this.projectRoot, relSource);
    if (!existsSync(fullPath)) return null;

    const content = readFileSync(fullPath, "utf8");
    const isTsx = relSource.endsWith(".tsx") || relSource.endsWith(".jsx");
    const sf = ts.createSourceFile(
      relSource,
      content,
      ts.ScriptTarget.Latest,
      true,
      isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    let contract: ContractDefinition | null = null;

    const visit = (node: ts.Node) => {
      // 1. Function / Hook / API client function
      if (
        (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) &&
        node.name &&
        ts.isIdentifier(node.name) &&
        node.name.text === symbolName
      ) {
        const params = node.parameters.map(p => ({
          name: p.name.getText(sf),
          type: p.type ? p.type.getText(sf) : "any",
          defaultValue: p.initializer ? p.initializer.getText(sf) : undefined,
          isOptional: Boolean(p.questionToken),
        }));

        const returnType = node.type ? node.type.getText(sf) : undefined;
        const kind = symbolName.startsWith("use") ? "hook" : relSource.includes("service") ? "service" : relSource.includes("api") || relSource.includes("client") ? "api_client" : "function";

        contract = {
          symbolId: `${relSource}#${symbolName}`,
          contractId: `contract_${relSource}_${symbolName}`,
          filePath: relSource,
          symbolName,
          kind,
          returnType,
          parameters: params,
          startPos: node.getStart(sf),
          endPos: node.getEnd(),
        };
        return;
      }

      // 2. Interface / Type / DTO / Component Props
      if (ts.isInterfaceDeclaration(node) && node.name.text === symbolName) {
        const fields = node.members
          .filter(ts.isPropertySignature)
          .map(m => ({
            name: m.name.getText(sf),
            type: m.type ? m.type.getText(sf) : "any",
            isOptional: Boolean(m.questionToken),
          }));

        const kind = symbolName.endsWith("Props") ? "component" : symbolName.endsWith("DTO") || symbolName.endsWith("Dto") ? "dto" : "interface";

        contract = {
          symbolId: `${relSource}#${symbolName}`,
          contractId: `contract_${relSource}_${symbolName}`,
          filePath: relSource,
          symbolName,
          kind,
          fields,
          startPos: node.getStart(sf),
          endPos: node.getEnd(),
        };
        return;
      }

      if (ts.isTypeAliasDeclaration(node) && node.name.text === symbolName) {
        contract = {
          symbolId: `${relSource}#${symbolName}`,
          contractId: `contract_${relSource}_${symbolName}`,
          filePath: relSource,
          symbolName,
          kind: "type",
          startPos: node.getStart(sf),
          endPos: node.getEnd(),
        };
        return;
      }

      ts.forEachChild(node, visit);
    };

    visit(sf);
    return contract;
  }
}

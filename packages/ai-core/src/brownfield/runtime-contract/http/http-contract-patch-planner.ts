/**
 * HttpContractPatchPlanner — Aegis V2.3 Project 2 Phase 7.2
 *
 * Generates exact AST patch operations for HTTP route updates and client consumers.
 */

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { HttpEndpointNode, HttpClientEndpointNode, HttpVerb } from "./http-contract-model.js";
import type { AstPatchOperation } from "../../ast-symbol-patch-planner.js";

export interface HttpPatchResult {
  valid: boolean;
  patches: AstPatchOperation[];
  affectedFiles: string[];
}

export class HttpContractPatchPlanner {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Plans simultaneous AST patches for route rename across server and client files.
   */
  public planRouteRename(
    endpoint: HttpEndpointNode,
    clientConsumers: HttpClientEndpointNode[],
    newPath: string
  ): HttpPatchResult {
    const patches: AstPatchOperation[] = [];
    const affectedFilesSet = new Set<string>([endpoint.filePath]);

    // 1. Patch Server Route
    const serverFullPath = resolve(this.projectRoot, endpoint.filePath);
    if (existsSync(serverFullPath)) {
      const content = readFileSync(serverFullPath, "utf8");
      const sf = ts.createSourceFile(endpoint.filePath, content, ts.ScriptTarget.Latest, true);

      // Find the route string literal
      const visit = (node: ts.Node) => {
        if (
          ts.isCallExpression(node) &&
          node.getStart(sf) === endpoint.startPos &&
          node.arguments.length >= 1
        ) {
          const pathArg = node.arguments[0];
          if (ts.isStringLiteral(pathArg)) {
            // If route was mounted, calculate relative route portion or replace exact string
            const targetReplacement = endpoint.mountPrefix
              ? newPath.replace(endpoint.mountPrefix, "") || "/"
              : newPath;

            patches.push({
              filePath: endpoint.filePath,
              targetSymbolName: endpoint.endpointId,
              originalSnippet: `"${pathArg.text}"`,
              replacementSnippet: `"${targetReplacement}"`,
              startPos: pathArg.getStart(sf),
              endPos: pathArg.getEnd(),
              description: `Update route path from "${pathArg.text}" to "${targetReplacement}"`,
            });
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(sf);
    }

    // 2. Patch Client Consumers
    for (const client of clientConsumers) {
      const clientFullPath = resolve(this.projectRoot, client.filePath);
      if (!existsSync(clientFullPath)) continue;

      const content = readFileSync(clientFullPath, "utf8");
      const sf = ts.createSourceFile(client.filePath, content, ts.ScriptTarget.Latest, true);

      const visitClient = (node: ts.Node) => {
        if (ts.isCallExpression(node) && node.getStart(sf) === client.startPos && node.arguments.length >= 1) {
          const urlArg = node.arguments[0];
          if (ts.isStringLiteral(urlArg)) {
            patches.push({
              filePath: client.filePath,
              targetSymbolName: client.clientId,
              originalSnippet: `"${urlArg.text}"`,
              replacementSnippet: `"${newPath}"`,
              startPos: urlArg.getStart(sf),
              endPos: urlArg.getEnd(),
              description: `Update client endpoint URL from "${urlArg.text}" to "${newPath}"`,
            });
            affectedFilesSet.add(client.filePath);
          }
        }
        ts.forEachChild(node, visitClient);
      };
      visitClient(sf);
    }

    return {
      valid: true,
      patches,
      affectedFiles: [...affectedFilesSet].sort(),
    };
  }

  /**
   * Plans simultaneous AST patches for HTTP method change across server and client files.
   */
  public planMethodChange(
    endpoint: HttpEndpointNode,
    clientConsumers: HttpClientEndpointNode[],
    newMethod: HttpVerb
  ): HttpPatchResult {
    const patches: AstPatchOperation[] = [];
    const affectedFilesSet = new Set<string>([endpoint.filePath]);

    // 1. Patch Server Route Method
    const serverFullPath = resolve(this.projectRoot, endpoint.filePath);
    if (existsSync(serverFullPath)) {
      const content = readFileSync(serverFullPath, "utf8");
      const sf = ts.createSourceFile(endpoint.filePath, content, ts.ScriptTarget.Latest, true);

      const visit = (node: ts.Node) => {
        if (
          ts.isCallExpression(node) &&
          node.getStart(sf) === endpoint.startPos &&
          ts.isPropertyAccessExpression(node.expression)
        ) {
          const prop = node.expression.name;
          const oldVerb = endpoint.method.toLowerCase();
          const targetVerb = newMethod.toLowerCase();

          patches.push({
            filePath: endpoint.filePath,
            targetSymbolName: endpoint.endpointId,
            originalSnippet: prop.text,
            replacementSnippet: targetVerb,
            startPos: prop.getStart(sf),
            endPos: prop.getEnd(),
            description: `Change route method from .${oldVerb}( to .${targetVerb}(`,
          });
        }
        ts.forEachChild(node, visit);
      };
      visit(sf);
    }

    return {
      valid: true,
      patches,
      affectedFiles: [...affectedFilesSet].sort(),
    };
  }
}

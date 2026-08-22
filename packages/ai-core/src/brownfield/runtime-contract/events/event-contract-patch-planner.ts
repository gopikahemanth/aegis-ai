/**
 * EventContractPatchPlanner — Aegis V2.3 Project 2 Phase 7.3
 *
 * Generates exact AST patch operations for event contract evolutions:
 * - Event name renaming in producers (.emit) and consumers (.on)
 * - Payload field renaming in producer payload objects and consumer property accesses
 */

import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { EventContractNode } from "./event-contract-model.js";
import type { AstPatchOperation } from "../../ast-symbol-patch-planner.js";

export interface EventPatchResult {
  valid: boolean;
  patches: AstPatchOperation[];
  affectedFiles: string[];
}

export class EventContractPatchPlanner {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Plans simultaneous AST patches for event name rename across producers and consumers.
   */
  public planEventNameRename(
    contract: EventContractNode,
    newEventName: string
  ): EventPatchResult {
    const patches: AstPatchOperation[] = [];
    const affectedFilesSet = new Set<string>();

    const allNodes = [...contract.producers, ...contract.consumers];

    for (const node of allNodes) {
      const fullPath = resolve(this.projectRoot, node.filePath);
      if (!existsSync(fullPath)) continue;

      const content = readFileSync(fullPath, "utf8");
      const sf = ts.createSourceFile(node.filePath, content, ts.ScriptTarget.Latest, true);

      const visit = (child: ts.Node) => {
        if (
          ts.isCallExpression(child) &&
          child.getStart(sf) === node.startPos &&
          child.arguments.length >= 1
        ) {
          const firstArg = child.arguments[0];
          if (ts.isStringLiteral(firstArg) && firstArg.text === contract.eventName) {
            patches.push({
              filePath: node.filePath,
              targetSymbolName: contract.eventName,
              originalSnippet: `"${firstArg.text}"`,
              replacementSnippet: `"${newEventName}"`,
              startPos: firstArg.getStart(sf),
              endPos: firstArg.getEnd(),
              description: `Update event name from "${firstArg.text}" to "${newEventName}"`,
            });
            affectedFilesSet.add(node.filePath);
          }
        }
        ts.forEachChild(child, visit);
      };
      visit(sf);
    }

    return {
      valid: true,
      patches,
      affectedFiles: [...affectedFilesSet].sort(),
    };
  }

  /**
   * Plans simultaneous AST patches for payload field rename in producers and consumers.
   */
  public planPayloadFieldRename(
    contract: EventContractNode,
    oldFieldName: string,
    newFieldName: string
  ): EventPatchResult {
    const patches: AstPatchOperation[] = [];
    const affectedFilesSet = new Set<string>();

    // 1. Patch Producers (object literals in .emit)
    for (const prod of contract.producers) {
      const fullPath = resolve(this.projectRoot, prod.filePath);
      if (!existsSync(fullPath)) continue;

      const content = readFileSync(fullPath, "utf8");
      const sf = ts.createSourceFile(prod.filePath, content, ts.ScriptTarget.Latest, true);

      const visitProd = (child: ts.Node) => {
        if (
          ts.isCallExpression(child) &&
          child.getStart(sf) === prod.startPos &&
          child.arguments.length >= 2
        ) {
          const payloadArg = child.arguments[1];
          if (ts.isObjectLiteralExpression(payloadArg)) {
            for (const prop of payloadArg.properties) {
              if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === oldFieldName) {
                patches.push({
                  filePath: prod.filePath,
                  targetSymbolName: prod.eventName,
                  originalSnippet: oldFieldName,
                  replacementSnippet: newFieldName,
                  startPos: prop.name.getStart(sf),
                  endPos: prop.name.getEnd(),
                  description: `Rename payload field "${oldFieldName}" to "${newFieldName}" in producer`,
                });
                affectedFilesSet.add(prod.filePath);
              } else if (ts.isShorthandPropertyAssignment(prop) && prop.name.text === oldFieldName) {
                // e.g. { priority } -> { taskPriority: priority }
                patches.push({
                  filePath: prod.filePath,
                  targetSymbolName: prod.eventName,
                  originalSnippet: oldFieldName,
                  replacementSnippet: `${newFieldName}: ${oldFieldName}`,
                  startPos: prop.getStart(sf),
                  endPos: prop.getEnd(),
                  description: `Expand shorthand payload field "${oldFieldName}" to "${newFieldName}: ${oldFieldName}" in producer`,
                });
                affectedFilesSet.add(prod.filePath);
              }
            }
          }
        }
        ts.forEachChild(child, visitProd);
      };
      visitProd(sf);
    }

    // 2. Patch Consumers (property access on payload e.g. task.priority -> task.taskPriority)
    for (const cons of contract.consumers) {
      const fullPath = resolve(this.projectRoot, cons.filePath);
      if (!existsSync(fullPath)) continue;

      const content = readFileSync(fullPath, "utf8");
      const sf = ts.createSourceFile(cons.filePath, content, ts.ScriptTarget.Latest, true);

      const visitCons = (child: ts.Node) => {
        if (
          ts.isCallExpression(child) &&
          child.getStart(sf) === cons.startPos &&
          child.arguments.length >= 2
        ) {
          const handler = child.arguments[1];
          if (ts.isArrowFunction(handler) || ts.isFunctionExpression(handler)) {
            const paramName = cons.payloadParamName;
            if (paramName) {
              const findProp = (bodyChild: ts.Node) => {
                if (
                  ts.isPropertyAccessExpression(bodyChild) &&
                  bodyChild.expression.getText(sf) === paramName &&
                  bodyChild.name.text === oldFieldName
                ) {
                  patches.push({
                    filePath: cons.filePath,
                    targetSymbolName: cons.eventName,
                    originalSnippet: oldFieldName,
                    replacementSnippet: newFieldName,
                    startPos: bodyChild.name.getStart(sf),
                    endPos: bodyChild.name.getEnd(),
                    description: `Rename consumer property access "${oldFieldName}" to "${newFieldName}"`,
                  });
                  affectedFilesSet.add(cons.filePath);
                }
                ts.forEachChild(bodyChild, findProp);
              };
              ts.forEachChild(handler.body, findProp);
            }
          }
        }
        ts.forEachChild(child, visitCons);
      };
      visitCons(sf);
    }

    return {
      valid: true,
      patches,
      affectedFiles: [...affectedFilesSet].sort(),
    };
  }
}

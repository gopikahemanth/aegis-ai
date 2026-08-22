/**
 * EventEmitterResolver — Aegis V2.3 Project 2 Phase 7.3
 *
 * Discovers and parses Node EventEmitter and typed EventBus producer/consumer calls:
 * - emitter.emit("task.updated", payload) / eventBus.emit(Events.TASK_UPDATED, payload)
 * - emitter.on("task.updated", handler) / eventBus.on(Events.TASK_UPDATED, (task: TaskDTO) => ...)
 * - Resolves string literals, constants, and enum references
 */

import ts from "typescript";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import type {
  EventProducerNode,
  EventConsumerNode,
  EventTransportType,
} from "./event-contract-model.js";

export interface EventEmitterDiscoveryResult {
  producers: EventProducerNode[];
  consumers: EventConsumerNode[];
}

export class EventEmitterResolver {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Discovers EventEmitter & EventBus producers and consumers across the repository.
   */
  public discover(): EventEmitterDiscoveryResult {
    const allFiles = this.discoverAllFiles(this.projectRoot);
    const producers: EventProducerNode[] = [];
    const consumers: EventConsumerNode[] = [];

    for (const file of allFiles) {
      const fullPath = resolve(this.projectRoot, file);
      if (!existsSync(fullPath)) continue;

      const content = readFileSync(fullPath, "utf8");
      if (!content.includes(".emit(") && !content.includes(".on(") && !content.includes(".addListener(")) {
        continue;
      }

      const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
      this.scanFile(sf, file, producers, consumers);
    }

    return { producers, consumers };
  }

  private scanFile(
    sf: ts.SourceFile,
    filePath: string,
    producers: EventProducerNode[],
    consumers: EventConsumerNode[]
  ) {
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const methodName = node.expression.name.text;
        const emitterText = node.expression.expression.getText(sf);

        // 1. Event Producer (.emit)
        if (methodName === "emit" && node.arguments.length >= 1) {
          const eventArg = node.arguments[0];
          const eventName = this.resolveEventName(eventArg, sf);

          if (eventName) {
            let payloadExpr: string | undefined;
            let payloadTypeName: string | undefined;

            if (node.arguments.length >= 2) {
              const payloadArg = node.arguments[1];
              payloadExpr = payloadArg.getText(sf);
            }

            const transport: EventTransportType =
              emitterText.toLowerCase().includes("bus")
                ? "TYPED_EVENT_BUS"
                : emitterText.includes("socket") || emitterText.includes("io")
                ? "SOCKET_IO"
                : "EVENT_EMITTER";

            producers.push({
              producerId: `${filePath}:${node.getStart(sf)}`,
              eventName,
              transport,
              filePath,
              emitterSymbol: emitterText,
              payloadExpression: payloadExpr,
              payloadTypeName,
              startPos: node.getStart(sf),
              endPos: node.getEnd(),
            });
          }
        }

        // 2. Event Consumer (.on / .addListener)
        if ((methodName === "on" || methodName === "addListener") && node.arguments.length >= 2) {
          const eventArg = node.arguments[0];
          const handlerArg = node.arguments[1];
          const eventName = this.resolveEventName(eventArg, sf);

          if (eventName) {
            let payloadParamName: string | undefined;
            let payloadTypeName: string | undefined;
            const accessedProperties: string[] = [];

            if (ts.isArrowFunction(handlerArg) || ts.isFunctionExpression(handlerArg)) {
              if (handlerArg.parameters.length > 0) {
                const firstParam = handlerArg.parameters[0];
                payloadParamName = firstParam.name.getText(sf);
                if (firstParam.type) {
                  payloadTypeName = firstParam.type.getText(sf);
                }
              }

              // Scan for property accesses on payload e.g. task.priority
              const findPropAccess = (child: ts.Node) => {
                if (
                  ts.isPropertyAccessExpression(child) &&
                  payloadParamName &&
                  child.expression.getText(sf) === payloadParamName
                ) {
                  accessedProperties.push(child.name.text);
                }
                ts.forEachChild(child, findPropAccess);
              };
              ts.forEachChild(handlerArg.body, findPropAccess);
            }

            const transport: EventTransportType =
              emitterText.toLowerCase().includes("bus")
                ? "TYPED_EVENT_BUS"
                : emitterText.includes("socket") || emitterText.includes("io")
                ? "SOCKET_IO"
                : "EVENT_EMITTER";

            consumers.push({
              consumerId: `${filePath}:${node.getStart(sf)}`,
              eventName,
              transport,
              filePath,
              receiverSymbol: emitterText,
              handlerSymbol: ts.isIdentifier(handlerArg) ? handlerArg.text : undefined,
              payloadParamName,
              payloadTypeName,
              accessedProperties: [...new Set(accessedProperties)],
              startPos: node.getStart(sf),
              endPos: node.getEnd(),
            });
          }
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sf);
  }

  private resolveEventName(node: ts.Node, sf: ts.SourceFile): string | null {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      return node.text;
    }

    if (ts.isPropertyAccessExpression(node)) {
      // e.g. Events.TASK_UPDATED -> resolve member name or text
      return node.name.text;
    }

    if (ts.isIdentifier(node)) {
      // e.g. TASK_UPDATED_EVENT
      return node.text;
    }

    return null;
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

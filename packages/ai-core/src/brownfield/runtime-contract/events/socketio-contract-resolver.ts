/**
 * SocketIOContractResolver — Aegis V2.3 Project 2 Phase 7.3
 *
 * Discovers and parses Socket.IO server & client event contracts:
 * - socket.emit("task.updated", payload, ack)
 * - socket.on("task.updated", (payload, ack) => ...)
 * - io.to("room").emit(...) / socket.join("room")
 * - Namespaces, rooms, and ACK signature extraction
 */

import ts from "typescript";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import type {
  EventProducerNode,
  EventConsumerNode,
} from "./event-contract-model.js";

export class SocketIOContractResolver {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Discovers Socket.IO producers and consumers across the repository.
   */
  public discover(): { producers: EventProducerNode[]; consumers: EventConsumerNode[] } {
    const allFiles = this.discoverAllFiles(this.projectRoot);
    const producers: EventProducerNode[] = [];
    const consumers: EventConsumerNode[] = [];

    for (const file of allFiles) {
      const fullPath = resolve(this.projectRoot, file);
      if (!existsSync(fullPath)) continue;

      const content = readFileSync(fullPath, "utf8");
      if (!content.includes("socket.") && !content.includes("io.")) {
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
        const callChainText = node.expression.getText(sf);

        // Check for room e.g. io.to("tasks").emit(...) or socket.to("room").emit(...)
        let room: string | undefined;
        if (callChainText.includes(".to(") || callChainText.includes(".in(")) {
          const match = callChainText.match(/\.(to|in)\(["']([^"']+)["']\)/);
          if (match) room = match[2];
        }

        // Socket.IO Emit
        if (methodName === "emit" && (callChainText.includes("socket.") || callChainText.includes("io.")) && node.arguments.length >= 1) {
          const eventArg = node.arguments[0];
          if (ts.isStringLiteral(eventArg)) {
            const eventName = eventArg.text;
            let payloadExpr: string | undefined;
            let hasAck = false;

            if (node.arguments.length >= 2) {
              payloadExpr = node.arguments[1].getText(sf);
            }
            if (node.arguments.length >= 3) {
              hasAck = true;
            }

            producers.push({
              producerId: `${filePath}:${node.getStart(sf)}`,
              eventName,
              transport: "SOCKET_IO",
              filePath,
              emitterSymbol: node.expression.expression.getText(sf),
              room,
              payloadExpression: payloadExpr,
              hasAck,
              startPos: node.getStart(sf),
              endPos: node.getEnd(),
            });
          }
        }

        // Socket.IO On
        if (methodName === "on" && (callChainText.includes("socket.") || callChainText.includes("io.")) && node.arguments.length >= 2) {
          const eventArg = node.arguments[0];
          const handlerArg = node.arguments[1];

          if (ts.isStringLiteral(eventArg)) {
            const eventName = eventArg.text;
            let payloadParamName: string | undefined;
            let payloadTypeName: string | undefined;
            let hasAck = false;
            const accessedProperties: string[] = [];

            if (ts.isArrowFunction(handlerArg) || ts.isFunctionExpression(handlerArg)) {
              if (handlerArg.parameters.length > 0) {
                const firstParam = handlerArg.parameters[0];
                payloadParamName = firstParam.name.getText(sf);
                if (firstParam.type) {
                  payloadTypeName = firstParam.type.getText(sf);
                }
              }
              if (handlerArg.parameters.length > 1) {
                hasAck = true;
              }

              const findProps = (child: ts.Node) => {
                if (
                  ts.isPropertyAccessExpression(child) &&
                  payloadParamName &&
                  child.expression.getText(sf) === payloadParamName
                ) {
                  accessedProperties.push(child.name.text);
                }
                ts.forEachChild(child, findProps);
              };
              ts.forEachChild(handlerArg.body, findProps);
            }

            consumers.push({
              consumerId: `${filePath}:${node.getStart(sf)}`,
              eventName,
              transport: "SOCKET_IO",
              filePath,
              receiverSymbol: node.expression.expression.getText(sf),
              room,
              payloadParamName,
              payloadTypeName,
              accessedProperties: [...new Set(accessedProperties)],
              hasAck,
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

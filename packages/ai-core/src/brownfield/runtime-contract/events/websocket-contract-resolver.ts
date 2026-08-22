/**
 * WebSocketContractResolver — Aegis V2.3 Project 2 Phase 7.3
 *
 * Discovers and parses WebSocket JSON message contracts:
 * - ws.send(JSON.stringify({ type: "task.updated", payload }))
 * - ws.on("message", (data) => { const msg = JSON.parse(data); ... })
 * - Resolves discriminated message contracts
 */

import ts from "typescript";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import type {
  EventProducerNode,
  EventConsumerNode,
} from "./event-contract-model.js";

export class WebSocketContractResolver {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Discovers WebSocket producers and consumers across the repository.
   */
  public discover(): { producers: EventProducerNode[]; consumers: EventConsumerNode[] } {
    const allFiles = this.discoverAllFiles(this.projectRoot);
    const producers: EventProducerNode[] = [];
    const consumers: EventConsumerNode[] = [];

    for (const file of allFiles) {
      const fullPath = resolve(this.projectRoot, file);
      if (!existsSync(fullPath)) continue;

      const content = readFileSync(fullPath, "utf8");
      if (!content.includes("ws.") && !content.includes("socket.send") && !content.includes("WebSocket")) {
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
      // 1. ws.send(JSON.stringify({ type: "task.updated", payload }))
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        if (node.expression.name.text === "send" && node.arguments.length >= 1) {
          const argText = node.arguments[0].getText(sf);
          // Look for JSON.stringify({ type: "...", ... })
          const typeMatch = argText.match(/type:\s*["']([^"']+)["']/);
          if (typeMatch) {
            const eventName = typeMatch[1];
            producers.push({
              producerId: `${filePath}:${node.getStart(sf)}`,
              eventName,
              transport: "WEBSOCKET",
              filePath,
              emitterSymbol: node.expression.expression.getText(sf),
              payloadExpression: argText,
              startPos: node.getStart(sf),
              endPos: node.getEnd(),
            });
          }
        }

        // 2. ws.on("message", handler)
        if (node.expression.name.text === "on" && node.arguments.length >= 2) {
          const firstArg = node.arguments[0];
          if (ts.isStringLiteral(firstArg) && firstArg.text === "message") {
            const handler = node.arguments[1];
            const handlerText = handler.getText(sf);
            // Search for type checks e.g. msg.type === "task.updated"
            const typeMatches = [...handlerText.matchAll(/(?:msg|event|data)\.type\s*===\s*["']([^"']+)["']/g)];
            for (const match of typeMatches) {
              const eventName = match[1];
              consumers.push({
                consumerId: `${filePath}:${node.getStart(sf)}#${eventName}`,
                eventName,
                transport: "WEBSOCKET",
                filePath,
                receiverSymbol: node.expression.expression.getText(sf),
                startPos: node.getStart(sf),
                endPos: node.getEnd(),
              });
            }
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

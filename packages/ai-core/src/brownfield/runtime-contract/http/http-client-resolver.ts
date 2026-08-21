/**
 * HttpClientResolver — Aegis V2.3 Project 2 Phase 7.2
 *
 * Discovers and parses frontend/consumer HTTP client requests:
 * - fetch("/api/tasks", { method: "POST" })
 * - fetch(`/api/tasks/${id}`)
 * - api.get("/api/tasks"), api.post("/api/tasks", data)
 * - Path interpolation canonicalization: /api/tasks/${id} -> /api/tasks/:id
 */

import ts from "typescript";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import type { HttpClientEndpointNode, HttpVerb } from "./http-contract-model.js";

export class HttpClientResolver {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Discovers all client HTTP requests across the repository.
   */
  public discoverClientCalls(): HttpClientEndpointNode[] {
    const allFiles = this.discoverAllFiles(this.projectRoot);
    const clients: HttpClientEndpointNode[] = [];

    for (const file of allFiles) {
      const fullPath = resolve(this.projectRoot, file);
      if (!existsSync(fullPath)) continue;

      const content = readFileSync(fullPath, "utf8");
      if (!content.includes("fetch(") && !content.includes("api.") && !content.includes("axios.")) {
        continue;
      }

      const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
      this.findClientCalls(sf, file, clients);
    }

    return clients;
  }

  private findClientCalls(sf: ts.SourceFile, filePath: string, clients: HttpClientEndpointNode[]) {
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        // 1. fetch("/api/tasks", { method: "POST" })
        if (ts.isIdentifier(node.expression) && node.expression.text === "fetch" && node.arguments.length >= 1) {
          const urlArg = node.arguments[0];
          const { rawUrl, normalizedPath } = this.extractUrlInfo(urlArg, sf);

          if (normalizedPath) {
            let method: HttpVerb = "GET";
            if (node.arguments.length >= 2) {
              const optArg = node.arguments[1];
              if (ts.isObjectLiteralExpression(optArg)) {
                for (const prop of optArg.properties) {
                  if (ts.isPropertyAssignment(prop) && prop.name.getText(sf) === "method") {
                    if (ts.isStringLiteral(prop.initializer)) {
                      method = prop.initializer.text.toUpperCase() as HttpVerb;
                    }
                  }
                }
              }
            }

            clients.push({
              clientId: `${method} ${normalizedPath}`,
              method,
              rawUrl,
              normalizedPath,
              filePath,
              callType: "fetch",
              startPos: node.getStart(sf),
              endPos: node.getEnd(),
            });
          }
        }

        // 2. api.get("/api/tasks") or api.post("/api/tasks", body)
        if (ts.isPropertyAccessExpression(node.expression) && node.arguments.length >= 1) {
          const objName = node.expression.expression.getText(sf);
          const mName = node.expression.name.text.toLowerCase();
          const validVerbs = new Set(["get", "post", "put", "patch", "delete"]);

          if ((objName === "api" || objName === "client" || objName === "axios") && validVerbs.has(mName)) {
            const urlArg = node.arguments[0];
            const { rawUrl, normalizedPath } = this.extractUrlInfo(urlArg, sf);

            if (normalizedPath) {
              clients.push({
                clientId: `${mName.toUpperCase()} ${normalizedPath}`,
                method: mName.toUpperCase() as HttpVerb,
                rawUrl,
                normalizedPath,
                filePath,
                callType: "api_wrapper",
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

  private extractUrlInfo(
    node: ts.Node,
    sf: ts.SourceFile
  ): { rawUrl: string; normalizedPath?: string } {
    if (ts.isStringLiteral(node)) {
      const raw = node.text;
      return { rawUrl: raw, normalizedPath: this.normalizePath(raw) };
    }

    if (ts.isTemplateExpression(node)) {
      // e.g. `/api/tasks/${id}`
      const head = node.head.text;
      const spans = node.templateSpans.map(s => `:${s.expression.getText(sf)}` + s.literal.text).join("");
      const combined = `${head}${spans}`;
      return { rawUrl: node.getText(sf), normalizedPath: this.normalizePath(combined) };
    }

    if (ts.isNoSubstitutionTemplateLiteral(node)) {
      const raw = node.text;
      return { rawUrl: raw, normalizedPath: this.normalizePath(raw) };
    }

    return { rawUrl: node.getText(sf) };
  }

  private normalizePath(pathStr: string): string {
    let clean = pathStr.startsWith("/") ? pathStr : `/${pathStr}`;
    if (clean.length > 1 && clean.endsWith("/")) clean = clean.slice(0, -1);
    // Replace ${...} with :param
    clean = clean.replace(/\$\{[^}]+\}/g, ":id");
    return clean;
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

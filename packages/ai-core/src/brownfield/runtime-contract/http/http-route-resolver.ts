/**
 * HttpRouteResolver — Aegis V2.3 Project 2 Phase 7.2
 *
 * Discovers and resolves Express server routes, router mounts, middleware,
 * and controller handler bindings from TypeScript AST.
 */

import ts from "typescript";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import type { HttpEndpointNode, HttpVerb } from "./http-contract-model.js";

export class HttpRouteResolver {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Discovers all HTTP server routes across the repository.
   */
  public discoverRoutes(): HttpEndpointNode[] {
    const allFiles = this.discoverAllFiles(this.projectRoot);
    const routes: HttpEndpointNode[] = [];
    const routerMountMap = new Map<string, string>(); // routerSymbol/file -> mountPrefix

    // 1. First pass: find router mounts e.g. app.use("/api/tasks", taskRouter)
    for (const file of allFiles) {
      const fullPath = resolve(this.projectRoot, file);
      if (!existsSync(fullPath)) continue;

      const content = readFileSync(fullPath, "utf8");
      if (!content.includes(".use(")) continue;

      const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
      this.findRouterMounts(sf, routerMountMap);
    }

    // 2. Second pass: find route endpoints e.g. router.get("/:id", ...) or app.post("/api/tasks", ...)
    for (const file of allFiles) {
      const fullPath = resolve(this.projectRoot, file);
      if (!existsSync(fullPath)) continue;

      const content = readFileSync(fullPath, "utf8");
      if (!content.includes(".get(") && !content.includes(".post(") && !content.includes(".patch(") &&
          !content.includes(".put(") && !content.includes(".delete(")) {
        continue;
      }

      const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
      this.findEndpoints(sf, file, routerMountMap, routes);
    }

    return routes;
  }

  private findRouterMounts(sf: ts.SourceFile, mountMap: Map<string, string>) {
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        if (node.expression.name.text === "use" && node.arguments.length >= 2) {
          const firstArg = node.arguments[0];
          const secondArg = node.arguments[1];

          if (ts.isStringLiteral(firstArg) && ts.isIdentifier(secondArg)) {
            const prefix = firstArg.text;
            const routerName = secondArg.text;
            mountMap.set(routerName, prefix);
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  private findEndpoints(
    sf: ts.SourceFile,
    filePath: string,
    mountMap: Map<string, string>,
    routes: HttpEndpointNode[]
  ) {
    const validVerbs = new Set(["get", "post", "put", "patch", "delete", "head", "options"]);

    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const methodName = node.expression.name.text.toLowerCase();
        if (validVerbs.has(methodName) && node.arguments.length >= 2) {
          const pathArg = node.arguments[0];
          if (ts.isStringLiteral(pathArg)) {
            const rawPath = pathArg.text;
            let routerSymbol: string | undefined;

            if (ts.isIdentifier(node.expression.expression)) {
              routerSymbol = node.expression.expression.text;
            }

            const mountPrefix = (routerSymbol && mountMap.get(routerSymbol)) || "";
            const combinedPath = this.combinePaths(mountPrefix, rawPath);
            const normalizedPath = this.normalizePath(combinedPath);

            // Handler & Middlewares
            const handlers = node.arguments.slice(1);
            const middlewareSymbols: string[] = [];
            let handlerSymbol: string | undefined;
            let controllerSymbol: string | undefined;
            let controllerMethod: string | undefined;
            let requestSchemaSymbol: string | undefined;

            for (let i = 0; i < handlers.length; i++) {
              const h = handlers[i];
              if (i === handlers.length - 1) {
                // Main route handler
                if (ts.isPropertyAccessExpression(h)) {
                  if (ts.isIdentifier(h.expression)) controllerSymbol = h.expression.text;
                  controllerMethod = h.name.text;
                  handlerSymbol = `${controllerSymbol || ""}.${controllerMethod}`;
                } else if (ts.isIdentifier(h)) {
                  handlerSymbol = h.text;
                }
              } else {
                // Middleware or validation
                if (ts.isCallExpression(h)) {
                  const mName = h.expression.getText(sf);
                  middlewareSymbols.push(mName);
                  if (mName.includes("validate") && h.arguments.length > 0) {
                    requestSchemaSymbol = h.arguments[0].getText(sf);
                  }
                } else if (ts.isIdentifier(h)) {
                  middlewareSymbols.push(h.text);
                }
              }
            }

            routes.push({
              endpointId: `${methodName.toUpperCase()} ${normalizedPath}`,
              method: methodName.toUpperCase() as HttpVerb,
              path: rawPath,
              normalizedPath,
              filePath,
              routerSymbol,
              mountPrefix,
              controllerSymbol,
              controllerMethod,
              handlerSymbol,
              middlewareSymbols,
              requestSchemaSymbol,
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

  private combinePaths(mountPrefix: string, routePath: string): string {
    if (!mountPrefix) return routePath.startsWith("/") ? routePath : `/${routePath}`;
    const cleanPrefix = mountPrefix.endsWith("/") ? mountPrefix.slice(0, -1) : mountPrefix;
    const cleanRoute = routePath.startsWith("/") ? routePath : `/${routePath}`;
    return `${cleanPrefix}${cleanRoute}`;
  }

  private normalizePath(pathStr: string): string {
    let clean = pathStr.startsWith("/") ? pathStr : `/${pathStr}`;
    if (clean.length > 1 && clean.endsWith("/")) clean = clean.slice(0, -1);
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

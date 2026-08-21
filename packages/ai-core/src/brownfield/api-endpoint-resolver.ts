/**
 * ApiEndpointResolver
 *
 * Correlates Express backend routes, controllers, DTO schemas, and Prisma client calls
 * with frontend API client calls.
 * Safely halts on dynamic API URLs or computed request body properties.
 */

import ts from "typescript";
import { SymbolReferenceResolver } from "./symbol-reference-resolver.js";
import type { HttpMethod } from "../governance/api-contract-registry.js";

export interface BackendEndpointDefinition {
  method: HttpMethod;
  rawPath: string;
  normalizedPath: string; // e.g. "/api/tasks/:id"
  handlerSymbol: string;
  filePath: string;
  boundDtoName?: string;
  modelQueried?: string;
  line: number;
  col: number;
}

export interface FrontendApiCallSite {
  method: HttpMethod;
  rawPath: string;
  normalizedPath: string;
  callerSymbol: string;
  filePath: string;
  payloadDtoName?: string;
  isDynamic: boolean;
  line: number;
  col: number;
}

export interface PrismaModelAccess {
  modelName: string; // e.g. "task" -> "Task"
  methodName: string; // e.g. "create", "findMany", "update", "delete"
  callerSymbol: string;
  filePath: string;
  line: number;
  col: number;
}

export interface ApiUsageEdge {
  fromFile: string;
  fromSymbol: string;
  toFile: string;
  endpointSignature: string; // e.g. "POST::/api/tasks"
  edgeType: "EXPOSES_ROUTE" | "BINDS_DTO" | "CALLS_ENDPOINT" | "QUERIES_MODEL";
  line: number;
  col: number;
}

export interface UnsafeApiPattern {
  filePath: string;
  reason: string;
}

export class ApiEndpointResolver {
  private readonly symbolResolver: SymbolReferenceResolver;
  private readonly endpoints: BackendEndpointDefinition[] = [];
  private readonly frontendCalls: FrontendApiCallSite[] = [];
  private readonly prismaAccesses: PrismaModelAccess[] = [];
  private readonly edges: ApiUsageEdge[] = [];
  private readonly unsafePatterns: UnsafeApiPattern[] = [];

  constructor(symbolResolver: SymbolReferenceResolver) {
    this.symbolResolver = symbolResolver;
  }

  /**
   * Analyzes all backend routes, controllers, services, and frontend API calls.
   */
  public analyzeProject(): {
    endpoints: BackendEndpointDefinition[];
    frontendCalls: FrontendApiCallSite[];
    prismaAccesses: PrismaModelAccess[];
    edges: ApiUsageEdge[];
    unsafePatterns: UnsafeApiPattern[];
  } {
    this.endpoints.length = 0;
    this.frontendCalls.length = 0;
    this.prismaAccesses.length = 0;
    this.edges.length = 0;
    this.unsafePatterns.length = 0;

    const summaries = this.symbolResolver.getAllSummaries();

    for (const [filePath] of summaries) {
      this.analyzeFile(filePath);
    }

    this.linkApiEdges();

    return {
      endpoints: this.endpoints,
      frontendCalls: this.frontendCalls,
      prismaAccesses: this.prismaAccesses,
      edges: this.edges,
      unsafePatterns: this.unsafePatterns,
    };
  }

  /**
   * Finds the cross-layer trace for a given route or model.
   */
  public findRouteTrace(
    method: HttpMethod,
    path: string
  ): {
    endpoints: BackendEndpointDefinition[];
    frontendCalls: FrontendApiCallSite[];
    prismaAccesses: PrismaModelAccess[];
    hasDynamicUrl: boolean;
    unsafeReasons: string[];
  } {
    const norm = this.normalizePath(path);
    const matchedEndpoints = this.endpoints.filter(e => e.method === method && e.normalizedPath === norm);
    const matchedCalls = this.frontendCalls.filter(c => c.method === method && c.normalizedPath === norm);

    const relatedModels = new Set<string>();
    for (const ep of matchedEndpoints) {
      if (ep.modelQueried) relatedModels.add(ep.modelQueried.toLowerCase());
    }

    const matchedAccesses = this.prismaAccesses.filter(a => relatedModels.has(a.modelName.toLowerCase()));

    const hasDynamic = this.unsafePatterns.length > 0 || matchedCalls.some(c => c.isDynamic);
    const unsafeReasons = this.unsafePatterns.map(u => u.reason);

    return {
      endpoints: matchedEndpoints,
      frontendCalls: matchedCalls,
      prismaAccesses: matchedAccesses,
      hasDynamicUrl: hasDynamic,
      unsafeReasons,
    };
  }

  /**
   * Normalizes route path parameters (e.g. /api/tasks/:id, /api/tasks/:taskId, /api/tasks/${id} -> /api/tasks/:id).
   */
  public normalizePath(path: string): string {
    return path
      .replace(/\/+/g, "/")
      .replace(/\/+$/, "")
      .replace(/\/:[A-Za-z0-9_]+/g, "/:id")
      .replace(/\/\$\{[^}]+\}/g, "/:id");
  }

  public getEndpoints(): BackendEndpointDefinition[] {
    return this.endpoints;
  }

  public getFrontendCalls(): FrontendApiCallSite[] {
    return this.frontendCalls;
  }

  public getPrismaAccesses(): PrismaModelAccess[] {
    return this.prismaAccesses;
  }

  public getEdges(): ApiUsageEdge[] {
    return this.edges;
  }

  public getUnsafePatterns(): UnsafeApiPattern[] {
    return this.unsafePatterns;
  }

  private analyzeFile(filePath: string) {
    const sourceFile = this.symbolResolver.getSourceFile(filePath);
    if (!sourceFile) return;

    const scopeStack: string[] = ["top_level"];

    const visit = (node: ts.Node) => {
      let pushedScope = false;

      if (ts.isFunctionDeclaration(node) && node.name) {
        scopeStack.push(node.name.text);
        pushedScope = true;
      } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) {
        scopeStack.push(node.name.text);
        pushedScope = true;
      } else if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
        scopeStack.push(node.name.text);
        pushedScope = true;
      }

      const currentScope = scopeStack[scopeStack.length - 1];

      // 1. Backend Express Route: router.get('/api/tasks', handler) or router.post('/api/tasks', handler)
      if (ts.isCallExpression(node)) {
        const expr = node.expression;
        if (ts.isPropertyAccessExpression(expr)) {
          const objText = expr.expression.getText(sourceFile);
          const methodText = expr.name.text.toUpperCase();
          const httpMethods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

          // Express route detection: (router.get, app.post, etc.)
          if ((objText === "router" || objText === "app" || objText.endsWith("Router")) && httpMethods.has(methodText)) {
            if (node.arguments.length >= 2) {
              const firstArg = node.arguments[0];
              const handlerArg = node.arguments[node.arguments.length - 1];

              let rawPath: string | undefined;
              if (ts.isStringLiteral(firstArg)) {
                rawPath = firstArg.text;
              } else if (ts.isNoSubstitutionTemplateLiteral(firstArg)) {
                rawPath = firstArg.text;
              }

              if (rawPath) {
                const handlerSymbol = handlerArg.getText(sourceFile);
                const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));

                this.endpoints.push({
                  method: methodText as HttpMethod,
                  rawPath,
                  normalizedPath: this.normalizePath(rawPath),
                  handlerSymbol,
                  filePath,
                  line: line + 1,
                  col: character + 1,
                });
              }
            }
          }

          // 2. Frontend API Client: api.get('/api/tasks'), api.post('/api/tasks', data)
          if ((objText === "api" || objText === "client" || objText === "axios" || objText.endsWith("Api")) && httpMethods.has(methodText)) {
            if (node.arguments.length >= 1) {
              const firstArg = node.arguments[0];
              const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));

              // Static string literal: api.get('/api/tasks')
              if (ts.isStringLiteral(firstArg) || ts.isNoSubstitutionTemplateLiteral(firstArg)) {
                const rawPath = firstArg.text;
                this.frontendCalls.push({
                  method: methodText as HttpMethod,
                  rawPath,
                  normalizedPath: this.normalizePath(rawPath),
                  callerSymbol: currentScope,
                  filePath,
                  isDynamic: false,
                  line: line + 1,
                  col: character + 1,
                });
              }
              // Static template literal with ID: api.get(`/api/tasks/${id}`)
              else if (ts.isTemplateExpression(firstArg)) {
                const headText = firstArg.head.text;
                const spanExpr = firstArg.templateSpans[0]?.expression.getText(sourceFile);
                const isIdParam = spanExpr === "id" || spanExpr === "taskId" || spanExpr === "item.id";

                if (headText.startsWith("/api/") && headText.split("/").length > 2 && isIdParam) {
                  const rawPath = `${headText}:id`;
                  this.frontendCalls.push({
                    method: methodText as HttpMethod,
                    rawPath,
                    normalizedPath: this.normalizePath(rawPath),
                    callerSymbol: currentScope,
                    filePath,
                    isDynamic: false,
                    line: line + 1,
                    col: character + 1,
                  });
                } else {
                  // Dynamic computed URL: api.get(`/api/${resource}`)
                  this.unsafePatterns.push({
                    filePath,
                    reason: `DYNAMIC_API_URL: Dynamic computed API template expression "${firstArg.getText(sourceFile)}" in ${filePath}`,
                  });
                  this.frontendCalls.push({
                    method: methodText as HttpMethod,
                    rawPath: "DYNAMIC_COMPUTED",
                    normalizedPath: "DYNAMIC_COMPUTED",
                    callerSymbol: currentScope,
                    filePath,
                    isDynamic: true,
                    line: line + 1,
                    col: character + 1,
                  });
                }
              }
              // Unresolved dynamic argument: api.get(urlVar)
              else {
                this.unsafePatterns.push({
                  filePath,
                  reason: `DYNAMIC_API_URL: Non-literal computed API URL argument "${firstArg.getText(sourceFile)}" in ${filePath}`,
                });
                this.frontendCalls.push({
                  method: methodText as HttpMethod,
                  rawPath: "DYNAMIC_COMPUTED",
                  normalizedPath: "DYNAMIC_COMPUTED",
                  callerSymbol: currentScope,
                  filePath,
                  isDynamic: true,
                  line: line + 1,
                  col: character + 1,
                });
              }
            }
          }

          // 3. Prisma Client Access: prisma.task.findMany(), prisma.user.create()
          if (ts.isPropertyAccessExpression(expr.expression) && expr.expression.expression.getText(sourceFile) === "prisma") {
            const modelName = expr.expression.name.text;
            const methodName = expr.name.text;
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));

            this.prismaAccesses.push({
              modelName,
              methodName,
              callerSymbol: currentScope,
              filePath,
              line: line + 1,
              col: character + 1,
            });
          }
        }
      }

      // 4. Computed Request Body Access Check: req.body[dynamicKey]
      if (ts.isElementAccessExpression(node)) {
        if (ts.isPropertyAccessExpression(node.expression) && node.expression.expression.getText(sourceFile) === "req" && node.expression.name.text === "body") {
          if (!ts.isStringLiteral(node.argumentExpression)) {
            this.unsafePatterns.push({
              filePath,
              reason: `COMPUTED_BODY_ACCESS: Computed request property access "${node.getText(sourceFile)}" in controller in ${filePath}`,
            });
          }
        }
      }

      ts.forEachChild(node, visit);

      if (pushedScope) {
        scopeStack.pop();
      }
    };

    visit(sourceFile);
  }

  private linkApiEdges() {
    for (const ep of this.endpoints) {
      const sig = `${ep.method}::${ep.normalizedPath}`;
      this.edges.push({
        fromFile: ep.filePath,
        fromSymbol: ep.handlerSymbol,
        toFile: ep.filePath,
        endpointSignature: sig,
        edgeType: "EXPOSES_ROUTE",
        line: ep.line,
        col: ep.col,
      });
    }

    for (const call of this.frontendCalls) {
      if (!call.isDynamic) {
        const sig = `${call.method}::${call.normalizedPath}`;
        this.edges.push({
          fromFile: call.filePath,
          fromSymbol: call.callerSymbol,
          toFile: call.filePath,
          endpointSignature: sig,
          edgeType: "CALLS_ENDPOINT",
          line: call.line,
          col: call.col,
        });
      }
    }

    for (const acc of this.prismaAccesses) {
      this.edges.push({
        fromFile: acc.filePath,
        fromSymbol: acc.callerSymbol,
        toFile: acc.filePath,
        endpointSignature: `PRISMA::${acc.modelName}.${acc.methodName}`,
        edgeType: "QUERIES_MODEL",
        line: acc.line,
        col: acc.col,
      });
    }
  }
}

/**
 * ImpactClosureEngine
 *
 * Single authoritative impact analysis engine for brownfield repositories.
 * Computes closed, non-leaking impact sets across:
 * - TypeScript AST symbol references and call graphs
 * - React JSX hierarchies and prop drilling flows
 * - React Context value shapes and custom hook return shapes
 * - useReducer action unions, action creators, dispatches, and reducer branches
 * - Prisma schemas, backend Express routes, DTOs, and frontend API services
 *
 * Halts safely with IMPACT_ANALYSIS_INCOMPLETE or DESTRUCTIVE_SCHEMA_MIGRATION_BLOCKED
 * if static resolution fails.
 */

import { SymbolReferenceResolver, type FileAstSummary } from "./symbol-reference-resolver.js";
import { CallGraphResolver, type CallerGraphEdge } from "./call-graph-resolver.js";
import { PropFlowResolver, type PropFlowEdge, type UnsafeReactPattern } from "./prop-flow-resolver.js";
import { ContextUsageResolver, type ContextUsageEdge } from "./context-usage-resolver.js";
import { HookStateResolver, type HookUsageEdge } from "./hook-state-resolver.js";
import { ReducerActionResolver, type ActionUsageEdge } from "./reducer-action-resolver.js";
import { SchemaModelResolver, type SchemaUsageEdge } from "./schema-model-resolver.js";
import { ApiEndpointResolver, type ApiUsageEdge } from "./api-endpoint-resolver.js";
import type { HttpMethod } from "../governance/api-contract-registry.js";

export interface TargetSymbolRequest {
  filePath: string;
  symbolName: string;
  propName?: string;
  contextName?: string;
  hookName?: string;
  actionTypeLiteral?: string;
  modelName?: string;
  endpointPath?: string;
  httpMethod?: HttpMethod;
  isDestructive?: boolean;
}

export interface ImpactClosureResult {
  status: "CLOSED" | "IMPACT_ANALYSIS_INCOMPLETE" | "DESTRUCTIVE_SCHEMA_MIGRATION_BLOCKED";
  targetSymbols: TargetSymbolRequest[];
  mustChange: string[];
  mayChange: string[];
  requiredTests: string[];
  readOnly: string[];
  protected: string[];
  callGraphEdges: CallerGraphEdge[];
  propFlowEdges?: PropFlowEdge[];
  contextEdges?: ContextUsageEdge[];
  hookEdges?: HookUsageEdge[];
  actionEdges?: ActionUsageEdge[];
  schemaEdges?: SchemaUsageEdge[];
  apiEdges?: ApiUsageEdge[];
  unresolvedReasons?: {
    file: string;
    symbol?: string;
    reason: string;
  }[];
}

export class ImpactClosureEngine {
  private readonly projectRoot: string;
  private readonly symbolResolver: SymbolReferenceResolver;
  private readonly callGraphResolver: CallGraphResolver;
  private readonly propFlowResolver: PropFlowResolver;
  private readonly contextResolver: ContextUsageResolver;
  private readonly hookResolver: HookStateResolver;
  private readonly reducerResolver: ReducerActionResolver;
  private readonly schemaResolver: SchemaModelResolver;
  private readonly apiResolver: ApiEndpointResolver;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.symbolResolver = new SymbolReferenceResolver(this.projectRoot);
    this.callGraphResolver = new CallGraphResolver(this.symbolResolver);
    this.propFlowResolver = new PropFlowResolver(this.symbolResolver);
    this.contextResolver = new ContextUsageResolver(this.symbolResolver);
    this.hookResolver = new HookStateResolver(this.symbolResolver);
    this.reducerResolver = new ReducerActionResolver(this.symbolResolver);
    this.schemaResolver = new SchemaModelResolver(this.projectRoot);
    this.apiResolver = new ApiEndpointResolver(this.symbolResolver);
  }

  /**
   * Computes the closed impact set for the given targets across all architectural layers.
   */
  public computeClosure(targets: TargetSymbolRequest[]): ImpactClosureResult {
    // 1. Parse all files and construct complete multi-layer graphs
    this.symbolResolver.parseProject();
    this.callGraphResolver.buildGraph();
    const propFlowData = this.propFlowResolver.analyzeProject();
    const contextData = this.contextResolver.analyzeProject();
    const hookData = this.hookResolver.analyzeProject();
    const actionData = this.reducerResolver.analyzeProject();
    const schemaData = this.schemaResolver.analyzeProject();
    const apiData = this.apiResolver.analyzeProject();

    const summaries = this.symbolResolver.getAllSummaries();
    const protectedFiles = new Set<string>([
      "package.json",
      "tsconfig.json",
      ".git",
      ".env",
      "pnpm-lock.yaml",
      "package-lock.json",
      "yarn.lock",
    ]);

    // 2. Check for unresolved dynamic imports across project
    const unresolvedReasons: { file: string; symbol?: string; reason: string }[] = [];

    for (const [filePath, summary] of summaries) {
      if (summary.unresolvedDynamicImports.length > 0) {
        unresolvedReasons.push({
          file: filePath,
          reason: `UNRESOLVED_DYNAMIC_IMPORT: File contains non-static dynamic import: ${summary.unresolvedDynamicImports.join(", ")}`,
        });
      }
    }

    // 3. Verify target symbols and check for unsafe patterns
    for (const target of targets) {
      const relTarget = this.toRelative(target.filePath);

      // Check destructive schema migration targets
      if (target.isDestructive) {
        return {
          status: "DESTRUCTIVE_SCHEMA_MIGRATION_BLOCKED",
          targetSymbols: targets,
          mustChange: [],
          mayChange: [],
          requiredTests: [],
          readOnly: Array.from(summaries.keys()),
          protected: Array.from(protectedFiles),
          callGraphEdges: [],
          unresolvedReasons: [
            {
              file: relTarget,
              symbol: target.symbolName,
              reason: `DESTRUCTIVE_SCHEMA_MIGRATION_BLOCKED: Destructive schema modification on "${target.symbolName}" is strictly blocked.`,
            },
          ],
        };
      }

      // Check if target symbol exists in file
      const targetSummary = summaries.get(relTarget);
      if (targetSummary && !target.endpointPath && !target.modelName && !relTarget.endsWith(".prisma")) {
        const symbolFound = targetSummary.symbols.some(s => s.name === target.symbolName || s.localName === target.symbolName);
        if (!symbolFound) {
          unresolvedReasons.push({
            file: relTarget,
            symbol: target.symbolName,
            reason: `TARGET_SYMBOL_NOT_FOUND: Symbol "${target.symbolName}" not found in "${relTarget}"`,
          });
        }
      }

      // Check prop spread unsafe patterns
      const unsafePropMatch = propFlowData.unsafePatterns.find(
        p => p.filePath === relTarget || (target.propName && p.snippet.includes(target.propName))
      );
      if (unsafePropMatch) {
        unresolvedReasons.push({
          file: unsafePropMatch.filePath,
          symbol: target.symbolName,
          reason: `${unsafePropMatch.patternType}: ${unsafePropMatch.reason}`,
        });
      }

      // Check context unsafe patterns
      const unsafeCtxMatch = contextData.unsafePatterns.find(
        u => u.contextName === target.symbolName || (target.contextName && u.contextName === target.contextName)
      );
      if (unsafeCtxMatch) {
        unresolvedReasons.push({
          file: unsafeCtxMatch.filePath,
          symbol: target.symbolName,
          reason: `COMPUTED_CONTEXT_ACCESS: ${unsafeCtxMatch.reason}`,
        });
      }

      // Check hook unsafe patterns
      const unsafeHookMatch = hookData.unsafePatterns.find(
        u => u.hookName === target.symbolName || (target.hookName && u.hookName === target.hookName)
      );
      if (unsafeHookMatch) {
        unresolvedReasons.push({
          file: unsafeHookMatch.filePath,
          symbol: target.symbolName,
          reason: `DYNAMIC_HOOK_PROPERTY_ACCESS: ${unsafeHookMatch.reason}`,
        });
      }

      // Check reducer action unsafe patterns
      const unsafeActionMatch = actionData.unsafePatterns.find(
        u => u.actionTypeLiteral === target.actionTypeLiteral || u.filePath === relTarget
      );
      if (unsafeActionMatch) {
        unresolvedReasons.push({
          file: unsafeActionMatch.filePath,
          symbol: target.symbolName,
          reason: `DYNAMIC_ACTION_DISPATCH: ${unsafeActionMatch.reason}`,
        });
      }

      // Check API unsafe patterns
      const unsafeApiMatch = apiData.unsafePatterns.find(u => u.filePath === relTarget || u.reason.includes(target.symbolName));
      if (unsafeApiMatch) {
        unresolvedReasons.push({
          file: unsafeApiMatch.filePath,
          symbol: target.symbolName,
          reason: `${unsafeApiMatch.reason}`,
        });
      }
    }

    if (unresolvedReasons.length > 0) {
      return {
        status: "IMPACT_ANALYSIS_INCOMPLETE",
        targetSymbols: targets,
        mustChange: [],
        mayChange: [],
        requiredTests: [],
        readOnly: Array.from(summaries.keys()),
        protected: Array.from(protectedFiles),
        callGraphEdges: [],
        propFlowEdges: [],
        contextEdges: [],
        hookEdges: [],
        actionEdges: [],
        schemaEdges: [],
        apiEdges: [],
        unresolvedReasons,
      };
    }

    // 4. Traverse multi-layer dependency graph to compute closed impact set
    const mustChange = new Set<string>();
    const mayChange = new Set<string>();
    const requiredTests = new Set<string>();
    const collectedCallEdges: CallerGraphEdge[] = [];
    const collectedPropEdges: PropFlowEdge[] = [];
    const collectedContextEdges: ContextUsageEdge[] = [];
    const collectedHookEdges: HookUsageEdge[] = [];
    const collectedActionEdges: ActionUsageEdge[] = [];
    const collectedSchemaEdges: SchemaUsageEdge[] = [];
    const collectedApiEdges: ApiUsageEdge[] = [];

    const queue: TargetSymbolRequest[] = [...targets];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentRel = this.toRelative(current.filePath);
      const key = `${currentRel}::${current.symbolName}${current.propName ? "::" + current.propName : ""}${current.contextName ? "::" + current.contextName : ""}${current.hookName ? "::" + current.hookName : ""}${current.actionTypeLiteral ? "::" + current.actionTypeLiteral : ""}${current.modelName ? "::" + current.modelName : ""}${current.endpointPath ? "::" + current.endpointPath : ""}`;

      if (visited.has(key)) continue;
      visited.add(key);

      mustChange.add(currentRel);

      // A. Direct Importers (when full symbol is modified)
      if (!current.propName && !current.actionTypeLiteral && !current.endpointPath) {
        const directImporters = this.symbolResolver.findDirectImporters(currentRel, current.symbolName);
        for (const imp of directImporters) {
          if (this.isTestFile(imp.importerFile)) {
            requiredTests.add(imp.importerFile);
          } else {
            mayChange.add(imp.importerFile);
          }
        }
      }

      // B. Direct Callers
      const callers = this.callGraphResolver.findDirectCallers(currentRel, current.symbolName);
      for (const caller of callers) {
        collectedCallEdges.push(caller);
        if (this.isTestFile(caller.fromFile)) {
          requiredTests.add(caller.fromFile);
        } else {
          mayChange.add(caller.fromFile);
          if (caller.fromSymbol !== "top_level") {
            queue.push({ filePath: caller.fromFile, symbolName: caller.fromSymbol });
          }
        }
      }

      // C. JSX Component Render Sites
      const jsxUsages = this.callGraphResolver.findJsxUsages(currentRel, current.symbolName);
      for (const usage of jsxUsages) {
        collectedCallEdges.push(usage);
        if (this.isTestFile(usage.fromFile)) {
          requiredTests.add(usage.fromFile);
        } else {
          mayChange.add(usage.fromFile);
          if (usage.fromSymbol !== "top_level") {
            queue.push({ filePath: usage.fromFile, symbolName: usage.fromSymbol });
          }
        }
      }

      // D. Prop & Callback Hierarchy Flow
      if (current.propName) {
        const propTrace = this.propFlowResolver.findPropTrace(currentRel, current.symbolName, current.propName);
        if (propTrace.hasUnsafeSpread) {
          return {
            status: "IMPACT_ANALYSIS_INCOMPLETE",
            targetSymbols: targets,
            mustChange: [],
            mayChange: [],
            requiredTests: [],
            readOnly: Array.from(summaries.keys()),
            protected: Array.from(protectedFiles),
            callGraphEdges: [],
            unresolvedReasons: propTrace.unsafeReasons.map(r => ({ file: currentRel, symbol: current.symbolName, reason: r })),
          };
        }

        for (const edge of propTrace.forwardingLayers) {
          collectedPropEdges.push(edge);
          if (edge.fromFile !== currentRel) {
            mayChange.add(edge.fromFile);
            queue.push({ filePath: edge.fromFile, symbolName: edge.fromComponent, propName: current.propName });
          }
        }
      }

      // E. Context Provider & Consumer Flow
      const contextName = current.contextName || (current.symbolName.endsWith("Context") ? current.symbolName : undefined);
      if (contextName) {
        const ctxTrace = this.contextResolver.findContextTrace(contextName, current.propName);
        if (ctxTrace.hasComputedAccess) {
          return {
            status: "IMPACT_ANALYSIS_INCOMPLETE",
            targetSymbols: targets,
            mustChange: [],
            mayChange: [],
            requiredTests: [],
            readOnly: Array.from(summaries.keys()),
            protected: Array.from(protectedFiles),
            callGraphEdges: [],
            unresolvedReasons: ctxTrace.unsafeReasons.map(r => ({ file: currentRel, symbol: current.symbolName, reason: r })),
          };
        }

        for (const prov of ctxTrace.providers) {
          if (prov.providerFile !== currentRel) {
            mayChange.add(prov.providerFile);
            queue.push({ filePath: prov.providerFile, symbolName: prov.providerComponent });
          }
        }

        for (const cons of ctxTrace.consumers) {
          if (cons.consumerFile !== currentRel) {
            mayChange.add(cons.consumerFile);
            queue.push({ filePath: cons.consumerFile, symbolName: cons.consumerComponent });
          }
        }
      }

      // F. Custom Hook Return Shape & Consumer Flow
      const hookName = current.hookName || (current.symbolName.startsWith("use") && current.symbolName.length > 3 ? current.symbolName : undefined);
      if (hookName) {
        const hookTrace = this.hookResolver.findHookTrace(hookName, current.propName);
        if (hookTrace.hasDynamicAccess) {
          return {
            status: "IMPACT_ANALYSIS_INCOMPLETE",
            targetSymbols: targets,
            mustChange: [],
            mayChange: [],
            requiredTests: [],
            readOnly: Array.from(summaries.keys()),
            protected: Array.from(protectedFiles),
            callGraphEdges: [],
            unresolvedReasons: hookTrace.unsafeReasons.map(r => ({ file: currentRel, symbol: current.symbolName, reason: r })),
          };
        }

        for (const cons of hookTrace.consumers) {
          if (cons.consumerFile !== currentRel) {
            mayChange.add(cons.consumerFile);
            queue.push({ filePath: cons.consumerFile, symbolName: cons.consumerComponent });
          }
        }
      }

      // G. useReducer Action & Dispatch Flow
      const actionLiteral = current.actionTypeLiteral || (current.symbolName.includes("Action") ? current.propName : undefined);
      if (actionLiteral) {
        const actionTrace = this.reducerResolver.findActionTrace(actionLiteral, current.propName);
        if (actionTrace.hasDynamicAction) {
          return {
            status: "IMPACT_ANALYSIS_INCOMPLETE",
            targetSymbols: targets,
            mustChange: [],
            mayChange: [],
            requiredTests: [],
            readOnly: Array.from(summaries.keys()),
            protected: Array.from(protectedFiles),
            callGraphEdges: [],
            unresolvedReasons: actionTrace.unsafeReasons.map(r => ({ file: currentRel, symbol: current.symbolName, reason: r })),
          };
        }

        for (const typeDef of actionTrace.actionTypes) {
          if (typeDef.filePath !== currentRel) {
            mayChange.add(typeDef.filePath);
            queue.push({ filePath: typeDef.filePath, symbolName: typeDef.typeName });
          }
        }

        for (const creator of actionTrace.actionCreators) {
          if (creator.filePath !== currentRel) {
            mayChange.add(creator.filePath);
            queue.push({ filePath: creator.filePath, symbolName: creator.creatorName });
          }
        }

        for (const branch of actionTrace.reducerBranches) {
          if (branch.filePath !== currentRel) {
            mayChange.add(branch.filePath);
            queue.push({ filePath: branch.filePath, symbolName: branch.reducerName });
          }
        }

        for (const disp of actionTrace.dispatchSites) {
          if (disp.callerFile !== currentRel) {
            mayChange.add(disp.callerFile);
            queue.push({ filePath: disp.callerFile, symbolName: disp.callerComponent });
          }
        }
      }

      // H. Prisma Schema & Model Flow
      const modelName = current.modelName || (currentRel.endsWith(".prisma") ? current.symbolName : undefined);
      if (modelName) {
        const modelTrace = this.schemaResolver.findModelTrace(modelName, current.propName);
        if (modelTrace.isDestructive) {
          return {
            status: "DESTRUCTIVE_SCHEMA_MIGRATION_BLOCKED",
            targetSymbols: targets,
            mustChange: [],
            mayChange: [],
            requiredTests: [],
            readOnly: Array.from(summaries.keys()),
            protected: Array.from(protectedFiles),
            callGraphEdges: [],
            unresolvedReasons: modelTrace.unsafeReasons.map(r => ({ file: currentRel, symbol: current.symbolName, reason: r })),
          };
        }

        // Correlate with Prisma Client calls: prisma.task.create()
        for (const acc of apiData.prismaAccesses) {
          if (acc.modelName.toLowerCase() === modelName.toLowerCase()) {
            if (acc.filePath !== currentRel) {
              mayChange.add(acc.filePath);
              queue.push({ filePath: acc.filePath, symbolName: acc.callerSymbol });
              const svcSummary = summaries.get(acc.filePath);
              if (svcSummary) {
                for (const sym of svcSummary.symbols) {
                  queue.push({ filePath: acc.filePath, symbolName: sym.name });
                }
              }
            }
          }
        }
      }

      // I. Express Routes & Frontend API Invocations
      const endpointPath = current.endpointPath || (current.symbolName.startsWith("/api/") ? current.symbolName : undefined);
      if (endpointPath) {
        const method = current.httpMethod || "GET";
        const routeTrace = this.apiResolver.findRouteTrace(method, endpointPath);
        if (routeTrace.hasDynamicUrl) {
          return {
            status: "IMPACT_ANALYSIS_INCOMPLETE",
            targetSymbols: targets,
            mustChange: [],
            mayChange: [],
            requiredTests: [],
            readOnly: Array.from(summaries.keys()),
            protected: Array.from(protectedFiles),
            callGraphEdges: [],
            unresolvedReasons: routeTrace.unsafeReasons.map(r => ({ file: currentRel, symbol: current.symbolName, reason: r })),
          };
        }

        for (const ep of routeTrace.endpoints) {
          if (ep.filePath !== currentRel) {
            mayChange.add(ep.filePath);
          }
          const baseHandler = ep.handlerSymbol.split(".")[0];
          const routeSummary = summaries.get(ep.filePath);
          if (routeSummary) {
            for (const imp of routeSummary.imports) {
              if ((imp.importedName === baseHandler || imp.localAlias === baseHandler) && imp.resolvedSourceFile) {
                mayChange.add(imp.resolvedSourceFile);
                queue.push({ filePath: imp.resolvedSourceFile, symbolName: baseHandler });
              }
            }
          }
        }

        for (const call of routeTrace.frontendCalls) {
          if (call.filePath !== currentRel) {
            mayChange.add(call.filePath);
            queue.push({ filePath: call.filePath, symbolName: call.callerSymbol });
          }
        }
      }

      // J. Discover In-Project Tests
      const tests = this.callGraphResolver.findTestCallers(currentRel, current.symbolName);
      for (const t of tests) {
        collectedCallEdges.push(t);
        requiredTests.add(t.fromFile);
      }
    }

    // 5. Partition remaining files into readOnly
    const readOnly = new Set<string>();
    for (const filePath of summaries.keys()) {
      if (!mustChange.has(filePath) && !mayChange.has(filePath) && !requiredTests.has(filePath) && !protectedFiles.has(filePath)) {
        readOnly.add(filePath);
      }
    }

    return {
      status: "CLOSED",
      targetSymbols: targets,
      mustChange: Array.from(mustChange),
      mayChange: Array.from(mayChange),
      requiredTests: Array.from(requiredTests),
      readOnly: Array.from(readOnly),
      protected: Array.from(protectedFiles),
      callGraphEdges: collectedCallEdges,
      propFlowEdges: collectedPropEdges,
      contextEdges: contextData.edges,
      hookEdges: hookData.edges,
      actionEdges: actionData.edges,
      schemaEdges: schemaData.edges,
      apiEdges: apiData.edges,
    };
  }

  public getSchemaResolver(): SchemaModelResolver {
    return this.schemaResolver;
  }

  public getApiResolver(): ApiEndpointResolver {
    return this.apiResolver;
  }

  public getReducerResolver(): ReducerActionResolver {
    return this.reducerResolver;
  }

  public getContextResolver(): ContextUsageResolver {
    return this.contextResolver;
  }

  public getHookResolver(): HookStateResolver {
    return this.hookResolver;
  }

  public getPropFlowResolver(): PropFlowResolver {
    return this.propFlowResolver;
  }

  private isTestFile(filePath: string): boolean {
    return (
      filePath.includes("__tests__") ||
      filePath.endsWith(".test.ts") ||
      filePath.endsWith(".test.tsx") ||
      filePath.endsWith(".spec.ts") ||
      filePath.endsWith(".spec.tsx")
    );
  }

  private toRelative(p: string): string {
    const normalizedProject = this.projectRoot.replace(/\\/g, "/");
    const normalizedP = p.replace(/\\/g, "/");
    if (normalizedP.startsWith(normalizedProject)) {
      return normalizedP.slice(normalizedProject.length).replace(/^(\/|\\)+/, "");
    }
    return normalizedP.replace(/^(\/|\\)+/, "");
  }
}

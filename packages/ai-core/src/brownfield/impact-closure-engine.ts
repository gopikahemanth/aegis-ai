/**
 * ImpactClosureEngine
 *
 * Computes a closed, non-leaking impact set for existing symbols, functions,
 * React components, prop flows, callback hierarchies, Context value shapes,
 * custom hook return shapes, and useReducer action/dispatch hierarchies.
 * Halts safely with IMPACT_ANALYSIS_INCOMPLETE if static resolution fails.
 */

import { SymbolReferenceResolver, type FileAstSummary } from "./symbol-reference-resolver.js";
import { CallGraphResolver, type CallerGraphEdge } from "./call-graph-resolver.js";
import { PropFlowResolver, type PropFlowEdge, type UnsafeReactPattern } from "./prop-flow-resolver.js";
import { ContextUsageResolver, type ContextUsageEdge } from "./context-usage-resolver.js";
import { HookStateResolver, type HookUsageEdge } from "./hook-state-resolver.js";
import { ReducerActionResolver, type ActionUsageEdge } from "./reducer-action-resolver.js";

export interface TargetSymbolRequest {
  filePath: string;
  symbolName: string;
  propName?: string;
  contextName?: string;
  hookName?: string;
  actionTypeLiteral?: string;
}

export interface ImpactClosureResult {
  status: "CLOSED" | "IMPACT_ANALYSIS_INCOMPLETE";
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

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.symbolResolver = new SymbolReferenceResolver(this.projectRoot);
    this.callGraphResolver = new CallGraphResolver(this.symbolResolver);
    this.propFlowResolver = new PropFlowResolver(this.symbolResolver);
    this.contextResolver = new ContextUsageResolver(this.symbolResolver);
    this.hookResolver = new HookStateResolver(this.symbolResolver);
    this.reducerResolver = new ReducerActionResolver(this.symbolResolver);
  }

  /**
   * Computes the closed impact set for the given target symbols, components, Contexts, hooks, or actions.
   */
  public computeClosure(targets: TargetSymbolRequest[]): ImpactClosureResult {
    // 1. Parse all files and construct reference, call, prop, context, hook, and action graphs
    this.symbolResolver.parseProject();
    this.callGraphResolver.buildGraph();
    const propFlowData = this.propFlowResolver.analyzeProject();
    const contextData = this.contextResolver.analyzeProject();
    const hookData = this.hookResolver.analyzeProject();
    const actionData = this.reducerResolver.analyzeProject();

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

    // 3. Verify target symbols and check for React / Context / Hook / Reducer unsafe patterns
    for (const target of targets) {
      const relTarget = this.toRelative(target.filePath);
      const summary = summaries.get(relTarget);
      if (!summary) {
        unresolvedReasons.push({
          file: relTarget,
          symbol: target.symbolName,
          reason: `TARGET_FILE_NOT_FOUND: Target file "${relTarget}" not found in project.`,
        });
        continue;
      }

      const sym = summary.symbols.find(s => s.name === target.symbolName || s.localName === target.symbolName);
      if (!sym && !target.contextName && !target.hookName && !target.actionTypeLiteral) {
        unresolvedReasons.push({
          file: relTarget,
          symbol: target.symbolName,
          reason: `TARGET_SYMBOL_NOT_FOUND: Symbol "${target.symbolName}" not declared in "${relTarget}".`,
        });
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
        unresolvedReasons,
      };
    }

    // 4. Traverse dependency, caller, prop, context, hook, and action graph to compute closed impact set
    const mustChange = new Set<string>();
    const mayChange = new Set<string>();
    const requiredTests = new Set<string>();
    const collectedCallEdges: CallerGraphEdge[] = [];
    const collectedPropEdges: PropFlowEdge[] = [];
    const collectedContextEdges: ContextUsageEdge[] = [];
    const collectedHookEdges: HookUsageEdge[] = [];
    const collectedActionEdges: ActionUsageEdge[] = [];

    const queue: { filePath: string; symbolName: string; propName?: string; contextName?: string; hookName?: string; actionTypeLiteral?: string }[] = [...targets];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentRel = this.toRelative(current.filePath);
      const key = `${currentRel}::${current.symbolName}${current.propName ? "::" + current.propName : ""}${current.contextName ? "::" + current.contextName : ""}${current.hookName ? "::" + current.hookName : ""}${current.actionTypeLiteral ? "::" + current.actionTypeLiteral : ""}`;

      if (visited.has(key)) continue;
      visited.add(key);

      mustChange.add(currentRel);

      // A. Direct Importers (when full symbol is modified)
      if (!current.propName && !current.actionTypeLiteral) {
        const directImporters = this.symbolResolver.findDirectImporters(currentRel, current.symbolName);
        for (const imp of directImporters) {
          if (imp.importerFile.includes("__tests__") || imp.importerFile.endsWith(".test.ts") || imp.importerFile.endsWith(".test.tsx") || imp.importerFile.endsWith(".spec.ts") || imp.importerFile.endsWith(".spec.tsx")) {
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
        if (caller.fromFile.includes("__tests__") || caller.fromFile.endsWith(".test.ts") || caller.fromFile.endsWith(".test.tsx")) {
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
        if (usage.fromFile.includes("__tests__") || usage.fromFile.endsWith(".test.ts") || usage.fromFile.endsWith(".test.tsx")) {
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
            propFlowEdges: [],
            contextEdges: [],
            hookEdges: [],
            actionEdges: [],
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
            propFlowEdges: [],
            contextEdges: [],
            hookEdges: [],
            actionEdges: [],
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
            propFlowEdges: [],
            contextEdges: [],
            hookEdges: [],
            actionEdges: [],
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
            propFlowEdges: [],
            contextEdges: [],
            hookEdges: [],
            actionEdges: [],
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

      // H. Discover Tests
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
    };
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

  private toRelative(p: string): string {
    const normalizedProject = this.projectRoot.replace(/\\/g, "/");
    const normalizedP = p.replace(/\\/g, "/");
    if (normalizedP.startsWith(normalizedProject)) {
      return normalizedP.slice(normalizedProject.length).replace(/^(\/|\\)+/, "");
    }
    return normalizedP.replace(/^(\/|\\)+/, "");
  }
}

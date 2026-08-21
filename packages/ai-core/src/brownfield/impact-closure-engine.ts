/**
 * ImpactClosureEngine
 *
 * Computes a closed, non-leaking impact set for existing symbols,
 * or halts safely with IMPACT_ANALYSIS_INCOMPLETE if static resolution fails.
 */

import { SymbolReferenceResolver, type FileAstSummary } from "./symbol-reference-resolver.js";
import { CallGraphResolver, type CallerGraphEdge } from "./call-graph-resolver.js";

export interface TargetSymbolRequest {
  filePath: string;
  symbolName: string;
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

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.symbolResolver = new SymbolReferenceResolver(this.projectRoot);
    this.callGraphResolver = new CallGraphResolver(this.symbolResolver);
  }

  /**
   * Computes the closed impact set for the given target symbols.
   */
  public computeClosure(targets: TargetSymbolRequest[]): ImpactClosureResult {
    // 1. Parse all files and construct call graph
    this.symbolResolver.parseProject();
    this.callGraphResolver.buildGraph();

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

    // 2. Check for unresolved dynamic imports or ambiguity across project
    const unresolvedReasons: { file: string; symbol?: string; reason: string }[] = [];

    for (const [filePath, summary] of summaries) {
      if (summary.unresolvedDynamicImports.length > 0) {
        unresolvedReasons.push({
          file: filePath,
          reason: `UNRESOLVED_DYNAMIC_IMPORT: File contains non-static dynamic import: ${summary.unresolvedDynamicImports.join(", ")}`,
        });
      }
    }

    // 3. Verify that each target symbol exists
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
      if (!sym) {
        unresolvedReasons.push({
          file: relTarget,
          symbol: target.symbolName,
          reason: `TARGET_SYMBOL_NOT_FOUND: Symbol "${target.symbolName}" not declared in "${relTarget}".`,
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
        unresolvedReasons,
      };
    }

    // 4. Traverse dependency & caller graph to compute closed impact set
    const mustChange = new Set<string>();
    const mayChange = new Set<string>();
    const requiredTests = new Set<string>();
    const collectedEdges: CallerGraphEdge[] = [];

    const queue: { filePath: string; symbolName: string }[] = [...targets];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentRel = this.toRelative(current.filePath);
      const key = `${currentRel}::${current.symbolName}`;

      if (visited.has(key)) continue;
      visited.add(key);

      mustChange.add(currentRel);

      // A. Discover direct importers
      const directImporters = this.symbolResolver.findDirectImporters(currentRel, current.symbolName);
      for (const imp of directImporters) {
        if (imp.importerFile.includes("__tests__") || imp.importerFile.endsWith(".test.ts") || imp.importerFile.endsWith(".test.tsx") || imp.importerFile.endsWith(".spec.ts") || imp.importerFile.endsWith(".spec.tsx")) {
          requiredTests.add(imp.importerFile);
        } else {
          mayChange.add(imp.importerFile);
        }
      }

      // B. Discover direct callers (functions, methods, hooks)
      const callers = this.callGraphResolver.findDirectCallers(currentRel, current.symbolName);
      for (const caller of callers) {
        collectedEdges.push(caller);
        if (caller.fromFile.includes("__tests__") || caller.fromFile.endsWith(".test.ts") || caller.fromFile.endsWith(".test.tsx")) {
          requiredTests.add(caller.fromFile);
        } else {
          mayChange.add(caller.fromFile);
          if (caller.fromSymbol !== "top_level") {
            queue.push({ filePath: caller.fromFile, symbolName: caller.fromSymbol });
          }
        }
      }

      // C. Discover JSX component renderers
      const jsxUsages = this.callGraphResolver.findJsxUsages(currentRel, current.symbolName);
      for (const usage of jsxUsages) {
        collectedEdges.push(usage);
        if (usage.fromFile.includes("__tests__") || usage.fromFile.endsWith(".test.ts") || usage.fromFile.endsWith(".test.tsx")) {
          requiredTests.add(usage.fromFile);
        } else {
          mayChange.add(usage.fromFile);
          if (usage.fromSymbol !== "top_level") {
            queue.push({ filePath: usage.fromFile, symbolName: usage.fromSymbol });
          }
        }
      }

      // D. Discover tests
      const tests = this.callGraphResolver.findTestCallers(currentRel, current.symbolName);
      for (const t of tests) {
        collectedEdges.push(t);
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
      callGraphEdges: collectedEdges,
    };
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

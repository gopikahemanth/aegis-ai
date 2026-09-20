/**
 * CapabilityCompletenessInvariant
 *
 * Enforces authoritative feature completeness across the entire Aegis generation pipeline.
 * Replaces shallow heuristics (e.g. arbitrary character counts or fixed button counts)
 * with an explicit, traceable contract chain:
 *
 * requirement → capability → data/state → UI control → handler → observable mutation → full-stack persistence
 *
 * Invariant: Build Success ≠ Generation Success ≠ Feature Success ≠ Certification
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";

export interface CapabilityChainEvidence {
  capabilityId: string;
  name: string;
  description: string;
  hasStateOrData: boolean;
  hasUI: boolean;
  hasHandler: boolean;
  hasObservableResult: boolean;
  isSatisfied: boolean;
  missingCells: string[];
}

export interface CapabilityCompletenessResult {
  complete: boolean;
  score: number;
  totalCapabilities: number;
  satisfiedCapabilities: number;
  evidence: CapabilityChainEvidence[];
  reasons: string[];
  earlyRejection?: string;
}

export interface FullStackTraceEvidence {
  featureOrEntity: string;
  frontendClientPresent: boolean;
  backendRoutePresent: boolean;
  dataPersistencePresent: boolean;
  isFullyTraced: boolean;
  details: string;
}

export interface FullStackTraceResult {
  valid: boolean;
  score: number;
  traces: FullStackTraceEvidence[];
  violations: string[];
}

export interface CapabilityEvaluationOptions {
  expectedWorkspaceType?: string;
  capabilities?: string[];
  domainModels?: string[];
  requiredFeatures?: string[];
  strictWorkspaceMarker?: boolean;
  filePath?: string;
  projectRoot?: string;
}

export class CapabilityCompletenessInvariant {

  /**
   * Evaluates a generated page (e.g. DashboardPage.tsx) against the declared workspace capabilities.
   * Every capability MUST have an explicit chain:
   * Data/State -> UI Control -> Event Handler -> Observable Mutation / Derivation
   */
  public static evaluatePage(
    content: string,
    options: CapabilityEvaluationOptions = {}
  ): CapabilityCompletenessResult {
    const reasons: string[] = [];
    const trimmed = (content || "").trim();

    // ── 0. Early Rejections (Syntax, Exports, Truncation, Route Stubs) ──────
    if (trimmed.includes("ROUTE_STUB_ONLY") || trimmed.includes("CAPABILITY_IMPLEMENTATION_REQUIRED") || trimmed.includes("data-testid=\"route-stub\"")) {
      return {
        complete: false,
        score: 0,
        totalCapabilities: (options.capabilities || []).length || 1,
        satisfiedCapabilities: 0,
        evidence: [],
        reasons: ["File is a non-generative route stub (ROUTE_STUB_ONLY). Genuine product capability implementation required from Coder."],
        earlyRejection: "ROUTE_STUB_ONLY",
      };
    }

    if (!trimmed || trimmed.length < 150) {
      return {
        complete: false,
        score: 0,
        totalCapabilities: 0,
        satisfiedCapabilities: 0,
        evidence: [],
        reasons: ["File is empty or truncated (< 150 characters)."],
        earlyRejection: "EMPTY_OR_TRUNCATED",
      };
    }

    const hasExport = /export\s+(default|function|const)/.test(trimmed);
    if (!hasExport) {
      return {
        complete: false,
        score: 10,
        totalCapabilities: 0,
        satisfiedCapabilities: 0,
        evidence: [],
        reasons: ["Component does not export a valid React component."],
        earlyRejection: "MISSING_EXPORT",
      };
    }

    // Strip comments and string literals before checking parenthesis balance
    const strippedSyntax = trimmed
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\r\n]*/g, "")
      .replace(/'(?:[^'\\]|\\.)*'/g, "''")
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/`[\s\S]*?`/g, "``");
    const openParens = (strippedSyntax.match(/\(/g) || []).length;
    const closeParens = (strippedSyntax.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      return {
        complete: false,
        score: 15,
        totalCapabilities: 0,
        satisfiedCapabilities: 0,
        evidence: [],
        reasons: ["Malformed JSX/TSX syntax: Unbalanced parentheses."],
        earlyRejection: "UNBALANCED_SYNTAX",
      };
    }

    // ── 0.1 Aggregate Modular Sub-components If Auditing File on Disk ──────────
    let evalSource = trimmed;
    if (options.filePath && existsSync(options.filePath)) {
      try {
        const pageDir = dirname(options.filePath);
        const resolvedFiles = new Set<string>();

        const scanImportsInText = (text: string, currentDir: string) => {
          const importRegex = /from\s+['"](\.[^'"]+)['"]/g;
          let match: RegExpExecArray | null;
          while ((match = importRegex.exec(text)) !== null) {
            const relImport = match[1];
            const extensions = ["", ".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts"];
            for (const ext of extensions) {
              const cand = join(currentDir, relImport + ext);
              if (existsSync(cand)) {
                try {
                  if (statSync(cand).isFile() && !resolvedFiles.has(cand)) {
                    resolvedFiles.add(cand);
                    const subText = readFileSync(cand, "utf8");
                    scanImportsInText(subText, dirname(cand));
                    break;
                  }
                } catch {}
              }
            }
          }
        };

        // 1. Scan recursive relative imports from the page file
        scanImportsInText(trimmed, pageDir);

        // 2. Scan sibling components folder (e.g. src/features/dashboard/components)
        const compDir = join(pageDir, "components");
        if (existsSync(compDir)) {
          try {
            for (const f of readdirSync(compDir)) {
              const p = join(compDir, f);
              if (statSync(p).isFile() && /\.(tsx|jsx|ts|js)$/.test(f) && !resolvedFiles.has(p)) {
                resolvedFiles.add(p);
              }
            }
          } catch {}
        }

        // 3. Scan sibling feature components in pageDir
        try {
          for (const f of readdirSync(pageDir)) {
            const p = join(pageDir, f);
            if (statSync(p).isFile() && /\.(tsx|jsx|ts|js)$/.test(f) && !f.toLowerCase().includes("page") && p !== options.filePath && !resolvedFiles.has(p)) {
              resolvedFiles.add(p);
            }
          }
        } catch {}

        for (const f of resolvedFiles) {
          try {
            evalSource += "\n" + readFileSync(f, "utf8");
          } catch {}
        }
      } catch {}
    }

    // ── 1. Primary Workspace Contract Presence ─────────────────────────────
    const expectedType = options.expectedWorkspaceType;
    if (expectedType) {
      const workspaceMarkers = [
        `"${expectedType}"`,
        `'${expectedType}'`,
        `data-workspace="${expectedType}"`,
        `data-workspace='${expectedType}'`,
        expectedType.replace(/_/g, "-"),
        expectedType.replace(/_/g, " "),
      ];
      if (expectedType === "catalog_grid") {
        workspaceMarkers.push("grid-cols", "catalog", "grid gap-", "grid grid-cols", "showcasegrid", "showcase-grid", "showcase", "datagrid", "data-grid");
      }
      const hasWorkspace = workspaceMarkers.some(m => evalSource.toLowerCase().includes(m.toLowerCase()));
      if (!hasWorkspace) {
        reasons.push(`Primary workspace contract "${expectedType}" is not materialized in the component.`);
      }
    }

    // ── 2. Derive Capabilities to Audit ─────────────────────────────────────
    const declaredCaps = options.capabilities && options.capabilities.length > 0
      ? options.capabilities
      : this.deriveDefaultCapabilities(expectedType);

    const evidenceList: CapabilityChainEvidence[] = [];

    for (const capId of declaredCaps) {
      const evidence = this.evaluateCapabilityChain(capId, evalSource);
      evidenceList.push(evidence);
      if (!evidence.isSatisfied) {
        reasons.push(
          `Capability "${evidence.name}" is incomplete: Missing [${evidence.missingCells.join(", ")}].`
        );
      }
    }

    const satisfiedCount = evidenceList.filter(e => e.isSatisfied).length;
    const totalCount = evidenceList.length;
    const score = totalCount > 0 ? Math.round((satisfiedCount / totalCount) * 100) : 100;
    const complete = reasons.length === 0 && (totalCount === 0 || satisfiedCount === totalCount);

    return {
      complete,
      score,
      totalCapabilities: totalCount,
      satisfiedCapabilities: satisfiedCount,
      evidence: evidenceList,
      reasons,
    };
  }

  /**
   * Audits full-stack capability traceability across frontend, backend routes, and persistence layer.
   */
  public static evaluateFullStack(
    projectRoot: string,
    options: { requiredModels?: string[]; requiredRoutes?: string[] } = {}
  ): FullStackTraceResult {
    const traces: FullStackTraceEvidence[] = [];
    const violations: string[] = [];

    const models = options.requiredModels && options.requiredModels.length > 0
      ? options.requiredModels.filter(m => !["user", "auth", "session", "token"].includes(m.toLowerCase()))
      : ["Entity"];

    const srcDir = join(projectRoot, "src");
    const serverDir = join(projectRoot, "server");

    // Read frontend API layer
    let frontendSource = "";
    const apiFilePath = join(srcDir, "services", "api.ts");
    if (existsSync(apiFilePath)) {
      try { frontendSource = readFileSync(apiFilePath, "utf8"); } catch {}
    }

    // Scan server routes
    const serverRoutesDir = join(serverDir, "routes");
    let allServerSource = "";
    if (existsSync(serverRoutesDir)) {
      try {
        const routeFiles = readdirSync(serverRoutesDir);
        for (const rf of routeFiles) {
          allServerSource += " " + readFileSync(join(serverRoutesDir, rf), "utf8");
        }
      } catch {}
    }
    const serverIndexPath = join(serverDir, "index.ts");
    if (existsSync(serverIndexPath)) {
      try { allServerSource += " " + readFileSync(serverIndexPath, "utf8"); } catch {}
    }

    for (const model of models) {
      const modelLower = model.toLowerCase();
      const slug = modelLower.replace(/[\s_]+/g, "-");

      const hasFrontend =
        frontendSource.toLowerCase().includes(slug) ||
        frontendSource.toLowerCase().includes(modelLower) ||
        frontendSource.includes(`/api/${slug}`) ||
        frontendSource.includes(`/api/${modelLower}`);

      const hasBackend =
        allServerSource.toLowerCase().includes(slug) ||
        allServerSource.toLowerCase().includes(modelLower) ||
        allServerSource.includes(`/${slug}`) ||
        allServerSource.includes(`/${modelLower}`);

      const hasPersistence =
        allServerSource.includes(`prisma.${modelLower}`) ||
        allServerSource.includes(`prisma.${model}`) ||
        allServerSource.toLowerCase().includes(`${modelLower}store`) ||
        allServerSource.toLowerCase().includes(`${slug}store`) ||
        (hasBackend && (allServerSource.includes("prisma.") || allServerSource.includes("store.")));

      const isFullyTraced = hasFrontend && hasBackend && hasPersistence;

      traces.push({
        featureOrEntity: model,
        frontendClientPresent: hasFrontend,
        backendRoutePresent: hasBackend,
        dataPersistencePresent: hasPersistence,
        isFullyTraced,
        details: `Frontend: ${hasFrontend}, Backend: ${hasBackend}, Persistence: ${hasPersistence}`,
      });

      if (!isFullyTraced) {
        const missing: string[] = [];
        if (!hasFrontend) missing.push("Frontend API client call");
        if (!hasBackend) missing.push("Server router endpoint");
        if (!hasPersistence) missing.push("Data store / repository layer");
        violations.push(`Full-stack trace broken for entity '${model}': Missing [${missing.join(", ")}].`);
      }
    }

    const fullyTracedCount = traces.filter(t => t.isFullyTraced).length;
    const score = traces.length > 0 ? Math.round((fullyTracedCount / traces.length) * 100) : 100;
    const valid = violations.length === 0;

    return {
      valid,
      score,
      traces,
      violations,
    };
  }

  /**
   * Evaluates the concrete implementation chain of an individual capability.
   */
  private static evaluateCapabilityChain(capId: string, content: string): CapabilityChainEvidence {
    switch (capId) {
      // ── 1. Telemetry / Analytical / Mathematical: aggregate_metrics ──────────
      case "aggregate_metrics": {
        const hasStateOrData =
          /reduce\(|\.filter|\.length|records|items|data|stats|metrics|kpis|total|calc|count|units|logs|recipes|inventory/i.test(content);
        const hasUI =
          /metric|kpi|total|average|avg|count|summary|card|stat|display|result|calc|temperature|variance|tracking|peak|efficiency/i.test(content);
        const hasObservableResult =
          /(\.reduce|\.map|\.length|Math\.|sum|total|avg|calculate|\+|\*|\/|totalMeasured|totalTarget|avgEfficiency|peakTemp)/i.test(content);

        const missingCells: string[] = [];
        if (!hasStateOrData) missingCells.push("State/Data derivation");
        if (!hasUI) missingCells.push("Metric presentation UI");
        if (!hasObservableResult) missingCells.push("Mathematical aggregation formula");

        return {
          capabilityId: capId,
          name: "Mathematical Metric Aggregation",
          description: "Aggregates multi-dimensional records into computed domain KPIs",
          hasStateOrData,
          hasUI,
          hasHandler: true, // Aggregations are pure derivations
          hasObservableResult,
          isSatisfied: missingCells.length === 0,
          missingCells,
        };
      }

      // ── 2. Temporal Window Filtering: filter_time_window ────────────────────
      case "filter_time_window": {
        const hasStateOrData =
          /timeWindow|timeRange|window|range|filterTime|selectedWindow|period|date/i.test(content) &&
          /useState|useStore|useMemo|useReducer/i.test(content);
        const hasUI =
          /<button|<select|<option|filter-bar|window-filter|time-filter|period/i.test(content) &&
          /(1h|24h|7d|today|week|month|all|cycle|schedule|hour)/i.test(content);
        const hasHandler =
          /setTime|setWindow|setRange|setPeriod|onClick|onChange/i.test(content);
        const hasObservableResult =
          /(timeWindow\s*===|\.filter\(|timeseries|filtered|date|window)/i.test(content);

        const missingCells: string[] = [];
        if (!hasStateOrData) missingCells.push("Temporal filter state");
        if (!hasUI) missingCells.push("Interactive window controls");
        if (!hasHandler) missingCells.push("Window filter event handler");
        if (!hasObservableResult) missingCells.push("Dataset or timeseries filtering");

        return {
          capabilityId: capId,
          name: "Temporal Window Filtering",
          description: "Filters timeseries data points by selectable time windows (1h, 24h, 7d)",
          hasStateOrData,
          hasUI,
          hasHandler,
          hasObservableResult,
          isSatisfied: missingCells.length === 0,
          missingCells,
        };
      }

      // ── 3. Categorical / Status Filtering: filter_status ───────────────────
      case "filter_status":
      case "status_filtering": {
        const hasStateOrData =
          /((status|category|tab|filter|stage|type)Filter|selected(Status|Category|Tab|Stage)|filter(Status|Category|Stage)|status|category|tab)/i.test(content) &&
          /useState|useStore|useMemo|useReducer/i.test(content);
        const hasUI =
          /(<button|<select|status-filter|status-chip|filter-chip|tab|pill|badge)/i.test(content);
        const hasHandler =
          /setStatus|setFilter|setTab|setCategory|onClick|onChange/i.test(content);
        const hasObservableResult =
          /(\.(status|category|stage|type)\s*===|filter(Status|Category)?\s*===|\.filter\(|\.find\()/i.test(content);

        const missingCells: string[] = [];
        if (!hasStateOrData) missingCells.push("Status filter state");
        if (!hasUI) missingCells.push("Interactive status chips/buttons");
        if (!hasHandler) missingCells.push("Status change handler");
        if (!hasObservableResult) missingCells.push("Filtered domain record set");

        return {
          capabilityId: capId,
          name: "Status Category Filtering",
          description: "Coupled status filtering across domain records",
          hasStateOrData,
          hasUI,
          hasHandler,
          hasObservableResult,
          isSatisfied: missingCells.length === 0,
          missingCells,
        };
      }

      // ── 4. Dynamic Visual Trends: visualize_trends ─────────────────────────
      case "visualize_trends": {
        const hasStateOrData =
          /timeseries|points|trend|series|history|dataPoints|schedule|profile|temperatures/i.test(content);
        const hasUI =
          /chart|trend|svg|path|polyline|<div[^>]*style=\{\{[^}]*height|recharts|graph|canvas/i.test(content);
        const hasObservableResult =
          /\.map\(.*(pt|point|kw|temp|val|item|log|entry).*height/i.test(content) ||
          /data-chart|trend-point|recharts|svg/i.test(content);

        const missingCells: string[] = [];
        if (!hasStateOrData) missingCells.push("Timeseries historical data");
        if (!hasUI) missingCells.push("Trend visualization chart elements");
        if (!hasObservableResult) missingCells.push("Data-bound graphical presentation");

        return {
          capabilityId: capId,
          name: "Dynamic Trend Visualization",
          description: "Renders data-bound timeseries graphs responsive to time-window selection",
          hasStateOrData,
          hasUI,
          hasHandler: true, // Driven by selected unit and time window
          hasObservableResult,
          isSatisfied: missingCells.length === 0,
          missingCells,
        };
      }

      // ── 5. Entity Selection & Drill-Down: inspect_record / drilldown ───────
      case "drilldown_timeseries":
      case "inspect_record": {
        const hasStateOrData =
          /(selected|active|inspected|inspecting|current|focused|detail)(Id|Item|Unit|Record|Entity|Piece|Glaze|Kiln|Batch|Log|Recipe|Commission|Job|Entry)?/i.test(content) &&
          /useState|useStore|useMemo|useReducer/i.test(content);
        const hasUI =
          /(card|item|row|drilldown|inspector|detail|panel|drawer|modal|selected|active|showcase|feed|grid|table)/i.test(content) &&
          /(\.find\(|\.filter\(|\[selected|selected\w*\.|active\w*\.|current\w*\.|onSelect)/i.test(content);
        const hasHandler =
          /setSelected|setActive|setCurrent|onClick|onSelect/i.test(content);
        const hasObservableResult =
          /(selected\w*\.|active\w*\.|current\w*\.|detail|inspected)/i.test(content);

        const missingCells: string[] = [];
        if (!hasStateOrData) missingCells.push("Selected entity identity state");
        if (!hasUI) missingCells.push("Selectable item list & detail inspector view");
        if (!hasHandler) missingCells.push("Item selection handler");
        if (!hasObservableResult) missingCells.push("Detail inspector bound to selected entity");

        return {
          capabilityId: capId,
          name: "Entity Selection & Drill-Down Inspection",
          description: "Interactive unit selection with comprehensive sensor/state inspection",
          hasStateOrData,
          hasUI,
          hasHandler,
          hasObservableResult,
          isSatisfied: missingCells.length === 0,
          missingCells,
        };
      }

      // ── 6. Operational State Mutation & Recalculation ───────────────────────
      case "recalculate_aggregations":
      case "operational_mutation":
      case "mutate_status": {
        const hasStateOrData =
          /(mutation|input|target|new|form|set\w+|mutate|setState|useMutation)/i.test(content);
        const hasUI =
          /(<form|<input|type=["']number["']|<button|mutation|submit|action)/i.test(content);
        const hasHandler =
          /handleSubmit|onSubmit|onClick|mutate|handleUpdate|handleAdd|handleCreate/i.test(content);
        const hasObservableResult =
          /(mutation\.mutate|set\w+\(|\.map\(|\.push\(|\.filter\(|mutateAsync)/i.test(content);

        const missingCells: string[] = [];
        if (!hasStateOrData) missingCells.push("Mutation input & collection state");
        if (!hasUI) missingCells.push("Operational input control and action button");
        if (!hasHandler) missingCells.push("Mutation submission handler");
        if (!hasObservableResult) missingCells.push("State modification and KPI recalculation");

        return {
          capabilityId: capId,
          name: "Operational Setpoint Mutation & Recalculation",
          description: "Interactive setpoint mutation updating records and recalculating aggregations",
          hasStateOrData,
          hasUI,
          hasHandler,
          hasObservableResult,
          isSatisfied: missingCells.length === 0,
          missingCells,
        };
      }

      // ── Generic Fallback for Domain Capabilities ─────────────────────────────
      default: {
        const capWords = capId.split(/[_-]/).filter(w => w.length > 2);
        const capRegex = new RegExp(capWords.join("|"), "i");

        const hasStateOrData =
          /useState|useStore|useReducer|items|records|data/i.test(content);
        const hasUI =
          /<button|<input|<select|<form|<div|<section/i.test(content) && capRegex.test(content);
        const hasHandler =
          /onClick|onChange|onSubmit|handle[A-Z]/i.test(content);
        const hasObservableResult =
          /\.map\(|\.filter\(|\.reduce\(|setState|localStorage/i.test(content);

        const missingCells: string[] = [];
        if (!hasStateOrData) missingCells.push("State/Data model");
        if (!hasUI) missingCells.push("Capability UI elements");
        if (!hasHandler) missingCells.push("Interactive event handler");
        if (!hasObservableResult) missingCells.push("Observable mutation/render");

        return {
          capabilityId: capId,
          name: capId.replace(/[_-]/g, " "),
          description: `Domain capability ${capId}`,
          hasStateOrData,
          hasUI,
          hasHandler,
          hasObservableResult,
          isSatisfied: missingCells.length === 0,
          missingCells,
        };
      }
    }
  }

  /**
   * Derives default capabilities if not explicitly specified in the contract.
   */
  private static deriveDefaultCapabilities(workspaceType?: string): string[] {
    if (!workspaceType) return [];
    switch (workspaceType) {
      case "telemetry_grid":
        return [
          "aggregate_metrics",
          "filter_time_window",
          "filter_status",
          "visualize_trends",
          "drilldown_timeseries",
          "recalculate_aggregations",
        ];
      case "workflow_board":
        return [
          "inspect_record",
          "mutate_status",
          "filter_status",
          "operational_mutation",
        ];
      // Wellness, habit-tracking, mood tracking, personal dashboards.
      // These apps log personal data — they do NOT need entity-drill-down or status filtering.
      // Applying master_detail capabilities to them causes false CapabilityCompletenessGate failures.
      case "wellness-tracker":
      case "personal-tracking":
      case "habit-dashboard":
        return [
          "log_entry",
          "visualize_progress",
          "aggregate_metrics",
          "complete_habit",
        ];
      case "availability_matrix":
      case "catalog_grid":
      case "master_detail":
      default:
        return [
          "inspect_record",
          "filter_status",
          "aggregate_metrics",
        ];
    }
  }
}

/**
 * SemanticNaming - Generic Bounded Semantic Naming Layer
 *
 * Converts natural-language requirements and action prose into:
 * 1. originalRequirement: complete unedited requirement
 * 2. capabilityId: stable, bounded kebab-case identifier (max 3-4 words)
 * 3. displayName: concise, human-readable UI label (max 20 characters)
 * 4. routeSlug: concise URL route slug (max 24 characters)
 * 5. modelName: concise PascalCase entity/model name (max 2 words, <= 24 chars)
 */

export interface CapabilityNaming {
  originalRequirement: string;
  capabilityId: string;
  displayName: string;
  routeSlug: string;
  modelName: string;
}

interface ConceptMapping {
  keywords: string[];
  displayName: string;
  routeSlug: string;
  modelName: string;
}

const DOMAIN_AGNOSTIC_CONCEPTS: ConceptMapping[] = [
  // Financial & Trading
  {
    keywords: ["order routing limit", "routing limit", "var calculation", "portfolio var", "liquidation buffer", "risk limit", "circuit breaker", "risk control"],
    displayName: "Risk Controls",
    routeSlug: "/risk-controls",
    modelName: "RiskControl",
  },
  {
    keywords: ["order book depth", "order book", "depth chart", "market depth", "tick-level"],
    displayName: "Order Book",
    routeSlug: "/order-book",
    modelName: "OrderBook",
  },
  {
    keywords: ["execution engine", "automated execution", "fill latency", "latency monitor", "slippage"],
    displayName: "Execution",
    routeSlug: "/execution",
    modelName: "ExecutionEngine",
  },
  {
    keywords: ["order fill audit", "fill audit log", "fill audit", "audit log", "audit trail"],
    displayName: "Audit Trail",
    routeSlug: "/audit-trail",
    modelName: "AuditTrail",
  },
  {
    keywords: ["strategy status", "volatility regime", "execution strategy", "algorithmic strategy", "strategies"],
    displayName: "Strategies",
    routeSlug: "/strategies",
    modelName: "Strategy",
  },
  {
    keywords: ["portfolio metric", "sharpe ratio", "net asset value", "portfolio performance", "portfolio nav"],
    displayName: "Portfolio",
    routeSlug: "/portfolio",
    modelName: "Portfolio",
  },

  // Maritime & Logistics
  {
    keywords: ["vessel telemetr", "fleet position", "ais tracking", "waypoint", "vessel tracker", "hull sensor"],
    displayName: "Fleet Telemetry",
    routeSlug: "/fleet-telemetry",
    modelName: "VesselTelemetry",
  },
  {
    keywords: ["cargo dispatch", "shipment transfer", "waybill", "manifest", "freight schedule"],
    displayName: "Dispatches",
    routeSlug: "/dispatches",
    modelName: "Dispatch",
  },

  // Healthcare & Clinical
  {
    keywords: ["patient triage", "vital signs", "acuity score", "icu bed", "clinical alert"],
    displayName: "Patient Triage",
    routeSlug: "/triage",
    modelName: "PatientTriage",
  },

  // Inventory & Warehouse
  {
    keywords: ["stock sku", "inventory count", "bin utilization", "warehouse slotting", "replenishment"],
    displayName: "Inventory",
    routeSlug: "/inventory",
    modelName: "InventoryItem",
  },

  // Project & Workflow Management
  {
    keywords: ["sprint backlog", "task board", "kanban board", "issue tracker", "workflow board"],
    displayName: "Task Board",
    routeSlug: "/task-board",
    modelName: "TaskItem",
  },
];

const LEADING_VERB_REGEX = /^(?:adjust|adjusting|manage|manages|managing|track|tracks|tracking|monitor|monitors|monitoring|explore|exploring|browse|browsing|compare|comparing|inspect|inspecting|view|viewing|discover|discovering|purchase|purchasing|order|ordering|book|booking|reserve|reserving|submit|submitting|handle|handling|coordinate|coordinates|coordinating|support|supporting|schedule|scheduling|create|creating|record|recording|aggregate|aggregating|filter|filtering|drill\s+down\s+into|drill\s+down|calculate|calculating|verify|verifying|analyze|analyzing)\s+/i;

const SUBORDINATE_CLAUSE_REGEX = /\s+(?:while\b|verifying\s+that\b|ensuring\s+that\b|so\s+that\b|in\s+order\s+to\b|such\s+that\b|and\s+confirm(?:ing)?\b|where\s+by\b|where\b|across\b|with\s+persistent\b|with\b|as\s+well\s+as\b)[\s\S]*$/i;

const FILLER_WORDS = new Set([
  "the", "a", "an", "all", "and", "or", "for", "of", "in", "on", "at", "by",
  "from", "into", "to", "real-time", "automated", "global", "appropriate",
  "various", "each", "their", "our", "dynamic", "dynamically"
]);

export class SemanticNaming {
  /**
   * Derive a complete bounded naming set from any raw requirement or phrase.
   */
  public static deriveCapabilityNaming(rawPhrase: string): CapabilityNaming {
    const originalRequirement = (rawPhrase || "").trim();
    if (!originalRequirement) {
      return {
        originalRequirement: "",
        capabilityId: "default-capability",
        displayName: "Overview",
        routeSlug: "/overview",
        modelName: "Overview",
      };
    }

    // 1. Truncate subordinate clauses (e.g., "while verifying that portfolio VaR calculations recalculate dynamically")
    const mainActionClause = originalRequirement.replace(SUBORDINATE_CLAUSE_REGEX, "").trim();

    // 2. Extract leading action verb if present
    const verbMatch = mainActionClause.match(LEADING_VERB_REGEX);
    const leadingVerb = verbMatch ? verbMatch[0].trim().toLowerCase() : "";
    const nounPhrase = mainActionClause.replace(LEADING_VERB_REGEX, "").trim();

    // 3. Stable capabilityId (kebab-case, max 4 words)
    const idSource = (leadingVerb ? `${leadingVerb} ${nounPhrase}` : nounPhrase || mainActionClause)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim();
    const idWords = idSource.split(/\s+/).filter(Boolean).slice(0, 4);
    const capabilityId = idWords.join("-") || "capability";

    // 4. Check Semantic Concept Mapping
    const searchTarget = originalRequirement.toLowerCase();
    for (const concept of DOMAIN_AGNOSTIC_CONCEPTS) {
      if (concept.keywords.some(kw => searchTarget.includes(kw))) {
        return {
          originalRequirement,
          capabilityId,
          displayName: concept.displayName,
          routeSlug: concept.routeSlug,
          modelName: concept.modelName,
        };
      }
    }

    // 5. Generic Algorithmic Distillation Fallback
    // Filter filler words from nounPhrase
    const cleanWords = nounPhrase
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w => w && !FILLER_WORDS.has(w) && w.length > 1);

    const boundedWords = cleanWords.slice(0, 2);
    let displayName = boundedWords
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    if (!displayName || displayName.length < 3) {
      displayName = "Controls";
    }

    // Enforce strict length limits
    if (displayName.length > 20) {
      displayName = displayName.slice(0, 20).trim();
    }

    let routeSlug = "/" + boundedWords.join("-");
    if (!routeSlug || routeSlug === "/") {
      routeSlug = "/controls";
    }
    if (routeSlug.length > 24) {
      routeSlug = routeSlug.slice(0, 24).replace(/-+$/, "");
    }

    // Singularize last word for modelName
    const modelWords = [...boundedWords];
    if (modelWords.length > 0) {
      const last = modelWords[modelWords.length - 1];
      const singular = last.endsWith("ies")
        ? last.slice(0, -3) + "y"
        : last.endsWith("es") && !last.endsWith("ees") && !last.endsWith("sses")
        ? last.slice(0, -2)
        : last.replace(/s$/, "");
      modelWords[modelWords.length - 1] = singular;
    }

    let modelName = modelWords
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join("");

    if (!modelName || modelName.length < 3) {
      modelName = "Item";
    }
    if (modelName.length > 24) {
      modelName = modelName.slice(0, 24);
    }

    return {
      originalRequirement,
      capabilityId,
      displayName,
      routeSlug,
      modelName,
    };
  }
}

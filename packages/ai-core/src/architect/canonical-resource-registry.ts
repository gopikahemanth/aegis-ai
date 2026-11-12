/**
 * CanonicalResourceRegistry
 *
 * Phase 3.2: Canonical Resource Architecture & Verified Prisma Delegate Mapping
 *
 * Provides single, authoritative source of truth for:
 * 1. Model identifier (PascalCase, e.g. CeramicPiece, VibrationTelemetry, FAAComplianceRecord)
 * 2. Prisma Client delegate (strictly model.charAt(0).toLowerCase() + model.slice(1), matching Prisma Client generator)
 * 3. Database table name (snake_case, e.g. ceramic_pieces, vibration_telemetry)
 * 4. Singular resource name (kebab-case, e.g. ceramic-piece, vibration-telemetry)
 * 5. Plural resource name (e.g. Ceramic Pieces, Component Inventories, Vibration Telemetry)
 * 6. Canonical URL slug (e.g. "ceramic-pieces", "vibration-telemetry")
 * 7. List path (e.g. "/api/ceramic-pieces")
 * 8. Detail path (e.g. "/api/ceramic-pieces/:id")
 * 9. Supported operations (Discriminated union of Standard CRUD + Domain Business Workflows)
 */

export type StandardCrudOperation = "LIST" | "GET" | "CREATE" | "UPDATE" | "DELETE";

export interface DomainBusinessWorkflow {
  action: string;                     // e.g. "dispatch", "checkout", "enroll", "verify"
  method: "POST" | "PUT" | "PATCH";
  pathSuffix: string;                 // e.g. "/workflow", "/checkout", "/dispatch"
  description: string;
  allowedPriorStates?: string[];      // e.g. ["PENDING", "OPEN"]
  targetState?: string;               // e.g. "DISPATCHED", "CONFIRMED"
  requiredRoles?: string[];
  auditLogged: boolean;
  transactional: boolean;
}

export type ResourceOperation =
  | { kind: "STANDARD_CRUD"; operation: StandardCrudOperation }
  | { kind: "DOMAIN_WORKFLOW"; workflow: DomainBusinessWorkflow };

export interface CanonicalResourceMapping {
  modelName: string;
  tableName: string;
  prismaDelegate: string;
  singularResourceName: string;
  pluralResourceName: string;
  canonicalUrlSlug: string;
  pluralResourceSlug: string; // Compatibility alias for canonicalUrlSlug
  listPath: string;
  pluralResourcePath: string; // Compatibility alias for listPath
  detailRoute: string;
  supportedOperations: ResourceOperation[];
}

export interface CanonicalResourceOptions {
  tableName?: string;
  singularResourceName?: string;
  pluralResourceName?: string;
  canonicalUrlSlug?: string;
  listPath?: string;
  detailPath?: string;
  customWorkflows?: DomainBusinessWorkflow[];
}

export class CanonicalResourceRegistry {
  private static readonly customRegistry = new Map<string, CanonicalResourceOptions>();

  public static register(modelName: string, options: CanonicalResourceOptions): void {
    this.customRegistry.set(modelName.toLowerCase(), options);
  }

  public static clearRegistry(): void {
    this.customRegistry.clear();
  }

  private static readonly UNCOUNTABLE_MASS_NOUNS = new Set([
    "telemetry",
    "software",
    "hardware",
    "equipment",
    "information",
    "feedback",
    "data",
    "metadata",
    "maintenance",
    "compliance",
    "research",
    "analytics",
    "logistics",
  ]);

  private static readonly IRREGULAR_PLURALS: Record<string, string> = {
    analysis: "analyses",
    datum: "data",
    criterion: "criteria",
    person: "people",
    child: "children",
    man: "men",
    woman: "women",
    medium: "media",
    index: "indices",
  };

  /**
   * Splits a PascalCase or camelCase identifier into individual lowercase words.
   * Handles acronyms like FAACompliance -> ["faa", "compliance"]
   */
  public static splitWords(identifier: string): string[] {
    if (!identifier) return [];
    const words: string[] = [];
    const regex = /([A-Z]+(?=[A-Z][a-z]|$)|[A-Z][a-z]+|[0-9]+|[a-z]+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(identifier)) !== null) {
      words.push(match[1].toLowerCase());
    }
    return words.length > 0 ? words : [identifier.toLowerCase()];
  }

  /**
   * Proposes an initial plural form for an English noun.
   * Note: The canonical contract owns the final URL slug; this helper provides initial suggestions.
   */
  public static pluralizeWord(word: string): string {
    const lower = word.toLowerCase();

    if (this.UNCOUNTABLE_MASS_NOUNS.has(lower)) {
      return lower;
    }
    if (this.IRREGULAR_PLURALS[lower]) {
      return this.IRREGULAR_PLURALS[lower];
    }
    if (/[^aeiou]y$/i.test(lower)) {
      return lower.slice(0, -1) + "ies";
    }
    if (/(s|x|z|ch|sh)$/i.test(lower)) {
      return lower + "es";
    }
    if (/(?:[aeo]lf|[^f]fe)$/i.test(lower)) {
      return lower.replace(/(?:f|fe)$/, "ves");
    }
    return lower + "s";
  }

  /**
   * Computes the exact Prisma Client delegate property name.
   * Prisma ORM generator strictly lowercases the first character of the model name:
   * CeramicPiece -> ceramicPiece
   * WorkOrder -> workOrder
   * VibrationTelemetry -> vibrationTelemetry
   * ComponentInventory -> componentInventory
   * FaaComplianceRecord -> faaComplianceRecord
   * FAAComplianceRecord -> fAAComplianceRecord
   * GPSLocation -> gPSLocation
   * GlazeSpecification -> glazeSpecification
   * HydroponicSensorReading -> hydroponicSensorReading
   */
  public static getPrismaDelegateName(modelName: string): string {
    if (!modelName) return "";
    return modelName.charAt(0).toLowerCase() + modelName.slice(1);
  }

  /**
   * Computes table name in snake_case.
   */
  public static getTableName(modelName: string, explicitTable?: string): string {
    if (explicitTable) return explicitTable;
    const words = this.splitWords(modelName);
    if (words.length === 0) return modelName.toLowerCase();
    const lastWord = words[words.length - 1];
    const pluralLast = this.pluralizeWord(lastWord);
    const tableWords = [...words.slice(0, -1), pluralLast];
    return tableWords.join("_");
  }

  /**
   * Computes singular resource name in kebab-case.
   */
  public static getSingularResourceName(modelName: string, explicitSingular?: string): string {
    if (explicitSingular) return explicitSingular;
    return this.splitWords(modelName).join("-");
  }

  /**
   * Computes plural resource name human label.
   */
  public static getPluralResourceName(modelName: string, explicitPlural?: string): string {
    if (explicitPlural) return explicitPlural;
    const words = this.splitWords(modelName);
    if (words.length === 0) return modelName;
    const lastWord = words[words.length - 1];
    const pluralLast = this.pluralizeWord(lastWord);
    const capitalWords = [...words.slice(0, -1), pluralLast].map(w => w.charAt(0).toUpperCase() + w.slice(1));
    return capitalWords.join(" ");
  }

  /**
   * Computes canonical URL slug.
   * If explicitSlug is provided, it takes precedence. Otherwise inflects from model name.
   */
  public static getCanonicalUrlSlug(modelName: string, explicitSlug?: string): string {
    if (explicitSlug) return explicitSlug;
    const words = this.splitWords(modelName);
    if (words.length === 0) return modelName.toLowerCase();
    const lastWord = words[words.length - 1];
    const pluralLast = this.pluralizeWord(lastWord);
    return [...words.slice(0, -1), pluralLast].join("-");
  }

  public static getPluralResourceSlug(modelName: string): string {
    return this.getCanonicalUrlSlug(modelName);
  }

  public static getPluralResourcePath(modelName: string): string {
    return `/api/${this.getCanonicalUrlSlug(modelName)}`;
  }

  /**
   * Resolves the full canonical resource mapping for a model.
   * The returned mapping explicitly owns all naming and route attributes.
   */
  public static resolve(modelName: string, options?: CanonicalResourceOptions): CanonicalResourceMapping {
    const effectiveOptions = options || this.customRegistry.get(modelName.toLowerCase());
    const slug = this.getCanonicalUrlSlug(modelName, effectiveOptions?.canonicalUrlSlug);
    const listPath = effectiveOptions?.listPath || `/api/${slug}`;
    const detailPath = effectiveOptions?.detailPath || `${listPath}/:id`;

    const standardOps: ResourceOperation[] = [
      { kind: "STANDARD_CRUD", operation: "LIST" },
      { kind: "STANDARD_CRUD", operation: "GET" },
      { kind: "STANDARD_CRUD", operation: "CREATE" },
      { kind: "STANDARD_CRUD", operation: "UPDATE" },
      { kind: "STANDARD_CRUD", operation: "DELETE" },
    ];

    const defaultWorkflow: DomainBusinessWorkflow = {
      action: "transitionState",
      method: "POST",
      pathSuffix: "/workflow",
      description: `Stateful workflow action and lifecycle transition for ${modelName}`,
      allowedPriorStates: ["DRAFT", "PENDING", "OPEN", "ACTIVE"],
      targetState: "PROCESSED",
      auditLogged: true,
      transactional: true,
    };

    const customList = effectiveOptions?.customWorkflows ||
      ((effectiveOptions as any)?.supportedOperations?.filter((op: any) => op.kind === "DOMAIN_WORKFLOW").map((op: any) => op.workflow));

    const workflowOps: ResourceOperation[] = (customList && customList.length > 0)
      ? customList.map((w: DomainBusinessWorkflow) => ({ kind: "DOMAIN_WORKFLOW", workflow: w }))
      : [{ kind: "DOMAIN_WORKFLOW", workflow: defaultWorkflow }];

    return {
      modelName,
      tableName: this.getTableName(modelName, effectiveOptions?.tableName),
      prismaDelegate: this.getPrismaDelegateName(modelName),
      singularResourceName: this.getSingularResourceName(modelName, effectiveOptions?.singularResourceName),
      pluralResourceName: this.getPluralResourceName(modelName, effectiveOptions?.pluralResourceName),
      canonicalUrlSlug: slug,
      pluralResourceSlug: slug,
      listPath,
      pluralResourcePath: listPath,
      detailRoute: detailPath,
      supportedOperations: [...standardOps, ...workflowOps],
    };
  }

  public static resolveAll(modelNames: string[]): CanonicalResourceMapping[] {
    return modelNames.map(m => this.resolve(m));
  }
}

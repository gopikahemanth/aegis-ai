/** Domain-specific vocabulary extracted from user request — used to ensure
 *  all UI labels, KPI titles, and metric names reflect the actual domain.
 */
export interface DomainVocabulary {
  /** Singular noun for the main entity (e.g. "Transaction", "Task", "Workout") */
  entityName: string;
  /** Plural form (e.g. "Transactions", "Tasks", "Workouts") */
  entityPlural: string;
  /** Real KPI metric titles derived from the domain (e.g. ["Total Expenses", "Monthly Budget", "Remaining Balance"]) */
  primaryMetrics: string[];
  /** Domain-specific action verbs (e.g. ["Add Expense", "Edit", "Delete", "Export", "Filter"]) */
  actionVerbs: string[];
  /** Domain prefix for CSS class names / route naming (e.g. "expense", "task", "workout") */
  domainPrefix: string;
}

export interface ProjectSpecification {
  name: string;

  type:
    | "website"
    | "saas"
    | "app"
    | "api"
    | "cli"
    | "extension"
    | "frontend"
    | "backend"
    | "fullstack"
    | "other";

  frontend?: string;
  backend?: string;
  database?: string;
  language: string;
  styling?: string;
  packageManager: "pnpm" | "npm" | "yarn";

  // ── Project Definition Document fields ──────────────────────────────────
  /** Inferred feature names — each becomes a folder under src/features/ */
  features?: string[];

  /** npm packages the project will need (inferred by PromptInferenceEngine) */
  inferredLibraries?: string[];

  /** Top-level user journeys (e.g. "upload-and-scan", "view-history") */
  userFlows?: string[];

  /** Core data entity names (e.g. ["ScanResult", "User", "Job"]) */
  dataModels?: string[];

  /** Short description of each feature for the coder agent */
  featureDescriptions?: Record<string, string>;

  /** Authentication strategy (e.g. "JWT", "OAuth2", "none") */
  auth?: string;

  /** Deployment target (e.g. "vercel", "docker", "railway", "none") */
  deployment?: string;

  /** Domain vocabulary extracted from user request — must be threaded through all agent prompts */
  domainVocabulary?: DomainVocabulary;
}

export interface DbTable {
  name: string;
  columns: { name: string; type: string; constraints?: string }[];
  relations?: { from: string; to: string; type: string }[];
}

export interface ApiRoute {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  requestBody?: string;
  responseBody?: string;
  description?: string;
}

export interface ArchitecturePlan {
  directoryTree: string[];
  databaseSchema?: DbTable[];
  apiContracts?: ApiRoute[];
  routing: string[];
}

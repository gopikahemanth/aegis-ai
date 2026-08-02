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

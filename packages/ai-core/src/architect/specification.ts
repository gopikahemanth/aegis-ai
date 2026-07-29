export interface ProjectSpecification {
  name: string;

  type:
    | "website"
    | "frontend"
    | "backend"
    | "fullstack";

  frontend?: string;

  backend?: string;

  database?: string;

  language: string;

  styling?: string;

  packageManager:
    | "pnpm"
    | "npm"
    | "yarn";
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

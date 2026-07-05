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

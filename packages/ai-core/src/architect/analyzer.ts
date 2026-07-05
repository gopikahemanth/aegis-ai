import type { ProjectSpecification } from "./specification.js";

export class RequirementAnalyzer {
  analyze(request: string): ProjectSpecification {
    const lower = request.toLowerCase();

    return {
      name: "Generated Project",

      type:
        lower.includes("backend")
          ? "backend"
          : lower.includes("fullstack")
          ? "fullstack"
          : "website",

      frontend: lower.includes("react")
        ? "React"
        : undefined,

      backend: lower.includes("express")
        ? "Express"
        : undefined,

      database: lower.includes("postgres")
        ? "PostgreSQL"
        : undefined,

      language: "TypeScript",

      styling: "Tailwind CSS",

      packageManager: "pnpm",
    };
  }
}

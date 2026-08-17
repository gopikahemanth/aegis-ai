import type { ProjectSpecification } from "./specification.js";

export class ArchitectPromptBuilder {
  build(spec: ProjectSpecification): string {
    return `
Generate a production-ready project.

Application Type:
${spec.type}

Frontend:
${spec.frontend ?? "None"}

Backend:
${spec.backend ?? "None"}

Database:
${spec.database ?? "None"}

Language:
${spec.language}

Styling:
${spec.styling ?? "None"}

Package Manager:
${spec.packageManager}

Return ONLY files.
`;
  }
}

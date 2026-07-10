import type { ProjectSpecification } from "../architect/specification.js";
export class PromptSections {
  executionPlan(plan: { title: string }[]) {
    return `Execution Plan

${plan.map(step => `- ${step.title}`).join("\n")}`;
  }

  architecture(text: string) {
    return `Architecture

${text}`;
  }
projectContext(files: string[]) {
  return `Existing Project Files

${files.map(file => `- ${file}`).join("\n")}

These files already exist.

Do not recreate them.

Modify existing files whenever possible.
`;
}
frameworkRules(
  spec: ProjectSpecification,
) {
  return `Framework Rules

Frontend:
${spec.frontend ?? "None"}

Backend:
${spec.backend ?? "None"}

Language:
${spec.language}

Styling:
${spec.styling}

Database:
${spec.database ?? "None"}

This project already exists.

Respect the selected frameworks.

Do not replace project configuration.

Modify existing application code whenever possible.

Never regenerate package.json, tsconfig, vite.config or lock files.
`;
}

  userRequest(request: string) {
    return `User Request

${request}`;
  }

  outputRules() {
    return `
Rules

Return ONLY files.

Every file must begin with:

===FILE: relative/path===

Never use markdown.

Never explain anything.

Never output configuration files.

Only output application source code.
`;
  }
}

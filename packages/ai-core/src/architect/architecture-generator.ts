import type { AIProvider } from "../providers/base.js";
import type { ProjectSpecification } from "./specification.js";

export class ArchitectureGenerator {
  constructor(
    private readonly provider: AIProvider,
  ) {}

  async generate(
    specification: ProjectSpecification,
  ): Promise<string> {

    return this.provider.chat([
      {
        role: "system",
        content: `
You are an expert software architect.

Given a project specification, create a high-level architecture plan.

Return ONLY plain text.

Include:

Pages
Components
Hooks
Services
Routes

Do not generate code.
Do not explain anything.
`,
      },
      {
        role: "user",
        content: JSON.stringify(
          specification,
          null,
          2,
        ),
      },
    ]);
  }
}

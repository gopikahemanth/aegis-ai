import type { AIProvider } from "../providers/base.js";

export class Fixer {
  constructor(private readonly provider: AIProvider) {}

  async fix(
    request: string,
    buildError: string,
  ) {
    return this.provider.chat([
      {
        role: "system",
        content: `
You are Aegis AI.

The generated project failed to build.

Fix the project.

Rules:

- Return ONLY files.
- No markdown.
- No explanations.
- Use:

===FILE: path===

for every updated file.
`,
      },
      {
        role: "user",
        content: `
Original Request:

${request}

Build Error:

${buildError}
`,
      },
    ]);
  }
}

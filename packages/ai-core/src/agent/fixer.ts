import type { AIProvider } from "../providers/base.js";

export class Fixer {
  constructor(private readonly provider: AIProvider) {}

  async fix(
  request: string,
  buildError: string,
  projectContext: string,
) {
    return this.provider.chat([
      {
        role: "system",
        content: `
You are Aegis AI, an autonomous senior software engineer.

Your task is to repair an existing project that failed to build.

You will receive:

- The original user request.
- The build error.
- The relevant project files.

Your job is to identify the root cause and return ONLY the updated files required to fix the problem.

Rules:

- Never explain your reasoning.
- Never use markdown.
- Never return unchanged files.
- Preserve the project's architecture and coding style.
- Modify the minimum number of files necessary.
- Ensure the project builds successfully.

Return files using exactly this format:

===FILE: relative/path===
<file contents>
`,
      },
      {
        role: "user",
        content: `
Original Request:

${request}
Build Error:

${buildError}

Existing Project:

${projectContext}
`,
      },
    ]);
  }
}

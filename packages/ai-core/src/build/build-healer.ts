import type { AIProvider } from "../providers/base.js";

export class BuildHealer {
  constructor(
    private readonly provider: AIProvider,
  ) {}

  async heal(
    request: string,
    buildError: string,
    projectSummary: string,
  ): Promise<string> {

    return this.provider.chat([
      {
        role: "system",
        content: `
You are an expert software engineer.

A project failed to build.

Analyze the compiler errors and explain
how the generated code should be fixed.

Return only the repair instructions.
`,
      },
      {
        role: "user",
        content: `
Request:
${request}

Compiler Errors:
${buildError}

Project Summary:
${projectSummary}
`,
      },
    ]);
  }
}

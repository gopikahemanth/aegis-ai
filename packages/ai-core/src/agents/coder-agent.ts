import { BaseAgent } from "./base-agent.js";

import { PromptBuilderEngine } from "../prompts/index.js";
import { Generator } from "../generator/generator.js";
import { Parser } from "../generator/parser.js";
import { ExecutionContext } from "../context/index.js";
import type { ProjectSpecification } from "../architect/specification.js";
import type { PlanStep } from "../agent/planner.js";
import type { Task } from "../planner/task.js";

export class CoderAgent extends BaseAgent {
  readonly name = "Coder Agent";

  private readonly promptEngine =
    new PromptBuilderEngine();

  private readonly generator =
    new Generator(
      this.provider,
    );

  private readonly parser =
    new Parser();
    private readonly context =
  new ExecutionContext();
 async execute(
  task: Task,
  architecture: ProjectSpecification,
  architecturePlan: string,
  request: string,
  outputDirectory: string,
  existingFiles: string[] = [],
){
  const existingContext =
  existingFiles.length === 0
    ? "No existing files."
    : existingFiles.join("\n");
    const prompt =
    this.promptEngine.build(
  [task],
        architecture,
        architecturePlan,
        `${request}

Existing project files:

${existingContext}
`,
        outputDirectory,
      );
const response =
  await this.generator.generate(
    prompt,
  );

const files =
  this.parser.parse(
    response,
  );
this.context.projectMemory.add(
  files,
);
const projectSummary =
  this.context.projectMemory.summarize();

return {
  response,
  files,
  projectSummary,
};
  }
}

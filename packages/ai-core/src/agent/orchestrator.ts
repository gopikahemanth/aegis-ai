import { Planner } from "./planner.js";
import { Memory } from "./memory.js";
import { Generator } from "../generator/generator.js";
import { Parser } from "../generator/parser.js";
import { FileWriter } from "../writer/writer.js";

import type { AIProvider } from "../providers/base.js";

export class Orchestrator {
  private readonly planner = new Planner();
  private readonly memory = new Memory();
  private readonly generator: Generator;
  private readonly parser = new Parser();
  private readonly writer = new FileWriter();

  constructor(private readonly provider: AIProvider) {
    this.generator = new Generator(provider);
  }

  async generateProject(
    request: string,
    outputDirectory: string,
  ) {
    this.memory.add(request);

    const plan = this.planner.createPlan(request);

    const prompt = `
Follow this execution plan:

${plan.map(step => `- ${step.title}`).join("\n")}

User Request:

${request}
`;

    const response = await this.generator.generate(prompt);

    const files = this.parser.parse(response);

    this.writer.write(files, outputDirectory);

    return {
      plan,
      filesCreated: files.length,
      outputDirectory,
    };
  }
}

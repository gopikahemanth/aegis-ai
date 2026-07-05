import { Planner } from "./planner.js";
import { Memory } from "./memory.js";
import { FrameworkSelector } from "../architect/index.js";
import { PromptBuilderEngine } from "../prompts/index.js";

import { Generator } from "../generator/generator.js";
import { Parser } from "../generator/parser.js";
import { FileWriter } from "../writer/writer.js";

import {
  RequirementAnalyzer,
  ArchitecturePlanner,
  PromptBuilder,
} from "../architect/index.js";

import type { AIProvider } from "../providers/base.js";

export class Orchestrator {
  private readonly planner = new Planner();

  private readonly memory = new Memory();

  private readonly analyzer = new RequirementAnalyzer();

  private readonly architect = new ArchitecturePlanner();

  private readonly promptBuilder = new PromptBuilder();

  private readonly generator: Generator;

  private readonly parser = new Parser();

  private readonly writer = new FileWriter();

  private readonly selector =new FrameworkSelector();

  private readonly promptEngine = new PromptBuilderEngine();

  constructor(
    private readonly provider: AIProvider,
  ) {
    this.generator = new Generator(provider);
  }

  async generateProject(
    request: string,
    outputDirectory: string,
  ) {
    this.memory.add(request);

    const plan = this.planner.createPlan(request);

    const specification =
      this.analyzer.analyze(request);

    const architecture =
      this.architect.plan(specification);

    const framework =
      this.selector.select(architecture);

   console.log("Framework:", framework);

    const architecturePrompt =
      this.promptBuilder.build(architecture);

  const prompt =
  this.promptEngine.build(
    plan,
    architecture,
    request,
  );

    const response =
      await this.generator.generate(prompt);

    const files =
      this.parser.parse(response);

    this.writer.write(
      files,
      outputDirectory,
    );

    return {
      plan,
      specification,
      filesCreated: files.length,
      outputDirectory,
    };
  }
}

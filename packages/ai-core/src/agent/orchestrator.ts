import { Planner } from "./planner.js";
import { Memory } from "./memory.js";
import { FrameworkSelector } from "../architect/index.js";
import { PromptBuilderEngine } from "../prompts/index.js";
import { FrameworkValidator } from "../validator/framework-validator.js";
import { Reviewer } from "../reviewer/reviewer.js";

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

    private readonly reviewer = new Reviewer();

  private readonly validator = new FrameworkValidator();

  private readonly writer = new FileWriter();

  private readonly selector =new FrameworkSelector();

  private readonly promptEngine = new PromptBuilderEngine();

  constructor(
    private readonly provider: AIProvider,
  ) {
    this.generator = new Generator(provider);
  }

  private async generate(
  prompt: string,
) {
  return this.generator.generate(
    prompt,
  );
}
private parse(
  response: string,
) {
  return this.parser.parse(
    response,
  );
}
private review(
  files: ReturnType<Parser["parse"]>,
) {
  const report =
    this.reviewer.review(files);

  if (!report.passed) {
    console.log(
      "Review issues:",
    );

    console.table(
      report.issues,
    );
  }

  return report;
}
private validate(
  framework: string,
  files: ReturnType<Parser["parse"]>,
) {
  return this.validator.validate(
    framework,
    files,
  );
}
private write(
  files: ReturnType<FrameworkValidator["validate"]>,
  outputDirectory: string,
) {
  this.writer.write(
    files,
    outputDirectory,
  );
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

  return {
    framework,
    plan,
    specification,
    outputDirectory,
  };
}
async generateCode(
  request: string,
  outputDirectory: string,
) {
  const plan =
    this.planner.createPlan(request);

  const specification =
    this.analyzer.analyze(request);

  const architecture =
    this.architect.plan(specification);

  const framework =
    this.selector.select(architecture);

  console.log(
    "Framework:",
    framework,
  );

  const prompt =
    this.promptEngine.build(
      plan,
      architecture,
      request,
      outputDirectory,
    );

  const response =
    await this.generate(
      prompt,
    );

  return {
    framework,
    response,
  };
}
async generateApplication(
  request: string,
  outputDirectory: string,
) {
  const plan = this.planner.createPlan(request);

  const specification =
    this.analyzer.analyze(request);

  const architecture =
    this.architect.plan(specification);
  const framework =
  this.selector.select(architecture);

console.log("Framework:", framework);

 const prompt =
  this.promptEngine.build(
    plan,
    architecture,
    request,
    outputDirectory,
  );

 const response =
  await this.generate(
    prompt,
  );

const parsedFiles =
  this.parse(
    response,
  );

this.review(
  parsedFiles,
);

const files =
  this.validate(
    framework,
    parsedFiles,
  );
this.write(
  files,
  outputDirectory,
);
  return {
    filesCreated: files.length,
  };
}
}

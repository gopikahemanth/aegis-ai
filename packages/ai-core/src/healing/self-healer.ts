import type { BuildError } from "./build-error.js";
import type { HealingReport } from "./report.js";

import { Fixer } from "../agent/fixer.js";
import { PatchEngine } from "./patch-engine.js";
import type { AIProvider } from "../providers/base.js";
import { ContextEngine } from "../context/context-engine.js";
export class SelfHealer {
  private readonly fixer: Fixer;

  private readonly patchEngine = new PatchEngine();
  private readonly context =new ContextEngine();
  constructor(provider: AIProvider) {
    this.fixer = new Fixer(provider);
  }

  async heal(
    request: string,
    error: BuildError,
    projectPath: string,
  ): Promise<HealingReport> {
    console.log("Analyzing build error...");

    console.log(error.summary);

console.log("Before ContextEngine");

const projectContext =
  this.context.build(
    request,
    projectPath,
  );

console.log("After ContextEngine");

console.log("Calling Fixer...");

const response =
  await this.fixer.fix(
    request,
    error.details,
    projectContext,
  );

console.log("Fixer returned.");

console.log("AI Fix Response:");
console.log(response);

const filesPatched =
  this.patchEngine.apply(
    response,
    projectPath,
  );

console.log(`Patched ${filesPatched} file(s).`);
    return {
      attempts: 1,
      fixed: filesPatched > 0,
      message: `Patched ${filesPatched} file(s).`,
    };
  }
}

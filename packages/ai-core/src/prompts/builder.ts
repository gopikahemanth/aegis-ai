import { PromptSections } from "./sections.js";
import { PromptTemplates } from "./templates.js";
import { ContextEngine } from "../context/context-engine.js";

import type { ProjectSpecification } from "../architect/specification.js";

export class PromptBuilderEngine {
  private readonly sections =
    new PromptSections();

  private readonly templates =
    new PromptTemplates();

private readonly contextEngine =
  new ContextEngine();

 build(
  plan: { title: string }[],
  spec: ProjectSpecification,
  request: string,
  projectPath: string,
) {
    const execution =
      this.sections.executionPlan(plan);

    const architecture =
      this.sections.architecture(
        JSON.stringify(spec, null, 2),
      );
 const fullContext =
  this.contextEngine.build(
    request,
    projectPath,
  );;
    const framework =
  this.sections.frameworkRules();

const user =
  this.sections.userRequest(request);

const rules =
  this.sections.outputRules();

return this.templates.projectGeneration(
  execution,
  architecture,
  fullContext,
  framework,
  user,
  rules,
);
  }
}

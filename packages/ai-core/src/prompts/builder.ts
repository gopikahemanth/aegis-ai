import { PromptSections } from "./sections.js";
import { PromptTemplates } from "./templates.js";

import type { ProjectSpecification } from "../architect/specification.js";

export class PromptBuilderEngine {
  private readonly sections =
    new PromptSections();

  private readonly templates =
    new PromptTemplates();

  build(
    plan: { title: string }[],
    spec: ProjectSpecification,
    request: string,
  ) {
    const execution =
      this.sections.executionPlan(plan);

    const architecture =
      this.sections.architecture(
        JSON.stringify(spec, null, 2),
      );

    const user =
      this.sections.userRequest(request);

    const rules =
      this.sections.outputRules();

    return this.templates.projectGeneration(
      execution,
      architecture,
      user,
      rules,
    );
  }
}

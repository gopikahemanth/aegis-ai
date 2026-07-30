import { PromptSections } from "./sections.js";
import { PromptTemplates } from "./templates.js";
import { ContextEngine } from "../context/context-engine.js";
import { FrameworkPromptFactory } from "./frameworks/factory.js";

import type { ProjectSpecification } from "../architect/specification.js";

export class PromptBuilderEngine {
  private readonly sections =
    new PromptSections();

  private readonly templates =
    new PromptTemplates();

private readonly frameworkFactory =
  new FrameworkPromptFactory();

private readonly contextEngine =
  new ContextEngine();

build(
  plan: { title: string }[],
  spec: ProjectSpecification,
  architecturePlan: string,
  request: string,
  projectPath: string,
) {
    const execution =
      this.sections.executionPlan(plan);

    const architecture =
      this.sections.architecture(
        JSON.stringify(spec, null, 2),
      );
      const architectureDetails =
  this.sections.architecturePlan(
    architecturePlan,
  );
    const activeTask = plan && plan.length > 0 ? plan[0] : null;
    const taskContext = activeTask ? `${activeTask.title} ${(activeTask as any).description || ""}` : "";
    const fullContext =
      this.contextEngine.build(
        request,
        projectPath,
        taskContext,
      );
    const framework =
  this.frameworkFactory.get(
    this.detectFramework(spec),
  );
const user =
  this.sections.userRequest(request);

const rules =
  this.sections.outputRules();

return this.templates.projectGeneration(
  execution,
  architecture,
  architectureDetails,
  fullContext,
  framework,
  user,
  rules,
);
  }
  private detectFramework(
  spec: ProjectSpecification,
): string {

  if (spec.frontend === "React") {
    return "react-vite";
  }

  if (spec.frontend === "Next.js") {
    return "next";
  }

  if (spec.backend === "Express") {
    return "express";
  }

  return "html";
}
}

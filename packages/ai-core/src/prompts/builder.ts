import { PromptSections } from "./sections.js";
import { PromptTemplates } from "./templates.js";
import { ContextEngine } from "../context/context-engine.js";
import { FrameworkPromptFactory } from "./frameworks/factory.js";
import { WorkspaceIntelligenceEngine } from "@aegis/workspace";

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

    let workspaceSummary = "";
    try {
      const intelEngine = new WorkspaceIntelligenceEngine();
      const index = intelEngine.scan(projectPath);
      workspaceSummary = `
═══════════════════════════════════════════════════════
WORKSPACE INTELLIGENCE INDEX (CURRENT PROJECT STATE)
═══════════════════════════════════════════════════════
${intelEngine.formatAsMarkdown(index)}
`;
    } catch (e: any) {
      console.warn(`[WorkspaceIntelligence] Warning: Scanning failed: ${e.message}`);
    }

    const archLockBlock = `
═══════════════════════════════════════════════════════
ARCHITECTURE LOCK (IMMUTABLE — DO NOT DEVIATE OR SUBSTITUTE)
═══════════════════════════════════════════════════════
Frontend: ${spec.frontend || "React-Vite"}
Backend:  ${spec.backend || "Express"}
Database: ${spec.database || "SQLite"}
Language: ${spec.language || "TypeScript"}
Styling:  ${spec.styling || "TailwindCSS"}

CRITICAL ARCHITECTURE RULES:
1. You MUST NOT substitute database provider (e.g. NEVER change PostgreSQL to SQLite).
2. You MUST NOT substitute frontend or backend framework (e.g. NEVER change Next.js to React/Vite or Express).
3. If an architectural change is required, STOP and emit an ArchitectureChangeProposal.
═══════════════════════════════════════════════════════
`;

    const mergedContext = `${fullContext}\n${archLockBlock}\n${workspaceSummary}`;

    // Thread domain vocabulary explicitly into the prompt context
    let domainVocabBlock = "";
    if ((spec as any).domainVocabulary) {
      const dv = (spec as any).domainVocabulary;
      domainVocabBlock = `
═══════════════════════════════════════════════════════
DOMAIN VOCABULARY CONTRACT (use EXACTLY these terms in all UI)
═══════════════════════════════════════════════════════
Entity (singular): ${dv.entityName}
Entity (plural):   ${dv.entityPlural}
Domain prefix:     ${dv.domainPrefix}

KPI Card Titles (use ONLY these — no generic placeholders):
${dv.primaryMetrics.map((m: string) => `  • ${m}`).join("\n")}

Action Labels (buttons, CTAs, menu items):
${dv.actionVerbs.map((v: string) => `  • ${v}`).join("\n")}

CRITICAL: Every KPI card title MUST come from the list above.
FORBIDDEN: "Total Activity Volume", "Target Goal Metric", "Performance Compliance",
           "Units" as a measurement, any generic dashboard placeholder label.
═══════════════════════════════════════════════════════
`;
    }

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
  mergedContext + domainVocabBlock,
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

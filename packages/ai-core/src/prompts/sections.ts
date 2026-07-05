export class PromptSections {
  executionPlan(plan: { title: string }[]) {
    return `Execution Plan

${plan.map(step => `- ${step.title}`).join("\n")}`;
  }

  architecture(text: string) {
    return `Architecture

${text}`;
  }

  userRequest(request: string) {
    return `User Request

${request}`;
  }

  outputRules() {
    return `
Rules

Return ONLY files.

Use:

===FILE: path===

No markdown.

No explanations.
`;
  }
}

import type { AIProvider } from "../providers/base.js";
import type { ProjectSpecification } from "./specification.js";
import { PromptManager } from "../prompts/prompt-manager.js";

export class SpecificationGenerator {
  private readonly promptManager = new PromptManager();

  constructor(
    private readonly provider: AIProvider,
  ) {}

  async generate(
    request: string,
    image?: { mimeType: string; data: string }
  ): Promise<ProjectSpecification> {

    const response =
      await this.provider.chat([
        {
          role: "system",
          content: this.promptManager.getSpecificationPrompt(),
        },
        {
          role: "user",
          content: request,
        },
      ], { agentType: "architect", image });


    const startIdx = response.indexOf("{");
    const endIdx = response.lastIndexOf("}");
    if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
      throw new Error(`Invalid JSON specification response: ${response}`);
    }
    const cleaned = response.substring(startIdx, endIdx + 1);
    const spec = JSON.parse(cleaned) as ProjectSpecification;

    // Hard deterministic override if user prompt explicitly specifies tech stack
    const reqLower = request.toLowerCase();
    if (reqLower.includes("sqlite")) {
      spec.database = "SQLite";
    } else if (reqLower.includes("postgres")) {
      spec.database = "PostgreSQL";
    }

    if (reqLower.includes("express")) {
      spec.backend = "Express";
    }

    if (reqLower.includes("react") && !reqLower.includes("next.js")) {
      spec.frontend = "React";
    }

    return spec;
  }
}

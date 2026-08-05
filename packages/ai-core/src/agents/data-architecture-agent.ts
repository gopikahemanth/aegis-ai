import { BaseAgent } from "./base-agent.js";
import { PromptManager } from "../prompts/prompt-manager.js";
import { JsonExtractor } from "../utils/json-extractor.js";
import type { ProjectSpecification } from "../architect/specification.js";

export interface DataModelField {
  name: string;
  type: string;
  isId?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  relationTo?: string;
  description?: string;
}

export interface DataArchitectureModel {
  name: string;
  description: string;
  persistence: "database" | "localStorage" | "sessionStorage" | "none";
  fields: DataModelField[];
}

export interface DataArchitectureApi {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  description: string;
  requestBodySchema?: string;
  responseBodySchema?: string;
}

export interface DataArchitectureHook {
  name: string;
  type: "query" | "mutation";
  endpoint: string;
  params?: string;
  returns: string;
}

export interface DataArchitecturePlan {
  models: DataArchitectureModel[];
  databaseSchema: string; // prisma schema snippet or SQL DDL
  apis: DataArchitectureApi[];
  hooks: DataArchitectureHook[];
}

export class DataArchitectureAgent extends BaseAgent {
  readonly name = "Data Architecture Agent";

  private readonly promptManager = new PromptManager();
  private readonly extractor = new JsonExtractor();

  async execute(
    request: string,
    specification: ProjectSpecification,
  ): Promise<DataArchitecturePlan> {
    console.log(`[DataArchitectureAgent] Planning real data architectures and schemas...`);

    const prompt = this.promptManager.getDataArchitecturePrompt(specification);
    const response = await this.provider.chat([
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: `Original Request:
${request}

Project Specification:
${JSON.stringify(specification, null, 2)}
`,
      },
    ], { agentType: "architect", complexity: 8 });

    try {
      const json = this.extractor.extract(response);
      return JSON.parse(json) as DataArchitecturePlan;
    } catch (err: any) {
      console.warn(`[DataArchitectureAgent] Failed to parse JSON response. Falling back to default architecture structure. Error: ${err.message}`);
      return {
        models: [],
        databaseSchema: `// Schema generation fallback\n// Request: ${request}`,
        apis: [],
        hooks: [],
      };
    }
  }
}

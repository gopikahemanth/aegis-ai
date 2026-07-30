import { BaseAgent } from "./base-agent.js";
import { SpecificationGenerator } from "../architect/specification-generator.js";
import { ArchitectureGenerator } from "../architect/architecture-generator.js";

import type { ProjectSpecification } from "../architect/specification.js";

export class ArchitectAgent extends BaseAgent {
  readonly name = "Architect Agent";

  private readonly specificationGenerator =
    new SpecificationGenerator(
      this.provider,
    );

  private readonly architectureGenerator =
    new ArchitectureGenerator(
      this.provider,
    );

  async execute(
    request: string,
    image?: { mimeType: string; data: string }
  ): Promise<{
    specification: ProjectSpecification;
    architecturePlan: string;
  }> {
    const specification =
      await this.specificationGenerator.generate(
        request,
        image,
      );

    const architecturePlan =
      await this.architectureGenerator.generate(
        specification,
      );

    return {
      specification,
      architecturePlan,
    };
  }
}

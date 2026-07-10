import type { AIProvider } from "../providers/base.js";
import type { ProjectSpecification } from "./specification.js";

export class SpecificationGenerator {
  constructor(
    private readonly provider: AIProvider,
  ) {}

  async generate(
    request: string,
  ): Promise<ProjectSpecification> {

    const response =
      await this.provider.chat([
        {
          role: "system",
          content: `
You are an expert software architect.

Analyze the user's request.

Return ONLY valid JSON.

Example:

{
  "name": "Generated Project",
  "type": "website",
  "frontend": "React",
  "backend": "Express",
  "database": "PostgreSQL",
  "language": "TypeScript",
  "styling": "Tailwind CSS",
  "packageManager": "pnpm"
}
`,
        },
        {
          role: "user",
          content: request,
        },
      ]);


const cleaned = response
  .replace(/```(?:json)?/gi, "")
  .trim();


return JSON.parse(cleaned);}
}

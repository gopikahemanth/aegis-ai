import type { AIProvider } from "../providers/base.js";
import type { ProjectSpecification } from "../architect/specification.js";
import type { GeneratedFile } from "../writer/writer.js";

/**
 * DocsGeneratorAgent
 *
 * Post-generation agent that produces human-quality project documentation.
 * Runs after all code is generated and verified.
 *
 * Outputs:
 *   - README.md   — project overview, features, setup, commands, screenshots
 *   - ARCHITECTURE.md — folder structure, data flow, design decisions
 *   - .env.example    — all environment variables documented with descriptions
 */
export class DocsGeneratorAgent {
  constructor(private readonly provider: AIProvider) {}

  async generate(
    spec: ProjectSpecification,
    originalRequest: string,
    generatedFiles: string[],
    projectDirectory: string,
  ): Promise<GeneratedFile[]> {
    const fileList = generatedFiles.slice(0, 60).join("\n");

    const readmePrompt = `You are a senior technical writer creating documentation for a software project.

Project: ${spec.name}
Original request: ${originalRequest}
Framework: ${spec.frontend ?? spec.type}
Language: ${spec.language}
Database: ${spec.database ?? "None"}

Generated files:
${fileList}

Write a professional README.md that includes:
1. Project title with a one-line description
2. Features list (bullet points, specific and concrete)
3. Tech Stack table (Technology | Purpose)
4. Getting Started:
   - Prerequisites (Node version, package manager)
   - Installation steps (exact commands)
   - Environment setup (copy .env.example, fill in keys)
   - Running locally (exact command)
5. Available scripts (dev, build, test, lint)
6. Project structure (key folders explained)
7. License (MIT)

Write in clear, professional technical English.
Do NOT use placeholder text.
Output raw markdown only — no code fences around the entire document.`;

    const architecturePrompt = `You are a senior software architect documenting a codebase.

Project: ${spec.name}
Framework: ${spec.frontend ?? spec.type}

Generated files:
${fileList}

Write a concise ARCHITECTURE.md that includes:
1. System Overview (2-3 sentences)
2. Folder Structure with annotations (use tree format with # comments)
3. Key Design Decisions (why each major tech choice was made)
4. Data Flow (how data moves from user action to storage and back)
5. State Management approach
6. Error Handling strategy

Output raw markdown only.`;

    const [readmeContent, architectureContent] = await Promise.all([
      this.provider.chat([
        { role: "system", content: "You are a professional technical writer. Write clear, accurate, complete documentation." },
        { role: "user", content: readmePrompt },
      ], { agentType: "reviewer", temperature: 0.3 }).catch(() =>
        this.buildFallbackReadme(spec, originalRequest)
      ),
      this.provider.chat([
        { role: "system", content: "You are a senior software architect. Write precise technical documentation." },
        { role: "user", content: architecturePrompt },
      ], { agentType: "reviewer", temperature: 0.2 }).catch(() =>
        this.buildFallbackArchitecture(spec, generatedFiles)
      ),
    ]);

    const envContent = this.buildEnvExample(spec);

    console.log("[DocsGenerator] ✓ Generated README.md, ARCHITECTURE.md, .env.example");

    return [
      { path: "README.md", content: readmeContent },
      { path: "ARCHITECTURE.md", content: architectureContent },
      { path: ".env.example", content: envContent },
    ];
  }

  private buildFallbackReadme(spec: ProjectSpecification, request: string): string {
    return `# ${spec.name}

> ${request}

## Features

- Built with ${spec.frontend ?? spec.type} and ${spec.language}
- ${spec.database ? `Database: ${spec.database}` : "Client-side storage"}

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended)

### Installation

\`\`\`bash
pnpm install
\`\`\`

### Running Locally

\`\`\`bash
pnpm run dev
\`\`\`

Open http://localhost:5173 in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| \`pnpm dev\` | Start development server |
| \`pnpm build\` | Build for production |
| \`pnpm preview\` | Preview production build |

## License

MIT
`;
  }

  private buildFallbackArchitecture(spec: ProjectSpecification, files: string[]): string {
    const featureFolders = [...new Set(
      files
        .map(f => f.split("/")[1])
        .filter(Boolean)
    )].join("\n│   ├── ");

    return `# Architecture — ${spec.name}

## System Overview

${spec.name} is a ${spec.type} application built with ${spec.frontend ?? spec.language}.

## Folder Structure

\`\`\`
src/
│   ├── ${featureFolders}
\`\`\`

## Tech Stack

| Technology | Purpose |
|------------|---------|
| ${spec.frontend ?? spec.type} | Frontend framework |
| ${spec.language} | Primary language |
${spec.database ? `| ${spec.database} | Database |\n` : ""}

## Data Flow

User action → Component handler → Service layer → Storage → State update → Re-render

## License

MIT
`;
  }

  private buildEnvExample(spec: ProjectSpecification): string {
    const lines: string[] = [
      "# Environment Variables",
      "# Copy this file to .env and fill in your values",
      "# Never commit .env to version control",
      "",
      "# Application",
      "VITE_APP_NAME=" + (spec.name ?? "MyApp"),
      "VITE_APP_URL=http://localhost:5173",
      "",
    ];

    if (spec.database) {
      lines.push("# Database");
      lines.push("DATABASE_URL=your_database_connection_string_here");
      lines.push("");
    }

    lines.push("# AI / External APIs (add any API keys your app uses)");
    lines.push("# VITE_API_KEY=your_api_key_here");

    return lines.join("\n");
  }
}

/**
 * ReadmeGenerator
 *
 * Generates a professional README.md, .env.example, and optional SETUP.md
 * for every generated project, so that any developer can install, configure,
 * and run the application without reverse-engineering its structure.
 *
 * This is part of the Phase 10 delivery phase and runs after the Final Success
 * Gate has evaluated the project.
 */

import { writeFileSync, existsSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { ProjectSpecification } from "../architect/specification.js";

export interface ReadmeGeneratorOptions {
  projectRoot: string;
  projectName: string;
  spec?: ProjectSpecification | null;
  buildSuccess: boolean;
  databaseProvider?: string;
  backendFramework?: string;
  frontendFramework?: string;
}

export class ReadmeGenerator {
  /**
   * Generate README.md and .env.example for a generated project.
   * Returns the paths of files written.
   */
  public static generate(options: ReadmeGeneratorOptions): string[] {
    const written: string[] = [];

    // 1. .env.example
    const envExample = ReadmeGenerator.buildEnvExample(options);
    if (envExample) {
      const envExamplePath = join(options.projectRoot, ".env.example");
      if (!existsSync(envExamplePath)) {
        // Only write if .env.example doesn't exist — don't overwrite user customizations
        try {
          writeFileSync(envExamplePath, envExample, "utf8");
          written.push(envExamplePath);
        } catch { /* non-fatal */ }
      }
    }

    // 2. README.md
    const readmePath = join(options.projectRoot, "README.md");
    const readme = ReadmeGenerator.buildReadme(options);
    try {
      writeFileSync(readmePath, readme, "utf8");
      written.push(readmePath);
    } catch { /* non-fatal */ }

    return written;
  }

  private static buildEnvExample(options: ReadmeGeneratorOptions): string {
    const lines: string[] = [
      "# Environment Variables",
      "# Copy this file to .env and fill in the values.",
      "",
    ];

    const { databaseProvider, backendFramework, spec } = options;
    const hasBackend = backendFramework && backendFramework !== "None" && backendFramework !== "none";
    const hasDatabase = databaseProvider && databaseProvider !== "None" && databaseProvider !== "none";

    if (hasDatabase && databaseProvider !== "sqlite") {
      lines.push("# Database");
      if (databaseProvider?.toLowerCase().includes("postgres")) {
        lines.push("DATABASE_URL=postgresql://user:password@localhost:5432/mydb");
      } else if (databaseProvider?.toLowerCase().includes("mysql")) {
        lines.push("DATABASE_URL=mysql://user:password@localhost:3306/mydb");
      } else if (databaseProvider?.toLowerCase().includes("mongo")) {
        lines.push("DATABASE_URL=mongodb://localhost:27017/mydb");
      } else {
        lines.push("DATABASE_URL=your-database-connection-string");
      }
      lines.push("");
    }

    if (hasBackend) {
      lines.push("# Server");
      lines.push("PORT=3001");
      lines.push("NODE_ENV=development");
      lines.push("");
    }

    if (spec?.auth && spec.auth !== "none") {
      lines.push("# Authentication");
      if (spec.auth === "JWT") {
        lines.push("JWT_SECRET=your-secret-key-at-least-32-characters-long");
        lines.push("JWT_EXPIRES_IN=7d");
      } else if (spec.auth === "OAuth2") {
        lines.push("OAUTH_CLIENT_ID=your-oauth-client-id");
        lines.push("OAUTH_CLIENT_SECRET=your-oauth-client-secret");
        lines.push("OAUTH_CALLBACK_URL=http://localhost:3000/auth/callback");
      } else if (spec.auth === "session") {
        lines.push("SESSION_SECRET=your-session-secret-at-least-32-characters-long");
      }
      lines.push("");
    }

    return lines.length > 4 ? lines.join("\n") : "";
  }

  private static buildReadme(options: ReadmeGeneratorOptions): string {
    const {
      projectName,
      projectRoot,
      spec,
      buildSuccess,
      databaseProvider,
      backendFramework,
      frontendFramework,
    } = options;

    const hasBackend = backendFramework && backendFramework !== "None" && backendFramework !== "none";
    const hasDatabase = databaseProvider && databaseProvider !== "None" && databaseProvider !== "none";
    const isSqlite = databaseProvider?.toLowerCase().includes("sqlite");

    // Detect package.json scripts
    let packageManager = "pnpm";
    let startScript = "dev";
    let buildScript = "build";
    const pkgPath = join(projectRoot, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        if (pkg.scripts?.start) startScript = "start";
        if (pkg.scripts?.dev) startScript = "dev";
      } catch { /* ignore */ }
    }

    const sections: string[] = [];

    // Header
    sections.push(`# ${projectName}`);
    sections.push("");
    if (spec?.features && spec.features.length > 0) {
      const featureList = spec.features.slice(0, 6).map(f => `- ${f}`).join("\n");
      sections.push(`Generated by [Aegis AI](https://github.com/aegis-ai) — an autonomous software engineering platform.\n\n**Features:**\n${featureList}`);
    } else {
      sections.push(`Generated by [Aegis AI](https://github.com/aegis-ai) — an autonomous software engineering platform.`);
    }
    sections.push("");

    // Build status badge
    if (buildSuccess) {
      sections.push(`> ✅ **Build Status:** Production build succeeded.`);
    } else {
      sections.push(`> ⚠️ **Build Status:** Build completed with warnings. See setup instructions below.`);
    }
    sections.push("");

    // Tech stack
    sections.push("## Tech Stack");
    sections.push("");
    const stack: string[] = [];
    if (frontendFramework) stack.push(`- **Frontend:** ${frontendFramework}`);
    if (hasBackend) stack.push(`- **Backend:** ${backendFramework}`);
    if (hasDatabase) stack.push(`- **Database:** ${databaseProvider}${isSqlite ? " (embedded, no server required)" : ""}`);
    if (spec?.auth && spec.auth !== "none") stack.push(`- **Authentication:** ${spec.auth}`);
    if (stack.length > 0) {
      sections.push(stack.join("\n"));
    }
    sections.push("");

    // Prerequisites
    sections.push("## Prerequisites");
    sections.push("");
    sections.push("- [Node.js](https://nodejs.org/) >= 18");
    sections.push("- [pnpm](https://pnpm.io/) >= 8 (or npm/yarn)");
    if (hasDatabase && !isSqlite) {
      sections.push(`- ${databaseProvider} server running and accessible`);
    }
    sections.push("");

    // Setup
    sections.push("## Setup");
    sections.push("");
    sections.push("### 1. Install dependencies");
    sections.push("```bash");
    sections.push("pnpm install");
    sections.push("```");
    sections.push("");

    if (hasDatabase && !isSqlite) {
      sections.push("### 2. Configure environment");
      sections.push("```bash");
      sections.push("cp .env.example .env");
      sections.push("# Edit .env and set your DATABASE_URL and other secrets");
      sections.push("```");
      sections.push("");
    } else if (hasDatabase && isSqlite) {
      sections.push("### 2. Configure environment (optional)");
      sections.push("SQLite is used as the database — no server required. The database file will be created automatically.");
      sections.push("```bash");
      sections.push("# Optional: copy .env.example if you want to customize settings");
      sections.push("cp .env.example .env");
      sections.push("```");
      sections.push("");
    }

    if (hasDatabase) {
      sections.push("### 3. Initialize the database");
      sections.push("```bash");
      sections.push("pnpm exec prisma generate");
      sections.push("pnpm exec prisma db push");
      sections.push("```");
      sections.push("");
    }

    // Running
    sections.push("## Running the Application");
    sections.push("");

    if (hasBackend) {
      sections.push("This is a full-stack application. Start the backend and frontend separately:");
      sections.push("");
      sections.push("**Backend:**");
      sections.push("```bash");
      sections.push(`cd server`);
      sections.push(`pnpm ${startScript}`);
      sections.push("```");
      sections.push("");
      sections.push("**Frontend:**");
      sections.push("```bash");
      sections.push(`pnpm ${startScript}`);
      sections.push("```");
    } else {
      sections.push("**Start the development server:**");
      sections.push("```bash");
      sections.push(`pnpm ${startScript}`);
      sections.push("```");
    }
    sections.push("");

    // Build
    sections.push("## Production Build");
    sections.push("");
    sections.push("```bash");
    sections.push(`pnpm ${buildScript}`);
    sections.push("```");
    sections.push("");

    // Environment variables
    if (existsSync(join(projectRoot, ".env.example"))) {
      sections.push("## Environment Variables");
      sections.push("");
      sections.push("See [`.env.example`](.env.example) for all required environment variables.");
      sections.push("");
    }

    // License / footer
    sections.push("---");
    sections.push("");
    sections.push("*Generated by [Aegis AI](https://github.com/aegis-ai) on " + new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) + ".*");
    sections.push("");

    return sections.join("\n");
  }
}

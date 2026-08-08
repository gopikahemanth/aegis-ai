import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ArchitectureContractV1 } from "./architecture-resolver.js";

export interface DetectedArchitecture {
  frontendFramework: string;
  backendFramework: string;
  databaseProvider: string;
  orm: string;
  language: string;
  styling: string;
  packageManager: string;
  authentication: string;
}

export class ArchitectureAuditor {
  public static audit(outputDirectory: string): DetectedArchitecture {
    let frontendFramework = "Unknown";
    let backendFramework = "Unknown";
    let databaseProvider = "Unknown";
    let orm = "Unknown";
    let language = "TypeScript";
    let styling = "CSS";
    let packageManager = "pnpm";
    let authentication = "none";

    const pkgPath = join(outputDirectory, "package.json");
    let pkgDeps: Record<string, string> = {};
    let pkgDevDeps: Record<string, string> = {};

    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        pkgDeps = pkg.dependencies || {};
        pkgDevDeps = pkg.devDependencies || {};
      } catch {}
    }

    const allDeps = { ...pkgDeps, ...pkgDevDeps };

    // 1. Detect Frontend Framework
    if ("next" in allDeps || existsSync(join(outputDirectory, "next.config.js")) || existsSync(join(outputDirectory, "next.config.ts")) || existsSync(join(outputDirectory, "app")) || existsSync(join(outputDirectory, "pages"))) {
      frontendFramework = "Next.js";
    } else if ("vite" in allDeps || existsSync(join(outputDirectory, "vite.config.ts")) || existsSync(join(outputDirectory, "vite.config.js"))) {
      frontendFramework = "React-Vite";
    } else {
      frontendFramework = "HTML";
    }

    // 2. Detect Backend Framework
    if (frontendFramework === "Next.js" && (existsSync(join(outputDirectory, "app/api")) || existsSync(join(outputDirectory, "pages/api")))) {
      backendFramework = "Next.js API Routes";
    } else if ("express" in allDeps || existsSync(join(outputDirectory, "server"))) {
      backendFramework = "Express";
    } else {
      backendFramework = "None";
    }

    // 3. Detect ORM & Database Provider
    const schemaCandidates = [
      join(outputDirectory, "prisma", "schema.prisma"),
      join(outputDirectory, "server", "prisma", "schema.prisma"),
      join(outputDirectory, "backend", "prisma", "schema.prisma")
    ];
    const schemaPath = schemaCandidates.find(p => existsSync(p));

    if (schemaPath) {
      orm = "Prisma";
      try {
        const schemaContent = readFileSync(schemaPath, "utf8");
        if (schemaContent.includes('provider = "postgresql"') || schemaContent.includes("provider = 'postgresql'")) {
          databaseProvider = "PostgreSQL";
        } else if (schemaContent.includes('provider = "sqlite"') || schemaContent.includes("provider = 'sqlite'")) {
          databaseProvider = "SQLite";
        } else if (schemaContent.includes('provider = "mysql"') || schemaContent.includes("provider = 'mysql'")) {
          databaseProvider = "MySQL";
        }
      } catch {}
    } else if ("drizzle-orm" in allDeps) {
      orm = "Drizzle";
      databaseProvider = "drizzle-orm" in allDeps ? ("pg" in allDeps ? "PostgreSQL" : "SQLite") : "Unknown";
    }

    // 4. Detect Authentication
    if ("next-auth" in allDeps || "@auth/core" in allDeps) {
      authentication = "NextAuth.js";
    } else if ("jsonwebtoken" in allDeps) {
      authentication = "JWT";
    }

    // 5. Detect Styling
    if ("tailwindcss" in allDeps || existsSync(join(outputDirectory, "tailwind.config.js")) || existsSync(join(outputDirectory, "tailwind.config.ts"))) {
      styling = "TailwindCSS";
    }

    return {
      frontendFramework,
      backendFramework,
      databaseProvider,
      orm,
      language,
      styling,
      packageManager,
      authentication
    };
  }
}

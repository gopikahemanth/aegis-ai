import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ArchitectureContractV1 } from "./architecture-resolver.js";

export interface ProjectManifestEntry {
  path: string;
  category: "required" | "optional" | "generated";
  description: string;
  expectedExports?: string[];
  expectedImports?: string[];
  dependencies?: string[];
}

export interface CanonicalManifest {
  version: 1;
  contractVersion: number;
  frontend: string;
  backend: string;
  database: string;
  orm: string;
  files: ProjectManifestEntry[];
  routes: string[];
  models: string[];
  apiEndpoints: string[];
}

export class CanonicalManifestGenerator {
  public static generate(contract: ArchitectureContractV1, outputDirectory: string): CanonicalManifest {
    const files: ProjectManifestEntry[] = [
      { path: "src/routes.tsx", category: "required", description: "Application React Router configuration" },
      { path: "src/App.tsx", category: "required", description: "Root React application component with QueryClientProvider" },
      { path: "src/features/dashboard/DashboardPage.tsx", category: "required", description: "Canonical dashboard view" },
      { path: "src/features/upload/UploadPage.tsx", category: "required", description: "Canonical resume upload view" },
      { path: "src/features/auth/LoginPage.tsx", category: "required", description: "Canonical authentication login view" },
      { path: "src/shared/components/MatchScoreDial.tsx", category: "required", description: "Canonical score gauge dial SVG" },
      { path: "src/shared/components/Layout.tsx", category: "required", description: "Application layout shell" },
      { path: "src/services/api.ts", category: "required", description: "Frontend API client service" },
      { path: "server/controllers/ScanController.ts", category: "required", description: "Express scan controller" },
      { path: "server/routes/scan.routes.ts", category: "required", description: "Express scan routes definition" },
      { path: "server/lib/prisma.ts", category: "required", description: "Prisma client instance" },
      { path: "prisma/schema.prisma", category: "required", description: "Prisma database schema" },
    ];

    const manifest: CanonicalManifest = {
      version: 1,
      contractVersion: contract.version || 1,
      frontend: contract.frontend.framework,
      backend: contract.backend.framework,
      database: contract.database.provider,
      orm: contract.database.orm,
      files,
      routes: contract.requiredRoutes || ["/", "/upload", "/login", "/dashboard"],
      models: contract.requiredModels || ["User", "Resume", "JobDescription", "AnalysisResult"],
      apiEndpoints: ["POST /api/scans", "GET /api/scans", "POST /api/auth/login"],
    };

    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });
    writeFileSync(join(aegisDir, "project-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

    console.log(`[CanonicalManifest] 📄 Generated canonical project manifest with ${files.length} file entries.`);
    return manifest;
  }
}

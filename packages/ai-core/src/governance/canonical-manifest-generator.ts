import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ArchitectureContractV1 } from "./architecture-resolver.js";
import { CANONICAL_FILES, CanonicalFileGraph } from "./canonical-file-graph.js";

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
    const files: ProjectManifestEntry[] = CANONICAL_FILES.map(f => ({
      path: f.canonicalPath,
      category: f.required ? "required" : "optional",
      description: f.semanticRole,
      expectedExports: f.requiredExports,
      expectedImports: f.allowedImports,
    }));

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
      apiEndpoints: ["POST /api/scans/upload", "POST /api/scans/analyze", "GET /api/scans/history", "POST /api/auth/login", "POST /api/auth/register"],
    };

    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });
    writeFileSync(join(aegisDir, "project-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

    console.log(`[CanonicalManifest] 📄 Generated canonical project manifest with ${files.length} file entries.`);
    return manifest;
  }
}

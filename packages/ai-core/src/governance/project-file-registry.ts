import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ArchitectureContractV1 } from "./architecture-resolver.js";
import { CANONICAL_FILES, CanonicalFileGraph } from "./canonical-file-graph.js";

export interface ProjectFileEntry {
  path: string;
  description: string;
  ownerTaskId?: number;
  expectedExports?: string[];
}

export class ProjectFileRegistry {
  private static instance: ProjectFileRegistry;
  private registry: Map<string, ProjectFileEntry> = new Map();

  public static getInstance(): ProjectFileRegistry {
    if (!ProjectFileRegistry.instance) {
      ProjectFileRegistry.instance = new ProjectFileRegistry();
    }
    return ProjectFileRegistry.instance;
  }

  public reset(): void {
    this.registry.clear();
  }

  public initialize(contract: ArchitectureContractV1, outputDirectory: string): void {
    this.registry.clear();

    const isATS = (contract.requiredModels || []).some(m => ["Resume", "JobDescription", "AnalysisResult", "Scan"].includes(m)) ||
                  (contract.requiredRoutes || []).some(r => r.includes("scan") || r.includes("resume"));

    const manifestPath = join(outputDirectory, ".aegis", "project-manifest.json");
    let entriesToRegister: { path: string; description: string; expectedExports?: string[] }[] = [];

    if (existsSync(manifestPath)) {
      try {
        const { readFileSync } = require("node:fs");
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
        if (manifest.files && Array.isArray(manifest.files)) {
          entriesToRegister = manifest.files.map((f: any) => ({
            path: f.path,
            description: f.description,
            expectedExports: f.expectedExports,
          }));
        }
      } catch {}
    }

    if (entriesToRegister.length === 0) {
      entriesToRegister = CANONICAL_FILES
        .filter(f => isATS || (!f.canonicalPath.includes("scan") && !f.canonicalPath.includes("analyzer") && !f.canonicalPath.includes("resume") && !f.canonicalPath.includes("pdf")))
        .map(f => ({
          path: f.canonicalPath,
          description: f.semanticRole,
          expectedExports: f.requiredExports,
        }));
    }

    for (const entry of entriesToRegister) {
      this.registry.set(entry.path, {
        path: entry.path,
        description: entry.description,
        expectedExports: entry.expectedExports,
      });
    }

    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });
    writeFileSync(join(aegisDir, "project-file-registry.json"), JSON.stringify(Array.from(this.registry.entries()), null, 2), "utf8");
  }


  public getRegistry(): Map<string, ProjectFileEntry> {
    return this.registry;
  }

  public registerFile(path: string, description: string, ownerTaskId?: number, expectedExports?: string[]): void {
    const normalized = path.replace(/\\/g, "/");
    if (CanonicalFileGraph.isAuthorized(normalized)) {
      this.registry.set(normalized, { path: normalized, description, ownerTaskId, expectedExports });
    } else {
      console.warn(`[ProjectFileRegistry] ⚠️ Rejected registration of unauthorized file path: "${normalized}"`);
    }
  }

  public hasFile(path: string): boolean {
    return this.registry.has(path.replace(/\\/g, "/"));
  }

  public isAuthorized(path: string): boolean {
    return CanonicalFileGraph.isAuthorized(path);
  }
}

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

  public initialize(contract: ArchitectureContractV1, outputDirectory: string): void {
    this.registry.clear();

    for (const entry of CANONICAL_FILES) {
      this.registry.set(entry.canonicalPath, {
        path: entry.canonicalPath,
        description: entry.semanticRole,
        expectedExports: entry.requiredExports,
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

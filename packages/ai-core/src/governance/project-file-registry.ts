import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ArchitectureContractV1 } from "./architecture-resolver.js";
import { createHash } from "node:crypto";

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

    // Standard Canonical Map for React-Vite + Express + PostgreSQL (Prisma)
    const canonicalFiles: ProjectFileEntry[] = [
      { path: "src/routes.tsx", description: "Application React Router configuration" },
      { path: "src/App.tsx", description: "Root React application container with QueryClientProvider" },
      { path: "src/features/dashboard/DashboardPage.tsx", description: "Canonical dashboard page" },
      { path: "src/features/upload/UploadPage.tsx", description: "Canonical resume upload page" },
      { path: "src/features/auth/LoginPage.tsx", description: "Canonical auth login page" },
      { path: "src/shared/components/MatchScoreDial.tsx", description: "Canonical score gauge dial SVG" },
      { path: "src/shared/components/Layout.tsx", description: "Canonical app shell layout" },
      { path: "src/services/api.ts", description: "Frontend API client service" },
      { path: "server/controllers/ScanController.ts", description: "Express scan controller" },
      { path: "server/routes/scan.routes.ts", description: "Express scan route definitions" },
      { path: "server/lib/prisma.ts", description: "Prisma client instance initialization" },
      { path: "prisma/schema.prisma", description: "Prisma database schema models" },
    ];

    for (const entry of canonicalFiles) {
      this.registry.set(entry.path, entry);
    }

    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });
    writeFileSync(join(aegisDir, "project-file-registry.json"), JSON.stringify(Array.from(this.registry.entries()), null, 2), "utf8");
  }

  public getRegistry(): Map<string, ProjectFileEntry> {
    return this.registry;
  }

  public registerFile(path: string, description: string, ownerTaskId?: number, expectedExports?: string[]): void {
    this.registry.set(path.replace(/\\/g, "/"), { path, description, ownerTaskId, expectedExports });
  }

  public hasFile(path: string): boolean {
    return this.registry.has(path.replace(/\\/g, "/"));
  }
}

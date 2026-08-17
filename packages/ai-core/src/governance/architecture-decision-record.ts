/**
 * ArchitectureDecisionRecord (ADR)
 *
 * Captures explicit architectural rationale, alternatives, tradeoffs, and provenance.
 * Persisted in `.aegis/adr.json` as an immutable audit trail.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export interface ADRItem {
  decisionId: string;
  category: string;
  selectedValue: string;
  reason: string;
  source: "USER_REQUIREMENT" | "EXISTING_PROJECT" | "AEGIS_DEFAULT" | "INFERRED_COMPATIBILITY";
  alternatives: string[];
  tradeoffs?: string;
  confidence: number;
  locked: boolean;
}

export interface ADRLog {
  version: 1;
  projectId: string;
  generationId?: string;
  decisions: ADRItem[];
  lockedAt: string;
}

export class ArchitectureDecisionManager {
  /**
   * Record architecture decisions derived from an ArchitectureContract.
   */
  public static createRecord(
    contract: any,
    outputDirectory?: string
  ): ADRLog {
    const decisions: ADRItem[] = [];

    // 1. Application Type Decision
    decisions.push({
      decisionId: "adr_app_type",
      category: "Application Type",
      selectedValue: contract.applicationType || "FULLSTACK_WEB_APPLICATION",
      reason: contract.reason || "Determined from project specification",
      source: contract.userSpecified ? "USER_REQUIREMENT" : "AEGIS_DEFAULT",
      alternatives: ["STATIC_SITE", "CLI_APPLICATION", "API_SERVICE", "DESKTOP_APPLICATION"],
      tradeoffs: "Provides complete decoupled client and server layers with independent scaling.",
      confidence: contract.confidence || 0.9,
      locked: true,
    });

    // 2. Frontend Framework Decision
    const feProv = contract.frontend?.provenance;
    decisions.push({
      decisionId: "adr_frontend",
      category: "Frontend Framework",
      selectedValue: contract.frontend?.framework || "React-Vite",
      reason: feProv === "user"
        ? "User explicitly requested frontend technology in prompt."
        : "Standard modern fast-refresh SPA architecture.",
      source: feProv === "user" ? "USER_REQUIREMENT" : (feProv === "existing" ? "EXISTING_PROJECT" : "AEGIS_DEFAULT"),
      alternatives: ["React-Vite", "Next.js", "Vue-Vite", "HTML/Vanilla"],
      tradeoffs: "Vite provides sub-second HMR with minimal build overhead compared to heavy fullstack SSR bundles.",
      confidence: feProv === "user" ? 1.0 : 0.9,
      locked: true,
    });

    // 3. Backend Framework Decision
    const beProv = contract.backend?.provenance;
    decisions.push({
      decisionId: "adr_backend",
      category: "Backend Framework",
      selectedValue: contract.backend?.framework || "Express",
      reason: beProv === "user"
        ? "User explicitly requested backend technology in prompt."
        : "Express provides lightweight, robust REST API routing with standard middleware support.",
      source: beProv === "user" ? "USER_REQUIREMENT" : (beProv === "existing" ? "EXISTING_PROJECT" : "AEGIS_DEFAULT"),
      alternatives: ["Express", "Fastify", "Next.js API Routes", "NestJS"],
      tradeoffs: "Minimal boilerplate with huge ecosystem of mature middleware.",
      confidence: beProv === "user" ? 1.0 : 0.9,
      locked: true,
    });

    // 4. Database & ORM Decision
    const dbProv = contract.database?.provenance;
    decisions.push({
      decisionId: "adr_database",
      category: "Database & ORM",
      selectedValue: `${contract.database?.provider || "PostgreSQL"} with ${contract.database?.orm || "Prisma"}`,
      reason: dbProv === "user"
        ? "User explicitly requested database technology in prompt."
        : "PostgreSQL with Prisma guarantees ACID transactions and type-safe relational queries.",
      source: dbProv === "user" ? "USER_REQUIREMENT" : (dbProv === "existing" ? "EXISTING_PROJECT" : "AEGIS_DEFAULT"),
      alternatives: ["PostgreSQL", "SQLite", "MySQL", "MongoDB"],
      tradeoffs: "Requires database service or container in production; provides strong relational integrity.",
      confidence: dbProv === "user" ? 1.0 : 0.9,
      locked: true,
    });

    // 5. Package Manager Decision
    decisions.push({
      decisionId: "adr_package_manager",
      category: "Package Manager",
      selectedValue: contract.packageManager || "pnpm",
      reason: "Locked package manager for fast deterministic node_modules installation and symlink caching.",
      source: "AEGIS_DEFAULT",
      alternatives: ["pnpm", "npm", "yarn"],
      tradeoffs: "Requires pnpm installed on host environment; saves disk space and installation time.",
      confidence: 1.0,
      locked: true,
    });

    const adrLog: ADRLog = {
      version: 1,
      projectId: "project",
      decisions,
      lockedAt: new Date().toISOString(),
    };

    if (outputDirectory) {
      try {
        const aegisDir = join(outputDirectory, ".aegis");
        if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });
        writeFileSync(join(aegisDir, "adr.json"), JSON.stringify(adrLog, null, 2), "utf8");
      } catch {}
    }

    return adrLog;
  }

  public static load(outputDirectory: string): ADRLog | null {
    const adrPath = join(outputDirectory, ".aegis", "adr.json");
    if (!existsSync(adrPath)) return null;
    try {
      return JSON.parse(readFileSync(adrPath, "utf8"));
    } catch {
      return null;
    }
  }
}

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type AgentRole = "FrontendAgent" | "BackendAgent" | "DatabaseAgent" | "ArchitectAgent" | "DevOpsAgent" | "HealerAgent";

export interface FilePatch {
  filePath: string;
  expectedHash?: string;
  newContent: string;
  reason: string;
  agent: AgentRole;
  taskId?: number | string;
}

export interface PatchResult {
  applied: boolean;
  filePath: string;
  newHash?: string;
  rejectionReason?: string;
}

export class FileOwnershipRegistry {
  public static getOwner(filePath: string): AgentRole {
    const rel = filePath.replace(/\\/g, "/").toLowerCase();
    if (rel.includes("prisma/") || rel.includes("schema.prisma") || rel.includes("db/")) {
      return "DatabaseAgent";
    }
    if (rel.includes("server/") || rel.includes("api/") || rel.includes("controllers/") || rel.includes("middleware/")) {
      return "BackendAgent";
    }
    if (rel.includes("src/components/") || rel.includes("src/features/") || rel.includes("src/pages/") || rel.includes("src/app.tsx") || rel.includes("src/main.tsx") || rel.includes("src/index.css")) {
      return "FrontendAgent";
    }
    if (rel.includes("package.json") || rel.includes("docker") || rel.includes(".env")) {
      return "DevOpsAgent";
    }
    return "ArchitectAgent";
  }

  public static canModify(agent: AgentRole, filePath: string): boolean {
    if (agent === "HealerAgent") return true; // Healer can patch files if instructed by root cause
    const owner = this.getOwner(filePath);
    return owner === agent || agent === "ArchitectAgent";
  }
}

export class SafePatchEngine {
  public static computeHash(content: string): string {
    return createHash("sha256").update(content, "utf8").digest("hex");
  }

  public static applyPatch(outputDirectory: string, patch: FilePatch): PatchResult {
    const fullPath = join(outputDirectory, patch.filePath);
    const relPath = patch.filePath.replace(/\\/g, "/");

    // 1. Verify File Ownership
    if (!FileOwnershipRegistry.canModify(patch.agent, relPath)) {
      const owner = FileOwnershipRegistry.getOwner(relPath);
      return {
        applied: false,
        filePath: relPath,
        rejectionReason: `REJECTED File Ownership Violation: File '${relPath}' is owned by '${owner}'. Agent '${patch.agent}' is not authorized to modify it.`
      };
    }

    // 2. Hash Verification before applying patch
    if (existsSync(fullPath)) {
      const currentContent = readFileSync(fullPath, "utf8");
      const currentHash = this.computeHash(currentContent);

      if (patch.expectedHash && patch.expectedHash !== currentHash) {
        return {
          applied: false,
          filePath: relPath,
          rejectionReason: `REJECTED Stale Patch Violation: File '${relPath}' content changed concurrently (Hash mismatch). Re-read file before patching.`
        };
      }
    }

    // Apply patch safely
    writeFileSync(fullPath, patch.newContent, "utf8");
    const newHash = this.computeHash(patch.newContent);

    return {
      applied: true,
      filePath: relPath,
      newHash
    };
  }
}

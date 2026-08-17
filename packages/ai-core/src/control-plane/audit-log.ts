/**
 * AuditLog
 *
 * Append-only security and operational audit logging for critical operations.
 */

import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { JobStore } from "./job-store.js";

export interface AuditRecord {
  id: string;
  timestamp: string;
  projectId: string;
  generationId?: string;
  actor: string;
  action: string;
  category: "SECURITY" | "AUTHORIZATION" | "DATABASE" | "ARCHITECTURE" | "ROLLBACK" | "JOB_LIFECYCLE";
  details: Record<string, any>;
}

export class AuditLog {
  private static inMemoryRecords: AuditRecord[] = [];

  public static record(
    projectPath: string,
    projectId: string,
    action: string,
    category: AuditRecord["category"],
    details: Record<string, any> = {},
    generationId?: string,
    actor: string = "system"
  ): AuditRecord {
    const rawRecord: AuditRecord = {
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      projectId,
      generationId,
      actor,
      action,
      category,
      details,
    };

    // Sanitize secrets
    const sanitizedJson = JobStore.sanitize(JSON.stringify(rawRecord));
    const sanitizedRecord: AuditRecord = JSON.parse(sanitizedJson);

    this.inMemoryRecords.push(sanitizedRecord);

    if (projectPath) {
      try {
        const aegisDir = join(projectPath, ".aegis");
        if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });
        appendFileSync(join(aegisDir, "audit.log"), `${JSON.stringify(sanitizedRecord)}\n`, "utf8");
      } catch (err) {
        console.error("[AuditLog] ❌ Failed to write to audit.log:", err);
      }
    }

    return sanitizedRecord;
  }

  public static getRecords(projectId?: string): AuditRecord[] {
    if (!projectId) return this.inMemoryRecords;
    return this.inMemoryRecords.filter((r) => r.projectId === projectId);
  }

  public static clear(): void {
    this.inMemoryRecords = [];
  }
}

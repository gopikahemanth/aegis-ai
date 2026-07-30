import { writeFileSync, existsSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export interface AuditLogEntry {
  timestamp: string;
  agentRole: string;
  action: string;
  filePath?: string;
  status: "SUCCESS" | "WARNING" | "FAILURE";
  metadata?: Record<string, any>;
}

export class AuditTrailEngine {
  private readonly aegisDir: string;
  private readonly auditLogPath: string;

  constructor(private readonly projectPath: string) {
    this.aegisDir = join(projectPath, ".aegis");
    this.auditLogPath = join(this.aegisDir, "audit-trail.json");
  }

  ensureAegisDir() {
    if (!existsSync(this.aegisDir)) {
      mkdirSync(this.aegisDir, { recursive: true });
    }
  }

  logEvent(entry: Omit<AuditLogEntry, "timestamp">) {
    this.ensureAegisDir();
    const fullEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      ...entry
    };

    let logs: AuditLogEntry[] = [];
    if (existsSync(this.auditLogPath)) {
      try {
        logs = JSON.parse(readFileSync(this.auditLogPath, "utf-8"));
      } catch {
        logs = [];
      }
    }
    logs.push(fullEntry);
    writeFileSync(this.auditLogPath, JSON.stringify(logs, null, 2), "utf-8");
  }

  getLogs(): AuditLogEntry[] {
    if (!existsSync(this.auditLogPath)) return [];
    try {
      return JSON.parse(readFileSync(this.auditLogPath, "utf-8"));
    } catch {
      return [];
    }
  }
}

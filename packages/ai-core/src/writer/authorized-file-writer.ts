/**
 * Aegis AI — Phase 6 Authorized File Writer & Single-Owner Boundary
 *
 * Enforces single-owner file mutation rules at the physical write boundary:
 * 1. Writer Authority: Checks FileOwnershipRegistry to ensure caller role has ownership.
 * 2. Content Hashing & Version Check: Detects unexpected external modifications between planning and writing.
 * 3. Concurrent Write Conflict Detection: Prevents competing agents from silently clobbering one another.
 * 4. Scope Boundary Enforcement: Rejects writes targeting forbidden paths outside the approved change scope.
 * 5. Preservation: Never overwrites user-authored files outside the authorized modification set.
 * 6. Audit Trail: Maintains a detailed write journal of all file mutations.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { FileOwnershipRegistry, type SubsystemRole } from "../governance/file-ownership.js";
import { AuthorizedSchemaManager } from "../governance/authorized-schema-manager.js";
import { ASTSafeTransformer } from "../governance/ast-safe-transformer.js";

export interface FileWriteRequest {
  path: string;
  content: string;
  callerRole: SubsystemRole;
  expectedBaseHash?: string; // Pre-change hash captured during planning
  scope?: {
    allowedFiles?: string[];
    forbiddenFiles?: string[];
  };
}

export interface FileWriteOutcome {
  path: string;
  success: boolean;
  written: boolean;
  status:
    | "WRITTEN"
    | "UNAUTHORIZED_OWNER"
    | "EXTERNAL_MODIFICATION_CONFLICT"
    | "CONCURRENT_WRITE_CONFLICT"
    | "SCOPE_BOUNDARY_VIOLATION"
    | "ERROR";
  reason?: string;
  hashBefore?: string;
  hashAfter?: string;
}

export interface WriteJournalEntry {
  timestamp: string;
  path: string;
  callerRole: SubsystemRole;
  action: "WRITE" | "DELETE" | "REJECTED";
  status: string;
  hashBefore?: string;
  hashAfter?: string;
}

export class AuthorizedFileWriter {
  private static activeLocks: Map<string, { role: SubsystemRole; lockTimestamp: number }> = new Map();
  private static journal: WriteJournalEntry[] = [];
  private static LOCK_TIMEOUT_MS = 30000; // 30 seconds

  /**
   * Computes SHA-256 hash of a file's content.
   */
  public static computeHash(content: string): string {
    return createHash("sha256").update(content, "utf8").digest("hex");
  }

  /**
   * Captures the current content hash of a file on disk (or undefined if not exists).
   */
  public static getDiskHash(projectRoot: string, relativePath: string): string | undefined {
    const full = join(projectRoot, relativePath.replace(/\\/g, "/"));
    if (!existsSync(full)) return undefined;
    try {
      const content = readFileSync(full, "utf8");
      return this.computeHash(content);
    } catch {
      return undefined;
    }
  }

  /**
   * Acquires a write lock for a specific file path.
   */
  public static acquireLock(relativePath: string, role: SubsystemRole): boolean {
    const norm = relativePath.replace(/\\/g, "/").toLowerCase();
    const existing = this.activeLocks.get(norm);
    const now = Date.now();

    if (existing) {
      if (existing.role === role) return true; // Reentrant lock
      if (now - existing.lockTimestamp < this.LOCK_TIMEOUT_MS) {
        return false; // Actively locked by competing agent
      }
    }

    this.activeLocks.set(norm, { role, lockTimestamp: now });
    return true;
  }

  /**
   * Releases write lock for a file path.
   */
  public static releaseLock(relativePath: string, role: SubsystemRole): void {
    const norm = relativePath.replace(/\\/g, "/").toLowerCase();
    const existing = this.activeLocks.get(norm);
    if (existing && existing.role === role) {
      this.activeLocks.delete(norm);
    }
  }

  /**
   * Atomically and safely writes a file to disk enforcing all Phase 6 rules.
   */
  public static writeFile(projectRoot: string, request: FileWriteRequest): FileWriteOutcome {
    const cleanRel = request.path
      .replace(/\\/g, "/")
      .replace(/^(\.\/|\/)+/, "")
      .replace(/^(generated\/project\/|apps\/cli\/generated\/project\/)+/i, "");

    const fullPath = join(projectRoot, cleanRel);
    const diskHash = this.getDiskHash(projectRoot, cleanRel);

    // 1. Scope Boundary Enforcement
    if (request.scope) {
      if (request.scope.forbiddenFiles && request.scope.forbiddenFiles.length > 0) {
        const isForbidden = request.scope.forbiddenFiles.some((pattern) => matchesPattern(cleanRel, pattern));
        if (isForbidden) {
          const outcome: FileWriteOutcome = {
            path: cleanRel,
            success: false,
            written: false,
            status: "SCOPE_BOUNDARY_VIOLATION",
            reason: `SCOPE_BOUNDARY_VIOLATION: File "${cleanRel}" is strictly forbidden for the approved change scope.`,
          };
          this.recordJournal(cleanRel, request.callerRole, "REJECTED", outcome.status);
          return outcome;
        }
      }
      if (request.scope.allowedFiles && request.scope.allowedFiles.length > 0) {
        const isAllowed = request.scope.allowedFiles.some((pattern) => matchesPattern(cleanRel, pattern));
        if (!isAllowed) {
          const outcome: FileWriteOutcome = {
            path: cleanRel,
            success: false,
            written: false,
            status: "SCOPE_BOUNDARY_VIOLATION",
            reason: `SCOPE_BOUNDARY_VIOLATION: File "${cleanRel}" is outside the approved allowedFiles scope list.`,
          };
          this.recordJournal(cleanRel, request.callerRole, "REJECTED", outcome.status);
          return outcome;
        }
      }
    }

    // 2. Concurrent Write Conflict Detection
    if (!this.acquireLock(cleanRel, request.callerRole)) {
      const lockHolder = this.activeLocks.get(cleanRel.toLowerCase())?.role || "Unknown";
      const outcome: FileWriteOutcome = {
        path: cleanRel,
        success: false,
        written: false,
        status: "CONCURRENT_WRITE_CONFLICT",
        reason: `CONCURRENT_WRITE_CONFLICT: Another agent ("${lockHolder}") is currently mutating "${cleanRel}". Simultaneous conflicting writes are rejected.`,
      };
      this.recordJournal(cleanRel, request.callerRole, "REJECTED", outcome.status);
      return outcome;
    }

    try {
      // 3. Unexpected External Modification Check
      if (request.expectedBaseHash !== undefined && diskHash !== undefined) {
        if (request.expectedBaseHash !== diskHash) {
          const outcome: FileWriteOutcome = {
            path: cleanRel,
            success: false,
            written: false,
            status: "EXTERNAL_MODIFICATION_CONFLICT",
            reason: `EXTERNAL_MODIFICATION_CONFLICT: File "${cleanRel}" was modified on disk unexpectedly after planning (expected base hash: ${request.expectedBaseHash.slice(0, 8)}, actual disk hash: ${diskHash.slice(0, 8)}). Halting write to protect changes.`,
            hashBefore: diskHash,
          };
          this.recordJournal(cleanRel, request.callerRole, "REJECTED", outcome.status);
          return outcome;
        }
      }

      // 4. Special Case: Prisma Schema Authoritative Governance
      if (cleanRel === "prisma/schema.prisma" || cleanRel.endsWith("schema.prisma")) {
        const schemaRes = AuthorizedSchemaManager.reconcileAndWriteSchema(
          projectRoot,
          request.content,
          request.callerRole
        );
        if (!schemaRes.success) {
          const outcome: FileWriteOutcome = {
            path: cleanRel,
            success: false,
            written: false,
            status: "UNAUTHORIZED_OWNER",
            reason: schemaRes.error || "Schema update rejected by AuthorizedSchemaManager.",
          };
          this.recordJournal(cleanRel, request.callerRole, "REJECTED", outcome.status);
          return outcome;
        }
        const outcome: FileWriteOutcome = {
          path: cleanRel,
          success: true,
          written: true,
          status: "WRITTEN",
          hashBefore: diskHash,
          hashAfter: this.getDiskHash(projectRoot, cleanRel),
        };
        this.recordJournal(cleanRel, request.callerRole, "WRITE", outcome.status, outcome.hashBefore, outcome.hashAfter);
        return outcome;
      }

      // 5. Authority & Single-Owner Verification
      const canWrite = FileOwnershipRegistry.canWrite(cleanRel, request.callerRole);
      if (!canWrite.allowed) {
        const outcome: FileWriteOutcome = {
          path: cleanRel,
          success: false,
          written: false,
          status: "UNAUTHORIZED_OWNER",
          reason: canWrite.reason,
        };
        this.recordJournal(cleanRel, request.callerRole, "REJECTED", outcome.status);
        return outcome;
      }

      // 6. Non-Destructive Extension Protection
      let targetRel = cleanRel;
      const isBackendFile = targetRel.startsWith("server/") || targetRel.startsWith("prisma/");
      if (!isBackendFile && targetRel.endsWith(".ts") && !targetRel.endsWith(".d.ts")) {
        const hasJsx =
          /<[A-Z][A-Za-z0-9]*[\s/>]/.test(request.content) ||
          /<(div|span|button|form|input|p|h[1-6]|a|ul|li|section|header|footer|main|nav)[\s/>]/.test(request.content) ||
          /<\/([A-Za-z0-9]+)>/.test(request.content);
        if (hasJsx) {
          targetRel = targetRel.replace(/\.ts$/, ".tsx");
        }
      }

      const destPath = join(projectRoot, targetRel);
      mkdirSync(dirname(destPath), { recursive: true });

      // AST-safe formatting transformation
      const transformed = ASTSafeTransformer.transformSource(request.content, targetRel);
      const finalCode = transformed.transformed ? transformed.code : request.content;

      writeFileSync(destPath, finalCode, "utf8");
      FileOwnershipRegistry.registerOwner(targetRel, request.callerRole);

      const hashAfter = this.computeHash(finalCode);
      const outcome: FileWriteOutcome = {
        path: targetRel,
        success: true,
        written: true,
        status: "WRITTEN",
        hashBefore: diskHash,
        hashAfter,
      };

      this.recordJournal(targetRel, request.callerRole, "WRITE", outcome.status, diskHash, hashAfter);
      return outcome;
    } catch (err: any) {
      const outcome: FileWriteOutcome = {
        path: cleanRel,
        success: false,
        written: false,
        status: "ERROR",
        reason: err.message,
      };
      this.recordJournal(cleanRel, request.callerRole, "REJECTED", outcome.status);
      return outcome;
    } finally {
      this.releaseLock(cleanRel, request.callerRole);
    }
  }

  public static getJournal(): WriteJournalEntry[] {
    return [...this.journal];
  }

  public static clearJournal(): void {
    this.journal = [];
    this.activeLocks.clear();
  }

  private static recordJournal(
    path: string,
    callerRole: SubsystemRole,
    action: "WRITE" | "DELETE" | "REJECTED",
    status: string,
    hashBefore?: string,
    hashAfter?: string
  ): void {
    this.journal.push({
      timestamp: new Date().toISOString(),
      path,
      callerRole,
      action,
      status,
      hashBefore,
      hashAfter,
    });
  }
}

function matchesPattern(filePath: string, pattern: string): boolean {
  const normPath = filePath.replace(/\\/g, "/").toLowerCase();
  const normPat = pattern.replace(/\\/g, "/").toLowerCase();

  if (normPat.endsWith("/**")) {
    const prefix = normPat.slice(0, -3);
    return normPath.startsWith(prefix);
  }
  if (normPat.includes("*")) {
    const rx = new RegExp("^" + normPat.replace(/\*/g, ".*") + "$");
    return rx.test(normPath);
  }
  return normPath === normPat;
}

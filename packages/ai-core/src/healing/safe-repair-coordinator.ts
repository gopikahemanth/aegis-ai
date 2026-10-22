/**
 * SafeRepairCoordinator — Aegis V2.3 Milestone 3
 *
 * Single-owner, evidence-driven, bounded repair coordinator:
 * - Creates explicit, traceable repair tickets with root-cause diagnostics
 * - Groups related defects to prevent conflicting multi-agent patch wars
 * - Enforces strict retry boundaries (max 2 attempts per defect)
 * - Records before-and-after cryptographic hashes and test evidence
 * - Modifies files strictly through the authorized write boundary
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { FileOwnershipRegistry, type SubsystemRole } from "../governance/file-ownership.js";

export type RepairRootCauseCategory =
  | "SYNTAX_ERROR"
  | "MISSING_IMPORT"
  | "TYPE_ERROR"
  | "SCHEMA_MISMATCH"
  | "RUNTIME_FAILURE"
  | "TRUNCATED_OUTPUT"
  | "UNKNOWN_DEFECT";

export interface TraceableRepairOperation {
  id: string; // e.g. "REP-001"
  timestamp: string;
  diagnostic: string;
  rootCauseCategory: RepairRootCauseCategory;
  affectedFile: string;
  owningRole: SubsystemRole;
  featureId?: string;
  contractId?: string;
  proposedRepair: string;
  authorizedBy: "SafeRepairCoordinator";
  validationChecksRequired: string[];
  attemptNumber: number;
  maxAttempts: number;
  beforeHash: string;
  afterHash?: string;
  status: "PROPOSED" | "APPLIED" | "VERIFIED" | "FAILED" | "TERMINATED_MAX_RETRIES";
  diagnosticEvidence?: string;
}

export interface GroupedDefect {
  groupKey: string;
  category: RepairRootCauseCategory;
  files: string[];
  diagnostics: string[];
  suggestedAction: string;
}

export class SafeRepairCoordinator {
  private readonly projectRoot: string;
  private readonly operations: TraceableRepairOperation[] = [];
  private readonly attemptCountByFile: Map<string, number> = new Map();
  private static readonly MAX_ATTEMPTS_PER_FILE = 2;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Classify root cause of a defect message.
   */
  public static classifyRootCause(diagnostic: string): RepairRootCauseCategory {
    const text = diagnostic.toLowerCase();
    if (text.includes("unexpected token") || text.includes("syntaxerror") || text.includes("unterminated")) {
      return "SYNTAX_ERROR";
    }
    if (text.includes("cannot find module") || text.includes("cannot find name") || text.includes("missing import")) {
      return "MISSING_IMPORT";
    }
    if (text.includes("type '") || text.includes("is not assignable to") || text.includes("ts2322") || text.includes("ts2339")) {
      return "TYPE_ERROR";
    }
    if (text.includes("unknown argument") || text.includes("p2002") || text.includes("p1000") || text.includes("model ") || text.includes("prisma")) {
      return "SCHEMA_MISMATCH";
    }
    if (text.includes("truncated") || text.includes("incomplete") || text.includes("ends mid-expression")) {
      return "TRUNCATED_OUTPUT";
    }
    if (text.includes("econnrefused") || text.includes("crash") || text.includes("500") || text.includes("failed to fetch")) {
      return "RUNTIME_FAILURE";
    }
    return "UNKNOWN_DEFECT";
  }

  /**
   * Group related errors across files to prevent conflicting piecemeal repairs.
   */
  public groupDefects(diagnostics: Array<{ file: string; message: string }>): GroupedDefect[] {
    const groups: Map<string, GroupedDefect> = new Map();

    for (const d of diagnostics) {
      const category = SafeRepairCoordinator.classifyRootCause(d.message);
      // Group by category and base directory or error pattern
      const key = `${category}:${d.file.split("/")[0] || "root"}`;
      const existing = groups.get(key);
      if (existing) {
        if (!existing.files.includes(d.file)) existing.files.push(d.file);
        existing.diagnostics.push(d.message);
      } else {
        groups.set(key, {
          groupKey: key,
          category,
          files: [d.file],
          diagnostics: [d.message],
          suggestedAction: `Resolve grouped ${category} across ${d.file}`,
        });
      }
    }

    return Array.from(groups.values());
  }

  /**
   * Propose a traceable repair operation.
   */
  public proposeRepair(params: {
    affectedFile: string;
    diagnostic: string;
    proposedRepair: string;
    featureId?: string;
    contractId?: string;
    validationChecksRequired?: string[];
  }): TraceableRepairOperation {
    const relFile = params.affectedFile.replace(/\\/g, "/");
    const fullPath = join(this.projectRoot, relFile);
    const beforeContent = existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
    const beforeHash = createHash("sha256").update(beforeContent).digest("hex");

    const category = SafeRepairCoordinator.classifyRootCause(params.diagnostic);
    const owningRole = FileOwnershipRegistry.getOwner(relFile);
    const currentAttempts = (this.attemptCountByFile.get(relFile) || 0) + 1;
    this.attemptCountByFile.set(relFile, currentAttempts);

    const ticketId = `REP-${String(this.operations.length + 1).padStart(3, "0")}`;
    const op: TraceableRepairOperation = {
      id: ticketId,
      timestamp: new Date().toISOString(),
      diagnostic: params.diagnostic,
      rootCauseCategory: category,
      affectedFile: relFile,
      owningRole,
      featureId: params.featureId,
      contractId: params.contractId,
      proposedRepair: params.proposedRepair,
      authorizedBy: "SafeRepairCoordinator",
      validationChecksRequired: params.validationChecksRequired || ["typecheck"],
      attemptNumber: currentAttempts,
      maxAttempts: SafeRepairCoordinator.MAX_ATTEMPTS_PER_FILE,
      beforeHash,
      status: currentAttempts > SafeRepairCoordinator.MAX_ATTEMPTS_PER_FILE
        ? "TERMINATED_MAX_RETRIES"
        : "PROPOSED",
      diagnosticEvidence: currentAttempts > SafeRepairCoordinator.MAX_ATTEMPTS_PER_FILE
        ? `TERMINATED: Max retry limit (${SafeRepairCoordinator.MAX_ATTEMPTS_PER_FILE}) reached for file "${relFile}". Halting repair to preserve diagnostics.`
        : undefined,
    };

    this.operations.push(op);
    this.persistReport();
    return op;
  }

  /**
   * Execute an authorized repair.
   */
  public applyRepair(
    ticketId: string,
    repairAction: (originalContent: string) => string
  ): { success: boolean; operation: TraceableRepairOperation; reason?: string } {
    const op = this.operations.find(o => o.id === ticketId);
    if (!op) {
      throw new Error(`REPAIR_TICKET_NOT_FOUND: Ticket ${ticketId} does not exist.`);
    }

    if (op.status === "TERMINATED_MAX_RETRIES") {
      return {
        success: false,
        operation: op,
        reason: `Repair aborted: max retry attempts exceeded for ${op.affectedFile}.`,
      };
    }

    const fullPath = join(this.projectRoot, op.affectedFile);
    if (!existsSync(fullPath)) {
      op.status = "FAILED";
      op.diagnosticEvidence = `File not found on disk: ${op.affectedFile}`;
      this.persistReport();
      return { success: false, operation: op, reason: op.diagnosticEvidence };
    }

    // Verify write authorization through SafeRepairCoordinator
    const auth = FileOwnershipRegistry.canWrite(op.affectedFile, "SafeRepairCoordinator", {
      repairTicketId: op.id,
    });
    if (!auth.allowed) {
      op.status = "FAILED";
      op.diagnosticEvidence = `Write authorization denied: ${auth.reason}`;
      this.persistReport();
      return { success: false, operation: op, reason: auth.reason };
    }

    try {
      const original = readFileSync(fullPath, "utf8");
      const repaired = repairAction(original);
      writeFileSync(fullPath, repaired, "utf8");
      const afterHash = createHash("sha256").update(repaired).digest("hex");
      op.afterHash = afterHash;
      op.status = "APPLIED";
      this.persistReport();
      return { success: true, operation: op };
    } catch (err: any) {
      op.status = "FAILED";
      op.diagnosticEvidence = `Repair application exception: ${err.message}`;
      this.persistReport();
      return { success: false, operation: op, reason: err.message };
    }
  }

  /**
   * Record post-repair validation outcome.
   */
  public recordValidation(ticketId: string, passed: boolean, evidenceNotes: string): void {
    const op = this.operations.find(o => o.id === ticketId);
    if (!op) return;

    if (passed) {
      op.status = "VERIFIED";
      op.diagnosticEvidence = `Repair verified: ${evidenceNotes}`;
    } else {
      op.status = "FAILED";
      op.diagnosticEvidence = `Post-repair verification failed: ${evidenceNotes}`;
    }
    this.persistReport();
  }

  /**
   * Persist repair operations log into .aegis/repair-operations.json.
   */
  private persistReport(): void {
    try {
      const aegisDir = join(this.projectRoot, ".aegis");
      if (!existsSync(aegisDir)) {
        mkdirSync(aegisDir, { recursive: true });
      }
      writeFileSync(
        join(aegisDir, "repair-operations.json"),
        JSON.stringify(this.operations, null, 2),
        "utf8"
      );
    } catch {
      // Non-fatal
    }
  }

  public getOperations(): TraceableRepairOperation[] {
    return [...this.operations];
  }
}

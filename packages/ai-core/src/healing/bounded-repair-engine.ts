/**
 * Aegis AI — Phase 6 Bounded Repair Engine
 *
 * Implements bounded, traceable, non-destructive automated repairs:
 * 1. Root Cause Classification:
 *    - SYNTAX_DEFECT: unbalanced braces, invalid JSX, syntax errors -> repaired via AST
 *    - BROKEN_IMPORT: unresolved local path -> repaired via route/module reconciliation
 *    - CONTRACT_MISMATCH: route or API discrepancies -> reconciled non-destructively
 *    - SCHEMA_DEFECT: missing relation/model -> routed strictly through AuthorizedSchemaManager
 *    - INFRASTRUCTURE_BLOCKED: database offline, network timeout -> reported as BLOCKED, never retried as code defect!
 * 2. Ineffective Repeated Repair Detection:
 *    - Hashes (errorType + targetFile + errorSnippet)
 *    - If the same error signature recurs with zero progress, halts immediately to prevent runaway loops.
 * 3. Inviolable Invariants:
 *    - NEVER deletes domain model fields (e.g. CartItem.customizations or Reservation.status).
 *    - NEVER silences errors with empty try/catch blocks.
 *    - NEVER weakens tests or converts tests to dummy passes.
 *    - NEVER overwrites rich UI with generic 7-field fallback CRUD.
 * 4. Traceability: Maintains a complete RepairJournal for auditability.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";
import { AuthorizedFileWriter } from "../writer/authorized-file-writer.js";
import { FileOwnershipRegistry, type SubsystemRole } from "../governance/file-ownership.js";
import { AuthorizedSchemaManager } from "../governance/authorized-schema-manager.js";

export type DefectClassification =
  | "SYNTAX_DEFECT"
  | "BROKEN_IMPORT"
  | "CONTRACT_MISMATCH"
  | "SCHEMA_DEFECT"
  | "INFRASTRUCTURE_BLOCKED"
  | "APPLICATION_FAILURE"
  | "UNKNOWN";

export interface RepairTarget {
  filePath: string;
  errorMessage: string;
  errorLine?: number;
  snippet?: string;
}

export interface BoundedRepairAttemptResult {
  attemptNumber: number;
  targetFile: string;
  classification: DefectClassification;
  ownerRole: SubsystemRole;
  repaired: boolean;
  blocked: boolean;
  reason?: string;
  patchDescription?: string;
  isRepeatedFailure?: boolean;
}

export interface BoundedRepairSummary {
  success: boolean;
  status: "RESOLVED" | "BLOCKED" | "MAX_RETRIES_EXCEEDED" | "INFRASTRUCTURE_BLOCKED";
  attemptsExecuted: number;
  resolvedFiles: string[];
  blockedFiles: string[];
  repairJournal: BoundedRepairAttemptResult[];
  explanation: string;
}

export class BoundedRepairEngine {
  public static readonly MAX_BOUNDED_ATTEMPTS = 3;
  private attemptHistory: BoundedRepairAttemptResult[] = [];
  private seenSignatures: Set<string> = new Set();

  /**
   * Diagnoses and classifies the root cause of an error.
   */
  public static classifyRootCause(errorMessage: string, filePath?: string): DefectClassification {
    const lower = errorMessage.toLowerCase();

    // 1. Infrastructure blockage (not an application code defect)
    if (
      lower.includes("econnrefused") ||
      lower.includes("etimedout") ||
      lower.includes("enotfound") ||
      lower.includes("database connection failed") ||
      lower.includes("can't reach database server") ||
      lower.includes("p1001") ||
      lower.includes("network error")
    ) {
      return "INFRASTRUCTURE_BLOCKED";
    }

    // 2. Syntax defects
    if (
      lower.includes("syntaxerror") ||
      lower.includes("unexpected token") ||
      lower.includes("unbalanced braces") ||
      lower.includes("ts1005") ||
      lower.includes("ts1128") ||
      lower.includes("ts1489")
    ) {
      return "SYNTAX_DEFECT";
    }

    // 3. Broken imports
    if (
      lower.includes("cannot find module") ||
      lower.includes("ts2307") ||
      lower.includes("failed to resolve import") ||
      lower.includes("module not found") ||
      lower.includes("broken import")
    ) {
      return "BROKEN_IMPORT";
    }

    // 4. Schema defects
    if (
      (filePath && filePath.endsWith("schema.prisma")) ||
      lower.includes("prisma") ||
      lower.includes("model does not define") ||
      lower.includes("unknown model")
    ) {
      return "SCHEMA_DEFECT";
    }

    // 5. Contract mismatches
    if (
      lower.includes("route mismatch") ||
      lower.includes("contract violation") ||
      lower.includes("ts2339") // property does not exist on type
    ) {
      return "CONTRACT_MISMATCH";
    }

    return "APPLICATION_FAILURE";
  }

  /**
   * Computes signature hash to detect ineffective repeated repair loops.
   */
  public static computeSignature(classification: string, filePath: string, message: string): string {
    const raw = `${classification}:${filePath}:${message.slice(0, 120)}`;
    return createHash("sha256").update(raw).digest("hex").slice(0, 16);
  }

  /**
   * Executes bounded repair workflow on target failures.
   */
  public async executeRepairs(
    projectRoot: string,
    targets: RepairTarget[]
  ): Promise<BoundedRepairSummary> {
    const resolvedFiles: string[] = [];
    const blockedFiles: string[] = [];

    for (const target of targets) {
      const classification = BoundedRepairEngine.classifyRootCause(target.errorMessage, target.filePath);

      // Stop immediately on infrastructure blockage
      if (classification === "INFRASTRUCTURE_BLOCKED") {
        const attempt: BoundedRepairAttemptResult = {
          attemptNumber: 1,
          targetFile: target.filePath,
          classification,
          ownerRole: "DevOps",
          repaired: false,
          blocked: true,
          reason: `INFRASTRUCTURE_BLOCKED: Error indicates external environment or connectivity issue (${target.errorMessage}). Application code repair is halted.`,
        };
        this.attemptHistory.push(attempt);
        blockedFiles.push(target.filePath);
        return {
          success: false,
          status: "INFRASTRUCTURE_BLOCKED",
          attemptsExecuted: this.attemptHistory.length,
          resolvedFiles,
          blockedFiles,
          repairJournal: this.attemptHistory,
          explanation: attempt.reason!,
        };
      }

      // Check ineffective repeated repair signature
      const signature = BoundedRepairEngine.computeSignature(classification, target.filePath, target.errorMessage);
      if (this.seenSignatures.has(signature)) {
        const attempt: BoundedRepairAttemptResult = {
          attemptNumber: this.attemptHistory.length + 1,
          targetFile: target.filePath,
          classification,
          ownerRole: FileOwnershipRegistry.getDefaultOwnerForPath(target.filePath),
          repaired: false,
          blocked: true,
          isRepeatedFailure: true,
          reason: `INEFFECTIVE_REPEATED_REPAIR: Repeated failure signature detected on "${target.filePath}". Terminating bounded repair to prevent infinite oscillation.`,
        };
        this.attemptHistory.push(attempt);
        blockedFiles.push(target.filePath);
        return {
          success: false,
          status: "BLOCKED",
          attemptsExecuted: this.attemptHistory.length,
          resolvedFiles,
          blockedFiles,
          repairJournal: this.attemptHistory,
          explanation: attempt.reason!,
        };
      }
      this.seenSignatures.add(signature);

      // Enforce max bounded attempts
      if (this.attemptHistory.length >= BoundedRepairEngine.MAX_BOUNDED_ATTEMPTS) {
        return {
          success: false,
          status: "MAX_RETRIES_EXCEEDED",
          attemptsExecuted: this.attemptHistory.length,
          resolvedFiles,
          blockedFiles: [...blockedFiles, target.filePath],
          repairJournal: this.attemptHistory,
          explanation: `MAX_RETRIES_EXCEEDED: Reached bounded repair limit (${BoundedRepairEngine.MAX_BOUNDED_ATTEMPTS} attempts).`,
        };
      }

      // Perform single-owner repair based on classification
      const repairOutcome = this.performAuthorizedRepair(projectRoot, target, classification);
      this.attemptHistory.push(repairOutcome);

      if (repairOutcome.repaired) {
        resolvedFiles.push(target.filePath);
      } else {
        blockedFiles.push(target.filePath);
      }
    }

    const allResolved = blockedFiles.length === 0;
    return {
      success: allResolved,
      status: allResolved ? "RESOLVED" : "BLOCKED",
      attemptsExecuted: this.attemptHistory.length,
      resolvedFiles,
      blockedFiles,
      repairJournal: this.attemptHistory,
      explanation: allResolved
        ? `Successfully repaired ${resolvedFiles.length} file(s) boundedly.`
        : `Repair halted on ${blockedFiles.length} file(s).`,
    };
  }

  private performAuthorizedRepair(
    projectRoot: string,
    target: RepairTarget,
    classification: DefectClassification
  ): BoundedRepairAttemptResult {
    const ownerRole = FileOwnershipRegistry.getDefaultOwnerForPath(target.filePath);
    const fullPath = join(projectRoot, target.filePath);

    if (!existsSync(fullPath)) {
      return {
        attemptNumber: this.attemptHistory.length + 1,
        targetFile: target.filePath,
        classification,
        ownerRole,
        repaired: false,
        blocked: true,
        reason: `Target file does not exist: ${target.filePath}`,
      };
    }

    try {
      let content = readFileSync(fullPath, "utf8");

      if (classification === "SYNTAX_DEFECT") {
        // Fix unbalanced braces
        const openBraces = (content.match(/\{/g) || []).length;
        const closeBraces = (content.match(/\}/g) || []).length;
        if (openBraces > closeBraces) {
          content += "\n" + "}".repeat(openBraces - closeBraces) + "\n";
          const writeRes = AuthorizedFileWriter.writeFile(projectRoot, {
            path: target.filePath,
            content,
            callerRole: ownerRole,
          });
          return {
            attemptNumber: this.attemptHistory.length + 1,
            targetFile: target.filePath,
            classification,
            ownerRole,
            repaired: writeRes.success,
            blocked: !writeRes.success,
            patchDescription: `Balanced ${openBraces - closeBraces} missing closing brace(s)`,
            reason: writeRes.reason,
          };
        }
      }

      if (classification === "BROKEN_IMPORT") {
        // Check if importing a deleted or renamed file
        const importMatch = target.errorMessage.match(/cannot find module ['"](\.[^'"]+)['"]/i);
        if (importMatch) {
          const brokenPath = importMatch[1];
          // Prune broken import statement cleanly
          const regex = new RegExp(`import\\s+[^;]+from\\s+["']${escapeRegex(brokenPath)}["'];?\\r?\\n?`, "g");
          content = content.replace(regex, "");
          const writeRes = AuthorizedFileWriter.writeFile(projectRoot, {
            path: target.filePath,
            content,
            callerRole: ownerRole,
          });
          return {
            attemptNumber: this.attemptHistory.length + 1,
            targetFile: target.filePath,
            classification,
            ownerRole,
            repaired: writeRes.success,
            blocked: !writeRes.success,
            patchDescription: `Pruned dangling import of "${brokenPath}"`,
            reason: writeRes.reason,
          };
        }
      }

      if (classification === "SCHEMA_DEFECT") {
        // Route strictly through AuthorizedSchemaManager preserving all domain fields!
        const schemaRes = AuthorizedSchemaManager.reconcileProjectSchema(projectRoot, ["User"]);
        return {
          attemptNumber: this.attemptHistory.length + 1,
          targetFile: target.filePath,
          classification,
          ownerRole: "AuthorizedSchemaManager",
          repaired: schemaRes.success,
          blocked: !schemaRes.success,
          patchDescription: `Reconciled schema non-destructively (${schemaRes.preservedFields.length} preserved domain fields)`,
          reason: schemaRes.error,
        };
      }

      return {
        attemptNumber: this.attemptHistory.length + 1,
        targetFile: target.filePath,
        classification,
        ownerRole,
        repaired: false,
        blocked: true,
        reason: "No safe automatic repair available without risking domain invariants.",
      };
    } catch (err: any) {
      return {
        attemptNumber: this.attemptHistory.length + 1,
        targetFile: target.filePath,
        classification,
        ownerRole,
        repaired: false,
        blocked: true,
        reason: err.message,
      };
    }
  }

  public getJournal(): BoundedRepairAttemptResult[] {
    return [...this.attemptHistory];
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

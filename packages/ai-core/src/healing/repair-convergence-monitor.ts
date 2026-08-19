/**
 * RepairConvergenceMonitor
 *
 * Implements monotonic convergence tracking, failure state fingerprinting,
 * failure comparison (improvement vs neutral vs regression), and oscillation protection
 * (preventing A -> B -> A cycles and deduplicating identical candidates).
 */

import { createHash } from "node:crypto";

export interface ClassifiedDiagnosticError {
  raw: string;
  file: string;
  line?: number;
  col?: number;
  code: string;
  message: string;
  normalizedSignature: string;
}

export interface FailureDiagnosticState {
  blockingErrorCount: number;
  errorCodes: string[];
  affectedFiles: string[];
  errors: ClassifiedDiagnosticError[];
  fingerprint: string;
}

export type StateComparisonVerdict =
  | "IMPROVED"
  | "NEUTRAL_PROGRESS"
  | "REGRESSION"
  | "OSCILLATION"
  | "IDENTICAL";

export interface StateComparisonResult {
  verdict: StateComparisonVerdict;
  beforeCount: number;
  afterCount: number;
  resolvedErrors: string[];
  newErrors: string[];
  reason: string;
}

export class RepairConvergenceMonitor {
  private static readonly TS_ERROR_REGEX = /^([^(]+)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/gm;

  /**
   * Extract a structured failure diagnostic state from compiler stderr / stdout.
   */
  public static extractDiagnosticState(diagnosticsText: string): FailureDiagnosticState {
    const text = diagnosticsText || "";
    const errors: ClassifiedDiagnosticError[] = [];
    const affectedFilesSet = new Set<string>();
    const errorCodesSet = new Set<string>();

    const matches = text.matchAll(/^([^(]+)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/gm);
    for (const m of matches) {
      const file = m[1].trim().replace(/\\/g, "/");
      const line = parseInt(m[2], 10);
      const col = parseInt(m[3], 10);
      const code = m[4].trim();
      const message = m[5].trim();

      affectedFilesSet.add(file);
      errorCodesSet.add(code);

      // Normalize message by stripping transient memory addresses or absolute paths
      const normalizedMessage = message
        .replace(/'.*?[\\\/]([a-zA-Z0-9_.-]+)'/g, "'$1'")
        .replace(/".*?[\\\/]([a-zA-Z0-9_.-]+)"/g, '"$1"');

      const normalizedSignature = `${code}:${file}:${normalizedMessage}`;

      errors.push({
        raw: m[0],
        file,
        line,
        col,
        code,
        message,
        normalizedSignature,
      });
    }

    // Fallback if no structured TS errors matched but text has ELIFECYCLE or generic failure
    if (errors.length === 0 && (text.includes("error") || text.includes("Error") || text.includes("ELIFECYCLE"))) {
      const lines = text.split(/\r?\n/).filter(l => l.toLowerCase().includes("error"));
      for (const line of lines.slice(0, 10)) {
        const norm = line.trim();
        errors.push({
          raw: line,
          file: "unknown",
          code: "GENERIC_ERROR",
          message: norm,
          normalizedSignature: `GENERIC_ERROR:${norm}`,
        });
      }
    }

    const blockingErrorCount = errors.length;
    const errorCodes = Array.from(errorCodesSet).sort();
    const affectedFiles = Array.from(affectedFilesSet).sort();

    // Fingerprint based on sorted normalized error signatures
    const sortedSignatures = errors.map(e => e.normalizedSignature).sort();
    const fingerprint = createHash("sha256")
      .update(sortedSignatures.join("|"))
      .digest("hex")
      .slice(0, 16);

    return {
      blockingErrorCount,
      errorCodes,
      affectedFiles,
      errors,
      fingerprint,
    };
  }

  /**
   * Compare before-repair state with after-repair state.
   */
  public static compareStates(
    before: FailureDiagnosticState,
    after: FailureDiagnosticState,
    rejectedFingerprints: Set<string> = new Set()
  ): StateComparisonResult {
    const beforeSigs = new Set(before.errors.map(e => e.normalizedSignature));
    const afterSigs = new Set(after.errors.map(e => e.normalizedSignature));

    const resolvedErrors = [...beforeSigs].filter(sig => !afterSigs.has(sig));
    const newErrors = [...afterSigs].filter(sig => !beforeSigs.has(sig));

    // 1. Identical state (no change)
    if (before.fingerprint === after.fingerprint) {
      return {
        verdict: "IDENTICAL",
        beforeCount: before.blockingErrorCount,
        afterCount: after.blockingErrorCount,
        resolvedErrors: [],
        newErrors: [],
        reason: "Repair candidate produced an identical failure state.",
      };
    }

    // 2. Previously rejected state (oscillation detection)
    if (rejectedFingerprints.has(after.fingerprint)) {
      return {
        verdict: "OSCILLATION",
        beforeCount: before.blockingErrorCount,
        afterCount: after.blockingErrorCount,
        resolvedErrors,
        newErrors,
        reason: `Repair transitioned into previously rejected state [${after.fingerprint}].`,
      };
    }

    // 3. Clear Improvement: error count strictly decreased and no massive new errors
    if (after.blockingErrorCount < before.blockingErrorCount) {
      return {
        verdict: "IMPROVED",
        beforeCount: before.blockingErrorCount,
        afterCount: after.blockingErrorCount,
        resolvedErrors,
        newErrors,
        reason: `Error count decreased from ${before.blockingErrorCount} to ${after.blockingErrorCount}. Resolved ${resolvedErrors.length} error(s).`,
      };
    }

    // 4. Regression: error count increased
    if (after.blockingErrorCount > before.blockingErrorCount) {
      return {
        verdict: "REGRESSION",
        beforeCount: before.blockingErrorCount,
        afterCount: after.blockingErrorCount,
        resolvedErrors,
        newErrors,
        reason: `Error count increased from ${before.blockingErrorCount} to ${after.blockingErrorCount} (+${newErrors.length} new errors).`,
      };
    }

    // 5. Same error count: Check if errors changed meaningfully
    if (resolvedErrors.length > 0 && newErrors.length === resolvedErrors.length) {
      return {
        verdict: "NEUTRAL_PROGRESS",
        beforeCount: before.blockingErrorCount,
        afterCount: after.blockingErrorCount,
        resolvedErrors,
        newErrors,
        reason: `Error count unchanged (${before.blockingErrorCount}), but resolved ${resolvedErrors.length} specific error(s).`,
      };
    }

    return {
      verdict: "REGRESSION",
      beforeCount: before.blockingErrorCount,
      afterCount: after.blockingErrorCount,
      resolvedErrors,
      newErrors,
      reason: "No measurable progress made in resolving compilation errors.",
    };
  }
}

/**
 * State tracker across multiple attempts of a healing transaction.
 */
export class RepairConvergenceTracker {
  private history: { attempt: number; fingerprint: string; errorCount: number; verdict: StateComparisonVerdict }[] = [];
  private seenFingerprints: Set<string> = new Set();
  private rejectedFingerprints: Set<string> = new Set();
  private candidatePatchHashes: Set<string> = new Set();
  private currentBaselineState: FailureDiagnosticState | null = null;

  constructor(initialDiagnostics: string) {
    this.currentBaselineState = RepairConvergenceMonitor.extractDiagnosticState(initialDiagnostics);
    this.seenFingerprints.add(this.currentBaselineState.fingerprint);
  }

  public getBaseline(): FailureDiagnosticState {
    return this.currentBaselineState!;
  }

  /**
   * Check if a proposed patch has already been tried in this healing transaction.
   */
  public isDuplicateCandidate(patchContent: string): boolean {
    const hash = createHash("sha256").update(patchContent.trim()).digest("hex").slice(0, 16);
    if (this.candidatePatchHashes.has(hash)) {
      return true;
    }
    this.candidatePatchHashes.add(hash);
    return false;
  }

  /**
   * Evaluate candidate execution and determine whether to accept or rollback.
   */
  public evaluateCandidate(
    attempt: number,
    afterDiagnostics: string
  ): {
    accepted: boolean;
    comparison: StateComparisonResult;
    nextBaseline: FailureDiagnosticState;
  } {
    const afterState = RepairConvergenceMonitor.extractDiagnosticState(afterDiagnostics);
    const comparison = RepairConvergenceMonitor.compareStates(
      this.currentBaselineState!,
      afterState,
      this.rejectedFingerprints
    );

    this.history.push({
      attempt,
      fingerprint: afterState.fingerprint,
      errorCount: afterState.blockingErrorCount,
      verdict: comparison.verdict,
    });

    if (comparison.verdict === "IMPROVED" || (afterState.blockingErrorCount === 0)) {
      // Accept improvement as new baseline
      this.currentBaselineState = afterState;
      this.seenFingerprints.add(afterState.fingerprint);
      return {
        accepted: true,
        comparison,
        nextBaseline: afterState,
      };
    }

    if (comparison.verdict === "NEUTRAL_PROGRESS") {
      // Neutral progress can be accepted conditionally if not previously seen
      if (!this.seenFingerprints.has(afterState.fingerprint)) {
        this.currentBaselineState = afterState;
        this.seenFingerprints.add(afterState.fingerprint);
        return {
          accepted: true,
          comparison,
          nextBaseline: afterState,
        };
      }
    }

    // Otherwise rejected: mark fingerprint as rejected to prevent oscillation
    this.rejectedFingerprints.add(afterState.fingerprint);
    return {
      accepted: false,
      comparison,
      nextBaseline: this.currentBaselineState!,
    };
  }

  public getHistory() {
    return [...this.history];
  }
}

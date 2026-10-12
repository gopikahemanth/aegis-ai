/**
 * CompositionConvergenceGate
 *
 * Enforces structural divergence across generated pages sharing the same
 * experience capability. Detects and fails if multiple outputs collapse into
 * the same structural wireframe/fingerprint.
 */

import type { CompositionVariant } from "../design/composition-variant-resolver.js";

export interface CompositionAuditSample {
  domain: string;
  route: string;
  capability: string;
  composition: CompositionVariant;
}

export interface CompositionAuditReport {
  passed: boolean;
  totalSamples: number;
  distinctFingerprints: number;
  fingerprintDistribution: Record<string, number>;
  maxDominanceRatio: number;
  failures: string[];
}

export class CompositionConvergenceGate {
  /**
   * Audits a set of composition samples for a given capability.
   * Requires:
   * - Across >= 5 samples, at least 3 distinct structural fingerprints must be present.
   * - No single structural fingerprint may exceed 60% of the sample set (maxDominanceRatio <= 0.6).
   */
  public static auditCapabilitySamples(
    capability: string,
    samples: CompositionAuditSample[]
  ): CompositionAuditReport {
    const relevant = samples.filter(s => s.capability === capability);
    if (relevant.length < 3) {
      // Not enough samples to evaluate convergence
      return {
        passed: true,
        totalSamples: relevant.length,
        distinctFingerprints: relevant.length,
        fingerprintDistribution: {},
        maxDominanceRatio: 1.0,
        failures: [],
      };
    }

    const distribution: Record<string, number> = {};
    for (const sample of relevant) {
      const fp = sample.composition.structuralFingerprint;
      distribution[fp] = (distribution[fp] || 0) + 1;
    }

    const distinctCount = Object.keys(distribution).length;
    let maxCount = 0;
    for (const count of Object.values(distribution)) {
      if (count > maxCount) maxCount = count;
    }
    const maxDominanceRatio = maxCount / relevant.length;

    const failures: string[] = [];

    // Rule 1: If 5 or more samples, require at least 3 distinct structural fingerprints
    if (relevant.length >= 5 && distinctCount < 3) {
      failures.push(
        `Capability "${capability}" converged to only ${distinctCount} distinct structural fingerprints across ${relevant.length} samples (minimum required: 3).`
      );
    }

    // Rule 2: If 4 samples, require at least 2 distinct structural fingerprints
    if (relevant.length === 4 && distinctCount < 2) {
      failures.push(
        `Capability "${capability}" converged to a single structural fingerprint across 4 samples.`
      );
    }

    // Rule 3: Max dominance check
    if (relevant.length >= 5 && maxDominanceRatio > 0.6) {
      failures.push(
        `Capability "${capability}" has structural dominance ratio of ${(maxDominanceRatio * 100).toFixed(0)}%, exceeding the 60% threshold.`
      );
    }

    return {
      passed: failures.length === 0,
      totalSamples: relevant.length,
      distinctFingerprints: distinctCount,
      fingerprintDistribution: distribution,
      maxDominanceRatio,
      failures,
    };
  }

  /**
   * Batch audit across all capabilities in a test run.
   */
  public static auditBatch(samples: CompositionAuditSample[]): {
    passed: boolean;
    reports: Record<string, CompositionAuditReport>;
  } {
    const capabilities = Array.from(new Set(samples.map(s => s.capability)));
    const reports: Record<string, CompositionAuditReport> = {};
    let passed = true;

    for (const cap of capabilities) {
      const report = this.auditCapabilitySamples(cap, samples);
      reports[cap] = report;
      if (!report.passed) {
        passed = false;
      }
    }

    return { passed, reports };
  }
}

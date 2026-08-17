/**
 * VerificationMatrix
 *
 * Tracks 13 distinct verification dimensions per feature:
 * Contract, FileGraph, ImportExport, TypeCheck, Build, UnitTest, Api,
 * Database, Browser, Reality, Security, Visual, GoldenWorkflow.
 *
 * Status values: PASS | FAIL | BLOCKED | NOT_APPLICABLE | UNVERIFIED
 */

export type DimensionStatus = "PASS" | "FAIL" | "BLOCKED" | "NOT_APPLICABLE" | "UNVERIFIED";

export interface FeatureVerificationRecord {
  featureId: string;
  dimensions: {
    contract: DimensionStatus;
    fileGraph: DimensionStatus;
    importExport: DimensionStatus;
    typeCheck: DimensionStatus;
    build: DimensionStatus;
    unitTest: DimensionStatus;
    api: DimensionStatus;
    database: DimensionStatus;
    browser: DimensionStatus;
    reality: DimensionStatus;
    security: DimensionStatus;
    visual: DimensionStatus;
    goldenWorkflow: DimensionStatus;
  };
  evidence: string[];
}

export interface VerificationMatrixReport {
  isVerified: boolean;
  totalFeatures: number;
  fullyVerifiedFeatures: number;
  failures: string[];
  summary: string;
}

export class VerificationMatrix {
  private featureRecords: Map<string, FeatureVerificationRecord> = new Map();

  public registerFeature(featureId: string, initialDefaults?: Partial<FeatureVerificationRecord["dimensions"]>): void {
    this.featureRecords.set(featureId, {
      featureId,
      dimensions: {
        contract: "UNVERIFIED",
        fileGraph: "UNVERIFIED",
        importExport: "UNVERIFIED",
        typeCheck: "UNVERIFIED",
        build: "UNVERIFIED",
        unitTest: "UNVERIFIED",
        api: "UNVERIFIED",
        database: "UNVERIFIED",
        browser: "UNVERIFIED",
        reality: "UNVERIFIED",
        security: "UNVERIFIED",
        visual: "UNVERIFIED",
        goldenWorkflow: "UNVERIFIED",
        ...(initialDefaults || {}),
      },
      evidence: [],
    });
  }

  public setDimension(
    featureId: string,
    dimension: keyof FeatureVerificationRecord["dimensions"],
    status: DimensionStatus,
    evidenceNote?: string
  ): void {
    let rec = this.featureRecords.get(featureId);
    if (!rec) {
      this.registerFeature(featureId);
      rec = this.featureRecords.get(featureId)!;
    }
    rec.dimensions[dimension] = status;
    if (evidenceNote) rec.evidence.push(evidenceNote);
  }

  public evaluate(): VerificationMatrixReport {
    const failures: string[] = [];
    let fullyVerified = 0;

    for (const [featureId, rec] of this.featureRecords.entries()) {
      let featurePassed = true;

      for (const [dim, stat] of Object.entries(rec.dimensions)) {
        if (stat === "FAIL" || stat === "BLOCKED" || stat === "UNVERIFIED") {
          failures.push(`Feature "${featureId}" failed verification dimension "${dim}": status is ${stat}`);
          featurePassed = false;
        }
      }

      if (featurePassed) fullyVerified++;
    }

    const isVerified = failures.length === 0 && this.featureRecords.size > 0;

    return {
      isVerified,
      totalFeatures: this.featureRecords.size,
      fullyVerifiedFeatures: fullyVerified,
      failures,
      summary: isVerified
        ? `VERIFICATION MATRIX PASSED: All ${fullyVerified}/${this.featureRecords.size} features passed all applicable 13 verification dimensions.`
        : `VERIFICATION MATRIX FAILED: ${failures.length} verification issue(s) detected across features.`,
    };
  }
}

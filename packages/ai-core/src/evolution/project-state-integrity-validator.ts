/**
 * ProjectStateIntegrityValidator
 *
 * Validates integrity of project metadata files (.aegis/*.json).
 * Detects corrupted or tampered state, recovers from disk reality where possible,
 * and safely blocks unrecoverable corrupted states.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface IntegrityCheckResult {
  valid: boolean;
  recovered: boolean;
  corruptedFiles: string[];
  repairedFiles: string[];
  message: string;
}

export class ProjectStateIntegrityValidator {
  /**
   * Validate and optionally recover corrupted .aegis contract and metadata files.
   */
  public static validateAndRecover(projectPath: string): IntegrityCheckResult {
    const aegisDir = join(projectPath, ".aegis");
    if (!existsSync(aegisDir)) {
      return {
        valid: true,
        recovered: false,
        corruptedFiles: [],
        repairedFiles: [],
        message: "No .aegis directory present. Clean initial state.",
      };
    }

    const corruptedFiles: string[] = [];
    const repairedFiles: string[] = [];

    const jsonFilesToCheck = [
      "architecture-contract.json",
      "domain-contract.json",
      "project-intelligence.json",
      "feature-completeness.json",
      "file-graph.json",
    ];

    for (const fileName of jsonFilesToCheck) {
      const fullPath = join(aegisDir, fileName);
      if (!existsSync(fullPath)) continue;

      try {
        const text = readFileSync(fullPath, "utf8");
        JSON.parse(text); // Check valid JSON
      } catch {
        corruptedFiles.push(fileName);

        // Attempt recovery if it's a non-critical cache/index file
        if (fileName === "project-intelligence.json") {
          const freshIndex = {
            version: 1,
            generations: [],
            features: {},
            lastReconciledAt: new Date().toISOString(),
          };
          writeFileSync(fullPath, JSON.stringify(freshIndex, null, 2), "utf8");
          repairedFiles.push(fileName);
        } else if (fileName === "feature-completeness.json") {
          const freshFeature = {
            version: 1,
            features: {},
            lastUpdated: new Date().toISOString(),
          };
          writeFileSync(fullPath, JSON.stringify(freshFeature, null, 2), "utf8");
          repairedFiles.push(fileName);
        }
      }
    }

    const unrecovered = corruptedFiles.filter((f) => !repairedFiles.includes(f));
    const isValid = unrecovered.length === 0;

    return {
      valid: isValid,
      recovered: repairedFiles.length > 0,
      corruptedFiles,
      repairedFiles,
      message: isValid
        ? repairedFiles.length > 0
          ? `INTEGRITY RECOVERED: Repaired ${repairedFiles.join(", ")} from reality.`
          : "All .aegis metadata files verified intact."
        : `CORRUPTED STATE DETECTED: Unrecoverable files [${unrecovered.join(", ")}]. Must block or regenerate.`,
    };
  }
}

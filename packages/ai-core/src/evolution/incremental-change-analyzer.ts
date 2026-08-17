/**
 * IncrementalChangeAnalyzer
 *
 * Classifies user change requests, determines minimal change set and blast radius,
 * produces ChangeSet, and enforces file preservation.
 */

import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ChangeCategory =
  | "NEW_FEATURE"
  | "FEATURE_MODIFICATION"
  | "FEATURE_REMOVAL"
  | "BUG_FIX"
  | "REFACTOR"
  | "UI_CHANGE"
  | "API_CHANGE"
  | "DATA_CHANGE"
  | "DEPENDENCY_CHANGE"
  | "ARCHITECTURE_CHANGE"
  | "SECURITY_CHANGE"
  | "PERFORMANCE_CHANGE";

export type BlastRadius =
  | "LOCAL"
  | "FEATURE"
  | "CROSS_FEATURE"
  | "API"
  | "DATA"
  | "ARCHITECTURE"
  | "GLOBAL";

export interface ChangeSet {
  generationId: string;
  category: ChangeCategory;
  blastRadius: BlastRadius;
  createdFiles: string[];
  modifiedFiles: string[];
  deletedFiles: string[];
  preservedFiles: string[];
  fileHashesBefore: Record<string, string>;
  fileHashesAfter: Record<string, string>;
}

export interface ChangeImpactReport {
  category: ChangeCategory;
  blastRadius: BlastRadius;
  targetFeatures: string[];
  directlyAffectedFiles: string[];
  preservedFiles: string[];
  requiresSchemaMigration: boolean;
  requiresApiContractUpdate: boolean;
  requiresFullRegression: boolean;
  explanation: string;
}

export class IncrementalChangeAnalyzer {
  /**
   * Classify request and estimate blast radius.
   */
  public static analyzeRequest(
    userPrompt: string,
    existingFiles: string[] = [],
    existingFeatures: string[] = []
  ): ChangeImpactReport {
    const promptLower = userPrompt.toLowerCase();
    let category: ChangeCategory = "NEW_FEATURE";
    let blastRadius: BlastRadius = "FEATURE";
    let requiresSchemaMigration = false;
    let requiresApiContractUpdate = false;
    let requiresFullRegression = false;

    if (promptLower.includes("migrate to") || promptLower.includes("switch framework")) {
      category = "ARCHITECTURE_CHANGE";
      blastRadius = "ARCHITECTURE";
      requiresFullRegression = true;
    } else if (promptLower.includes("remove ") || promptLower.includes("delete feature")) {
      category = "FEATURE_REMOVAL";
      blastRadius = "FEATURE";
    } else if (promptLower.includes("fix ") || promptLower.includes("bug") || promptLower.includes("error")) {
      category = "BUG_FIX";
      blastRadius = "LOCAL";
    } else if (promptLower.includes("style") || promptLower.includes("cleaner") || promptLower.includes("color") || promptLower.includes("css")) {
      category = "UI_CHANGE";
      blastRadius = "LOCAL";
    } else if (promptLower.includes("faster") || promptLower.includes("optimize") || promptLower.includes("performance")) {
      category = "PERFORMANCE_CHANGE";
      blastRadius = "FEATURE";
    } else if (promptLower.includes("auth") || promptLower.includes("permission") || promptLower.includes("security")) {
      category = "SECURITY_CHANGE";
      blastRadius = "CROSS_FEATURE";
      requiresApiContractUpdate = true;
    } else if (promptLower.includes("update ") || promptLower.includes("change ") || promptLower.includes("modify ")) {
      category = "FEATURE_MODIFICATION";
      blastRadius = "FEATURE";
    } else {
      category = "NEW_FEATURE";
      blastRadius = "FEATURE";
    }

    if (promptLower.includes("table") || promptLower.includes("schema") || promptLower.includes("model") || promptLower.includes("database")) {
      requiresSchemaMigration = true;
      blastRadius = "DATA";
    }
    if (promptLower.includes("api") || promptLower.includes("endpoint") || promptLower.includes("route")) {
      requiresApiContractUpdate = true;
    }

    // Determine target features
    const targetFeatures = existingFeatures.filter((f) => promptLower.includes(f.toLowerCase()));
    if (targetFeatures.length === 0 && category === "NEW_FEATURE") {
      targetFeatures.push(promptLower.replace(/^(add|create|implement)\s+/i, "").slice(0, 30));
    }

    return {
      category,
      blastRadius,
      targetFeatures,
      directlyAffectedFiles: [],
      preservedFiles: existingFiles,
      requiresSchemaMigration,
      requiresApiContractUpdate,
      requiresFullRegression,
      explanation: `Request classified as ${category} with blast radius ${blastRadius}. Minimal targeted execution applied.`,
    };
  }

  /**
   * Produce ChangeSet and verify that untouched files remain bit-identical.
   */
  public static verifyFilePreservation(
    projectPath: string,
    changeSet: ChangeSet
  ): { preservedValid: boolean; corruptedFiles: string[] } {
    const corruptedFiles: string[] = [];

    for (const preservedFile of changeSet.preservedFiles) {
      const beforeHash = changeSet.fileHashesBefore[preservedFile];
      if (!beforeHash) continue;

      const fullPath = join(projectPath, preservedFile);
      if (!existsSync(fullPath)) {
        corruptedFiles.push(`${preservedFile} (DELETED_UNEXPECTEDLY)`);
        continue;
      }

      try {
        const content = readFileSync(fullPath, "utf8");
        const afterHash = createHash("sha256").update(content).digest("hex").slice(0, 16);
        if (beforeHash !== afterHash) {
          corruptedFiles.push(`${preservedFile} (MODIFIED_WITHOUT_AUTHORIZATION)`);
        }
      } catch {
        corruptedFiles.push(`${preservedFile} (UNREADABLE)`);
      }
    }

    return {
      preservedValid: corruptedFiles.length === 0,
      corruptedFiles,
    };
  }
}

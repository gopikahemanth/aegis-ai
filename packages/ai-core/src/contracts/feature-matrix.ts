/**
 * FeatureMatrix
 *
 * Single framework-owned requirements and feature specification for generated projects.
 * Stored at `.aegis/feature-matrix.json`.
 *
 * Implements Milestone 2:
 * 1. Requirements Authority: Versioned, schema-validated feature matrix.
 * 2. Deterministic Feature IDs (F01, F02, ...).
 * 3. End-to-end traceability linking:
 *    Feature -> Routes -> Components -> API Endpoints -> Data Models -> Acceptance Tests -> Evidence.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { HttpMethod } from "../governance/api-contract-registry.js";

export type FeaturePriority = "must-have" | "should-have" | "optional";

export type FeatureVerificationStatus =
  | "UNVERIFIED"
  | "VERIFIED"
  | "FAILED"
  | "BLOCKED";

export type TestVerificationStrategy =
  | "unit"
  | "api-integration"
  | "database"
  | "browser"
  | "e2e";

export interface FeatureEndpointRef {
  method: HttpMethod;
  path: string;
  operationId?: string;
  expectedStatus?: number;
}

export interface FeatureModelRef {
  model: string;
  fields: string[];
  requiredRelations?: string[];
}

export interface FeatureAcceptanceTestRef {
  testId: string;
  strategy: TestVerificationStrategy;
  description: string;
  verified?: boolean;
  evidence?: string;
}

export interface FeatureDefinition {
  /** Deterministic feature ID, e.g. "F01", "F02" */
  id: string;
  /** Concise, clear title */
  title: string;
  /** Detailed requirement description */
  description: string;
  /** Feature priority */
  priority: FeaturePriority;
  /** User-visible expected behavior */
  expectedBehavior: string;
  /** Relevant frontend routes */
  routes: string[];
  /** Primary UI components */
  components: string[];
  /** Required API endpoints */
  apiEndpoints: FeatureEndpointRef[];
  /** Data models and required fields */
  dataModels: FeatureModelRef[];
  /** Validation and error states */
  validationRules: string[];
  /** Acceptance test identifiers and strategies */
  acceptanceTests: FeatureAcceptanceTestRef[];
  /** Current verification status */
  verificationStatus: FeatureVerificationStatus;
  /** Verification evidence notes or report reference */
  evidenceNotes?: string;
}

export interface FeatureMatrix {
  version: "1.0.0";
  projectName: string;
  domainName: string;
  generatedAt: string;
  updatedAt: string;
  totalFeatures: number;
  mustHaveCount: number;
  verifiedCount: number;
  features: FeatureDefinition[];
}

export interface FeatureMatrixValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class FeatureMatrixManager {
  public static readonly CURRENT_VERSION = "1.0.0";

  /**
   * Deterministically assign stable IDs (F01, F02, ...) to features.
   */
  public static assignFeatureIds(features: Array<Omit<FeatureDefinition, "id">>): FeatureDefinition[] {
    return features.map((f, index) => {
      const num = index + 1;
      const id = `F${num.toString().padStart(2, "0")}`;
      return {
        ...f,
        id,
      };
    });
  }

  /**
   * Validate a FeatureMatrix structure and semantic invariants.
   */
  public static validate(matrix: FeatureMatrix): FeatureMatrixValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!matrix) {
      return { valid: false, errors: ["FeatureMatrix is undefined or null."], warnings: [] };
    }

    if (matrix.version !== this.CURRENT_VERSION) {
      errors.push(`Unsupported FeatureMatrix version: "${matrix.version}". Expected "${this.CURRENT_VERSION}".`);
    }

    if (!matrix.projectName || matrix.projectName.trim().length === 0) {
      errors.push("FeatureMatrix must specify a valid projectName.");
    }

    if (!Array.isArray(matrix.features) || matrix.features.length === 0) {
      errors.push("FeatureMatrix must define at least one feature in features array.");
      return { valid: false, errors, warnings };
    }

    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();

    for (let i = 0; i < matrix.features.length; i++) {
      const f = matrix.features[i];
      const prefix = `Feature[${i}] (${f.id || "no-id"})`;

      if (!f.id || !/^F\d{2,}$/.test(f.id)) {
        errors.push(`${prefix}: Invalid feature ID format "${f.id}". Must follow format "F01", "F02", etc.`);
      } else if (seenIds.has(f.id)) {
        errors.push(`${prefix}: Duplicate feature ID "${f.id}".`);
      } else {
        seenIds.add(f.id);
      }

      if (!f.title || f.title.trim().length === 0) {
        errors.push(`${prefix}: Missing required feature title.`);
      } else if (seenTitles.has(f.title.toLowerCase())) {
        warnings.push(`${prefix}: Potential duplicate feature title "${f.title}".`);
      } else {
        seenTitles.add(f.title.toLowerCase());
      }

      if (!f.description || f.description.trim().length === 0) {
        errors.push(`${prefix}: Missing required feature description.`);
      }

      if (!["must-have", "should-have", "optional"].includes(f.priority)) {
        errors.push(`${prefix}: Invalid priority "${f.priority}". Must be "must-have", "should-have", or "optional".`);
      }

      if (!f.expectedBehavior || f.expectedBehavior.trim().length === 0) {
        errors.push(`${prefix}: Missing expectedBehavior definition.`);
      }

      // Check routes
      if (!Array.isArray(f.routes) || f.routes.length === 0) {
        warnings.push(`${prefix}: No frontend routes declared.`);
      }

      // Must-have features require acceptance test references
      if (f.priority === "must-have") {
        if (!Array.isArray(f.acceptanceTests) || f.acceptanceTests.length === 0) {
          errors.push(`${prefix}: Must-have feature must define at least one acceptance test.`);
        } else {
          for (const test of f.acceptanceTests) {
            if (!test.testId || !test.strategy) {
              errors.push(`${prefix}: Acceptance test must have valid testId and strategy.`);
            }
          }
        }
      }

      // Validate endpoints
      if (Array.isArray(f.apiEndpoints)) {
        for (const ep of f.apiEndpoints) {
          if (!ep.method || !ep.path) {
            errors.push(`${prefix}: API endpoint missing method or path.`);
          }
          if (ep.path && !ep.path.startsWith("/")) {
            errors.push(`${prefix}: API endpoint path must start with "/" (got "${ep.path}").`);
          }
        }
      }

      // Validate models
      if (Array.isArray(f.dataModels)) {
        for (const dm of f.dataModels) {
          if (!dm.model) {
            errors.push(`${prefix}: Data model reference missing model name.`);
          }
          if (!Array.isArray(dm.fields) || dm.fields.length === 0) {
            errors.push(`${prefix}: Data model "${dm.model}" must list required fields.`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Read the feature matrix for a project from `.aegis/feature-matrix.json`.
   */
  public static loadFromProject(projectRoot: string): FeatureMatrix | null {
    const matrixPath = join(projectRoot, ".aegis", "feature-matrix.json");
    if (!existsSync(matrixPath)) {
      return null;
    }
    try {
      const content = readFileSync(matrixPath, "utf8");
      const parsed = JSON.parse(content) as FeatureMatrix;
      return parsed;
    } catch (err: any) {
      console.warn(`[FeatureMatrixManager] Failed to load feature matrix from ${matrixPath}: ${err.message}`);
      return null;
    }
  }

  /**
   * Persist a validated FeatureMatrix to `.aegis/feature-matrix.json`.
   */
  public static saveToProject(projectRoot: string, matrix: FeatureMatrix): boolean {
    const validation = this.validate(matrix);
    if (!validation.valid) {
      console.error(`[FeatureMatrixManager] Cannot save invalid feature matrix:`, validation.errors);
      return false;
    }

    const aegisDir = join(projectRoot, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }

    const matrixPath = join(aegisDir, "feature-matrix.json");
    writeFileSync(matrixPath, JSON.stringify(matrix, null, 2) + "\n", "utf8");
    console.log(`[FeatureMatrixManager] 📄 Successfully wrote feature matrix (${matrix.features.length} features) to ${matrixPath}`);
    return true;
  }

  /**
   * Create a new FeatureMatrix instance with computed counts and metadata.
   */
  public static createMatrix(
    projectName: string,
    domainName: string,
    rawFeatures: Array<Omit<FeatureDefinition, "id">>
  ): FeatureMatrix {
    const features = this.assignFeatureIds(rawFeatures);
    const mustHaveCount = features.filter(f => f.priority === "must-have").length;
    const verifiedCount = features.filter(f => f.verificationStatus === "VERIFIED").length;
    const now = new Date().toISOString();

    return {
      version: this.CURRENT_VERSION,
      projectName,
      domainName,
      generatedAt: now,
      updatedAt: now,
      totalFeatures: features.length,
      mustHaveCount,
      verifiedCount,
      features,
    };
  }

  /**
   * Update verification status of a feature with evidence.
   */
  public static updateFeatureStatus(
    matrix: FeatureMatrix,
    featureId: string,
    status: FeatureVerificationStatus,
    evidenceNotes?: string
  ): boolean {
    const feature = matrix.features.find(f => f.id === featureId);
    if (!feature) return false;

    feature.verificationStatus = status;
    if (evidenceNotes) {
      feature.evidenceNotes = evidenceNotes;
    }
    matrix.updatedAt = new Date().toISOString();
    matrix.verifiedCount = matrix.features.filter(f => f.verificationStatus === "VERIFIED").length;
    return true;
  }
}

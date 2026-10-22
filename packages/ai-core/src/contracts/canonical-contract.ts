/**
 * CanonicalApplicationContract
 *
 * The unified authoritative contract connecting:
 * - Requirements & Features (FeatureMatrix)
 * - Navigation & Routes (RouteContract)
 * - API Endpoints & Request/Response Schemas (ApiEndpointContract)
 * - Database Models, Fields, & Relations (DynamicDataModelContract / AuthorizedSchemaManager)
 * - Frontend Data Dependencies
 * - Acceptance Tests & Verification Strategies
 *
 * Implements Milestone 2:
 * - Pre-generation validation
 * - Requirement change impact analysis
 * - Seamless integration with AuthorizedSchemaManager
 */

import { FeatureMatrix, FeatureDefinition, FeatureMatrixManager } from "./feature-matrix.js";
import { ApiEndpointContract, ApiContractRegistry, HttpMethod } from "../governance/api-contract-registry.js";
import { AuthorizedSchemaManager, ParsedPrismaModel } from "../governance/authorized-schema-manager.js";

export interface RouteContract {
  path: string;
  name: string;
  title: string;
  component: string;
  featureOwnership?: string;
  requiresAuth?: boolean;
  dataEndpoints?: string[];
}

export interface ModelFieldContract {
  name: string;
  type: string;
  required: boolean;
  unique?: boolean;
  isId?: boolean;
  relationModel?: string;
  defaultValue?: string;
}

export interface ModelContract {
  name: string;
  fields: ModelFieldContract[];
  featureOwnership?: string;
  relations?: Array<{
    relationField: string;
    targetModel: string;
    foreignKey: string;
    relationType: "1:1" | "1:N" | "N:M";
  }>;
}

export interface AcceptanceTestContract {
  testId: string;
  featureId: string;
  strategy: "unit" | "api-integration" | "database" | "browser" | "e2e";
  targetRoute?: string;
  targetEndpoint?: { method: HttpMethod; path: string };
  description: string;
  assertions: string[];
}

export interface CanonicalApplicationContract {
  contractVersion: "1.0.0";
  domain: string;
  applicationName: string;
  features: FeatureMatrix;
  routes: RouteContract[];
  apiEndpoints: ApiEndpointContract[];
  dataModels: ModelContract[];
  acceptanceTests: AcceptanceTestContract[];
}

export interface ContractValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  traceabilityCoverage: {
    featureCoverage: number; // 0 to 1
    apiCoverage: number;
    modelCoverage: number;
    testCoverage: number;
  };
}

export interface RequirementChangeImpact {
  modifiedFeatureId: string;
  impactedRoutes: string[];
  impactedEndpoints: string[];
  impactedModels: string[];
  impactedTests: string[];
  mustRegenerate: {
    frontendPages: string[];
    apiRoutes: string[];
    schemaModels: string[];
    testSuites: string[];
  };
}

export class CanonicalContractManager {
  public static readonly VERSION = "1.0.0";

  /**
   * Validate full canonical contract alignment across requirements, routes, APIs, models, and tests.
   */
  public static validate(contract: CanonicalApplicationContract): ContractValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!contract) {
      return {
        valid: false,
        errors: ["CanonicalApplicationContract is null or undefined."],
        warnings: [],
        traceabilityCoverage: { featureCoverage: 0, apiCoverage: 0, modelCoverage: 0, testCoverage: 0 },
      };
    }

    // 1. Validate FeatureMatrix
    const matrixRes = FeatureMatrixManager.validate(contract.features);
    errors.push(...matrixRes.errors);
    warnings.push(...matrixRes.warnings);

    // Build lookup maps
    const modelMap = new Map<string, ModelContract>();
    for (const model of contract.dataModels || []) {
      if (!model.name) {
        errors.push("Data model contract has a model with no name.");
        continue;
      }
      modelMap.set(model.name, model);
    }

    const routeMap = new Map<string, RouteContract>();
    for (const route of contract.routes || []) {
      if (!route.path) {
        errors.push("Route contract has a route with no path.");
        continue;
      }
      if (routeMap.has(route.path)) {
        errors.push(`Duplicate route path declared: "${route.path}".`);
      }
      routeMap.set(route.path, route);
    }

    const endpointMap = new Map<string, ApiEndpointContract>();
    for (const ep of contract.apiEndpoints || []) {
      const key = `${ep.method.toUpperCase()} ${ep.path}`;
      if (endpointMap.has(key)) {
        errors.push(`Duplicate API endpoint declared: "${key}".`);
      }
      endpointMap.set(key, ep);
    }

    const testMap = new Map<string, AcceptanceTestContract>();
    for (const test of contract.acceptanceTests || []) {
      if (testMap.has(test.testId)) {
        errors.push(`Duplicate test identifier: "${test.testId}".`);
      }
      testMap.set(test.testId, test);
    }

    // 2. Validate End-to-End Alignment from Feature Matrix
    let coveredFeatures = 0;
    const allFeatures = contract.features?.features || [];

    for (const feature of allFeatures) {
      let featureHasRoute = false;
      let featureHasApi = false;
      let featureHasModel = false;
      let featureHasTest = false;

      // Check routes declared for feature
      for (const rPath of feature.routes) {
        if (!routeMap.has(rPath)) {
          errors.push(`Feature ${feature.id} references route "${rPath}", which is missing in route contracts.`);
        } else {
          featureHasRoute = true;
        }
      }

      // Check API endpoints declared for feature
      for (const epRef of feature.apiEndpoints) {
        const key = `${epRef.method.toUpperCase()} ${epRef.path}`;
        if (!endpointMap.has(key)) {
          errors.push(`Feature ${feature.id} references API endpoint "${key}", which is missing in API contracts.`);
        } else {
          featureHasApi = true;
        }
      }

      // Check Data Models declared for feature
      for (const dmRef of feature.dataModels) {
        const targetModel = modelMap.get(dmRef.model);
        if (!targetModel) {
          errors.push(`Feature ${feature.id} references model "${dmRef.model}", which is missing in data model contracts.`);
        } else {
          featureHasModel = true;
          // Check that required fields exist on the model
          const existingFields = new Set(targetModel.fields.map(f => f.name));
          for (const requiredField of dmRef.fields) {
            if (!existingFields.has(requiredField)) {
              errors.push(`Feature ${feature.id} requires field "${dmRef.model}.${requiredField}", but it is not defined in model contract.`);
            }
          }
        }
      }

      // Check Acceptance Tests declared for feature
      for (const testRef of feature.acceptanceTests) {
        if (!testMap.has(testRef.testId)) {
          errors.push(`Feature ${feature.id} references acceptance test "${testRef.testId}", which is missing in acceptance test contracts.`);
        } else {
          featureHasTest = true;
        }
      }

      if (featureHasRoute && (featureHasApi || feature.routes.length > 0) && (featureHasTest || feature.priority !== "must-have")) {
        coveredFeatures++;
      }
    }

    const featureCoverage = allFeatures.length > 0 ? coveredFeatures / allFeatures.length : 1;
    const apiCoverage = contract.apiEndpoints.length > 0 ? 1 : 0;
    const modelCoverage = contract.dataModels.length > 0 ? 1 : 0;
    const testCoverage = contract.acceptanceTests.length > 0 ? 1 : 0;

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      traceabilityCoverage: {
        featureCoverage,
        apiCoverage,
        modelCoverage,
        testCoverage,
      },
    };
  }

  /**
   * Determine exact blast radius if a feature requirement is changed.
   */
  public static analyzeChangeImpact(
    contract: CanonicalApplicationContract,
    featureId: string
  ): RequirementChangeImpact | null {
    const feature = contract.features?.features.find(f => f.id === featureId);
    if (!feature) return null;

    const impactedRoutes = [...feature.routes];
    const impactedEndpoints = feature.apiEndpoints.map(e => `${e.method} ${e.path}`);
    const impactedModels = feature.dataModels.map(m => m.model);
    const impactedTests = feature.acceptanceTests.map(t => t.testId);

    // Map to concrete files
    const frontendPages = impactedRoutes.map(r => {
      const clean = r.replace(/^\//, "").replace(/\//g, "-") || "home";
      return `src/pages/${clean.charAt(0).toUpperCase() + clean.slice(1)}Page.tsx`;
    });

    const apiRoutes = impactedEndpoints.map(e => {
      const parts = e.split(" ");
      const path = parts[1] || "";
      const base = path.replace(/^\/api\/?/, "").split("/")[0] || "api";
      return `server/routes/${base}.ts`;
    });

    const testSuites = impactedTests.map(t => `tests/${t}.test.ts`);

    return {
      modifiedFeatureId: featureId,
      impactedRoutes,
      impactedEndpoints,
      impactedModels,
      impactedTests,
      mustRegenerate: {
        frontendPages: Array.from(new Set(frontendPages)),
        apiRoutes: Array.from(new Set(apiRoutes)),
        schemaModels: Array.from(new Set(impactedModels)),
        testSuites: Array.from(new Set(testSuites)),
      },
    };
  }

  /**
   * Reconcile Canonical Contract models into prisma/schema.prisma via AuthorizedSchemaManager.
   */
  public static syncToPrismaSchema(
    projectRoot: string,
    contract: CanonicalApplicationContract,
    callerRole = "ContractAuthority"
  ): boolean {
    const modelNames = contract.dataModels.map(m => m.name);
    const res = AuthorizedSchemaManager.reconcileProjectSchema(
      projectRoot,
      modelNames,
      "postgresql"
    );
    return res.success;
  }
}

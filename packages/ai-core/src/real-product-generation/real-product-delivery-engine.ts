/**
 * RealProductDeliveryEngine
 *
 * Produces the official delivery manifest listing all runtime evidence,
 * identifying configuration requirements, and describing startup instructions.
 */

import { type RealProductAcceptanceResult } from "./real-product-acceptance.js";
import { type IntegrationVerificationState, type RealIntegrationContract } from "./real-integration-provisioner.js";

export interface RealDeliveryManifest {

  status: "ACCEPTED" | "NOT_ACCEPTED";
  productName: string;
  projectPath: string;
  buildVerified: boolean;
  runtimeVerified: boolean;
  databaseVerified: boolean;
  apiWorkflowsVerified: boolean;
  browserWorkflowsVerified: boolean;
  featureCompleteness: number;
  criticalDefects: number;
  startupCommand: string;
  configurationRequired: {
    envVar: string;
    description: string;
    requiredByService: string;
    state: IntegrationVerificationState;
  }[];
  deliveredAt: string;
}

export class RealProductDeliveryEngine {
  public static createManifest(
    productName: string,
    projectPath: string,
    acceptance: RealProductAcceptanceResult,
    integrations: RealIntegrationContract[]
  ): RealDeliveryManifest {

    const configRequired = integrations
      .filter((i) => i.state === "CONFIGURATION_REQUIRED" || i.state === "FAILED")
      .flatMap((i) =>
        i.requiredEnvVars.map((env) => ({
          envVar: env,
          description: i.reason,
          requiredByService: i.serviceName,
          state: i.state,
        }))
      );

    return {
      status: acceptance.isAccepted ? "ACCEPTED" : "NOT_ACCEPTED",
      productName,
      projectPath,
      buildVerified: acceptance.criteria.find((c) => c.name === "Backend Verification PASS")?.isPassed ?? false,
      runtimeVerified: acceptance.criteria.find((c) => c.name === "Critical Workflows 100%")?.isPassed ?? false,
      databaseVerified: acceptance.criteria.find((c) => c.name === "Database Verification PASS")?.isPassed ?? false,
      apiWorkflowsVerified: acceptance.criteria.find((c) => c.name === "Critical Workflows 100%")?.isPassed ?? false,
      browserWorkflowsVerified: acceptance.criteria.find((c) => c.name === "Frontend Verification PASS")?.isPassed ?? false,
      featureCompleteness: acceptance.overallScore,
      criticalDefects: acceptance.criticalDefectCount,
      startupCommand: `cd ${productName.toLowerCase().replace(/\s+/g, "-")} && npm run dev`,
      configurationRequired: configRequired,
      deliveredAt: new Date().toISOString(),
    };
  }
}

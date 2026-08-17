/**
 * ProductBuilder API
 *
 * High-level programmatic API for end-to-end autonomous product construction.
 */

import { ProductBuildOrchestrator } from "./product-build-orchestrator.js";
import { type FinishedProductDeliveryPackage } from "./product-delivery-engine.js";

export interface BuildProductOptions {
  requirement: string;
  projectName?: string;
  projectPath?: string;
  configuration?: {
    maxRepairAttempts?: number;
    maxVerificationCycles?: number;
  };
}

export class ProductBuilder {
  public static async build(options: BuildProductOptions): Promise<FinishedProductDeliveryPackage> {
    const orchestrator = new ProductBuildOrchestrator();
    return await orchestrator.executeAutonomousBuild(
      options.requirement,
      options.projectName || "AegisGeneratedProduct",
      options.projectPath || "./dist/product"
    );
  }
}

/**
 * AegisProductBuilder Unified API
 *
 * One-call public API entrypoint for building complete, verified, and certified full-stack products from a single prompt.
 */

import {
  ProductIntelligenceOrchestrator,
  type MasterProductAssemblyResult,
} from "./product-intelligence-orchestrator.js";
import { type UserStackPreference } from "../universal-product-builder/universal-architecture-planner.js";

export interface AegisBuildProductOptions {
  requirement: string;
  preferredName?: string;
  requestedStack?: UserStackPreference;
  outputDirectory?: string;
}

export class AegisProductBuilder {
  public static async buildProduct(options: AegisBuildProductOptions): Promise<MasterProductAssemblyResult> {

    return ProductIntelligenceOrchestrator.buildProduct(
      options.requirement,
      options.preferredName,
      options.requestedStack,
      options.outputDirectory
    );
  }
}

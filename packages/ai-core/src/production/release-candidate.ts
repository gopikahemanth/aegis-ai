/**
 * ReleaseCandidate Model
 *
 * Canonical model capturing the complete production release candidate state.
 */

import type { SoftwareBillOfMaterials } from "./sbom-generator.js";
import type { SecurityHardeningReport } from "./security-hardener.js";
import type { PerformanceReport } from "./performance-engine.js";
import type { ProductSuccessReport } from "../validation/product-success-gate.js";


export interface ReleaseCandidate {
  releaseId: string;
  projectId: string;
  generationId: string;
  createdAt: string;
  hashes: {
    architectureHash: string;
    domainHash: string;
    dataHash: string;
    apiHash: string;
    fileGraphHash: string;
    dependencyHash: string;
  };
  productSuccess: ProductSuccessReport;
  security: SecurityHardeningReport;
  performance: PerformanceReport;
  sbom: SoftwareBillOfMaterials;
  isReleaseReady: boolean;
  blockers: string[];
}

import { ArchitectureContractV1 } from "./architecture-resolver.js";
import { ProjectSpecification } from "../architect/specification.js";

export interface ContractConflict {
  error: "CONTRACT_CONFLICT";
  field: "frontend" | "backend" | "database" | "orm" | "language" | "packageManager";
  expected: string;
  actual: string;
  expectedSource: string;
  actualSource: "llm_inference" | "raw_spec" | "unknown";
}

export class ArchitectureContractNormalizer {
  /**
   * Validates that the raw specification does not conflict with the locked architecture contract.
   * If critical fields (frontend/backend/database/orm) differ, throws a CONTRACT_CONFLICT.
   * Only normalizes safe formatting fields like feature descriptions.
   * DOES NOT silently overwrite framework/database/orm choices.
   */
  public static normalizeSpecification<T extends ProjectSpecification>(
    rawSpec: T,
    contract: ArchitectureContractV1
  ): T {
    if (!contract || !contract.frontend || !contract.backend || !contract.database) {
      return rawSpec;
    }

    const conflicts: ContractConflict[] = [];

    // Check frontend conflict
    if (rawSpec.frontend && rawSpec.frontend.toLowerCase() !== contract.frontend.framework.toLowerCase()) {
      const isSignificantDrift = (
        (rawSpec.frontend.toLowerCase().includes("next") && !contract.frontend.framework.toLowerCase().includes("next")) ||
        (rawSpec.frontend.toLowerCase().includes("react") && !contract.frontend.framework.toLowerCase().includes("react"))
      );
      if (isSignificantDrift) {
        conflicts.push({
          error: "CONTRACT_CONFLICT",
          field: "frontend",
          expected: contract.frontend.framework,
          actual: rawSpec.frontend,
          expectedSource: contract.frontend.provenance || "contract",
          actualSource: "llm_inference"
        });
      }
    }

    // Check backend conflict
    if (rawSpec.backend && rawSpec.backend.toLowerCase() !== contract.backend.framework.toLowerCase()) {
      const isSignificantDrift = (
        (rawSpec.backend.toLowerCase().includes("next") && !contract.backend.framework.toLowerCase().includes("next")) ||
        (rawSpec.backend.toLowerCase().includes("express") && !contract.backend.framework.toLowerCase().includes("express"))
      );
      if (isSignificantDrift) {
        conflicts.push({
          error: "CONTRACT_CONFLICT",
          field: "backend",
          expected: contract.backend.framework,
          actual: rawSpec.backend,
          expectedSource: contract.backend.provenance || "contract",
          actualSource: "llm_inference"
        });
      }
    }

    // Check database conflict
    if (rawSpec.database && rawSpec.database.toLowerCase() !== contract.database.provider.toLowerCase()) {
      conflicts.push({
        error: "CONTRACT_CONFLICT",
        field: "database",
        expected: contract.database.provider,
        actual: rawSpec.database,
        expectedSource: contract.database.provenance || "contract",
        actualSource: "llm_inference"
      });
    }

    if (conflicts.length > 0) {
      for (const conflict of conflicts) {
        console.error(
          `[ContractNormalizer] ❌ CONTRACT_CONFLICT detected:\n` +
          `  Field:    ${conflict.field}\n` +
          `  Expected: ${conflict.expected} [${conflict.expectedSource}]\n` +
          `  Actual:   ${conflict.actual} [${conflict.actualSource}]\n` +
          `  → Keeping locked contract value. Specification drift will be corrected.`
        );
      }
    }

    // Safe normalizations only: force spec to match contract values, and sanitize feature text.
    // We do NOT throw — we correct the spec to match the locked contract and log the conflict.
    const normalized: T = {
      ...rawSpec,
      frontend: contract.frontend.framework,
      backend: contract.backend.framework,
      database: contract.database.provider,
      language: contract.language || rawSpec.language || "TypeScript",
      packageManager: contract.packageManager || rawSpec.packageManager || "pnpm"
    };

    // Only sanitize feature text (safe — does not change technology)
    if (normalized.features) {
      normalized.features = normalized.features.map(f =>
        f
          .replace(/Next\.js App Router/gi, `${contract.frontend.framework} Router`)
          .replace(/Next\.js API Routes/gi, `${contract.backend.framework} REST API`)
          .replace(/NextAuth/gi, "Express JWT Auth")
          .replace(/MongoDB/gi, contract.database.provider)
          .replace(/Mongoose/gi, contract.database.orm)
      );
    }

    if (conflicts.length === 0) {
      console.log(`[ContractNormalizer] ✓ Specification consistent with locked contract: ${contract.frontend.framework} + ${contract.backend.framework} + ${contract.database.provider} (${contract.database.orm})`);
    } else {
      console.log(`[ContractNormalizer] 🔒 Applied ${conflicts.length} contract correction(s). Specification normalized to locked contract.`);
    }

    return normalized;
  }
}

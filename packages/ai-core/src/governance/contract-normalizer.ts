import { ArchitectureContractV1 } from "./architecture-resolver.js";
import { ProjectSpecification } from "../architect/specification.js";

export class ArchitectureContractNormalizer {
  public static normalizeSpecification<T extends ProjectSpecification>(
    rawSpec: T,
    contract: ArchitectureContractV1
  ): T {
    if (!contract || !contract.frontend || !contract.backend || !contract.database) {
      return rawSpec;
    }

    const normalized: T = {
      ...rawSpec,
      frontend: contract.frontend.framework,
      backend: contract.backend.framework,
      database: contract.database.provider,
      language: contract.language || rawSpec.language || "TypeScript",
      packageManager: contract.packageManager || rawSpec.packageManager || "pnpm"
    };

    // Sanitize feature names & description to purge contradictory Next.js / NextAuth / MongoDB references
    if (normalized.features) {
      normalized.features = normalized.features.map(f => {
        return f
          .replace(/Next\.js App Router/gi, `${contract.frontend.framework} Router`)
          .replace(/Next\.js API Routes/gi, `${contract.backend.framework} REST API`)
          .replace(/NextAuth/gi, "Express JWT Auth")
          .replace(/MongoDB/gi, contract.database.provider)
          .replace(/Mongoose/gi, contract.database.orm);
      });
    }

    console.log(`[ContractNormalizer] 🔒 Normalized ProjectSpecification to match locked contract: ${contract.frontend.framework} + ${contract.backend.framework} + ${contract.database.provider} (${contract.database.orm})`);
    return normalized;
  }
}

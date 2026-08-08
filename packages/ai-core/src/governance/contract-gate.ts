import { ArchitectureContractV1 } from "./architecture-resolver.js";
import { createHash } from "node:crypto";

export interface ContractGateResult {
  valid: boolean;
  architectureHash: string;
  errors: string[];
}

export type ContractErrorCode =
  | "ARCHITECTURE_CONFLICT"
  | "DATABASE_CONFIGURATION_CONFLICT"
  | "CONTRACT_CONFLICT"
  | "ORM_INCOMPATIBILITY"
  | "MISSING_CONTRACT_FIELD";

/**
 * ContractGate is a mandatory blocking checkpoint that runs:
 * 1. After ArchitectureResolver.resolve() — before DataArchitectureAgent
 * 2. Before any CoderAgent execution tier
 *
 * If ContractGate fails, the pipeline MUST STOP. No code generation may proceed.
 */
export class ContractGate {
  public static verify(contract: ArchitectureContractV1): ContractGateResult {
    const errors: string[] = [];

    // ── 1. Required field validation ─────────────────────────────────────────
    if (!contract) {
      return { valid: false, architectureHash: "missing", errors: ["MISSING_CONTRACT_FIELD: contract is null/undefined"] };
    }
    if (!contract.frontend?.framework) {
      errors.push("MISSING_CONTRACT_FIELD: frontend.framework is not defined");
    }
    if (!contract.backend?.framework) {
      errors.push("MISSING_CONTRACT_FIELD: backend.framework is not defined");
    }
    if (!contract.database?.provider) {
      errors.push("MISSING_CONTRACT_FIELD: database.provider is not defined");
    }
    if (!contract.database?.orm) {
      errors.push("MISSING_CONTRACT_FIELD: database.orm is not defined");
    }

    // ── 2. ORM / Database compatibility ─────────────────────────────────────
    const dbLower = (contract.database?.provider || "").toLowerCase();
    const ormLower = (contract.database?.orm || "").toLowerCase();

    // Mongoose is ONLY valid for MongoDB
    if (ormLower === "mongoose" && !dbLower.includes("mongo")) {
      errors.push(`ORM_INCOMPATIBILITY: Mongoose is incompatible with database "${contract.database.provider}". Use Prisma for PostgreSQL/MySQL/SQLite.`);
    }

    // Prisma with MongoDB requires datasource provider = "mongodb" — valid, but flag if provider is explicitly relational
    if (ormLower === "prisma" && dbLower.includes("mongo")) {
      // Valid — Prisma supports MongoDB, just note it
    }

    // Sequelize/TypeORM are not valid for MongoDB
    if ((ormLower === "sequelize" || ormLower === "typeorm") && dbLower.includes("mongo")) {
      errors.push(`ORM_INCOMPATIBILITY: "${contract.database.orm}" does not support MongoDB. Use Mongoose or Prisma for MongoDB.`);
    }

    // ── 3. Frontend / Backend stack compatibility ────────────────────────────
    const frontendLower = (contract.frontend?.framework || "").toLowerCase();
    const backendLower = (contract.backend?.framework || "").toLowerCase();

    // If frontend is Next.js but backend is Express — unusual, warn but don't block
    if (frontendLower.includes("next") && backendLower.includes("express")) {
      console.warn(`[ContractGate] ⚠️ Unusual stack: Next.js frontend with Express backend. Ensure this is intentional.`);
    }

    // ── 4. Compute architecture hash ────────────────────────────────────────
    const stableStr = JSON.stringify({
      frontend: contract.frontend?.framework,
      backend: contract.backend?.framework,
      database: contract.database?.provider,
      orm: contract.database?.orm,
      language: contract.language,
      auth: contract.authentication
    });
    const architectureHash = createHash("sha256").update(stableStr).digest("hex").slice(0, 12);

    // ── 5. Report ────────────────────────────────────────────────────────────
    if (errors.length > 0) {
      console.error(`\n[ContractGate] ❌ CONTRACT VALIDATION FAILED (${errors.length} error(s)):`);
      errors.forEach(e => console.error(`  • ${e}`));
      console.error(`[ContractGate] Pipeline will STOP. Fix the architecture contract before proceeding.\n`);
      return { valid: false, architectureHash, errors };
    }

    console.log(`\n=== CONTRACT VERIFIED ===`);
    console.log(`Frontend:          ${contract.frontend.framework} [${contract.frontend.provenance || "locked"}]`);
    console.log(`Backend:           ${contract.backend.framework} [${contract.backend.provenance || "locked"}]`);
    console.log(`Database:          ${contract.database.provider} [${contract.database.provenance || "locked"}]`);
    console.log(`ORM:               ${contract.database.orm} [${contract.database.ormProvenance || "locked"}]`);
    console.log(`Language:          ${contract.language}`);
    console.log(`Auth:              ${contract.authentication}`);
    console.log(`Models:            ${contract.requiredModels?.join(", ") || "(none defined yet)"}`);
    console.log(`Features:          ${contract.requiredFeatures?.slice(0, 3).join(", ") || "(none defined yet)"}${(contract.requiredFeatures?.length || 0) > 3 ? ` +${(contract.requiredFeatures?.length || 0) - 3} more` : ""}`);
    console.log(`Architecture Hash: ${architectureHash}`);
    console.log(`Status:            VALID`);
    console.log(`=========================\n`);

    return { valid: true, architectureHash, errors: [] };
  }
}

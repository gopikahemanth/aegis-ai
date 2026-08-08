import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { CanonicalProjectSpecification } from "../spec/canonical-spec.js";

export interface RequirementContract {
  id: string;
  createdAt: string;
  prompt: string;
  immutableRequirements: {
    frontend: string;
    backend: string;
    database: string;
    language: string;
    styling: string;
    auth: string;
    packageManager: string;
    features: string[];
    userFlows: string[];
    dataModels: string[];
  };
}

export interface ArchitectureContractData {
  contractId: string;
  lockedAt: string;
  stack: {
    frontend: string;
    backend: string;
    database: string;
    orm: string;
    auth: string;
    language: string;
    styling: string;
    packageManager: string;
  };
  features: string[];
  userFlows: string[];
  dataModels: string[];
  allowedRoutePrefixes: string[];
}

export class ArchitectureContractManager {
  public static createContract(
    outputDirectory: string,
    prompt: string,
    spec: CanonicalProjectSpecification
  ): ArchitectureContractData {
    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }

    const requirementContract: RequirementContract = {
      id: `req_${Date.now()}`,
      createdAt: new Date().toISOString(),
      prompt,
      immutableRequirements: {
        frontend: spec.lockedStack?.frontend || spec.frontend || "React",
        backend: spec.lockedStack?.backend || spec.backend || "Express",
        database: spec.lockedStack?.database || spec.database || "SQLite",
        language: spec.lockedStack?.language || spec.language || "TypeScript",
        styling: spec.lockedStack?.styling || spec.styling || "TailwindCSS",
        auth: spec.lockedStack?.auth || spec.auth || "none",
        packageManager: spec.lockedStack?.packageManager || spec.packageManager || "pnpm",
        features: spec.features || [],
        userFlows: spec.userFlows || [],
        dataModels: spec.dataModels || []
      }
    };

    const archContract: ArchitectureContractData = {
      contractId: requirementContract.id,
      lockedAt: new Date().toISOString(),
      stack: {
        frontend: requirementContract.immutableRequirements.frontend,
        backend: requirementContract.immutableRequirements.backend,
        database: requirementContract.immutableRequirements.database,
        orm: spec.lockedStack?.orm || "Prisma",
        auth: requirementContract.immutableRequirements.auth,
        language: requirementContract.immutableRequirements.language,
        styling: requirementContract.immutableRequirements.styling,
        packageManager: requirementContract.immutableRequirements.packageManager
      },
      features: requirementContract.immutableRequirements.features,
      userFlows: requirementContract.immutableRequirements.userFlows,
      dataModels: requirementContract.immutableRequirements.dataModels,
      allowedRoutePrefixes: ["/api", "/auth", "/dashboard", "/"]
    };

    writeFileSync(join(aegisDir, "architecture-contract.json"), JSON.stringify(archContract, null, 2), "utf8");
    writeFileSync(join(aegisDir, "requirement-contract.json"), JSON.stringify(requirementContract, null, 2), "utf8");

    console.log(`[Governance] 🔒 Architecture Contract locked in .aegis/architecture-contract.json (DB: ${archContract.stack.database}, Frontend: ${archContract.stack.frontend}, Backend: ${archContract.stack.backend})`);

    return archContract;
  }

  public static loadContract(outputDirectory: string): ArchitectureContractData | null {
    const contractPath = join(outputDirectory, ".aegis", "architecture-contract.json");
    if (!existsSync(contractPath)) return null;
    try {
      return JSON.parse(readFileSync(contractPath, "utf8"));
    } catch {
      return null;
    }
  }

  public static validateProposedChange(
    outputDirectory: string,
    changeType: "database" | "frontend" | "backend" | "auth",
    newValue: string
  ): { allowed: boolean; reason?: string } {
    const contract = this.loadContract(outputDirectory);
    if (!contract) return { allowed: true };

    const lockedVal = contract.stack[changeType];
    if (lockedVal && newValue && lockedVal.toLowerCase() !== newValue.toLowerCase()) {
      // Check if substitution is immutable violation (e.g. PostgreSQL -> SQLite)
      if (changeType === "database" && lockedVal.toLowerCase().includes("postgres") && newValue.toLowerCase().includes("sqlite")) {
        return {
          allowed: false,
          reason: `REJECTED Architecture Violation: User explicitly requested database '${lockedVal}'. Cannot silently substitute '${newValue}'.`
        };
      }
    }
    return { allowed: true };
  }
}

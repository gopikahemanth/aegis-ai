/**
 * ContractHashEngine
 *
 * Produces stable, deterministic SHA-256 hashes for each contract layer.
 *
 * Rules:
 * - Canonical serialization: keys are sorted, timestamps EXCLUDED.
 * - The same contract always produces the same hash.
 * - A meaningful change to any contract field changes the hash.
 * - Used by StaleArtifactDetector and downstream systems.
 */

import { createHash } from "node:crypto";
import type { ArchitectureContractV1 } from "./architecture-resolver.js";
import type { DomainContract } from "./domain-contract.js";

// ─── ContractHashes — embedded in every derived artifact ───────────────────

export interface ContractHashes {
  /** Hash of the ArchitectureContractV1 */
  architectureHash: string;
  /** Hash of the DomainContract */
  domainHash: string;
  /** Hash of the DataContract (if computed) */
  dataHash?: string;
  /** Hash of the API contract (if computed) */
  apiHash?: string;
  /** Hash of the file graph (if computed) */
  fileGraphHash?: string;
}

// ─── ContractHashEngine ─────────────────────────────────────────────────────

export class ContractHashEngine {
  /**
   * Compute a stable hash for an ArchitectureContractV1.
   * Excludes: lockedAt, timestamps, source provenance metadata.
   * Includes: all structural fields that affect code generation.
   */
  public static hashArchitecture(contract: ArchitectureContractV1): string {
    const stable = {
      frontend: contract.frontend?.framework,
      backend: contract.backend?.framework,
      database: contract.database?.provider,
      orm: contract.database?.orm,
      language: contract.language,
      styling: contract.styling,
      packageManager: contract.packageManager,
      authentication: contract.authentication,
      requiredLibraries: [...(contract.requiredLibraries || [])].sort(),
      requiredFeatures: [...(contract.requiredFeatures || [])].sort(),
      requiredRoutes: [...(contract.requiredRoutes || [])].sort(),
      requiredModels: [...(contract.requiredModels || [])].sort(),
    };
    return ContractHashEngine.hash(stable);
  }

  /**
   * Compute a stable hash for a DomainContract.
   * Excludes: lockedAt.
   */
  public static hashDomain(domain: DomainContract): string {
    const stable = {
      domainName: domain.domainName,
      entities: [...domain.entities]
        .map(e => ({ name: e.name, kind: e.kind }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      features: [...domain.features]
        .map(f => ({ featureId: f.featureId, entities: [...f.entities].sort() }))
        .sort((a, b) => a.featureId.localeCompare(b.featureId)),
      allowedTerminology: [...domain.allowedTerminology].sort(),
    };
    return ContractHashEngine.hash(stable);
  }

  /**
   * Compute a stable hash for a data model definition.
   * Pass in an array of { name, fields } objects.
   */
  public static hashData(models: Array<{ name: string; fields: string[] }>): string {
    const stable = [...models]
      .map(m => ({ name: m.name, fields: [...m.fields].sort() }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return ContractHashEngine.hash(stable);
  }

  /**
   * Compute a stable hash for an API contract.
   * Pass in an array of { method, path } objects.
   */
  public static hashApi(endpoints: Array<{ method: string; path: string; operationId?: string }>): string {
    const stable = [...endpoints]
      .map(e => ({ method: e.method.toUpperCase(), path: e.path, op: e.operationId || "" }))
      .sort((a, b) => `${a.method}:${a.path}`.localeCompare(`${b.method}:${b.path}`));
    return ContractHashEngine.hash(stable);
  }

  /**
   * Compute a stable hash for a file graph.
   * Pass in an array of canonical paths.
   */
  public static hashFileGraph(paths: string[]): string {
    const stable = [...paths].sort();
    return ContractHashEngine.hash(stable);
  }

  /**
   * Build a full ContractHashes object from available contracts.
   */
  public static buildHashes(
    architecture: ArchitectureContractV1,
    domain: DomainContract,
    dataModels?: Array<{ name: string; fields: string[] }>,
    apiEndpoints?: Array<{ method: string; path: string; operationId?: string }>,
    filePaths?: string[],
  ): ContractHashes {
    return {
      architectureHash: ContractHashEngine.hashArchitecture(architecture),
      domainHash: ContractHashEngine.hashDomain(domain),
      dataHash: dataModels ? ContractHashEngine.hashData(dataModels) : undefined,
      apiHash: apiEndpoints ? ContractHashEngine.hashApi(apiEndpoints) : undefined,
      fileGraphHash: filePaths ? ContractHashEngine.hashFileGraph(filePaths) : undefined,
    };
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private static hash(value: unknown): string {
    return createHash("sha256")
      .update(JSON.stringify(value))
      .digest("hex")
      .slice(0, 12);
  }
}

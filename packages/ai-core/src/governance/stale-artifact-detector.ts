/**
 * StaleArtifactDetector
 *
 * Compares an artifact's embedded ContractHashes against current contract hashes.
 * Returns STALE / FRESH and a granular diff of which contracts changed.
 *
 * Usage:
 *   const result = StaleArtifactDetector.check(artifactHashes, currentHashes);
 *   if (result.stale) { // regenerate affected downstream systems }
 */

import type { ContractHashes } from "./contract-hash-engine.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export type StaleLevel =
  | "FRESH"
  | "STALE_ARCHITECTURE"   // Architecture changed → full regeneration required
  | "STALE_DOMAIN"         // Domain changed → file graph + tasks invalid
  | "STALE_DATA"           // Data models changed → API + backend tasks invalid
  | "STALE_API"            // API contract changed → frontend + backend tasks invalid
  | "STALE_FILE_GRAPH";    // File graph changed → task ownership invalid

export interface ArtifactDiff {
  field: keyof ContractHashes;
  artifactHash: string | undefined;
  currentHash: string | undefined;
}

export interface StaleCheckResult {
  stale: boolean;
  level: StaleLevel;
  diffs: ArtifactDiff[];
  /** Which downstream systems must be regenerated */
  affectedSystems: string[];
  summary: string;
}

// ─── Cascade table: what must be regenerated when a contract changes ─────────

const CASCADE: Record<string, string[]> = {
  architectureHash:  ["domain-contract", "data-contract", "api-contract", "file-graph", "all-tasks", "all-code"],
  domainHash:        ["file-graph", "domain-tasks", "data-validation", "contamination-check"],
  dataHash:          ["api-contract", "backend-tasks", "schema"],
  apiHash:           ["frontend-tasks", "backend-tasks", "api-service"],
  fileGraphHash:     ["task-ownership", "import-validation"],
};

// ─── StaleArtifactDetector ───────────────────────────────────────────────────

export class StaleArtifactDetector {
  /**
   * Check whether an artifact (with embedded hashes) is stale relative to
   * the current contract hashes.
   *
   * @param artifactHashes - Hashes embedded in the artifact when it was generated
   * @param currentHashes  - Current contract hashes from ContractHashEngine
   */
  public static check(
    artifactHashes: Partial<ContractHashes>,
    currentHashes: ContractHashes,
  ): StaleCheckResult {
    const diffs: ArtifactDiff[] = [];

    const fields: Array<keyof ContractHashes> = [
      "architectureHash", "domainHash", "dataHash", "apiHash", "fileGraphHash",
    ];

    for (const field of fields) {
      const artifactVal = artifactHashes[field];
      const currentVal = currentHashes[field];

      // Only compare if current hash is defined (i.e., system supports it)
      if (currentVal === undefined) continue;
      if (artifactVal === undefined) continue; // Artifact doesn't track this hash → skip

      if (artifactVal !== currentVal) {
        diffs.push({ field, artifactHash: artifactVal, currentHash: currentVal });
      }
    }

    if (diffs.length === 0) {
      return {
        stale: false,
        level: "FRESH",
        diffs: [],
        affectedSystems: [],
        summary: "Artifact is fresh — all contract hashes match.",
      };
    }

    // Determine severity level (most upstream change wins)
    let level: StaleLevel = "STALE_FILE_GRAPH";
    const affectedSystems = new Set<string>();

    for (const diff of diffs) {
      const cascade = CASCADE[diff.field] || [];
      cascade.forEach(s => affectedSystems.add(s));

      if (diff.field === "architectureHash") {
        level = "STALE_ARCHITECTURE";
      } else if (diff.field === "domainHash" && level !== "STALE_ARCHITECTURE") {
        level = "STALE_DOMAIN";
      } else if (diff.field === "dataHash" && !["STALE_ARCHITECTURE", "STALE_DOMAIN"].includes(level)) {
        level = "STALE_DATA";
      } else if (diff.field === "apiHash" && level === "STALE_FILE_GRAPH") {
        level = "STALE_API";
      }
    }

    const changedFields = diffs.map(d => d.field).join(", ");
    const summary = `Artifact is STALE. Changed contracts: [${changedFields}]. ` +
      `Must regenerate: [${Array.from(affectedSystems).join(", ")}].`;

    console.warn(`[StaleArtifactDetector] ⚠️  ${summary}`);

    return {
      stale: true,
      level,
      diffs,
      affectedSystems: Array.from(affectedSystems),
      summary,
    };
  }

  /**
   * Convenience: check a persisted artifact file's hashes field against current.
   * The artifact JSON must contain a `contractHashes` property.
   */
  public static checkArtifactJson(
    artifactJson: Record<string, unknown>,
    currentHashes: ContractHashes,
  ): StaleCheckResult {
    const embedded = (artifactJson.contractHashes || {}) as Partial<ContractHashes>;
    return StaleArtifactDetector.check(embedded, currentHashes);
  }
}

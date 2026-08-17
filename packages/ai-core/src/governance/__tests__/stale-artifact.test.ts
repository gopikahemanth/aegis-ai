/**
 * stale-artifact.test.ts
 *
 * Tests that StaleArtifactDetector correctly identifies stale vs fresh artifacts.
 * Section 35 of AEGIS Phase 2 requirements.
 */

import { describe, it, expect } from "vitest";
import { StaleArtifactDetector } from "../stale-artifact-detector.js";
import type { ContractHashes } from "../contract-hash-engine.js";

describe("StaleArtifactDetector", () => {
  const currentHashes: ContractHashes = {
    architectureHash: "abc123def456",
    domainHash: "def456ghi789",
    dataHash: "ghi789jkl012",
    apiHash: "jkl012mno345",
    fileGraphHash: "mno345pqr678",
  };

  // ── FRESH cases ────────────────────────────────────────────────────────────

  it("returns FRESH when all hashes match", () => {
    const result = StaleArtifactDetector.check(currentHashes, currentHashes);
    expect(result.stale).toBe(false);
    expect(result.level).toBe("FRESH");
    expect(result.diffs).toHaveLength(0);
    expect(result.affectedSystems).toHaveLength(0);
  });

  it("returns FRESH when artifact has subset of hashes and all match", () => {
    const partialArtifact: Partial<ContractHashes> = {
      architectureHash: "abc123def456",
      domainHash: "def456ghi789",
    };
    const result = StaleArtifactDetector.check(partialArtifact, currentHashes);
    expect(result.stale).toBe(false);
    expect(result.level).toBe("FRESH");
  });

  // ── STALE cases ────────────────────────────────────────────────────────────

  it("detects STALE_ARCHITECTURE when architectureHash changes", () => {
    const artifact = { ...currentHashes, architectureHash: "OLD_HASH" };
    const result = StaleArtifactDetector.check(artifact, currentHashes);
    expect(result.stale).toBe(true);
    expect(result.level).toBe("STALE_ARCHITECTURE");
    expect(result.diffs).toHaveLength(1);
    expect(result.diffs[0].field).toBe("architectureHash");
  });

  it("cascades architecture change to all downstream systems", () => {
    const artifact = { ...currentHashes, architectureHash: "OLD" };
    const result = StaleArtifactDetector.check(artifact, currentHashes);
    expect(result.affectedSystems).toContain("all-code");
    expect(result.affectedSystems).toContain("all-tasks");
    expect(result.affectedSystems).toContain("file-graph");
  });

  it("detects STALE_DOMAIN when only domainHash changes", () => {
    const artifact = { ...currentHashes, domainHash: "OLD_DOMAIN" };
    const result = StaleArtifactDetector.check(artifact, currentHashes);
    expect(result.stale).toBe(true);
    expect(result.level).toBe("STALE_DOMAIN");
    expect(result.affectedSystems).toContain("file-graph");
    expect(result.affectedSystems).toContain("domain-tasks");
  });

  it("detects STALE_DATA when only dataHash changes", () => {
    const artifact = { ...currentHashes, dataHash: "OLD_DATA" };
    const result = StaleArtifactDetector.check(artifact, currentHashes);
    expect(result.stale).toBe(true);
    expect(result.level).toBe("STALE_DATA");
    expect(result.affectedSystems).toContain("backend-tasks");
    expect(result.affectedSystems).toContain("api-contract");
  });

  it("detects STALE_API when only apiHash changes", () => {
    const artifact = { ...currentHashes, apiHash: "OLD_API" };
    const result = StaleArtifactDetector.check(artifact, currentHashes);
    expect(result.stale).toBe(true);
    expect(result.level).toBe("STALE_API");
    expect(result.affectedSystems).toContain("frontend-tasks");
    expect(result.affectedSystems).toContain("backend-tasks");
  });

  it("detects STALE_FILE_GRAPH when only fileGraphHash changes", () => {
    const artifact = { ...currentHashes, fileGraphHash: "OLD_GRAPH" };
    const result = StaleArtifactDetector.check(artifact, currentHashes);
    expect(result.stale).toBe(true);
    expect(result.level).toBe("STALE_FILE_GRAPH");
    expect(result.affectedSystems).toContain("task-ownership");
  });

  it("uses STALE_ARCHITECTURE severity when both arch and domain change", () => {
    const artifact = { ...currentHashes, architectureHash: "OLD", domainHash: "OLD2" };
    const result = StaleArtifactDetector.check(artifact, currentHashes);
    expect(result.level).toBe("STALE_ARCHITECTURE"); // Most upstream wins
    expect(result.diffs).toHaveLength(2);
  });

  it("does not flag field as stale when current hash is undefined", () => {
    const currentWithoutOptional: ContractHashes = {
      architectureHash: "abc123def456",
      domainHash: "def456ghi789",
      // dataHash, apiHash, fileGraphHash intentionally omitted
    };
    const artifact = {
      architectureHash: "abc123def456",
      domainHash: "def456ghi789",
      dataHash: "some-old-data-hash",
    };
    const result = StaleArtifactDetector.check(artifact, currentWithoutOptional);
    // dataHash in artifact is not compared because current doesn't define it
    expect(result.stale).toBe(false);
  });

  // ── checkArtifactJson ─────────────────────────────────────────────────────

  it("checkArtifactJson works with nested contractHashes", () => {
    const artifactJson = {
      name: "file-graph",
      generatedAt: "2026-01-01",
      contractHashes: { ...currentHashes, domainHash: "OLD_DOMAIN" },
    };
    const result = StaleArtifactDetector.checkArtifactJson(artifactJson, currentHashes);
    expect(result.stale).toBe(true);
    expect(result.level).toBe("STALE_DOMAIN");
  });

  it("checkArtifactJson returns FRESH when no contractHashes field", () => {
    const artifactJson = { name: "test", generatedAt: "2026-01-01" };
    const result = StaleArtifactDetector.checkArtifactJson(artifactJson, currentHashes);
    // No embedded hashes = no diffs to detect
    expect(result.stale).toBe(false);
  });
});

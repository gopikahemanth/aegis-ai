/**
 * dynamic-file-graph.test.ts
 *
 * Tests that DynamicCanonicalFileGraphBuilder produces correct, domain-specific
 * file graphs and DynamicFileGraphManager validates them correctly.
 *
 * Section 33 (graph consistency) and part of Section 31-32 (no domain leakage).
 */

import { describe, it, expect } from "vitest";
import { DynamicCanonicalFileGraphBuilder, DynamicFileGraphManager } from "../dynamic-file-graph.js";
import { DomainContractDeriver } from "../domain-contract.js";
import type { ArchitectureContractV1 } from "../architecture-resolver.js";

// ── Fixture ──────────────────────────────────────────────────────────────────

function makeArchitecture(overrides: Partial<ArchitectureContractV1> = {}): ArchitectureContractV1 {
  return {
    version: 1,
    frontend: { framework: "React-Vite", provenance: "explicit" },
    backend: { framework: "Express", provenance: "explicit" },
    database: { provider: "PostgreSQL", orm: "Prisma", provenance: "explicit", ormProvenance: "explicit" },
    language: "TypeScript",
    styling: "TailwindCSS",
    authentication: "JWT",
    packageManager: "pnpm",
    requiredModels: ["User"],
    requiredFeatures: [],
    requiredLibraries: [],
    requiredRoutes: [],
    prompt: "",
    ...overrides,
  };
}

// ── Section 33: Graph consistency ────────────────────────────────────────────

describe("DynamicCanonicalFileGraphBuilder — Graph consistency", () => {
  const arch = makeArchitecture({
    requiredModels: ["User", "Scan", "Vulnerability"],
    requiredFeatures: ["Security Scan", "Vulnerability Report"],
    prompt: "Build a security scanner",
  });
  const domain = DomainContractDeriver.derive(arch, "test-arch-hash");
  const graph = DynamicCanonicalFileGraphBuilder.build(arch, domain, "test-arch-hash");

  it("builds a non-empty graph", () => {
    expect(graph.entries.length).toBeGreaterThan(0);
  });

  it("all entries have canonicalPath", () => {
    for (const entry of graph.entries) {
      expect(entry.canonicalPath).toBeTruthy();
      expect(typeof entry.canonicalPath).toBe("string");
    }
  });

  it("includes required config files", () => {
    const paths = graph.entries.map(e => e.canonicalPath);
    expect(paths).toContain("package.json");
    expect(paths).toContain("tsconfig.json");
    expect(paths).toContain("vite.config.ts");
  });

  it("includes Prisma schema (has DB)", () => {
    const paths = graph.entries.map(e => e.canonicalPath);
    expect(paths).toContain("prisma/schema.prisma");
  });

  it("includes Express server entry", () => {
    const paths = graph.entries.map(e => e.canonicalPath);
    expect(paths).toContain("server/index.ts");
    expect(paths).toContain("server/lib/prisma.ts");
  });

  it("includes JWT auth middleware (JWT auth)", () => {
    const paths = graph.entries.map(e => e.canonicalPath);
    expect(paths).toContain("server/middleware/auth.ts");
    expect(paths).toContain("server/routes/auth.ts");
  });

  it("includes domain-entity routes for Scan and Vulnerability", () => {
    const paths = graph.entries.map(e => e.canonicalPath);
    expect(paths).toContain("server/routes/scan.ts");
    expect(paths).toContain("server/routes/vulnerability.ts");
  });

  it("includes React frontend entry points", () => {
    const paths = graph.entries.map(e => e.canonicalPath);
    expect(paths).toContain("src/main.tsx");
    expect(paths).toContain("src/App.tsx");
    expect(paths).toContain("src/services/api.ts");
  });

  it("includes feature pages for domain entities", () => {
    const paths = graph.entries.map(e => e.canonicalPath);
    // Scan entity → feature page
    expect(paths.some(p => p.includes("scan"))).toBe(true);
  });

  it("has no duplicate canonicalPaths", () => {
    const paths = graph.entries.map(e => e.canonicalPath);
    const uniquePaths = new Set(paths);
    expect(uniquePaths.size).toBe(paths.length);
  });

  it("carries contract hashes", () => {
    // architectureHash in the graph is a computed SHA-256 hash of the architecture
    // (not the raw string passed to build()), because ContractHashEngine.buildHashes
    // computes the hash from the contract content.
    expect(graph.contractHashes.architectureHash).toBeTruthy();
    expect(graph.contractHashes.architectureHash).toMatch(/^[a-f0-9]{12}$/);
    // domainHash is the domain's own hash
    expect(graph.contractHashes.domainHash).toBe(domain.domainHash);
    expect(graph.contractHashes.fileGraphHash).toBeTruthy();
    expect(graph.contractHashes.fileGraphHash).toMatch(/^[a-f0-9]{12}$/);
  });
});

// ── No Resume leakage in Security graph ─────────────────────────────────────

describe("DynamicCanonicalFileGraphBuilder — No Resume leakage", () => {
  const arch = makeArchitecture({
    requiredModels: ["User", "Repository", "Scan", "Vulnerability", "Remediation"],
    requiredFeatures: ["Security Scan", "Vulnerability Detection"],
    prompt: "Build a security vulnerability scanner",
  });
  const domain = DomainContractDeriver.derive(arch, "hash-security");
  const graph = DynamicCanonicalFileGraphBuilder.build(arch, domain, "hash-security");

  it("contains no Resume-specific paths", () => {
    const paths = graph.entries.map(e => e.canonicalPath.toLowerCase());
    for (const path of paths) {
      expect(path).not.toContain("resume");
      expect(path).not.toContain("jobdescription");
      expect(path).not.toContain("keywordmatch");
      expect(path).not.toContain("matchscore");
      expect(path).not.toContain("ats");
    }
  });

  it("semantic roles have no Resume references", () => {
    for (const entry of graph.entries) {
      expect(entry.semanticRole.toLowerCase()).not.toContain("resume");
    }
  });
});

// ── Gym graph has no Resume leakage ─────────────────────────────────────────

describe("DynamicCanonicalFileGraphBuilder — Gym domain", () => {
  const arch = makeArchitecture({
    requiredModels: ["User", "Member", "Membership", "Attendance"],
    requiredFeatures: ["Member Management", "Attendance Tracking"],
    prompt: "Build a gym management system",
  });
  const domain = DomainContractDeriver.derive(arch, "hash-gym");
  const graph = DynamicCanonicalFileGraphBuilder.build(arch, domain, "hash-gym");

  it("includes Member entity paths", () => {
    const paths = graph.entries.map(e => e.canonicalPath);
    expect(paths.some(p => p.includes("member"))).toBe(true);
  });

  it("contains no Resume or Security paths", () => {
    const paths = graph.entries.map(e => e.canonicalPath.toLowerCase());
    for (const path of paths) {
      expect(path).not.toContain("resume");
      expect(path).not.toContain("vulnerability");
    }
  });
});

// ── Graph validation ─────────────────────────────────────────────────────────

describe("DynamicFileGraphManager.validate", () => {
  it("validates a correct graph as VALID", () => {
    const arch = makeArchitecture({
      requiredModels: ["User", "Scan"],
      requiredFeatures: ["Security Scan"],
    });
    const domain = DomainContractDeriver.derive(arch, "hash-val");
    const graph = DynamicCanonicalFileGraphBuilder.build(arch, domain, "hash-val");
    const result = DynamicFileGraphManager.validate(graph, domain);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("detects unknown entity reference", () => {
    const arch = makeArchitecture({
      requiredModels: ["User", "Scan"],
      requiredFeatures: ["Security Scan"],
    });
    const domain = DomainContractDeriver.derive(arch, "hash-val2");
    const graph = DynamicCanonicalFileGraphBuilder.build(arch, domain, "hash-val2");

    // Inject a bad entry with an entity not in the domain contract
    const badGraph = {
      ...graph,
      entries: [
        ...graph.entries,
        {
          canonicalPath: "src/features/ghost/index.tsx",
          semanticRole: "Ghost Page",
          semanticAliases: [],
          requiredExports: ["GhostPage"],
          allowedImports: [],
          required: true,
          category: "frontend-page" as const,
          layer: "frontend" as const,
          domain: "Ghost",
          entityName: "GhostEntity", // not in domain!
          status: "required" as const,
        },
      ],
    };
    const result = DynamicFileGraphManager.validate(badGraph, domain);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("UNKNOWN_ENTITY"))).toBe(true);
  });

});

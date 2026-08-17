/**
 * contract-hash-engine.test.ts
 *
 * Tests that ContractHashEngine produces stable, canonical hashes.
 */

import { describe, it, expect } from "vitest";
import { ContractHashEngine } from "../contract-hash-engine.js";
import type { ArchitectureContractV1 } from "../architecture-resolver.js";

function makeContract(overrides: Partial<ArchitectureContractV1> = {}): ArchitectureContractV1 {
  return {
    version: 1,
    frontend: { framework: "React-Vite", provenance: "explicit" },
    backend: { framework: "Express", provenance: "explicit" },
    database: { provider: "PostgreSQL", orm: "Prisma", provenance: "explicit", ormProvenance: "explicit" },
    language: "TypeScript",
    styling: "TailwindCSS",
    authentication: "JWT",
    packageManager: "pnpm",
    requiredModels: ["User", "Scan"],
    requiredFeatures: ["Feature A"],
    requiredLibraries: ["react"],
    requiredRoutes: ["/"],
    prompt: "Build a scanner",
    ...overrides,
  };
}

describe("ContractHashEngine — Architecture hashing", () => {
  it("produces a 12-char hex hash", () => {
    const hash = ContractHashEngine.hashArchitecture(makeContract());
    expect(hash).toMatch(/^[a-f0-9]{12}$/);
  });

  it("produces the same hash for identical contracts", () => {
    const c = makeContract();
    expect(ContractHashEngine.hashArchitecture(c)).toBe(ContractHashEngine.hashArchitecture(c));
  });

  it("is stable across field order", () => {
    const c1 = makeContract({ requiredModels: ["User", "Scan"] });
    const c2 = makeContract({ requiredModels: ["Scan", "User"] }); // different order
    // Same models, sorted → same hash
    expect(ContractHashEngine.hashArchitecture(c1)).toBe(ContractHashEngine.hashArchitecture(c2));
  });

  it("changes hash when frontend framework changes", () => {
    const c1 = makeContract({ frontend: { framework: "React-Vite", provenance: "explicit" } });
    const c2 = makeContract({ frontend: { framework: "Next.js", provenance: "explicit" } });
    expect(ContractHashEngine.hashArchitecture(c1)).not.toBe(ContractHashEngine.hashArchitecture(c2));
  });

  it("changes hash when database provider changes", () => {
    const c1 = makeContract({ database: { provider: "PostgreSQL", orm: "Prisma", provenance: "explicit", ormProvenance: "explicit" } });
    const c2 = makeContract({ database: { provider: "SQLite", orm: "Prisma", provenance: "explicit", ormProvenance: "explicit" } });
    expect(ContractHashEngine.hashArchitecture(c1)).not.toBe(ContractHashEngine.hashArchitecture(c2));
  });

  it("does NOT include timestamps in hash", () => {
    // lockedAt is not a field in ArchitectureContractV1 but validate the concept:
    // running twice should give same hash
    const c = makeContract();
    const h1 = ContractHashEngine.hashArchitecture(c);
    const h2 = ContractHashEngine.hashArchitecture(c);
    expect(h1).toBe(h2);
  });
});

describe("ContractHashEngine — Data hashing", () => {
  it("sorts fields for stable hash", () => {
    const m1 = [{ name: "User", fields: ["id", "email", "name"] }];
    const m2 = [{ name: "User", fields: ["name", "id", "email"] }]; // different order
    expect(ContractHashEngine.hashData(m1)).toBe(ContractHashEngine.hashData(m2));
  });

  it("changes hash when model name changes", () => {
    const m1 = [{ name: "User", fields: ["id", "email"] }];
    const m2 = [{ name: "Account", fields: ["id", "email"] }];
    expect(ContractHashEngine.hashData(m1)).not.toBe(ContractHashEngine.hashData(m2));
  });
});

describe("ContractHashEngine — API hashing", () => {
  it("sorts endpoints for stable hash", () => {
    const e1 = [
      { method: "GET", path: "/api/scans" },
      { method: "POST", path: "/api/scans" },
    ];
    const e2 = [
      { method: "POST", path: "/api/scans" },
      { method: "GET", path: "/api/scans" },
    ];
    expect(ContractHashEngine.hashApi(e1)).toBe(ContractHashEngine.hashApi(e2));
  });

  it("changes hash when path changes", () => {
    const e1 = [{ method: "GET", path: "/api/scans" }];
    const e2 = [{ method: "GET", path: "/api/vulnerability" }];
    expect(ContractHashEngine.hashApi(e1)).not.toBe(ContractHashEngine.hashApi(e2));
  });
});

describe("ContractHashEngine — File graph hashing", () => {
  it("sorts paths for stable hash", () => {
    const h1 = ContractHashEngine.hashFileGraph(["src/App.tsx", "src/main.tsx"]);
    const h2 = ContractHashEngine.hashFileGraph(["src/main.tsx", "src/App.tsx"]);
    expect(h1).toBe(h2);
  });

  it("changes when file is added", () => {
    const h1 = ContractHashEngine.hashFileGraph(["src/App.tsx"]);
    const h2 = ContractHashEngine.hashFileGraph(["src/App.tsx", "src/NewFile.tsx"]);
    expect(h1).not.toBe(h2);
  });
});

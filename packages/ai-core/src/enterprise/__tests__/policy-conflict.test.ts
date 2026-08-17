import { describe, it, expect } from "vitest";
import { PolicyConflictEngine } from "../policy-conflict-engine.js";

describe("AEGIS Phase 21 — Policy Conflict Resolution", () => {
  it("prevents lower-level policies from weakening mandatory platform safety rules", () => {
    const resolved = PolicyConflictEngine.resolve([
      { level: "PLATFORM", requireHumanApprovalForDestructiveMigrations: true, maxConcurrentJobs: 10 },
      { level: "ORGANIZATION", requireHumanApprovalForDestructiveMigrations: true, maxConcurrentJobs: 8 },
      { level: "PROJECT", requireHumanApprovalForDestructiveMigrations: false, maxConcurrentJobs: 4 }, // attempts weakening
    ]);

    expect(resolved.requireHumanApprovalForDestructiveMigrations).toBe(true);
    expect(resolved.maxConcurrentJobs).toBe(4); // Strictest limit
    expect(resolved.conflictsResolved.length).toBeGreaterThan(0);
  });
});

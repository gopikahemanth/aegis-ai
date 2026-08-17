import { describe, it, expect, beforeEach } from "vitest";
import { ArchitectureMemoryEngine } from "../architecture-memory-engine.js";

describe("AEGIS Phase 41 — Architecture Decision Memory Engine", () => {
  beforeEach(() => {
    ArchitectureMemoryEngine.reset();
  });

  it("tracks architecture decision records and maintains supersession chains without deleting history", () => {
    ArchitectureMemoryEngine.recordADR({
      decisionId: "ADR-001",
      organizationId: "org_global",
      projectId: "proj_gym",
      title: "In-Memory Event Dispatch",
      context: "Low initial concurrency requiring simple message dispatch",
      decision: "Use Node EventEmitter for internal events",
      tradeoffs: ["Fast local memory", "Cannot scale across distributed processes"],
      author: "lead_arch",
      status: "ACTIVE",
      recordedAt: new Date().toISOString(),
    });

    ArchitectureMemoryEngine.recordADR({
      decisionId: "ADR-014",
      organizationId: "org_global",
      projectId: "proj_gym",
      title: "Zero-Copy Streaming Pipeline",
      context: "Scale to >10,000 active sessions across clustered nodes",
      decision: "Adopt zero-copy ring buffer streaming",
      tradeoffs: ["Higher buffer complexity", "Predictable sub-20ms latency"],
      author: "vp_eng_lead",
      status: "ACTIVE",
      recordedAt: new Date().toISOString(),
    });

    ArchitectureMemoryEngine.supersedeADR("ADR-001", "ADR-014", "Scaled concurrency requirement");

    const adr001 = ArchitectureMemoryEngine.getADR("ADR-001");
    expect(adr001?.status).toBe("SUPERSEDED");
    expect(adr001?.supersededBy).toBe("ADR-014");

    const all = ArchitectureMemoryEngine.getAllADRs();
    expect(all.length).toBe(2); // History preserved
  });
});

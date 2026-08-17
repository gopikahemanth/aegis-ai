import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ProjectIntelligenceIndex } from "../project-intelligence-index.js";

const INTEL_DIR = join(process.cwd(), ".tmp_test_intel");

describe("ProjectIntelligenceIndex", () => {
  beforeEach(() => {
    if (existsSync(INTEL_DIR)) rmSync(INTEL_DIR, { recursive: true, force: true });
    mkdirSync(INTEL_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(INTEL_DIR)) rmSync(INTEL_DIR, { recursive: true, force: true });
  });

  it("records generation lineage and tracks feature lifecycles", () => {
    ProjectIntelligenceIndex.recordGeneration(INTEL_DIR, "proj_gym", {
      generationId: "gen_1",
      requestId: "req_1",
      prompt: "Build Gym App",
      timestamp: new Date().toISOString(),
      contractHashes: { arch: "hash_123" },
      changeSet: {
        generationId: "gen_1",
        category: "NEW_FEATURE",
        blastRadius: "FEATURE",
        createdFiles: ["src/features/members/MemberList.tsx"],
        modifiedFiles: [],
        deletedFiles: [],
        preservedFiles: [],
        fileHashesBefore: {},
        fileHashesAfter: {},
      },
      verificationPassed: true,
      evidenceSummary: "10/10 checks passed",
    });

    ProjectIntelligenceIndex.updateFeature(INTEL_DIR, "proj_gym", {
      featureId: "members",
      name: "Member Management",
      status: "VERIFIED",
      createdInGeneration: "gen_1",
      lastModifiedInGeneration: "gen_1",
      ownedFiles: ["src/features/members/MemberList.tsx"],
    });

    const store = ProjectIntelligenceIndex.load(INTEL_DIR, "proj_gym");
    expect(store.generations.length).toBe(1);
    expect(store.features["members"].status).toBe("VERIFIED");
  });
});

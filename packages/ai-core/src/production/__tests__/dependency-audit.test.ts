import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DependencyAuditor } from "../dependency-auditor.js";
import { SbomGenerator } from "../sbom-generator.js";

const DEP_TEST_DIR = join(process.cwd(), ".tmp_test_p14_dep");

describe("AEGIS Phase 14 — Supply-Chain Security & SBOM Generation", () => {
  beforeEach(() => {
    if (existsSync(DEP_TEST_DIR)) rmSync(DEP_TEST_DIR, { recursive: true, force: true });
    mkdirSync(DEP_TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(DEP_TEST_DIR)) rmSync(DEP_TEST_DIR, { recursive: true, force: true });
  });

  it("detects lockfile drift when foreign package-lock.json exists in pnpm workspace", () => {
    writeFileSync(join(DEP_TEST_DIR, "package.json"), JSON.stringify({ dependencies: { express: "^4.19.2" } }));
    writeFileSync(join(DEP_TEST_DIR, "package-lock.json"), "{}");

    const audit = DependencyAuditor.audit(DEP_TEST_DIR);
    expect(audit.status).toBe("FAIL");
    expect(audit.issues.some((i) => i.type === "UNEXPECTED_LOCKFILE")).toBe(true);
  });

  it("generates authoritative SBOM at .aegis/sbom.json", () => {
    writeFileSync(
      join(DEP_TEST_DIR, "package.json"),
      JSON.stringify({
        dependencies: { express: "^4.19.2", react: "^19.1.0" },
        devDependencies: { typescript: "^5.8.3" },
      })
    );

    const sbom = SbomGenerator.generate(DEP_TEST_DIR, "gym_proj", "gen_101", "arch_hash", "dep_hash");
    expect(sbom.components.length).toBe(3);
    expect(existsSync(join(DEP_TEST_DIR, ".aegis", "sbom.json"))).toBe(true);
  });
});

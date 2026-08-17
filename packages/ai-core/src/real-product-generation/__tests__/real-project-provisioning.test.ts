import { describe, it, expect } from "vitest";
import { RealProjectProvisioner } from "../real-project-provisioner.js";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";

describe("AEGIS Phase 52 — Real Project Provisioner", () => {
  it("creates real project directories, package manifests, source scaffold, and env template on disk", () => {
    const result = RealProjectProvisioner.provision("GymPlatformTest", path.join(os.tmpdir(), "aegis-test-prov"));
    expect(result.isProvisioned).toBe(true);
    expect(result.directoryCreated).toBe(true);
    expect(result.packageManifestCreated).toBe(true);
    expect(result.sourceScaffolded).toBe(true);
    expect(result.envTemplateCreated).toBe(true);
    expect(result.requiredEnvVars).toContain("DATABASE_URL");
    expect(fs.existsSync(result.projectPath)).toBe(true);
    expect(fs.existsSync(path.join(result.projectPath, "package.json"))).toBe(true);
    expect(fs.existsSync(path.join(result.projectPath, ".env.template"))).toBe(true);
    fs.rmSync(result.projectPath, { recursive: true, force: true });
  });
});

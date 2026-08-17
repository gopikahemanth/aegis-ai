import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ProjectStateReconciler } from "../project-state-reconciler.js";
import { ArchitectureResolver } from "../../governance/architecture-resolver.js";

const RECON_DIR = join(process.cwd(), ".tmp_test_recon");

describe("ProjectStateReconciler", () => {
  beforeEach(() => {
    if (existsSync(RECON_DIR)) rmSync(RECON_DIR, { recursive: true, force: true });
    mkdirSync(RECON_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(RECON_DIR)) rmSync(RECON_DIR, { recursive: true, force: true });
  });

  it("reconstructs actual state from disk and detects drift against locked contracts", () => {
    // 1. Setup disk project with React-Vite and SQLite
    writeFileSync(join(RECON_DIR, "package.json"), JSON.stringify({ dependencies: { react: "^18.0.0" } }), "utf8");
    const prismaDir = join(RECON_DIR, "prisma");
    mkdirSync(prismaDir, { recursive: true });
    writeFileSync(
      join(prismaDir, "schema.prisma"),
      `datasource db {\n  provider = "sqlite"\n  url = "file:./dev.db"\n}\n\nmodel User {\n  id Int @id @default(autoincrement())\n}\n\nmodel Member {\n  id Int @id @default(autoincrement())\n  name String\n}`,
      "utf8"
    );

    // 2. Reconcile with matching locked contract
    const matchingArch = ArchitectureResolver.resolve("Build Gym App with SQLite and React");
    const recon1 = ProjectStateReconciler.reconcile(RECON_DIR, matchingArch, null);

    expect(recon1.reconciledState.framework).toBe("React-Vite");
    expect(recon1.reconciledState.database).toBe("sqlite");
    expect(recon1.reconciledState.models).toContain("User");
    expect(recon1.reconciledState.models).toContain("Member");
    expect(recon1.hasDrift).toBe(false);

    // 3. Reconcile with mismatching locked contract (e.g. locked PostgreSQL vs disk SQLite)
    const mismatchArch = ArchitectureResolver.resolve("Build Gym App with PostgreSQL and Express");
    const recon2 = ProjectStateReconciler.reconcile(RECON_DIR, mismatchArch, null);

    expect(recon2.hasDrift).toBe(true);
    expect(recon2.driftTypes).toContain("DATA_DRIFT");
  });
});

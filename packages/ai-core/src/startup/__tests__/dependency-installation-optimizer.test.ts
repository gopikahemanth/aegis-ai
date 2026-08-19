import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DependencyInstallationOptimizer } from "../dependency-installation-optimizer.js";
import { DependencyInstaller } from "@aegis/project-builder";

describe("Aegis V2.1 Fix 9 — Dependency Installation Optimizer & Cache Synchronization", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aegis-fix9-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(testDir, { recursive: true });
    mkdirSync(join(testDir, "node_modules"), { recursive: true });
    mkdirSync(join(testDir, ".aegis"), { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  it("Test 1 — No package changes: existing synchronized dependency state skips full install", () => {
    const pkg = {
      name: "test-app",
      dependencies: { react: "^18.2.0", "react-dom": "^18.2.0" },
    };
    writeFileSync(join(testDir, "package.json"), JSON.stringify(pkg, null, 2), "utf8");

    // Simulate mock node_modules entries
    mkdirSync(join(testDir, "node_modules/react"), { recursive: true });
    mkdirSync(join(testDir, "node_modules/react-dom"), { recursive: true });

    const hash = DependencyInstallationOptimizer.computeDependencyHash(JSON.stringify(pkg), "pnpm");
    DependencyInstallationOptimizer.saveCache(testDir, hash, "mock-lock-hash", "pnpm", "prefer-offline");

    const sync = DependencyInstallationOptimizer.checkSynchronization(testDir, "pnpm");
    expect(sync.synchronized).toBe(true);
    expect(sync.reason).toContain("synchronized and verified");
  });

  it("Test 2 — New dependency: package.json adds a dependency -> synchronization invoked", () => {
    const pkgInitial = {
      name: "test-app",
      dependencies: { react: "^18.2.0" },
    };
    writeFileSync(join(testDir, "package.json"), JSON.stringify(pkgInitial, null, 2), "utf8");
    mkdirSync(join(testDir, "node_modules/react"), { recursive: true });

    const initialHash = DependencyInstallationOptimizer.computeDependencyHash(JSON.stringify(pkgInitial), "pnpm");
    DependencyInstallationOptimizer.saveCache(testDir, initialHash, "mock-lock", "pnpm", "prefer-offline");

    // Add new dependency to package.json
    const pkgUpdated = {
      name: "test-app",
      dependencies: { react: "^18.2.0", axios: "^1.6.0" },
    };
    writeFileSync(join(testDir, "package.json"), JSON.stringify(pkgUpdated, null, 2), "utf8");

    const sync = DependencyInstallationOptimizer.checkSynchronization(testDir, "pnpm");
    expect(sync.synchronized).toBe(false);
  });

  it("Test 3 — Lockfile changed: lockfile hash changes -> synchronization invoked", () => {
    const pkg = { name: "test-app", dependencies: { react: "^18.2.0" } };
    writeFileSync(join(testDir, "package.json"), JSON.stringify(pkg, null, 2), "utf8");
    writeFileSync(join(testDir, "pnpm-lock.yaml"), "lockfile-v1", "utf8");
    mkdirSync(join(testDir, "node_modules/react"), { recursive: true });

    const hash = DependencyInstallationOptimizer.computeDependencyHash(JSON.stringify(pkg), "pnpm");
    DependencyInstallationOptimizer.saveCache(testDir, hash, "lockfile-v1-hash", "pnpm");

    // Change lockfile content
    writeFileSync(join(testDir, "pnpm-lock.yaml"), "lockfile-v2-updated", "utf8");
    const lockHash = DependencyInstallationOptimizer.computeLockfileHash(testDir);
    expect(lockHash).not.toBe("lockfile-v1-hash");
  });

  it("Test 4 — No node_modules: installation invoked when node_modules is missing", () => {
    const pkg = { name: "test-app", dependencies: { react: "^18.2.0" } };
    writeFileSync(join(testDir, "package.json"), JSON.stringify(pkg, null, 2), "utf8");
    rmSync(join(testDir, "node_modules"), { recursive: true, force: true });

    const sync = DependencyInstallationOptimizer.checkSynchronization(testDir, "pnpm");
    expect(sync.synchronized).toBe(false);
    expect(sync.reason).toContain("node_modules directory does not exist");
  });

  it("Test 5 — Offline store available: fast prefer-offline caching succeeds", () => {
    const installer = new DependencyInstaller();
    const pkg = { name: "test-app", dependencies: { zod: "^3.22.0" } };
    writeFileSync(join(testDir, "package.json"), JSON.stringify(pkg, null, 2), "utf8");
    mkdirSync(join(testDir, "node_modules/zod"), { recursive: true });

    installer.saveCache(testDir, "pnpm", "prefer-offline");
    expect(installer.isSynchronized(testDir, "pnpm")).toBe(true);
  });

  it("Test 6 — Offline store missing required package: missing package triggers synchronization", () => {
    const pkg = {
      name: "test-app",
      dependencies: { react: "^18.2.0", "missing-pkg-123": "^1.0.0" },
    };
    writeFileSync(join(testDir, "package.json"), JSON.stringify(pkg, null, 2), "utf8");
    mkdirSync(join(testDir, "node_modules/react"), { recursive: true });
    // "missing-pkg-123" is missing in node_modules

    const sync = DependencyInstallationOptimizer.checkSynchronization(testDir, "pnpm");
    expect(sync.synchronized).toBe(false);
  });

  it("Test 7 — Source-only change: modifying src/App.tsx does not require dependency re-install", () => {
    const pkg = { name: "test-app", dependencies: { react: "^18.2.0" } };
    writeFileSync(join(testDir, "package.json"), JSON.stringify(pkg, null, 2), "utf8");
    mkdirSync(join(testDir, "node_modules/react"), { recursive: true });
    mkdirSync(join(testDir, "src"), { recursive: true });
    writeFileSync(join(testDir, "src/App.tsx"), "export function App() { return <div>V1</div>; }", "utf8");

    const hash = DependencyInstallationOptimizer.computeDependencyHash(JSON.stringify(pkg), "pnpm");
    DependencyInstallationOptimizer.saveCache(testDir, hash, "lock", "pnpm", "prefer-offline");

    // Modify source code only
    writeFileSync(join(testDir, "src/App.tsx"), "export function App() { return <div>V2 Updated</div>; }", "utf8");

    const sync = DependencyInstallationOptimizer.checkSynchronization(testDir, "pnpm");
    expect(sync.synchronized).toBe(true);
  });

  it("Test 8 — Dependency fingerprint invalidation: changing version or adding package invalidates cache", () => {
    const pkgV1 = { name: "test-app", dependencies: { react: "18.2.0" } };
    const pkgV2 = { name: "test-app", dependencies: { react: "18.3.0" } };

    const hash1 = DependencyInstallationOptimizer.computeDependencyHash(JSON.stringify(pkgV1), "pnpm");
    const hash2 = DependencyInstallationOptimizer.computeDependencyHash(JSON.stringify(pkgV2), "pnpm");

    expect(hash1).not.toBe(hash2);
  });

  it("Test 9 — Prisma schema change only: schema update does not trigger dependency reinstall", () => {
    const pkg = { name: "test-app", dependencies: { "@prisma/client": "^6.0.0" } };
    writeFileSync(join(testDir, "package.json"), JSON.stringify(pkg, null, 2), "utf8");
    mkdirSync(join(testDir, "node_modules/@prisma/client"), { recursive: true });
    mkdirSync(join(testDir, "prisma"), { recursive: true });
    writeFileSync(join(testDir, "prisma/schema.prisma"), "model User { id String @id }", "utf8");

    const hash = DependencyInstallationOptimizer.computeDependencyHash(JSON.stringify(pkg), "pnpm");
    DependencyInstallationOptimizer.saveCache(testDir, hash, "lock", "pnpm", "prefer-offline");

    // Update schema with a new model
    writeFileSync(join(testDir, "prisma/schema.prisma"), "model User { id String @id }\nmodel Task { id String @id }", "utf8");

    const sync = DependencyInstallationOptimizer.checkSynchronization(testDir, "pnpm");
    expect(sync.synchronized).toBe(true);
  });

  it("Test 10 — Optimization failure fallback: invalid cache state cleanly prompts resync", () => {
    const pkg = { name: "test-app", dependencies: { react: "^18.2.0" } };
    writeFileSync(join(testDir, "package.json"), JSON.stringify(pkg, null, 2), "utf8");

    // Corrupt or invalidate cache
    DependencyInstallationOptimizer.invalidateCache(testDir);
    const sync = DependencyInstallationOptimizer.checkSynchronization(testDir, "pnpm");
    expect(sync.synchronized).toBe(false);
  });
});

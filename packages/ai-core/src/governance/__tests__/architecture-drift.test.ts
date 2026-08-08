import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ArchitectureResolver } from "../../governance/architecture-resolver.js";
import { ArchitectureAuditor } from "../../governance/architecture-auditor.js";
import { ArchitectureDiff } from "../../governance/architecture-diff.js";
import { DefinitionOfDone } from "../../validation/definition-of-done.js";

describe("Architecture Drift Governance Suite", () => {
  const testDir = join(process.cwd(), "temp_test_governance");

  beforeEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
    mkdirSync(join(testDir, "src"), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
  });

  it("TEST 1: Next.js contract vs Next.js project -> PASS", () => {
    const contract = ArchitectureResolver.resolve("Build Next.js app with Next.js API Routes", { name: "app", type: "fullstack", language: "TypeScript", packageManager: "pnpm" }, {} as any);
    ArchitectureResolver.writeContract(testDir, contract);
    writeFileSync(join(testDir, "package.json"), JSON.stringify({ dependencies: { next: "^14.0.0", react: "^18.0.0" } }), "utf8");
    mkdirSync(join(testDir, "app", "api"), { recursive: true });

    const audit = ArchitectureAuditor.audit(testDir);
    const diff = ArchitectureDiff.compare(ArchitectureResolver.loadContract(testDir), audit);
    expect(diff.status).toBe("PASS");
  });

  it("TEST 2: Next.js contract vs Vite project -> FAIL", () => {
    const contract = ArchitectureResolver.resolve("Build Next.js app", { name: "app", type: "fullstack", language: "TypeScript", packageManager: "pnpm" }, {} as any);
    ArchitectureResolver.writeContract(testDir, contract);
    writeFileSync(join(testDir, "package.json"), JSON.stringify({ dependencies: { vite: "^5.0.0", react: "^18.0.0" } }), "utf8");

    const audit = ArchitectureAuditor.audit(testDir);
    const diff = ArchitectureDiff.compare(ArchitectureResolver.loadContract(testDir), audit);
    expect(diff.status).toBe("FAILED");
    expect(diff.violations.some(v => v.field === "frontend.framework")).toBe(true);
  });

  it("TEST 3: PostgreSQL contract vs SQLite project -> FAIL (Catches silent PostgreSQL -> SQLite regression)", () => {
    const contract = ArchitectureResolver.resolve("Build app with PostgreSQL", { name: "app", type: "fullstack", language: "TypeScript", packageManager: "pnpm" }, {} as any);
    ArchitectureResolver.writeContract(testDir, contract);

    mkdirSync(join(testDir, "prisma"), { recursive: true });
    writeFileSync(join(testDir, "prisma", "schema.prisma"), `datasource db { provider = "sqlite" url = "file:./dev.db" }`, "utf8");

    const audit = ArchitectureAuditor.audit(testDir);
    const diff = ArchitectureDiff.compare(ArchitectureResolver.loadContract(testDir), audit);
    expect(diff.status).toBe("FAILED");
    expect(diff.violations.some(v => v.field === "database.provider")).toBe(true);
  });

  it("TEST 4: Drizzle contract vs Prisma project -> FAIL", () => {
    const contract = ArchitectureResolver.resolve("Build app with Drizzle ORM", { name: "app", type: "fullstack", language: "TypeScript", packageManager: "pnpm" }, {} as any);
    ArchitectureResolver.writeContract(testDir, contract);

    mkdirSync(join(testDir, "prisma"), { recursive: true });
    writeFileSync(join(testDir, "prisma", "schema.prisma"), `datasource db { provider = "sqlite" url = "file:./dev.db" }`, "utf8");

    const audit = ArchitectureAuditor.audit(testDir);
    const diff = ArchitectureDiff.compare(ArchitectureResolver.loadContract(testDir), audit);
    expect(diff.status).toBe("FAILED");
    expect(diff.violations.some(v => v.field === "database.orm")).toBe(true);
  });

  it("TEST 5: Next.js API Routes contract vs Express project -> FAIL", () => {
    const contract = ArchitectureResolver.resolve("Build Next.js API Routes app", { name: "app", type: "fullstack", language: "TypeScript", packageManager: "pnpm" }, {} as any);
    ArchitectureResolver.writeContract(testDir, contract);

    writeFileSync(join(testDir, "package.json"), JSON.stringify({ dependencies: { express: "^4.18.0" } }), "utf8");

    const audit = ArchitectureAuditor.audit(testDir);
    const diff = ArchitectureDiff.compare(ArchitectureResolver.loadContract(testDir), audit);
    expect(diff.status).toBe("FAILED");
    expect(diff.violations.some(v => v.field === "backend.framework")).toBe(true);
  });

  it("TEST 6: Missing architecture contract -> FAIL", () => {
    const audit = ArchitectureAuditor.audit(testDir);
    const diff = ArchitectureDiff.compare(null, audit);
    expect(diff.status).toBe("FAILED");
  });

  it("TEST 7: Valid project with minor syntax error -> Architecture PASS, Build FAIL", () => {
    const contract = ArchitectureResolver.resolve("Build React Vite app with Express", { name: "app", type: "fullstack", language: "TypeScript", packageManager: "pnpm" }, {} as any);
    ArchitectureResolver.writeContract(testDir, contract);
    writeFileSync(join(testDir, "package.json"), JSON.stringify({ dependencies: { vite: "^5.0.0", react: "^18.0.0", express: "^4.18.0" } }), "utf8");

    const audit = ArchitectureAuditor.audit(testDir);
    const diff = ArchitectureDiff.compare(ArchitectureResolver.loadContract(testDir), audit);
    expect(diff.status).toBe("PASS");

    const dod = new DefinitionOfDone();
    const result = dod.validate(testDir, [], false); // buildSuccess = false
    expect(result.passed).toBe(false);
    expect(result.blockers.some(b => b.id === "build-success")).toBe(true);
  });

  it("TEST 8: Architecture Change Proposal generation when stack change attempted -> BLOCKED", () => {
    const proposalPath = ArchitectureDiff.createProposal(
      testDir,
      { database: "PostgreSQL" },
      { database: "SQLite" },
      "Local setup failed"
    );

    expect(existsSync(proposalPath)).toBe(true);
    const proposal = JSON.parse(readFileSync(proposalPath, "utf8"));
    expect(proposal.approved).toBe(false);
  });
});

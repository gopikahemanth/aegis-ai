import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ArchitectureResolver } from "../../governance/architecture-resolver.js";
import { ArchitectureAuditor } from "../../governance/architecture-auditor.js";
import { ArchitectureDiff } from "../../governance/architecture-diff.js";
import { PlannerArchitectureGuard } from "../../governance/planner-guard.js";
import { ArchitectureContractNormalizer } from "../../governance/contract-normalizer.js";
import { FastDeterministicSanitizer } from "../../governance/fast-sanitizer.js";
import { DefinitionOfDone } from "../../validation/definition-of-done.js";
import { TransactionalRepairSystem } from "../../healing/transactional-repair.js";
import { ValidationContextManager } from "../../validation/validation-context.js";

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

  it("TEST 9: TransactionalRepairSystem rollback restores original file on repair failure", () => {
    const filePath = join("src", "App.tsx");
    writeFileSync(join(testDir, filePath), "const original = 1;", "utf8");

    const checkpointId = TransactionalRepairSystem.createCheckpoint(testDir, [filePath]);
    writeFileSync(join(testDir, filePath), "const broken = 2;", "utf8");

    TransactionalRepairSystem.rollback(testDir, checkpointId, "Repair validation failed");
    expect(readFileSync(join(testDir, filePath), "utf8")).toBe("const original = 1;");
  });

  it("TEST 10: GenerationValidationContext throws error when instantiated with invalid architecture", () => {
    expect(() => {
      ValidationContextManager.createInitialContext(testDir, null as any, {} as any);
    }).toThrow("Invalid Architecture Contract");
  });

  it("TEST 11: PlannerArchitectureGuard blocks Next.js task when contract is React-Vite", () => {
    const contract = ArchitectureResolver.resolve("Build React-Vite app with Express", { name: "app", type: "fullstack", language: "TypeScript", packageManager: "pnpm" }, {} as any);
    const task = { id: 1, title: "Create Next.js App Router layout and Server Actions", description: "Use App Router", completed: false, priority: 1, stage: "frontend", dependencies: [], estimatedComplexity: 3 } as any;
    
    const check = PlannerArchitectureGuard.validateTask(task, contract);
    expect(check.hasConflict).toBe(true);
    expect(check.detectedTechnology).toContain("Next.js");
  });

  it("TEST 12: PlannerArchitectureGuard blocks MongoDB task when contract is PostgreSQL", () => {
    const contract = ArchitectureResolver.resolve("Build app with PostgreSQL and Prisma", { name: "app", type: "fullstack", language: "TypeScript", packageManager: "pnpm" }, {} as any);
    const task = { id: 2, title: "Connect to MongoDB Atlas using Mongoose schema", description: "Setup MongoDB", completed: false, priority: 1, stage: "backend", dependencies: [], estimatedComplexity: 3 } as any;

    const check = PlannerArchitectureGuard.validateTask(task, contract);
    expect(check.hasConflict).toBe(true);
    expect(check.detectedTechnology).toContain("MongoDB");
  });

  it("TEST 13: ValidationContextManager.assertArchitectureContext verifies complete architecture contract", () => {
    const contract = ArchitectureResolver.resolve("Build React-Vite app with Express, PostgreSQL and Prisma", { name: "app", type: "fullstack", language: "TypeScript", packageManager: "pnpm" }, {} as any);
    const valCtx = ValidationContextManager.createInitialContext(testDir, contract, {} as any);

    expect(() => {
      ValidationContextManager.assertArchitectureContext(valCtx);
    }).not.toThrow();

    expect(valCtx.framework).toBe("React-Vite");
    expect(valCtx.database).toBe("PostgreSQL");
    expect(valCtx.orm).toBe("Prisma");
  });

  it("TEST 14: ValidationContextManager.assertArchitectureContext throws ARCHITECTURE_CONTEXT_INVALID when framework is missing", () => {
    const invalidContext: any = {
      architecture: {
        frontend: {},
        backend: { framework: "Express" },
        database: { provider: "PostgreSQL", orm: "Prisma" }
      }
    };

    expect(() => {
      ValidationContextManager.assertArchitectureContext(invalidContext);
    }).toThrow("ARCHITECTURE_CONTEXT_INVALID");
  });

  it("TEST 15: PlannerArchitectureGuard throws ARCHITECTURE_CONTRACT_MISSING when contract is undefined", () => {
    expect(() => {
      PlannerArchitectureGuard.validateTask({ id: 1, title: "Valid task" } as any, undefined as any);
    }).toThrow("ARCHITECTURE_CONTRACT_MISSING");
  });

  it("TEST 16: PlannerArchitectureGuard allows valid React + Express + Prisma tasks", () => {
    const contract = ArchitectureResolver.resolve("Build React-Vite app with Express, PostgreSQL and Prisma", { name: "app", type: "fullstack", language: "TypeScript", packageManager: "pnpm" }, {} as any);
    
    const validTasks = [
      { id: 1, title: "Implement Express JWT authentication using bcrypt and PostgreSQL/Prisma", description: "Auth setup" },
      { id: 2, title: "Implement Express PDF upload endpoint using multer and pdf-parse", description: "PDF handler" },
      { id: 3, title: "Implement React dashboard with Recharts", description: "UI component" }
    ] as any[];

    for (const t of validTasks) {
      const check = PlannerArchitectureGuard.validateTask(t, contract);
      expect(check.hasConflict).toBe(false);
    }
  });

  it("TEST 17: PlannerArchitectureGuard adapts/regenerates Next.js task to React/Express REST", () => {
    const contract = ArchitectureResolver.resolve("Build React-Vite app with Express, PostgreSQL and Prisma", { name: "app", type: "fullstack", language: "TypeScript", packageManager: "pnpm" }, {} as any);
    
    const nextTask = { id: 1, title: "Implement NextAuth authentication", description: "Use NextAuth" } as any;
    const filtered = PlannerArchitectureGuard.filterTasks([nextTask], contract);

    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe("Implement Express JWT Auth authentication");
    expect(filtered[0].description).toContain("Express middleware");
  });

  it("TEST 18: ArchitectureContractNormalizer normalizes contradictory Next.js spec to React-Vite + Express contract", () => {
    const contract = ArchitectureResolver.resolve("Build React-Vite app with Express, PostgreSQL and Prisma", { name: "app", type: "fullstack", language: "TypeScript", packageManager: "pnpm" }, {} as any);
    const contradictorySpec = {
      name: "app",
      type: "fullstack",
      frontend: "Next.js 14 App Router",
      backend: "Next.js API Routes",
      database: "MongoDB",
      features: ["NextAuth", "Next.js App Router"]
    } as any;

    const normalized = ArchitectureContractNormalizer.normalizeSpecification(contradictorySpec, contract);
    expect(normalized.frontend).toBe("React-Vite");
    expect(normalized.backend).toBe("Express");
    expect(normalized.database).toBe("PostgreSQL");
    expect(normalized.features).toContain("Express JWT Auth");
  });

  it("TEST 19: FastDeterministicSanitizer fixes dependency closure, case collisions, and invalid DB URL", () => {
    writeFileSync(join(testDir, "package.json"), JSON.stringify({ dependencies: { express: "^4.18.2" } }), "utf8");
    writeFileSync(join(testDir, ".env"), 'DATABASE_URL="sqlite://dev.db"', "utf8");
    mkdirSync(join(testDir, "src"), { recursive: true });
    writeFileSync(join(testDir, "src", "index.ts"), 'import multer from "multer";\nimport pdf from "pdf-parse";\n', "utf8");

    const report = FastDeterministicSanitizer.sanitizeProject(testDir);
    expect(report.missingDependenciesAdded).toContain("multer");
    expect(report.missingDependenciesAdded).toContain("pdf-parse");
    expect(report.databaseUrlValid).toBe(false);

    const updatedEnv = readFileSync(join(testDir, ".env"), "utf8");
    expect(updatedEnv).toContain("postgresql://");
  });

  it("TEST 20: FastDeterministicSanitizer ignores local path aliases (@/shared) from dependency closure", () => {
    writeFileSync(join(testDir, "package.json"), JSON.stringify({ dependencies: { express: "^4.18.2" } }), "utf8");
    writeFileSync(join(testDir, "src", "alias.ts"), 'import { Button } from "@/shared/components/Button";\n', "utf8");

    const report = FastDeterministicSanitizer.sanitizeProject(testDir);
    expect(report.missingDependenciesAdded).not.toContain("@/shared");
    expect(report.missingDependenciesAdded).not.toContain("@/shared/components/Button");
  });

  it("TEST 21: FastDeterministicSanitizer repairs pdf-parse default import contract and React.FC<any>> syntax typo", () => {
    writeFileSync(join(testDir, "src", "pdfHandler.ts"), 'import pdfParse from "pdf-parse";\n', "utf8");
    writeFileSync(join(testDir, "src", "GlassCard.tsx"), 'export const GlassCard: React.FC<any>> = (props) => <div />;\n', "utf8");

    const report = FastDeterministicSanitizer.sanitizeProject(testDir);
    expect(report.exportFixesApplied).toBeGreaterThanOrEqual(1);
    expect(report.syntaxErrorsRepaired).toBeGreaterThanOrEqual(1);

    const pdfCode = readFileSync(join(testDir, "src", "pdfHandler.ts"), "utf8");
    expect(pdfCode).toContain('* as pdfParse');

    const glassCode = readFileSync(join(testDir, "src", "GlassCard.tsx"), "utf8");
    expect(glassCode).not.toContain('React.FC<any>>');
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ArchitectureResolver } from "../architecture-resolver.js";
import { TechnologyContractBuilder } from "../technology-contract.js";
import { DependencyContractManager } from "../dependency-contract.js";
import { ArchitectureDriftValidator } from "../architecture-drift-validator.js";
import { ArchitectureDecisionManager } from "../architecture-decision-record.js";

const TEST_DIR = join(process.cwd(), ".tmp_test_arch_phase4");

describe("AEGIS Phase 4 — Architecture Selection, Governance & Drift Prevention", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  // 1. Generic full-stack default
  it("1. Generic full-stack defaults to React-Vite + Express + PostgreSQL + Prisma + pnpm", () => {
    const contract = ArchitectureResolver.resolve(
      "Build a project management and task tracking application with kanban board."
    );

    expect(contract.applicationType).toBe("FULLSTACK_WEB_APPLICATION");
    expect(contract.frontend.framework).toBe("React-Vite");
    expect(contract.backend.framework).toBe("Express");
    expect(contract.database.provider).toBe("PostgreSQL");
    expect(contract.database.orm).toBe("Prisma");
    expect(contract.packageManager).toBe("pnpm");
    expect(contract.authentication).toBe("JWT");
  });

  // 2. Explicit React requirement
  it("2. Explicit React requirement is respected", () => {
    const contract = ArchitectureResolver.resolve(
      "Build a React Vite frontend with Express backend for expense tracking."
    );
    expect(contract.frontend.framework).toBe("React-Vite");
    expect(contract.frontend.provenance).toBe("user");
  });

  // 3. Explicit Next.js requirement overrides default React-Vite
  it("3. Explicit Next.js requirement overrides default stack", () => {
    const contract = ArchitectureResolver.resolve(
      "Build this with Next.js 14 App Router and PostgreSQL database."
    );
    expect(contract.frontend.framework).toBe("Next.js");
    expect(contract.frontend.provenance).toBe("user");
    expect(contract.architectureProfile).toBe("NEXTJS_FULLSTACK");
  });

  // 4. Explicit Python FastAPI requirement
  it("4. Explicit Python FastAPI requirement is respected", () => {
    const contract = ArchitectureResolver.resolve(
      "Build a data processing pipeline with Python FastAPI backend and PostgreSQL."
    );
    expect(contract.backend.framework).toBe("FastAPI");
    expect(contract.backend.provenance).toBe("user");
  });

  // 5. Existing project architecture preservation
  it("5. Preserves existing project architecture on feature addition", () => {
    // 1. Save an existing React + Express + PostgreSQL contract
    const initialContract = ArchitectureResolver.resolve(
      "Build a customer support ticketing tool with React and Express."
    );
    ArchitectureResolver.writeContract(TEST_DIR, initialContract);

    // 2. User asks to add GitHub integration
    const followUpContract = ArchitectureResolver.resolve(
      "Add GitHub repository webhook integration and sync tickets.",
      undefined,
      undefined,
      TEST_DIR
    );

    // Must NOT migrate to Next.js or different DB
    expect(followUpContract.frontend.framework).toBe("React-Vite");
    expect(followUpContract.backend.framework).toBe("Express");
    expect(followUpContract.database.provider).toBe("PostgreSQL");
  });

  // 6. Incompatible ORM gets safely normalized
  it("6. Incompatible Mongoose with PostgreSQL is normalized to Prisma", () => {
    const contract = ArchitectureResolver.resolve(
      "Build a web app with PostgreSQL database and Mongoose ORM."
    );
    expect(contract.database.provider).toBe("PostgreSQL");
    expect(contract.database.orm).toBe("Prisma"); // Mongoose overridden because PostgreSQL requires relational ORM
  });

  // 7. Simple Static Site Minimalism
  it("7. Simple static landing page does NOT invent unwanted database/backend/auth", () => {
    const contract = ArchitectureResolver.resolve(
      "Create a simple static landing page for a coffee shop."
    );

    expect(contract.applicationType).toBe("STATIC_SITE");
    expect(contract.database.provider).toBe("None");
    expect(contract.database.orm).toBe("None");
    expect(contract.backend.framework).toBe("None");
    expect(contract.authentication).toBe("None");
    expect(contract.browserTestFramework).toBe("None");
  });

  // 8. Package manager lock
  it("8. Package manager is locked to pnpm and detects package-lock.json drift", () => {
    const contract = ArchitectureResolver.resolve("Build a web app with React.");
    expect(contract.packageManager).toBe("pnpm");

    // Write package.json and conflicting package-lock.json
    writeFileSync(join(TEST_DIR, "package.json"), JSON.stringify({ name: "test-app", dependencies: {} }), "utf8");
    writeFileSync(join(TEST_DIR, "package-lock.json"), "{}", "utf8");

    const res = ArchitectureDriftValidator.validate(TEST_DIR, contract);
    expect(res.driftDetected).toBe(true);
    expect(res.issues.some(i => i.category === "PACKAGE_MANAGER_DRIFT")).toBe(true);
  });

  // 9. Dependency duplication detection
  it("9. Detects duplicate competing dependencies (multiple HTTP clients)", () => {
    const duplicates = DependencyContractManager.detectDuplicates(["axios", "got", "react", "express"]);
    expect(duplicates.length).toBe(1);
    expect(duplicates[0]).toContain("DUPLICATE_DEPENDENCY [http_client]");
  });

  // 10. Critical Drift Test: React-Vite + Express + PG vs Next.js + NestJS + Mongo
  it("10. Critical Drift Test: Fails when actual project deviates to Next + Nest + Mongo", () => {
    const contract = ArchitectureResolver.resolve("Build a React Express PostgreSQL application.");

    // Simulate drifted project on disk
    writeFileSync(
      join(TEST_DIR, "package.json"),
      JSON.stringify({
        name: "drifted-project",
        dependencies: {
          "next": "^14.0.0",
          "@nestjs/core": "^10.0.0",
          "mongoose": "^8.0.0",
          "drizzle-orm": "^0.30.0",
        },
      }),
      "utf8"
    );

    const res = ArchitectureDriftValidator.validate(TEST_DIR, contract);
    expect(res.valid).toBe(false);
    expect(res.driftDetected).toBe(true);

    const categories = res.issues.map(i => i.category);
    expect(categories).toContain("FRAMEWORK_DRIFT");
    expect(categories).toContain("DATABASE_DRIFT");
    expect(categories).toContain("ORM_DRIFT");
  });

  // 11. Server boundary violation: Frontend importing @prisma/client
  it("11. Server boundary violation: Detects frontend importing @prisma/client", () => {
    const contract = ArchitectureResolver.resolve("Build a React Express app.");

    mkdirSync(join(TEST_DIR, "src"), { recursive: true });
    writeFileSync(
      join(TEST_DIR, "src", "Dashboard.tsx"),
      `import { PrismaClient } from "@prisma/client";\nexport const Dashboard = () => <div>DB</div>;`,
      "utf8"
    );

    const res = ArchitectureDriftValidator.validate(TEST_DIR, contract);
    expect(res.driftDetected).toBe(true);
    expect(res.issues.some(i => i.category === "BOUNDARY_VIOLATION" && i.actual.includes("@prisma/client"))).toBe(true);
  });

  // 12. Server boundary violation: Frontend importing node:fs
  it("12. Server boundary violation: Detects frontend importing node:fs", () => {
    const contract = ArchitectureResolver.resolve("Build a React Express app.");

    mkdirSync(join(TEST_DIR, "src"), { recursive: true });
    writeFileSync(
      join(TEST_DIR, "src", "FileManager.tsx"),
      `import fs from "node:fs";\nexport const FileManager = () => <div>Files</div>;`,
      "utf8"
    );

    const res = ArchitectureDriftValidator.validate(TEST_DIR, contract);
    expect(res.driftDetected).toBe(true);
    expect(res.issues.some(i => i.category === "BOUNDARY_VIOLATION" && i.actual.includes("fs"))).toBe(true);
  });

  // 13. Secret leak detection: Client component referencing DATABASE_URL
  it("13. Secret leak detection: Flags process.env.DATABASE_URL in frontend client bundle", () => {
    const contract = ArchitectureResolver.resolve("Build a React Express app.");

    mkdirSync(join(TEST_DIR, "src"), { recursive: true });
    writeFileSync(
      join(TEST_DIR, "src", "Config.tsx"),
      `export const dbConfig = { url: process.env.DATABASE_URL };`,
      "utf8"
    );

    const res = ArchitectureDriftValidator.validate(TEST_DIR, contract);
    expect(res.driftDetected).toBe(true);
    expect(res.issues.some(i => i.category === "SECRET_LEAK")).toBe(true);
  });

  // 14. Architecture hash determinism
  it("14. Architecture hash is deterministic for identical stacks", () => {
    const contract1 = ArchitectureResolver.resolve("Build a SaaS invoicing platform with React and Express.");
    const contract2 = ArchitectureResolver.resolve("Build a SaaS invoicing platform with React and Express.");

    expect(contract1.architectureHash).toBeTruthy();
    expect(contract1.architectureHash).toBe(contract2.architectureHash);
  });

  // 15. Technology hash determinism
  it("15. Technology hash is deterministic", () => {
    const t1 = TechnologyContractBuilder.build("FULLSTACK_WEB_APPLICATION", { frontend: "React-Vite", backend: "Express", database: "PostgreSQL" });
    const t2 = TechnologyContractBuilder.build("FULLSTACK_WEB_APPLICATION", { frontend: "React-Vite", backend: "Express", database: "PostgreSQL" });

    expect(t1.technologyHash).toBe(t2.technologyHash);
  });

  // 16. Dependency hash determinism
  it("16. Dependency hash is deterministic", () => {
    const tech = TechnologyContractBuilder.build("FULLSTACK_WEB_APPLICATION", { frontend: "React-Vite", backend: "Express" });
    const d1 = DependencyContractManager.build(tech, "pnpm");
    const d2 = DependencyContractManager.build(tech, "pnpm");

    expect(d1.dependencyHash).toBe(d2.dependencyHash);
  });

  // 17. Architecture Decision Record (ADR) generation
  it("17. Generates and persists Architecture Decision Record (ADR) in .aegis/adr.json", () => {
    const contract = ArchitectureResolver.resolve("Build an analytics dashboard with React.", undefined, undefined, TEST_DIR);
    ArchitectureResolver.writeContract(TEST_DIR, contract);

    expect(existsSync(join(TEST_DIR, ".aegis", "adr.json"))).toBe(true);
    const adr = ArchitectureDecisionManager.load(TEST_DIR);
    expect(adr).not.toBeNull();
    expect(adr?.decisions.length).toBeGreaterThanOrEqual(4);
    expect(adr?.decisions.some(d => d.category === "Frontend Framework")).toBe(true);
  });
});

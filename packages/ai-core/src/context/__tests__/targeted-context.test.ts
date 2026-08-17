import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { TargetedContextMinimizer } from "../targeted-context-minimizer.js";
import type { Task } from "../../planner/task.js";
import { ArchitectureResolver } from "../../governance/architecture-resolver.js";
import { DomainContractDeriver } from "../../governance/domain-contract.js";

const TEST_DIR = join(process.cwd(), ".tmp_test_context_phase5");

describe("TargetedContextMinimizer — Minimum Sufficient Context & Secret Isolation", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(TEST_DIR, { recursive: true });
    mkdirSync(join(TEST_DIR, "src", "components"), { recursive: true });
    mkdirSync(join(TEST_DIR, "server", "routes"), { recursive: true });
    mkdirSync(join(TEST_DIR, "prisma"), { recursive: true });

    // Setup files on disk
    writeFileSync(join(TEST_DIR, "src", "components", "Button.tsx"), "export const Button = () => <button>Click</button>;", "utf8");
    writeFileSync(join(TEST_DIR, "server", "routes", "api.ts"), `const secret = process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";`, "utf8");
    writeFileSync(join(TEST_DIR, "prisma", "schema.prisma"), "datasource db { provider = \"postgresql\" }", "utf8");
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("frontend task receives UI context and redacts server secrets / ignores backend files", () => {
    const arch = ArchitectureResolver.resolve("Build a React Express app with PostgreSQL.");
    const domain = DomainContractDeriver.derive(arch, arch.architectureHash!);

    const frontendTask: Task = {
      id: 1,
      title: "Implement UI Button Component",
      description: "Create primary button in src/components/Button.tsx",
      completed: false,
      ownedFiles: ["src/components/Button.tsx"],
      allowedFiles: ["server/routes/api.ts", "prisma/schema.prisma"], // Attempting to read server files
    };

    const ctx = TargetedContextMinimizer.buildContext(frontendTask, TEST_DIR, arch, domain);

    expect(ctx.contextHeader).toContain("TASK #1: Implement UI Button Component");
    expect(ctx.relevantContracts).toContain("[ARCHITECTURE CONTRACT: FRONTEND]");
    expect(ctx.filesToRead.some(f => f.path.includes("Button.tsx"))).toBe(true);

    // Verify server files were filtered out of frontend context
    expect(ctx.filesToRead.some(f => f.path.includes("api.ts"))).toBe(false);
    expect(ctx.filesToRead.some(f => f.path.includes("schema.prisma"))).toBe(false);
    expect(ctx.excludedSecretsCount).toBeGreaterThanOrEqual(1);
  });

  it("backend task receives backend schema and routes without unrelated frontend UI", () => {
    const arch = ArchitectureResolver.resolve("Build a React Express app with PostgreSQL.");
    const domain = DomainContractDeriver.derive(arch, arch.architectureHash!);

    const backendTask: Task = {
      id: 2,
      title: "Implement Backend Authentication Route",
      description: "Create Express auth route in server/routes/api.ts",
      completed: false,
      ownedFiles: ["server/routes/api.ts"],
      allowedFiles: ["src/components/Button.tsx"], // Unrelated frontend UI
    };

    const ctx = TargetedContextMinimizer.buildContext(backendTask, TEST_DIR, arch, domain);

    expect(ctx.relevantContracts).toContain("[ARCHITECTURE CONTRACT: BACKEND]");
    expect(ctx.filesToRead.some(f => f.path.includes("api.ts"))).toBe(true);

    // Verify unrelated frontend UI was filtered out of backend context
    expect(ctx.filesToRead.some(f => f.path.includes("Button.tsx"))).toBe(false);
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ProjectStartupAgent } from "../project-startup-agent.js";
import { AppServerRunner } from "../app-server-runner.js";

describe("Prisma Startup Lifecycle & Backend Guard Suite (Defect 3)", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aegis-prisma-lifecycle-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
    mkdirSync(join(testDir, "prisma"), { recursive: true });
    mkdirSync(join(testDir, ".aegis"), { recursive: true });
    mkdirSync(join(testDir, "server"), { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  it("auto-repairs duplicate relations during prepare and generates client successfully", async () => {
    const dirtySchema = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String       @id
  coffeeitems CoffeeItem[]
  coffeeItems CoffeeItem[]
}

model CoffeeItem {
  id     String @id
  userId String
  user   User   @relation(fields: [userId], references: [id])
}
`;
    writeFileSync(join(testDir, "prisma", "schema.prisma"), dirtySchema, "utf8");
    writeFileSync(join(testDir, "package.json"), JSON.stringify({ name: "test-app", dependencies: {} }), "utf8");

    const startupAgent = new ProjectStartupAgent();
    await startupAgent.prepare(testDir);

    const repairedSchema = readFileSync(join(testDir, "prisma", "schema.prisma"), "utf8");
    expect(repairedSchema).not.toContain("coffeeitems");
    expect(repairedSchema).toMatch(/coffeeItems\s+CoffeeItem\[\]/);

    const statusPath = join(testDir, ".aegis", "prisma-status.json");
    expect(existsSync(statusPath)).toBe(true);
    const status = JSON.parse(readFileSync(statusPath, "utf8"));
    expect(status.valid).toBe(true);
    expect(status.clientGenerated).toBe(true);
  });

  it("detects and records invalid status when schema has unrecoverable syntax errors", async () => {
    const unrecoverableSchema = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Broken {
  INVALID_SYNTAX_WITHOUT_TYPE_OR_ID
}
`;
    writeFileSync(join(testDir, "prisma", "schema.prisma"), unrecoverableSchema, "utf8");
    writeFileSync(join(testDir, "package.json"), JSON.stringify({ name: "test-app", dependencies: {} }), "utf8");

    const startupAgent = new ProjectStartupAgent();
    try {
      await startupAgent.prepare(testDir);
    } catch {}

    const statusPath = join(testDir, ".aegis", "prisma-status.json");
    expect(existsSync(statusPath)).toBe(true);
    const status = JSON.parse(readFileSync(statusPath, "utf8"));
    expect(status.valid).toBe(false);
    expect(status.clientGenerated).toBe(false);
    expect(status.error).toBeTruthy();
  });

  it("does not report server as ready when backend server crashes on startup", async () => {
    writeFileSync(join(testDir, "package.json"), JSON.stringify({
      name: "test-app",
      scripts: {
        dev: "vite",
      }
    }), "utf8");

    // Server that immediately crashes with code 1
    writeFileSync(join(testDir, "server", "index.ts"), `
console.error("Error: @prisma/client did not initialize yet. Please run prisma generate");
process.exit(1);
`, "utf8");

    // Set a very short timeout for testing to avoid 20s wait
    const serverInfo = await AppServerRunner.startServer(testDir);
    expect(serverInfo.ready).toBe(false);
    AppServerRunner.stopServer();
  });
});

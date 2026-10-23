/**
 * Aegis AI — Phase 7A Reliability, Repair, and Safe Recovery Suite
 *
 * Verifies the tight integration of:
 * - AuthorizedFileWriter & File Ownership Registry (single ownership, bypass detection)
 * - AuthorizedSchemaManager (non-destructive evolution, syntax checks, write permissions)
 * - BoundedRepairEngine (bounded repair attempts, loop termination, no test weakening)
 * - UnifiedVerificationEngine (honest classification: PASS, FAIL, BLOCKED)
 * - UndoManager & Rollback (state preservation under controlled failure injection)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { AuthorizedFileWriter } from "../../writer/authorized-file-writer.js";
import { FileOwnershipRegistry } from "../../governance/file-ownership.js";
import { BoundedRepairEngine } from "../../healing/bounded-repair-engine.js";
import { UnifiedVerificationEngine } from "../../validation/unified-verification-engine.js";
import { AuthorizedSchemaManager } from "../../governance/authorized-schema-manager.js";
import { UndoManager } from "../../edit/undo-manager.js";
import { FeatureMatrixManager } from "../../contracts/feature-matrix.js";

describe("Phase 7A: Reliability, Repair, and Safe Recovery", () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = join(
      tmpdir(),
      `aegis_p7a_reliability_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    ).replace(/\\/g, "/");

    mkdirSync(join(projectRoot, "src", "pages"), { recursive: true });
    mkdirSync(join(projectRoot, "prisma"), { recursive: true });
    mkdirSync(join(projectRoot, ".aegis"), { recursive: true });

    // Seed baseline project files
    writeFileSync(
      join(projectRoot, "src", "pages", "Home.tsx"),
      `import React from "react";\nexport default function Home() { return <h1>Reliable App</h1>; }\n`,
      "utf8"
    );

    writeFileSync(
      join(projectRoot, "src", "index.css"),
      `:root { --color-primary: #3b82f6; --color-background: #0f172a; }\n`,
      "utf8"
    );

    writeFileSync(
      join(projectRoot, "prisma", "schema.prisma"),
      `datasource db {\n  provider = "postgresql"\n  url = env("DATABASE_URL")\n}\ngenerator client {\n  provider = "prisma-client-js"\n}\nmodel User {\n  id String @id @default(uuid())\n  email String @unique\n}\n`,
      "utf8"
    );

    FileOwnershipRegistry.registerOwner("src/pages/Home.tsx", "FrontendAgent");

    const matrix = FeatureMatrixManager.createMatrix("ReliabilityApp", "general", [
      {
        id: "F01",
        title: "Home",
        description: "Primary home page",
        priority: "must-have",
        expectedBehavior: "Renders home page",
        routes: ["/"],
        components: ["Home"],
        apiEndpoints: [],
        dataModels: [],
        validationRules: [],
        acceptanceTests: [{ testId: "test_home", strategy: "browser", description: "Verify home" }],
        verificationStatus: "VERIFIED",
        source: "domain-inference",
        confidence: 1.0,
      },
    ]);
    FeatureMatrixManager.saveToProject(projectRoot, matrix);
  });

  afterEach(() => {
    try {
      if (existsSync(projectRoot)) {
        rmSync(projectRoot, { recursive: true, force: true });
      }
    } catch {}
  });

  // 1. AuthorizedFileWriter prevents write boundary bypass
  it("Ownership enforcement: Blocks unowned or unauthorized writes to protected files", () => {
    const filePath = "src/pages/Home.tsx";

    // Attempt unauthorized write by BackendAgent (Home.tsx is owned by FrontendAgent)
    const rogueWrite = AuthorizedFileWriter.writeFile(projectRoot, {
      path: filePath,
      content: `export default function Hacked() { return null; }`,
      callerRole: "BackendAgent",
    });

    expect(rogueWrite.success).toBe(false);
    expect(rogueWrite.status).toBe("UNAUTHORIZED_OWNER");

    // Content must remain untouched
    const current = readFileSync(join(projectRoot, filePath), "utf8");
    expect(current).toContain("Reliable App");

    // Legitimate owner (FrontendAgent) write must succeed
    const validWrite = AuthorizedFileWriter.writeFile(projectRoot, {
      path: filePath,
      content: `import React from "react";\nexport default function Home() { return <h1>Updated Reliably</h1>; }\n`,
      callerRole: "FrontendAgent",
    });
    expect(validWrite.success).toBe(true);
    expect(validWrite.status).toBe("WRITTEN");
    expect(readFileSync(join(projectRoot, filePath), "utf8")).toContain("Updated Reliably");
  });

  // 2. AuthorizedFileWriter protects against unexpected external modifications
  it("External modification protection: Rejects writes if file changed unexpectedly on disk", () => {
    const filePath = "src/pages/Home.tsx";
    const baseHash = AuthorizedFileWriter.getDiskHash(projectRoot, filePath);
    expect(baseHash).toBeDefined();

    // External actor modifies file on disk
    writeFileSync(join(projectRoot, filePath), `// external manual edit\nexport default function Home() {}`, "utf8");

    // Agent attempts write using the stale pre-change hash
    const outcome = AuthorizedFileWriter.writeFile(projectRoot, {
      path: filePath,
      content: `export default function Overwrite() {}`,
      callerRole: "FrontendAgent",
      expectedBaseHash: baseHash,
    });

    expect(outcome.success).toBe(false);
    expect(outcome.status).toBe("EXTERNAL_MODIFICATION_CONFLICT");
    expect(readFileSync(join(projectRoot, filePath), "utf8")).toContain("external manual edit");
  });

  // 3. AuthorizedSchemaManager prevents rogue writes to prisma/schema.prisma
  it("Schema authority: Blocks unauthorized mutations to database schema", () => {
    const unauthRes = AuthorizedSchemaManager.reconcileAndWriteSchema(
      projectRoot,
      `model Malicious { id String @id }`,
      "UnauthorizedScript"
    );

    expect(unauthRes.success).toBe(false);
    expect(unauthRes.error).toContain("UNAUTHORIZED_SCHEMA_WRITER");

    // Original schema preserved
    const schemaContent = readFileSync(join(projectRoot, "prisma", "schema.prisma"), "utf8");
    expect(schemaContent).toContain("model User");
    expect(schemaContent).not.toContain("Malicious");
  });

  // 4. Broken imports detection in verification engine
  it("Broken imports: UnifiedVerificationEngine flags unresolved local imports", () => {
    const brokenFile = "src/pages/Dashboard.tsx";

    // Write file importing non-existent module using authorized FrontendAgent
    AuthorizedFileWriter.writeFile(projectRoot, {
      path: brokenFile,
      content: `import React from "react";\nimport { NonExistentComponent } from "../shared/components/Missing";\nexport default function Dashboard() { return <NonExistentComponent />; }\n`,
      callerRole: "FrontendAgent",
    });

    // Unified verification must flag the import error
    const verification = UnifiedVerificationEngine.verifyProject(projectRoot);
    expect(verification.success).toBe(false);
    expect(verification.checks.some((c) => c.category === "IMPORTS" && c.status === "FAIL")).toBe(true);
  });

  // 5. Ineffective repeated repairs stop cleanly
  it("Bounded repair: Ineffective repair loops terminate boundedly on repeated failure signatures", async () => {
    const repairEngine = new BoundedRepairEngine();
    const targetFile = "src/stuck.ts";
    writeFileSync(join(projectRoot, targetFile), "export const stuck = true;", "utf8");

    // Attempt 1
    await repairEngine.executeRepairs(projectRoot, [
      { filePath: targetFile, errorMessage: "Unresolvable compile failure TS9999" },
    ]);

    // Attempt 2 with exact same signature halts immediately as BLOCKED
    const summary2 = await repairEngine.executeRepairs(projectRoot, [
      { filePath: targetFile, errorMessage: "Unresolvable compile failure TS9999" },
    ]);

    expect(summary2.success).toBe(false);
    expect(summary2.status).toBe("BLOCKED");
    expect(summary2.explanation).toContain("INEFFECTIVE_REPEATED_REPAIR");
  });

  // 6. Test weakening prohibition: Never silences tests or deletes requirements
  it("Repair invariants: Never weakens tests or drops model fields to force passing", () => {
    const schemaPath = join(projectRoot, "prisma", "schema.prisma");
    const existing = readFileSync(schemaPath, "utf8");

    // Reconcile with incoming schema that lacks `email`
    const minimalIncoming = `datasource db { provider = "postgresql" url = env("DATABASE_URL") } generator client { provider = "prisma-client-js" } model User { id String @id @default(uuid()) }`;

    const reconciled = AuthorizedSchemaManager.reconcile(existing, minimalIncoming);
    expect(reconciled.success).toBe(true);
    // Crucial: email must be preserved and NOT silently discarded!
    expect(reconciled.schemaContent).toContain("email");
  });

  // 7. Honest Infrastructure Blocked reporting
  it("Honest reporting: Classifies database disconnection as INFRASTRUCTURE_BLOCKED, not application code defect", () => {
    const verification = UnifiedVerificationEngine.verifyProject(projectRoot, {
      databaseConnected: false,
    });

    const dbCheck = verification.checks.find((c) => c.category === "INFRASTRUCTURE");
    expect(dbCheck).toBeDefined();
    expect(dbCheck?.status).toBe("BLOCKED");
    expect(dbCheck?.message).toContain("INFRASTRUCTURE_BLOCKED");
  });

  // 8. Atomic Rollback on Controlled Failure
  it("Atomic rollback: Safely restores original state if a mutation crashes midway", () => {
    const checkpoint = UndoManager.createCheckpoint(
      projectRoot,
      "Add feature that crashes midway",
      "add_feature",
      ["src/pages/HalfDone.tsx"]
    );

    // Simulate partial write
    writeFileSync(join(projectRoot, "src/pages/HalfDone.tsx"), "partial corrupt data", "utf8");

    // Perform rollback
    const undoRes = UndoManager.undo(projectRoot);
    expect(undoRes.success).toBe(true);
    expect(existsSync(join(projectRoot, "src/pages/HalfDone.tsx"))).toBe(false);
  });
});

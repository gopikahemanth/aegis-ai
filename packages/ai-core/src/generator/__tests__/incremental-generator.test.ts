import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { IncrementalGenerator } from "../incremental-generator.js";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("IncrementalGenerator — File Satisfaction, Caching, and Targeted Repair", () => {
  const testDir = join(process.cwd(), "temp-test-incremental");

  beforeEach(() => {
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("checkTaskSatisfaction returns false when owned files are missing", () => {
    const task: any = {
      id: 1,
      title: "Create Hero Component",
      ownedFiles: ["src/components/Hero.tsx"],
    };

    const check = IncrementalGenerator.checkTaskSatisfaction(task, testDir);
    expect(check.isSatisfied).toBe(false);
    expect(check.missingOrInvalidFiles.length).toBe(1);
    expect(check.missingOrInvalidFiles[0]).toContain("missing on disk");
  });

  it("checkTaskSatisfaction returns true when owned files exist, are complete, and have balanced braces", () => {
    const filePath = join(testDir, "src", "components", "Hero.tsx");
    mkdirSync(join(testDir, "src", "components"), { recursive: true });
    writeFileSync(filePath, `
      import React from "react";
      export const Hero = () => {
        return (
          <section className="hero">
            <h1>Welcome to Aegis</h1>
          </section>
        );
      };
    `, "utf8");

    const task: any = {
      id: 1,
      title: "Create Hero Component",
      ownedFiles: ["src/components/Hero.tsx"],
    };

    const check = IncrementalGenerator.checkTaskSatisfaction(task, testDir);
    expect(check.isSatisfied).toBe(true);
    expect(check.existingFiles.length).toBe(1);
    expect(check.missingOrInvalidFiles.length).toBe(0);
  });

  it("checkTaskSatisfaction rejects Vite template scaffold counter boilerplate", () => {
    const filePath = join(testDir, "src", "App.tsx");
    mkdirSync(join(testDir, "src"), { recursive: true });
    writeFileSync(filePath, `
      import { useState } from 'react';
      export default function App() {
        const [count, setCount] = useState(0);
        return <h1>Vite + React count is {count}</h1>;
      }
    `, "utf8");

    const task: any = {
      id: 1,
      title: "App Shell",
      ownedFiles: ["src/App.tsx"],
    };

    const check = IncrementalGenerator.checkTaskSatisfaction(task, testDir);
    expect(check.isSatisfied).toBe(false);
    expect(check.missingOrInvalidFiles[0]).toContain("unmodified template scaffold");
  });

  it("checkTaskSatisfaction rejects files with unresolved relative imports", () => {
    const filePath = join(testDir, "src", "App.tsx");
    mkdirSync(join(testDir, "src"), { recursive: true });
    writeFileSync(filePath, `
      import React from "react";
      import { AppRoutes } from "./routes";
      export default function App() {
        return <AppRoutes />;
      }
    `, "utf8");

    const task: any = {
      id: 1,
      title: "App Shell",
      ownedFiles: ["src/App.tsx"],
    };

    // ./routes does NOT exist on disk
    const check = IncrementalGenerator.checkTaskSatisfaction(task, testDir);
    expect(check.isSatisfied).toBe(false);
    expect(check.missingOrInvalidFiles[0]).toContain("unresolved relative import");
  });

  it("checkTaskSatisfaction rejects frontend files that violate server/client boundary", () => {
    const filePath = join(testDir, "src", "components", "BadComponent.tsx");
    mkdirSync(join(testDir, "src", "components"), { recursive: true });
    writeFileSync(filePath, `
      import React from "react";
      import { PrismaClient } from "@prisma/client";
      export const BadComponent = () => <div>Leaking prisma to client</div>;
    `, "utf8");

    const task: any = {
      id: 1,
      title: "Bad Component",
      ownedFiles: ["src/components/BadComponent.tsx"],
    };

    const check = IncrementalGenerator.checkTaskSatisfaction(task, testDir);
    expect(check.isSatisfied).toBe(false);
    expect(check.missingOrInvalidFiles[0]).toContain("server/client boundary violation");
  });

  it("checkTaskSatisfaction invalidates satisfaction when contract hash changes", () => {
    const filePath = join(testDir, "src", "components", "Hero.tsx");
    mkdirSync(join(testDir, "src", "components"), { recursive: true });
    writeFileSync(filePath, `
      import React from "react";
      export const Hero = () => <section>Valid Hero</section>;
    `, "utf8");

    const task: any = {
      id: 1,
      title: "Create Hero Component",
      ownedFiles: ["src/components/Hero.tsx"],
    };

    // Record fingerprint with contractHash "contract_v1"
    IncrementalGenerator.recordTaskFingerprint(task, testDir, "contract_v1");

    // Check with matching contractHash -> SATISFIED
    const check1 = IncrementalGenerator.checkTaskSatisfaction(task, testDir, { contractHash: "contract_v1" });
    expect(check1.isSatisfied).toBe(true);

    // Check with new contractHash -> INVALIDATED
    const check2 = IncrementalGenerator.checkTaskSatisfaction(task, testDir, { contractHash: "contract_v2" });
    expect(check2.isSatisfied).toBe(false);
    expect(check2.reason).toContain("Contract hash changed");
  });

  it("checkTaskSatisfaction flags unbalanced braces as unsatisfied", () => {
    const filePath = join(testDir, "src", "components", "Broken.tsx");
    mkdirSync(join(testDir, "src", "components"), { recursive: true });
    writeFileSync(filePath, `
      export const Broken = () => {
        return <div>Missing closing brace;
    `, "utf8");

    const task: any = {
      id: 2,
      title: "Broken Component",
      ownedFiles: ["src/components/Broken.tsx"],
    };

    const check = IncrementalGenerator.checkTaskSatisfaction(task, testDir);
    expect(check.isSatisfied).toBe(false);
    expect(check.missingOrInvalidFiles[0]).toContain("unbalanced");
  });

  it("Artifact caching persists and retrieves cached specifications", () => {
    const specData = { name: "portfolio", version: "1.0.0", features: ["contact", "projects"] };
    IncrementalGenerator.setCachedArtifact(testDir, "product-spec", "test-prompt-hash", specData);

    const retrieved = IncrementalGenerator.getCachedArtifact(testDir, "product-spec", "test-prompt-hash");
    expect(retrieved).toEqual(specData);

    const missing = IncrementalGenerator.getCachedArtifact(testDir, "product-spec", "unknown-hash");
    expect(missing).toBeNull();
  });

  it("getTargetedRepairContext extracts ONLY the failing route file and prisma snippet", () => {
    const routesDir = join(testDir, "server", "routes");
    mkdirSync(routesDir, { recursive: true });

    writeFileSync(join(routesDir, "contactRoutes.ts"), `export const contactRouter = {};`, "utf8");
    writeFileSync(join(routesDir, "portfolioRoutes.ts"), `export const portfolioRouter = {};`, "utf8");

    const prismaDir = join(testDir, "prisma");
    mkdirSync(prismaDir, { recursive: true });
    writeFileSync(join(prismaDir, "schema.prisma"), `
      model Contact {
        id Int @id @default(autoincrement())
        name String
      }
      model Project {
        id Int @id @default(autoincrement())
        title String
      }
    `, "utf8");

    const targeted = IncrementalGenerator.getTargetedRepairContext(testDir, "/api/contact");
    expect(targeted.targetRouteFile).toBe("server/routes/contactRoutes.ts");
    expect(targeted.content).toContain("contactRouter");
    expect(targeted.content).not.toContain("portfolioRouter");
    expect(targeted.prismaSnippet).toContain("model Contact");
    expect(targeted.prismaSnippet).not.toContain("model Project");
  });
});

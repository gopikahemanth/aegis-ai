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

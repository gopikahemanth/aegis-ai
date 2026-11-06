import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { IncrementalGenerator } from "../incremental-generator.js";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

describe("IncrementalGenerator — 10 Critical Failure & Invalidation Edge Cases", () => {
  const testDir = join(process.cwd(), "temp-test-incremental-edge-cases");

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

  // CASE 1: An unchanged valid file can be reused
  it("Case 1: An unchanged valid file can be reused", () => {
    const filePath = join(testDir, "src", "components", "ValidHero.tsx");
    mkdirSync(join(testDir, "src", "components"), { recursive: true });
    writeFileSync(
      filePath,
      `import React from "react";
export const ValidHero = () => {
  return (
    <section className="hero">
      <h1>Software Engineer Portfolio</h1>
      <p>Building high-performance systems.</p>
    </section>
  );
};`,
      "utf8"
    );

    const task: any = {
      id: 1,
      title: "Hero Section",
      ownedFiles: ["src/components/ValidHero.tsx"],
    };

    IncrementalGenerator.recordTaskFingerprint(task, testDir, "contract_v1");
    const check = IncrementalGenerator.checkTaskSatisfaction(task, testDir, { contractHash: "contract_v1" });

    expect(check.isSatisfied).toBe(true);
    expect(check.existingFiles.length).toBe(1);
    expect(check.missingOrInvalidFiles.length).toBe(0);
    expect(check.existingFiles[0].content).toContain("Software Engineer Portfolio");
  });

  // CASE 2: A changed user requirement invalidates the relevant cache
  it("Case 2: A changed user requirement invalidates the relevant cache", () => {
    const filePath = join(testDir, "src", "components", "Hero.tsx");
    mkdirSync(join(testDir, "src", "components"), { recursive: true });
    writeFileSync(filePath, `export const Hero = () => <h1>Student Portfolio</h1>;`, "utf8");

    const task: any = {
      id: 2,
      title: "Hero Component",
      ownedFiles: ["src/components/Hero.tsx"],
    };

    // Cache with initial user requirement / prompt
    IncrementalGenerator.recordTaskFingerprint(task, testDir, "contract_v1", {
      requirementHash: "req_portfolio_v1",
      userPrompt: "Create a computer science student portfolio",
    });

    // Check with modified requirement hash -> MUST INVALIDATE
    const checkWithChangedReq = IncrementalGenerator.checkTaskSatisfaction(task, testDir, {
      contractHash: "contract_v1",
      requirementHash: "req_portfolio_v2_ecommerce",
    });
    expect(checkWithChangedReq.isSatisfied).toBe(false);
    expect(checkWithChangedReq.reason).toContain("Requirement hash changed");

    // Check with modified user prompt -> MUST INVALIDATE
    const checkWithChangedPrompt = IncrementalGenerator.checkTaskSatisfaction(task, testDir, {
      contractHash: "contract_v1",
      userPrompt: "Create an online bookstore with shopping cart",
    });
    expect(checkWithChangedPrompt.isSatisfied).toBe(false);
    expect(checkWithChangedPrompt.reason).toContain("User prompt changed");

    // Artifact cache lookup invalidation
    IncrementalGenerator.setCachedArtifact(testDir, "discovery", "prompt_portfolio", { pages: ["projects", "about"] });
    expect(IncrementalGenerator.getCachedArtifact(testDir, "discovery", "prompt_portfolio")).toBeDefined();
    expect(IncrementalGenerator.getCachedArtifact(testDir, "discovery", "prompt_bookstore")).toBeNull();
  });

  // CASE 3: A changed architecture contract invalidates the cache
  it("Case 3: A changed architecture contract invalidates the cache", () => {
    const filePath = join(testDir, "src", "components", "Navigation.tsx");
    mkdirSync(join(testDir, "src", "components"), { recursive: true });
    writeFileSync(filePath, `export const Navigation = () => <nav><a href="#home">Home</a></nav>;`, "utf8");

    const task: any = {
      id: 3,
      title: "Navigation Bar",
      ownedFiles: ["src/components/Navigation.tsx"],
    };

    IncrementalGenerator.recordTaskFingerprint(task, testDir, "contract_arch_hash_aaa");

    // Check with same contract hash -> PASSES
    const checkSame = IncrementalGenerator.checkTaskSatisfaction(task, testDir, { contractHash: "contract_arch_hash_aaa" });
    expect(checkSame.isSatisfied).toBe(true);

    // Check with new contract hash -> MUST INVALIDATE
    const checkChanged = IncrementalGenerator.checkTaskSatisfaction(task, testDir, { contractHash: "contract_arch_hash_bbb" });
    expect(checkChanged.isSatisfied).toBe(false);
    expect(checkChanged.reason).toContain("Contract hash changed");
    expect(checkChanged.missingOrInvalidFiles[0]).toContain("invalidated by contract change");
  });

  // CASE 4: A changed dependency invalidates affected files
  it("Case 4: A changed dependency invalidates affected files", () => {
    mkdirSync(join(testDir, "src", "components"), { recursive: true });
    const depPath = "src/components/Button.tsx";
    const depFullPath = join(testDir, depPath);
    writeFileSync(depFullPath, `export const Button = () => <button>Click v1</button>;`, "utf8");
    const initialDepHash = createHash("sha256").update(readFileSync(depFullPath, "utf8")).digest("hex").slice(0, 16);

    const compFullPath = join(testDir, "src", "components", "Header.tsx");
    writeFileSync(
      compFullPath,
      `import { Button } from "./Button";
export const Header = () => <header><Button /></header>;`,
      "utf8"
    );

    const task: any = {
      id: 4,
      title: "Header Component",
      ownedFiles: ["src/components/Header.tsx"],
    };

    // Check with initial matching dependency hash -> PASSES
    const checkBefore = IncrementalGenerator.checkTaskSatisfaction(task, testDir, {
      dependencyHashes: { [depPath]: initialDepHash },
    });
    expect(checkBefore.isSatisfied).toBe(true);

    // Mutate dependency Button.tsx (e.g. signature or styling change)
    writeFileSync(depFullPath, `export const Button = ({ variant }: { variant: string }) => <button className={variant}>Click v2</button>;`, "utf8");

    // Check with original dependency expectation -> MUST INVALIDATE
    const checkAfter = IncrementalGenerator.checkTaskSatisfaction(task, testDir, {
      dependencyHashes: { [depPath]: initialDepHash },
    });
    expect(checkAfter.isSatisfied).toBe(false);
    expect(checkAfter.reason).toContain("modified");
  });

  // CASE 5: A deleted imported file invalidates dependent files
  it("Case 5: A deleted imported file invalidates dependent files", () => {
    mkdirSync(join(testDir, "src", "components"), { recursive: true });
    const bannerPath = join(testDir, "src", "components", "Banner.tsx");
    writeFileSync(bannerPath, `export const Banner = () => <div>Banner</div>;`, "utf8");

    const pagePath = join(testDir, "src", "components", "HomePage.tsx");
    writeFileSync(
      pagePath,
      `import React from "react";
import { Banner } from "./Banner";
export const HomePage = () => <div><Banner /></div>;`,
      "utf8"
    );

    const task: any = {
      id: 5,
      title: "Home Page",
      ownedFiles: ["src/components/HomePage.tsx"],
    };

    // Initially passes because ./Banner exists
    const check1 = IncrementalGenerator.checkTaskSatisfaction(task, testDir);
    expect(check1.isSatisfied).toBe(true);

    // Delete the imported Banner.tsx
    unlinkSync(bannerPath);

    // Now MUST fail closed due to missing relative import closure
    const check2 = IncrementalGenerator.checkTaskSatisfaction(task, testDir);
    expect(check2.isSatisfied).toBe(false);
    expect(check2.missingOrInvalidFiles[0]).toContain("unresolved relative import: ./Banner");
  });

  // CASE 6: A broken TypeScript file cannot be reused
  it("Case 6: A broken TypeScript file cannot be reused", () => {
    mkdirSync(join(testDir, "src", "components"), { recursive: true });
    const brokenPath = join(testDir, "src", "components", "BrokenComponent.tsx");
    writeFileSync(
      brokenPath,
      `import React from "react";
export const BrokenComponent = () => {
  if (true) {
    return (
      <div>Unclosed JSX and syntax truncation`,
      "utf8"
    );

    const task: any = {
      id: 6,
      title: "Broken Component",
      ownedFiles: ["src/components/BrokenComponent.tsx"],
    };

    const check = IncrementalGenerator.checkTaskSatisfaction(task, testDir);
    expect(check.isSatisfied).toBe(false);
    expect(check.missingOrInvalidFiles[0]).toContain("failed syntactic completeness check");
  });

  // CASE 7: A file with unresolved imports cannot be reused
  it("Case 7: A file with unresolved imports cannot be reused", () => {
    mkdirSync(join(testDir, "src", "components"), { recursive: true });
    const ghostImportPath = join(testDir, "src", "components", "GhostImport.tsx");
    writeFileSync(
      ghostImportPath,
      `import React from "react";
import { NonExistentService } from "../services/nonExistentService";
export const GhostImport = () => <div>{NonExistentService()}</div>;`,
      "utf8"
    );

    const task: any = {
      id: 7,
      title: "Ghost Import Component",
      ownedFiles: ["src/components/GhostImport.tsx"],
    };

    const check = IncrementalGenerator.checkTaskSatisfaction(task, testDir);
    expect(check.isSatisfied).toBe(false);
    expect(check.missingOrInvalidFiles[0]).toContain("unresolved relative import: ../services/nonExistentService");
  });

  // CASE 8: A file from another domain cannot be reused
  it("Case 8: A file from another domain cannot be reused", () => {
    mkdirSync(join(testDir, "src", "components"), { recursive: true });
    const ecommerceCartPath = join(testDir, "src", "components", "CartDrawer.tsx");
    writeFileSync(
      ecommerceCartPath,
      `import React from "react";
export const CartDrawer = () => {
  const { addToCart, checkoutSession } = (window as any).useCart();
  return <button onClick={addToCart}>Checkout Cart</button>;
};`,
      "utf8"
    );

    const task: any = {
      id: 8,
      title: "Project Portfolio View",
      ownedFiles: ["src/components/CartDrawer.tsx"],
    };

    // Expected domain is portfolio — must reject ecommerce shopping cart
    const check = IncrementalGenerator.checkTaskSatisfaction(task, testDir, {
      expectedDomain: "portfolio",
    });

    expect(check.isSatisfied).toBe(false);
    expect(check.missingOrInvalidFiles[0]).toContain("cross-domain contamination");
    expect(check.missingOrInvalidFiles[0]).toContain("portfolio");
  });

  // CASE 9: A file that lacks a newly required feature cannot be reused
  it("Case 9: A file that lacks a newly required feature cannot be reused", () => {
    mkdirSync(join(testDir, "src", "components"), { recursive: true });
    const minimalResumePath = join(testDir, "src", "components", "Experience.tsx");
    writeFileSync(
      minimalResumePath,
      `import React from "react";
export const Experience = () => {
  return (
    <section>
      <h2>Experience</h2>
      <p>Intern at Tech Corp.</p>
    </section>
  );
};`,
      "utf8"
    );

    const task: any = {
      id: 9,
      title: "Experience & Resume",
      ownedFiles: ["src/components/Experience.tsx"],
    };

    // Specification now requires resumeDownload and contactSubmission features
    const check = IncrementalGenerator.checkTaskSatisfaction(task, testDir, {
      requiredFeatures: ["resumeDownload", "contactSubmission"],
    });

    expect(check.isSatisfied).toBe(false);
    expect(check.missingOrInvalidFiles[0]).toContain("missing newly required feature(s)");
    expect(check.missingOrInvalidFiles[0]).toContain("resumeDownload");
  });

  // CASE 10: A file that fails validation cannot be cached as successful
  it("Case 10: A file that fails validation cannot be cached as successful", () => {
    mkdirSync(join(testDir, "src", "components"), { recursive: true });
    const brokenPath = join(testDir, "src", "components", "FailingComp.tsx");
    writeFileSync(brokenPath, `export const FailingComp = () => { return <div>Incomplete`, "utf8");

    // Task that has explicitly failed validation
    const failedTask: any = {
      id: 10,
      title: "Failing Component Task",
      ownedFiles: ["src/components/FailingComp.tsx"],
      validationStatus: "FAIL",
      hasFailedValidation: true,
    };

    // Attempt to record fingerprint
    IncrementalGenerator.recordTaskFingerprint(failedTask, testDir, "contract_v1");

    const cacheFile = join(testDir, ".aegis", "cache", "task-fingerprints.json");
    if (existsSync(cacheFile)) {
      const registry = JSON.parse(readFileSync(cacheFile, "utf8"));
      expect(registry.taskFingerprints["Failing Component Task"]).toBeUndefined();
    } else {
      // Registry file was not even created because task failed validation
      expect(existsSync(cacheFile)).toBe(false);
    }

    // Verify it also fails closed when queried
    const check = IncrementalGenerator.checkTaskSatisfaction(failedTask, testDir, { contractHash: "contract_v1" });
    expect(check.isSatisfied).toBe(false);
    expect(check.reason).toContain("failed validation status");
    expect(check.missingOrInvalidFiles[0]).toContain("failed prior validation");
  });
});

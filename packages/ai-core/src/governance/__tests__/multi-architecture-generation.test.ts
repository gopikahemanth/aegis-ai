import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ArchitectureResolver } from "../architecture-resolver.js";
import { DynamicCanonicalFileGraphBuilder } from "../dynamic-file-graph.js";
import { DomainContractDeriver } from "../domain-contract.js";
import { TechnologyContractBuilder } from "../technology-contract.js";

import { DependencyContractManager } from "../dependency-contract.js";
import { TaskFileLockManager } from "../file-ownership-registry.js";

const ARCH_TEST_DIR = join(process.cwd(), ".tmp_test_phase8_arch");

describe("AEGIS Phase 8 — Multi-Architecture Selection, Infrastructure Minimization & Explicit Requests", () => {
  beforeEach(() => {
    if (existsSync(ARCH_TEST_DIR)) rmSync(ARCH_TEST_DIR, { recursive: true, force: true });
    mkdirSync(ARCH_TEST_DIR, { recursive: true });
    TaskFileLockManager.getInstance().reset();
  });

  afterEach(() => {
    if (existsSync(ARCH_TEST_DIR)) rmSync(ARCH_TEST_DIR, { recursive: true, force: true });
    TaskFileLockManager.getInstance().reset();
  });

  it("resolves fullstack React + Express + Relational DB architecture when requested", () => {
    const prompt = "Build a fullstack Task Management application with React frontend, Express API, and PostgreSQL database.";
    const arch = ArchitectureResolver.resolve(prompt);

    expect(arch.applicationType).toBe("FULLSTACK_WEB_APPLICATION");
    expect(arch.frontend.framework).toBe("React-Vite");
    expect(arch.backend.framework).toBe("Express");
    expect(arch.database.provider.toLowerCase()).toBe("postgresql");

    // Technology Contract
    const tech = TechnologyContractBuilder.build(arch.applicationType, {
      frontend: arch.frontend.framework,
      backend: arch.backend.framework,
      database: arch.database.provider,
      orm: arch.database.orm,
      auth: arch.authentication,
      language: arch.language,
      styling: arch.styling,
      packageManager: arch.packageManager,
    });
    const frontendTech = tech.technologies.find((t) => t.category === "frontend");
    const backendTech = tech.technologies.find((t) => t.category === "backend");
    expect(frontendTech?.name).toBe("React-Vite");
    expect(backendTech?.name).toBe("Express");


    // Dynamic FileGraph includes both server and client paths
    const fileGraph = DynamicCanonicalFileGraphBuilder.build(arch, DomainContractDeriver.derive(arch, arch.architectureHash!), ARCH_TEST_DIR);
    expect(fileGraph.entries.some((e) => e.canonicalPath.startsWith("server/"))).toBe(true);
    expect(fileGraph.entries.some((e) => e.canonicalPath.startsWith("src/"))).toBe(true);
    expect(fileGraph.entries.some((e) => e.canonicalPath.includes("schema.prisma"))).toBe(true);

  });

  it("minimizes infrastructure for static landing page (zero backend / zero database)", () => {
    const prompt = "Create a static marketing landing page with hero, features, and contact form using Vite.";
    const arch = ArchitectureResolver.resolve(prompt);

    expect(arch.frontend.framework).toBe("React-Vite");
    expect(arch.language).toBe("TypeScript");
    expect(arch.architectureHash).toBeDefined();

    // Verify Technology Contract & Dependencies do NOT inject unneeded server dependencies
    const tech = TechnologyContractBuilder.build(arch.applicationType, {
      frontend: arch.frontend.framework,
      backend: "None",
      database: "None",
      orm: "None",
      auth: "None",
      language: arch.language,
      styling: arch.styling,
      packageManager: arch.packageManager,
    });
    const depContract = DependencyContractManager.build(tech, arch.packageManager);
    expect(depContract.dependencies.some((d) => d.packageName === "express")).toBe(false);
    expect(depContract.dependencies.some((d) => d.packageName === "@prisma/client")).toBe(false);
    expect(depContract.dependencies.some((d) => d.packageName === "pg")).toBe(false);
  });

  it("resolves API-only service architecture without injecting unnecessary frontend components", () => {
    const prompt = "Build a REST API microservice with Express and SQLite for payment transactions.";
    const arch = ArchitectureResolver.resolve(prompt);

    expect(arch.backend.framework).toBe("Express");
    expect(arch.language).toBe("TypeScript");
    expect(arch.database.provider.toLowerCase()).toBe("sqlite");

    // Verify dependencies
    const tech = TechnologyContractBuilder.build(arch.applicationType, {
      frontend: "None",
      backend: arch.backend.framework,
      database: arch.database.provider,
      orm: arch.database.orm,
      auth: arch.authentication,
      language: arch.language,
      styling: arch.styling,
      packageManager: arch.packageManager,
    });
    const depContract = DependencyContractManager.build(tech, arch.packageManager);
    expect(depContract.dependencies.some((d) => d.packageName === "express")).toBe(true);
  });


  it("respects explicit user technology requests", () => {
    const prompt = "Build a customer feedback dashboard using React-Vite and SQLite.";
    const arch = ArchitectureResolver.resolve(prompt);

    expect(arch.frontend.framework).toBe("React-Vite");
    expect(arch.database.provider.toLowerCase()).toBe("sqlite");
    expect(arch.userSpecified).toBe(true);
  });
});

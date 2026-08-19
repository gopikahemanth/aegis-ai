import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { CanonicalManifestGenerator } from "../canonical-manifest-generator.js";
import { CanonicalArchitectureState } from "../canonical-architecture-state.js";
import { ArchitectureResolver, ArchitectureContractV1 } from "../architecture-resolver.js";
import { DomainContractManager } from "../domain-contract.js";

describe("Aegis V2.1 Fix 7 — Generic Domain Context & Static ATS Removal", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aegis-fix7-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(testDir, { recursive: true });
    mkdirSync(join(testDir, ".aegis"), { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  it("Test 1 — Kanban coder context: contains Kanban models and zero ATS strings", () => {
    const kanbanContract: ArchitectureContractV1 = {
      version: 1,
      status: "locked",
      prompt: "Build a modern Task Management Application with a Kanban board",
      applicationType: "FULLSTACK_WEB_APPLICATION",
      architectureProfile: "FULLSTACK_WEB_REACT_EXPRESS",
      source: "user",
      confidence: 1.0,
      reason: "Kanban test",
      userSpecified: true,
      inferred: false,
      overridden: false,
      frontend: { framework: "React-Vite", provenance: "user" },
      backend: { framework: "Express", provenance: "user" },
      database: { provider: "PostgreSQL", orm: "Prisma", provenance: "user", ormProvenance: "user" },
      language: "TypeScript",
      styling: "TailwindCSS",
      packageManager: "pnpm",
      authentication: "JWT",
      runtime: "Node.js",
      apiStyle: "REST",
      buildTool: "Vite",
      testFramework: "Vitest",
      browserTestFramework: "Puppeteer",
      deploymentTarget: "Docker",
      storage: "Local",
      cache: "In-Memory",
      queue: "None",
      realtime: "None",
      aiProvider: "Gemini",
      securityRequirements: [],
      requiredLibraries: ["@dnd-kit/core"],
      requiredFeatures: ["kanban-board", "task-management"],
      requiredRoutes: ["/", "/board", "/login"],
      requiredModels: ["User", "Task", "Column", "Priority"],
      projectStructure: { src: "Frontend", server: "Backend", prisma: "DB" },
      architectureHash: "kanban_hash_1",
      technologyHash: "tech_hash_1",
      dependencyHash: "dep_hash_1",
    };

    ArchitectureResolver.writeContract(testDir, kanbanContract);
    DomainContractManager.lock(kanbanContract, "kanban_hash_1", testDir);

    const loadedContract = ArchitectureResolver.loadContract(testDir);
    expect(loadedContract).not.toBeNull();
    expect(loadedContract?.requiredModels).toEqual(["User", "Task", "Column", "Priority"]);

    const manifest = CanonicalManifestGenerator.generate(loadedContract!, testDir);
    expect(manifest.models).toEqual(["User", "Task", "Column", "Priority"]);
    expect(manifest.apiEndpoints).not.toContain("POST /api/scans/upload");
    expect(manifest.apiEndpoints).toContain("GET /api/v1/tasks");
  });

  it("Test 2 — ATS coder context: preserves ATS models for genuine ATS project", () => {
    const atsContract: ArchitectureContractV1 = {
      version: 1,
      status: "locked",
      prompt: "Build an ATS Resume Scanner and Job Description Matcher",
      applicationType: "FULLSTACK_WEB_APPLICATION",
      architectureProfile: "FULLSTACK_WEB_REACT_EXPRESS",
      source: "user",
      confidence: 1.0,
      reason: "ATS test",
      userSpecified: true,
      inferred: false,
      overridden: false,
      frontend: { framework: "React-Vite", provenance: "user" },
      backend: { framework: "Express", provenance: "user" },
      database: { provider: "PostgreSQL", orm: "Prisma", provenance: "user", ormProvenance: "user" },
      language: "TypeScript",
      styling: "TailwindCSS",
      packageManager: "pnpm",
      authentication: "JWT",
      runtime: "Node.js",
      apiStyle: "REST",
      buildTool: "Vite",
      testFramework: "Vitest",
      browserTestFramework: "Puppeteer",
      deploymentTarget: "Docker",
      storage: "Local",
      cache: "In-Memory",
      queue: "None",
      realtime: "None",
      aiProvider: "Gemini",
      securityRequirements: [],
      requiredLibraries: ["pdf-parse"],
      requiredFeatures: ["resume-scanner", "keyword-matcher"],
      requiredRoutes: ["/", "/scans", "/upload"],
      requiredModels: ["User", "Resume", "JobDescription", "AnalysisResult"],
      projectStructure: { src: "Frontend", server: "Backend", prisma: "DB" },
      architectureHash: "ats_hash_1",
      technologyHash: "tech_hash_1",
      dependencyHash: "dep_hash_1",
    };

    ArchitectureResolver.writeContract(testDir, atsContract);
    const manifest = CanonicalManifestGenerator.generate(atsContract, testDir);

    expect(manifest.models).toEqual(["User", "Resume", "JobDescription", "AnalysisResult"]);
    expect(manifest.apiEndpoints).toContain("POST /api/scans/upload");
    expect(manifest.apiEndpoints).toContain("POST /api/scans/analyze");
    expect(manifest.apiEndpoints).toContain("GET /api/scans/history");
  });

  it("Test 3 — Kanban manifest: contains only domain-approved endpoints and zero ATS fallback routes", () => {
    const kanbanContract: ArchitectureContractV1 = {
      version: 1,
      status: "locked",
      prompt: "Build a Task Management Application",
      applicationType: "FULLSTACK_WEB_APPLICATION",
      architectureProfile: "FULLSTACK_WEB_REACT_EXPRESS",
      source: "user",
      confidence: 1.0,
      reason: "test",
      userSpecified: true,
      inferred: false,
      overridden: false,
      frontend: { framework: "React-Vite", provenance: "user" },
      backend: { framework: "Express", provenance: "user" },
      database: { provider: "PostgreSQL", orm: "Prisma", provenance: "user", ormProvenance: "user" },
      language: "TypeScript",
      styling: "TailwindCSS",
      packageManager: "pnpm",
      authentication: "JWT",
      runtime: "Node.js",
      apiStyle: "REST",
      buildTool: "Vite",
      testFramework: "Vitest",
      browserTestFramework: "Puppeteer",
      deploymentTarget: "Docker",
      storage: "Local",
      cache: "In-Memory",
      queue: "None",
      realtime: "None",
      aiProvider: "Gemini",
      securityRequirements: [],
      requiredLibraries: [],
      requiredFeatures: ["tasks"],
      requiredRoutes: ["/", "/tasks"],
      requiredModels: ["User", "Task"],
      projectStructure: { src: "Frontend", server: "Backend", prisma: "DB" },
      architectureHash: "hash_kanban",
      technologyHash: "tech_hash",
      dependencyHash: "dep_hash",
    };

    const manifest = CanonicalManifestGenerator.generate(kanbanContract, testDir);
    expect(manifest.apiEndpoints).toEqual([
      "POST /api/auth/login",
      "POST /api/auth/register",
      "GET /api/v1/tasks",
      "POST /api/v1/tasks",
      "PATCH /api/v1/tasks/:id",
      "DELETE /api/v1/tasks/:id",
    ]);
    expect(manifest.apiEndpoints).not.toContain("POST /api/scans/upload");
  });

  it("Test 4 — ATS manifest: explicit ATS endpoints present when required", () => {
    const atsContract: ArchitectureContractV1 = {
      version: 1,
      status: "locked",
      prompt: "Resume ATS Matcher",
      applicationType: "FULLSTACK_WEB_APPLICATION",
      architectureProfile: "FULLSTACK_WEB_REACT_EXPRESS",
      source: "user",
      confidence: 1.0,
      reason: "test",
      userSpecified: true,
      inferred: false,
      overridden: false,
      frontend: { framework: "React-Vite", provenance: "user" },
      backend: { framework: "Express", provenance: "user" },
      database: { provider: "PostgreSQL", orm: "Prisma", provenance: "user", ormProvenance: "user" },
      language: "TypeScript",
      styling: "TailwindCSS",
      packageManager: "pnpm",
      authentication: "JWT",
      runtime: "Node.js",
      apiStyle: "REST",
      buildTool: "Vite",
      testFramework: "Vitest",
      browserTestFramework: "Puppeteer",
      deploymentTarget: "Docker",
      storage: "Local",
      cache: "In-Memory",
      queue: "None",
      realtime: "None",
      aiProvider: "Gemini",
      securityRequirements: [],
      requiredLibraries: [],
      requiredFeatures: ["resume-scan"],
      requiredRoutes: ["/", "/upload"],
      requiredModels: ["User", "Resume"],
      projectStructure: { src: "Frontend", server: "Backend", prisma: "DB" },
      architectureHash: "hash_ats",
      technologyHash: "tech_hash",
      dependencyHash: "dep_hash",
    };

    const manifest = CanonicalManifestGenerator.generate(atsContract, testDir);
    expect(manifest.apiEndpoints).toContain("POST /api/scans/upload");
  });

  it("Test 5 — Kanban architecture state: records Task and Column without Resume/JobDescription", () => {
    const kanbanContract: ArchitectureContractV1 = {
      version: 1,
      status: "locked",
      prompt: "Kanban board",
      applicationType: "FULLSTACK_WEB_APPLICATION",
      architectureProfile: "FULLSTACK_WEB_REACT_EXPRESS",
      source: "user",
      confidence: 1.0,
      reason: "test",
      userSpecified: true,
      inferred: false,
      overridden: false,
      frontend: { framework: "React-Vite", provenance: "user" },
      backend: { framework: "Express", provenance: "user" },
      database: { provider: "PostgreSQL", orm: "Prisma", provenance: "user", ormProvenance: "user" },
      language: "TypeScript",
      styling: "TailwindCSS",
      packageManager: "pnpm",
      authentication: "JWT",
      runtime: "Node.js",
      apiStyle: "REST",
      buildTool: "Vite",
      testFramework: "Vitest",
      browserTestFramework: "Puppeteer",
      deploymentTarget: "Docker",
      storage: "Local",
      cache: "In-Memory",
      queue: "None",
      realtime: "None",
      aiProvider: "Gemini",
      securityRequirements: [],
      requiredLibraries: [],
      requiredFeatures: ["kanban"],
      requiredRoutes: ["/", "/kanban"],
      requiredModels: ["User", "Task", "Column", "Priority"],
      projectStructure: { src: "Frontend", server: "Backend", prisma: "DB" },
      architectureHash: "hash_kanban_state",
      technologyHash: "tech_hash",
      dependencyHash: "dep_hash",
    };

    const state = CanonicalArchitectureState.getInstance().initialize(kanbanContract, testDir);
    expect(state.requiredModels).toEqual(["User", "Task", "Column", "Priority"]);
    expect(state.requiredModels).not.toContain("Resume");
    expect(state.requiredModels).not.toContain("JobDescription");
    expect(state.requiredModels).not.toContain("AnalysisResult");
  });

  it("Test 6 — No-contract neutral fallback: defaults to neutral [User] or empty, never ATS", () => {
    const minimalContract: ArchitectureContractV1 = {
      version: 1,
      status: "locked",
      prompt: "Generic Application",
      applicationType: "FULLSTACK_WEB_APPLICATION",
      architectureProfile: "FULLSTACK_WEB_REACT_EXPRESS",
      source: "default",
      confidence: 0.5,
      reason: "fallback",
      userSpecified: false,
      inferred: true,
      overridden: false,
      frontend: { framework: "React-Vite", provenance: "default" },
      backend: { framework: "Express", provenance: "default" },
      database: { provider: "PostgreSQL", orm: "Prisma", provenance: "default", ormProvenance: "default" },
      language: "TypeScript",
      styling: "TailwindCSS",
      packageManager: "pnpm",
      authentication: "JWT",
      runtime: "Node.js",
      apiStyle: "REST",
      buildTool: "Vite",
      testFramework: "Vitest",
      browserTestFramework: "Puppeteer",
      deploymentTarget: "Docker",
      storage: "Local",
      cache: "In-Memory",
      queue: "None",
      realtime: "None",
      aiProvider: "Gemini",
      securityRequirements: [],
      requiredLibraries: [],
      requiredFeatures: [],
      requiredRoutes: ["/"],
      requiredModels: [], // empty models
      projectStructure: { src: "Frontend", server: "Backend", prisma: "DB" },
      architectureHash: "min_hash",
      technologyHash: "tech_hash",
      dependencyHash: "dep_hash",
    };

    const manifest = CanonicalManifestGenerator.generate(minimalContract, testDir);
    expect(manifest.models).toEqual([]);
    expect(manifest.apiEndpoints).not.toContain("POST /api/scans/upload");
    expect(manifest.apiEndpoints).not.toContain("GET /api/scans/history");
  });

  it("Test 7 — Single source of truth: CoderAgent, ManifestGenerator, ArchitectureState receive equivalent domain model set", () => {
    const sharedContract: ArchitectureContractV1 = {
      version: 1,
      status: "locked",
      prompt: "E-Commerce Storefront with Product, Cart, Order",
      applicationType: "FULLSTACK_WEB_APPLICATION",
      architectureProfile: "FULLSTACK_WEB_REACT_EXPRESS",
      source: "user",
      confidence: 1.0,
      reason: "ecommerce",
      userSpecified: true,
      inferred: false,
      overridden: false,
      frontend: { framework: "React-Vite", provenance: "user" },
      backend: { framework: "Express", provenance: "user" },
      database: { provider: "PostgreSQL", orm: "Prisma", provenance: "user", ormProvenance: "user" },
      language: "TypeScript",
      styling: "TailwindCSS",
      packageManager: "pnpm",
      authentication: "JWT",
      runtime: "Node.js",
      apiStyle: "REST",
      buildTool: "Vite",
      testFramework: "Vitest",
      browserTestFramework: "Puppeteer",
      deploymentTarget: "Docker",
      storage: "Local",
      cache: "In-Memory",
      queue: "None",
      realtime: "None",
      aiProvider: "Gemini",
      securityRequirements: [],
      requiredLibraries: [],
      requiredFeatures: ["catalog", "cart", "checkout"],
      requiredRoutes: ["/", "/cart", "/checkout"],
      requiredModels: ["User", "Product", "Order", "CartItem"],
      projectStructure: { src: "Frontend", server: "Backend", prisma: "DB" },
      architectureHash: "ecom_hash",
      technologyHash: "tech_hash",
      dependencyHash: "dep_hash",
    };

    ArchitectureResolver.writeContract(testDir, sharedContract);
    const manifest = CanonicalManifestGenerator.generate(sharedContract, testDir);
    const archState = CanonicalArchitectureState.getInstance().initialize(sharedContract, testDir);

    expect(manifest.models).toEqual(["User", "Product", "Order", "CartItem"]);
    expect(archState.requiredModels).toEqual(["User", "Product", "Order", "CartItem"]);
  });

  it("Test 8 — Static source leak test: production source files do not contain unconditional ATS defaults", () => {
    const aiCoreRoot = process.cwd().endsWith("packages\\ai-core") || process.cwd().endsWith("packages/ai-core")
      ? process.cwd()
      : join(process.cwd(), "packages/ai-core");

    const coderAgentSrc = readFileSync(join(aiCoreRoot, "src/agents/coder-agent.ts"), "utf8");
    const manifestGenSrc = readFileSync(join(aiCoreRoot, "src/governance/canonical-manifest-generator.ts"), "utf8");
    const archStateSrc = readFileSync(join(aiCoreRoot, "src/governance/canonical-architecture-state.ts"), "utf8");

    // Check coder-agent static header does not hardcode ATS models
    expect(coderAgentSrc).not.toContain("CANONICAL DOMAIN MODELS (NEVER INVENT ScanResult");
    expect(coderAgentSrc).not.toContain("- Resume\n- JobDescription\n- AnalysisResult");

    // Check manifest generator does not hardcode ATS models as default fallback
    expect(manifestGenSrc).not.toContain('contract.requiredModels || ["User", "Resume", "JobDescription"');

    // Check arch state does not hardcode ATS models as default fallback
    expect(archStateSrc).not.toContain('contract.requiredModels || ["User", "Resume", "JobDescription"');
  });
});

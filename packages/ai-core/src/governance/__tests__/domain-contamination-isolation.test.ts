import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DomainContaminationDetector } from "../domain-contamination-detector.js";
import { ProjectStartupAgent } from "../../startup/project-startup-agent.js";
import { ProjectGraphEngine } from "../../validation/project-graph-engine.js";
import { ArchitectureContractV1 } from "../architecture-resolver.js";

describe("Aegis V2.1 Fix 3 — Remove Hardcoded ATS Domain Contamination", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aegis-domain-iso-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(testDir, { recursive: true });
    mkdirSync(join(testDir, ".aegis"), { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  it("Test 1 — Kanban must reject ATS fallback artifacts", async () => {
    const kanbanContract: ArchitectureContractV1 = {
      version: 1,
      status: "locked",
      prompt: "Build a modern Task Management Application with a Kanban board, Todo/In Progress/Done columns",
      applicationType: "FULLSTACK_WEB_APPLICATION",
      architectureProfile: "FULLSTACK_WEB_REACT_EXPRESS",
      source: "canonical_spec",
      confidence: 0.9,
      reason: "Kanban test",
      userSpecified: false,
      inferred: true,
      overridden: false,
      domainCategory: "task-manager",
      requiredModels: ["User", "Task", "Column"],
      requiredFeatures: ["kanban-board", "task-lifecycle"],
      requiredRoutes: ["get-tasks", "create-task"],
      frontend: { framework: "React", provenance: "inferred" },
      backend: { framework: "Express", provenance: "default" },
      database: { provider: "PostgreSQL", orm: "Prisma", provenance: "default", ormProvenance: "default" },
      language: "TypeScript",
      styling: "tailwindcss",
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
      projectStructure: {},
      architectureHash: "h1",
      technologyHash: "h2",
      dependencyHash: "h3",
    };

    writeFileSync(join(testDir, ".aegis", "architecture-contract.json"), JSON.stringify(kanbanContract, null, 2), "utf8");

    // Run ProjectStartupAgent prepare
    const startupAgent = new ProjectStartupAgent();
    await startupAgent.prepare(testDir);

    // Assert NO ATS files are created
    expect(existsSync(join(testDir, "server/controllers/scan.controller.ts"))).toBe(false);
    expect(existsSync(join(testDir, "server/routes/scan.routes.ts"))).toBe(false);
    expect(existsSync(join(testDir, "server/middleware/upload.middleware.ts"))).toBe(false);
    expect(existsSync(join(testDir, "server/services/pdf.service.ts"))).toBe(false);
    expect(existsSync(join(testDir, "server/services/keyword.service.ts"))).toBe(false);
    expect(existsSync(join(testDir, "src/services/scan.service.ts"))).toBe(false);
    expect(existsSync(join(testDir, "src/features/history/services/historyService.ts"))).toBe(false);

    // Assert generic api.ts does not contain ATS methods
    if (existsSync(join(testDir, "src/services/api.ts"))) {
      const apiContent = readFileSync(join(testDir, "src/services/api.ts"), "utf8");
      expect(apiContent).not.toContain("uploadResume");
      expect(apiContent).not.toContain("analyzeScan");
      expect(apiContent).not.toContain("getScanHistory");
    }

    // Assert types/index.ts does not contain AnalysisResult or ScanHistoryItem
    if (existsSync(join(testDir, "src/types/index.ts"))) {
      const typesContent = readFileSync(join(testDir, "src/types/index.ts"), "utf8");
      expect(typesContent).not.toContain("AnalysisResult");
      expect(typesContent).not.toContain("ScanHistoryItem");
    }
  });

  it("Test 2 — E-commerce must reject ATS contamination", async () => {
    const ecommerceContract: ArchitectureContractV1 = {
      version: 1,
      status: "locked",
      prompt: "Build an E-Commerce online store with products, categories, cart, orders and checkout",
      applicationType: "FULLSTACK_WEB_APPLICATION",
      architectureProfile: "FULLSTACK_WEB_REACT_EXPRESS",
      source: "canonical_spec",
      confidence: 0.9,
      reason: "E-commerce test",
      userSpecified: false,
      inferred: true,
      overridden: false,
      domainCategory: "ecommerce",
      requiredModels: ["User", "Product", "Order", "Cart"],
      requiredFeatures: ["product-catalog", "shopping-cart", "checkout"],
      requiredRoutes: ["get-products", "create-order"],
      frontend: { framework: "React", provenance: "inferred" },
      backend: { framework: "Express", provenance: "default" },
      database: { provider: "PostgreSQL", orm: "Prisma", provenance: "default", ormProvenance: "default" },
      language: "TypeScript",
      styling: "tailwindcss",
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
      projectStructure: {},
      architectureHash: "h1",
      technologyHash: "h2",
      dependencyHash: "h3",
    };

    writeFileSync(join(testDir, ".aegis", "architecture-contract.json"), JSON.stringify(ecommerceContract, null, 2), "utf8");

    const graphEngine = new ProjectGraphEngine();
    // Simulate missing module resolution
    const created = (graphEngine as any).ensureCanonicalFileOnDisk("server/controllers/scan.controller.ts", testDir);
    expect(created).toBeNull();
    expect(existsSync(join(testDir, "server/controllers/scan.controller.ts"))).toBe(false);
  });

  it("Test 3 — IoT must reject ATS contamination", async () => {
    const iotContract: ArchitectureContractV1 = {
      version: 1,
      status: "locked",
      prompt: "IoT monitoring dashboard with devices, sensors, telemetry and alerts",
      applicationType: "FULLSTACK_WEB_APPLICATION",
      architectureProfile: "FULLSTACK_WEB_REACT_EXPRESS",
      source: "canonical_spec",
      confidence: 0.9,
      reason: "IoT test",
      userSpecified: false,
      inferred: true,
      overridden: false,
      requiredModels: ["User", "Device", "Sensor", "Telemetry", "Alert"],
      requiredFeatures: ["device-monitoring", "telemetry-stream"],
      requiredRoutes: ["get-devices", "get-telemetry"],
      frontend: { framework: "React", provenance: "inferred" },
      backend: { framework: "Express", provenance: "default" },
      database: { provider: "PostgreSQL", orm: "Prisma", provenance: "default", ormProvenance: "default" },
      language: "TypeScript",
      styling: "tailwindcss",
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
      projectStructure: {},
      architectureHash: "h1",
      technologyHash: "h2",
      dependencyHash: "h3",
    };

    writeFileSync(join(testDir, ".aegis", "architecture-contract.json"), JSON.stringify(iotContract, null, 2), "utf8");

    const graphEngine = new ProjectGraphEngine();
    const created = (graphEngine as any).ensureCanonicalFileOnDisk("server/services/keyword.service.ts", testDir);
    expect(created).toBeNull();
    expect(existsSync(join(testDir, "server/services/keyword.service.ts"))).toBe(false);
  });

  it("Test 4 — Genuine ATS project must preserve ATS capability", async () => {
    const atsContract: ArchitectureContractV1 = {
      version: 1,
      status: "locked",
      prompt: "Resume ATS scanner that compares a resume against a job description with match score and keyword analysis",
      applicationType: "FULLSTACK_WEB_APPLICATION",
      architectureProfile: "FULLSTACK_WEB_REACT_EXPRESS",
      source: "canonical_spec",
      confidence: 0.9,
      reason: "ATS test",
      userSpecified: false,
      inferred: true,
      overridden: false,
      domainCategory: "resume-scanner",
      requiredModels: ["User", "Resume", "JobDescription", "AnalysisResult"],
      requiredFeatures: ["resume-parser", "keyword-matching", "scoring"],
      requiredRoutes: ["upload-resume", "analyze-match"],
      frontend: { framework: "React", provenance: "inferred" },
      backend: { framework: "Express", provenance: "default" },
      database: { provider: "PostgreSQL", orm: "Prisma", provenance: "default", ormProvenance: "default" },
      language: "TypeScript",
      styling: "tailwindcss",
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
      projectStructure: {},
      architectureHash: "h1",
      technologyHash: "h2",
      dependencyHash: "h3",
    };

    writeFileSync(join(testDir, ".aegis", "architecture-contract.json"), JSON.stringify(atsContract, null, 2), "utf8");

    const startupAgent = new ProjectStartupAgent();
    await startupAgent.prepare(testDir);

    // For a genuine ATS project, ATS artifacts are allowed
    expect(existsSync(join(testDir, "server/controllers/scan.controller.ts"))).toBe(true);
    expect(existsSync(join(testDir, "server/routes/scan.routes.ts"))).toBe(true);
    expect(existsSync(join(testDir, "server/middleware/upload.middleware.ts"))).toBe(true);
    expect(existsSync(join(testDir, "src/services/scan.service.ts"))).toBe(true);
  });

  it("Test 5 — Generic project must not select ATS fallback", async () => {
    const genericContract: ArchitectureContractV1 = {
      version: 1,
      status: "locked",
      prompt: "A modern collaborative note taking application with rich text editing",
      applicationType: "FULLSTACK_WEB_APPLICATION",
      architectureProfile: "FULLSTACK_WEB_REACT_EXPRESS",
      source: "canonical_spec",
      confidence: 0.8,
      reason: "Notes test",
      userSpecified: false,
      inferred: true,
      overridden: false,
      requiredModels: ["User", "Note", "Folder"],
      requiredFeatures: ["notes-editor", "collaboration"],
      requiredRoutes: ["get-notes", "create-note"],
      frontend: { framework: "React", provenance: "inferred" },
      backend: { framework: "Express", provenance: "default" },
      database: { provider: "PostgreSQL", orm: "Prisma", provenance: "default", ormProvenance: "default" },
      language: "TypeScript",
      styling: "tailwindcss",
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
      projectStructure: {},
      architectureHash: "h1",
      technologyHash: "h2",
      dependencyHash: "h3",
    };

    writeFileSync(join(testDir, ".aegis", "architecture-contract.json"), JSON.stringify(genericContract, null, 2), "utf8");

    const graphEngine = new ProjectGraphEngine();
    const created = (graphEngine as any).ensureCanonicalFileOnDisk("server/controllers/scan.controller.ts", testDir);
    expect(created).toBeNull();
  });

  it("Test 6 — Detector classification: foreign vs legitimate ATS", () => {
    const kanbanContract: any = { prompt: "Task management kanban board", domainCategory: "task-manager" };
    const atsContract: any = { prompt: "Resume ATS matcher", domainCategory: "resume-scanner" };

    expect(DomainContaminationDetector.getActiveDomainKey(kanbanContract)).toBe("task-manager");
    expect(DomainContaminationDetector.getActiveDomainKey(atsContract)).toBe("resume");

    // Write a dummy ATS file in testDir
    mkdirSync(join(testDir, "server/controllers"), { recursive: true });
    writeFileSync(join(testDir, "server/controllers/scan.controller.ts"), "export const uploadResume = () => {};", "utf8");

    // When scanned with Kanban contract -> violations detected
    const reportKanban = DomainContaminationDetector.scanProject(testDir, kanbanContract);
    expect(reportKanban.clean).toBe(false);
    expect(reportKanban.violations.length).toBeGreaterThan(0);

    // When scanned with ATS contract -> clean (no foreign violation)
    const reportAts = DomainContaminationDetector.scanProject(testDir, atsContract);
    expect(reportAts.clean).toBe(true);
  });

  it("Test 7 — Generic prompt templates contain zero hardcoded ATS examples in orchestrator", () => {
    const orchestratorPath = join(__dirname, "../../agent/orchestrator.ts");
    const content = readFileSync(orchestratorPath, "utf8");

    // Assert generic schema hint does not leak Resume 1:N MatchAnalysis
    expect(content).not.toContain("User 1:N Resume");
    expect(content).not.toContain("User 1:N MatchAnalysis");
    expect(content).not.toContain("User 1:N JobDescription");
  });
});

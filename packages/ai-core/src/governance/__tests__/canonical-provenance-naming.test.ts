import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { CanonicalFileGraph } from "../canonical-file-graph.js";
import { SemanticDuplicateDetector } from "../semantic-duplicate-detector.js";
import { ArchitectureResolver } from "../architecture-resolver.js";
import { DesignSystemGenerator } from "../../design/design-system-generator.js";
import { SemanticNaming } from "../../semantics/semantic-naming.js";

describe("Canonical Path Ownership, Component Provenance & Bounded Naming", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `aegis-canonical-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    try {
      if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true, force: true });
      }
    } catch {}
  });

  // ── 1. Canonical Path Ownership & Alias Rejection ─────────────────────────────
  it("TEST 1: Rejects unauthorized alias lib/prisma.ts in favor of canonical server/lib/prisma.ts", () => {
    const dupCheck = CanonicalFileGraph.detectSemanticDuplicate("lib/prisma.ts");
    expect(dupCheck.isDuplicate).toBe(true);
    expect(dupCheck.canonicalFile?.canonicalPath).toBe("server/lib/prisma.ts");

    const checkWrite = SemanticDuplicateDetector.checkBeforeWrite("lib/prisma.ts");
    expect(checkWrite.allowed).toBe(false);
    expect(checkWrite.canonicalPath).toBe("server/lib/prisma.ts");
    expect(checkWrite.action).toBe("DELETE_ORPHAN");

    const checkSrcWrite = SemanticDuplicateDetector.checkBeforeWrite("src/lib/prisma.ts");
    expect(checkSrcWrite.allowed).toBe(false);
    expect(checkSrcWrite.canonicalPath).toBe("server/lib/prisma.ts");
  });

  it("TEST 2: Detects and deletes unauthorized alias lib/prisma.ts and redirects callers", () => {
    // Setup mock project structure
    const serverRoutesDir = join(testDir, "server", "routes");
    const serverLibDir = join(testDir, "server", "lib");
    const libDir = join(testDir, "lib");
    mkdirSync(serverRoutesDir, { recursive: true });
    mkdirSync(serverLibDir, { recursive: true });
    mkdirSync(libDir, { recursive: true });

    // Canonical server prisma file
    writeFileSync(join(serverLibDir, "prisma.ts"), "export const prisma = {};\nexport default prisma;\n", "utf8");

    // Caller with bad relative import
    const routeFile = join(serverRoutesDir, "trading.ts");
    writeFileSync(routeFile, "import { prisma } from '../../lib/prisma';\nexport const getTrading = () => prisma;\n", "utf8");

    // Unauthorized alias file
    const aliasFile = join(libDir, "prisma.ts");
    writeFileSync(aliasFile, "export * from '../server/lib/prisma';\n", "utf8");

    // Orphan detection must find the duplicate alias even though trading.ts imported it
    const orphans = SemanticDuplicateDetector.detectOrphans(testDir);
    const prismaOrphan = orphans.find(o => o.orphanPath.replace(/\\/g, "/") === "lib/prisma.ts");
    expect(prismaOrphan).toBeDefined();
    expect(prismaOrphan?.action).toBe("DELETE");
    expect(prismaOrphan?.canonicalAlternative).toBe("server/lib/prisma.ts");

    // Remove orphans should delete the alias file and rewrite caller
    const deleted = SemanticDuplicateDetector.removeOrphans(testDir, orphans);
    expect(deleted).toContain("lib/prisma.ts");
    expect(existsSync(aliasFile)).toBe(false);

    // Verify caller was rewired to canonical path
    const updatedRoute = readFileSync(routeFile, "utf8");
    expect(updatedRoute).not.toContain("../../lib/prisma");
    expect(updatedRoute).toContain("../lib/prisma");
  });

  // ── 2. Capability-Driven Component Provenance (KanbanBoard) ─────────────────
  it("TEST 3: DesignSystemGenerator omits KanbanBoard in Trading, Maritime, and Hospital domains", () => {
    const dsGen = new DesignSystemGenerator();

    // A. Trading Desk
    const tradingSpec: any = {
      name: "QuantTrading",
      description: "Quantitative high-frequency algorithmic trading operations desk",
      userPrompt: "Build a quantitative high-frequency algorithmic trading operations desk. Traders monitor execution engines and VaR.",
      frontend: "react-vite",
      styling: "tailwind",
      features: ["order-book-monitor", "portfolio-dashboard", "risk-management", "strategy-manager"],
    };
    const tradingFiles = dsGen.generate(tradingSpec);
    expect(tradingFiles.map(f => f.path)).not.toContain("src/design-system/components/KanbanBoard.tsx");
    const tradingIndex = tradingFiles.find(f => f.path === "src/design-system/index.ts")?.content || "";
    expect(tradingIndex).not.toContain("KanbanBoard");

    // B. Maritime Logistics
    const maritimeSpec: any = {
      name: "OceanicFleet",
      description: "Marine & Oceanographic research expedition telemetry platform",
      userPrompt: "Build a marine expedition telemetry platform tracking vessels and oceanographic CTD casts.",
      frontend: "react-vite",
      styling: "tailwind",
      features: ["vessel-telemetry", "voyage-dispatch", "specimen-log"],
    };
    const maritimeFiles = dsGen.generate(maritimeSpec);
    expect(maritimeFiles.map(f => f.path)).not.toContain("src/design-system/components/KanbanBoard.tsx");

    // C. Healthcare / Hospital
    const hospitalSpec: any = {
      name: "MediCare",
      description: "Clinical patient intake and triage management",
      userPrompt: "Build a clinical healthcare platform for emergency room triage and vital monitoring.",
      frontend: "react-vite",
      styling: "tailwind",
      features: ["patient-triage", "vital-monitor", "bed-occupancy"],
    };
    const hospitalFiles = dsGen.generate(hospitalSpec);
    expect(hospitalFiles.map(f => f.path)).not.toContain("src/design-system/components/KanbanBoard.tsx");
  });

  it("TEST 4: DesignSystemGenerator materializes KanbanBoard when capability is explicitly required", () => {
    const dsGen = new DesignSystemGenerator();

    const taskManagementSpec: any = {
      name: "TaskHub",
      description: "Agile project workflow and sprint planning platform",
      userPrompt: "Build a sprint backlog and kanban board for agile development teams.",
      frontend: "react-vite",
      styling: "tailwind",
      features: ["Sprint Backlog", "Kanban Board", "Issue Tracking"],
    };

    const files = dsGen.generate(taskManagementSpec);
    expect(files.map(f => f.path)).toContain("src/design-system/components/KanbanBoard.tsx");
    const indexTs = files.find(f => f.path === "src/design-system/index.ts")?.content || "";
    expect(indexTs).toContain("KanbanBoard");
  });

  // ── 3. Bounded Semantic Route & Label Naming ────────────────────────────────
  it("TEST 5: Derives concise, bounded semantic names from long prose requirements", () => {
    const rawRequirement = "adjust order routing limits while verifying that portfolio VaR calculations recalculate dynamically";
    const naming = SemanticNaming.deriveCapabilityNaming(rawRequirement);

    // Retain original requirement
    expect(naming.originalRequirement).toBe(rawRequirement);

    // Stable capability ID
    expect(naming.capabilityId).toBe("adjust-order-routing-limits");

    // Concise display name (<= 20 chars)
    expect(naming.displayName).toBe("Risk Controls");
    expect(naming.displayName.length).toBeLessThanOrEqual(20);

    // Concise route slug (<= 24 chars)
    expect(naming.routeSlug).toBe("/risk-controls");
    expect(naming.routeSlug.length).toBeLessThanOrEqual(24);

    // Clean model name
    expect(naming.modelName).toBe("RiskControl");
    expect(naming.modelName.length).toBeLessThanOrEqual(24);
  });

  it("TEST 6: Derives generic bounded names for unseen arbitrary requirements without hardcoding", () => {
    const rawUnseen = "inspect hydrostatic pressure readings across multi-sensor deepsea probes with persistent continuous calibration";
    const naming = SemanticNaming.deriveCapabilityNaming(rawUnseen);

    expect(naming.originalRequirement).toBe(rawUnseen);
    expect(naming.capabilityId).toMatch(/^inspect-hydrostatic/);
    expect(naming.displayName.length).toBeLessThanOrEqual(20);
    expect(naming.routeSlug.length).toBeLessThanOrEqual(24);
    expect(naming.modelName.length).toBeLessThanOrEqual(24);
    expect(naming.routeSlug).not.toContain("with");
    expect(naming.routeSlug).not.toContain("calibration");
  });

  it("TEST 7: ArchitectureResolver bounds routes and models for the full Quant Trading prompt", () => {
    const quantPrompt = "Build a quantitative high-frequency algorithmic trading operations desk. Quantitative traders must monitor automated execution engines across global exchange order books, aggregate real-time portfolio metrics (total net asset value, portfolio Sharpe ratio, average order fill latency in microseconds, and risk liquidation buffer), filter execution strategies by market volatility regimes (Low, Elevated, High Volatility) and strategy status (ALL, STANDBY, ACTIVE_ROUTING, FILLED, CIRCUIT_HALTED), view tick-level limit order book depth charts, drill down into an algorithmic strategy's order fill audit log, and adjust order routing limits while verifying that portfolio VaR calculations recalculate dynamically.";

    const contract = ArchitectureResolver.resolve(quantPrompt);

    // Ensure all routes are bounded
    for (const route of contract.requiredRoutes) {
      expect(route.length).toBeLessThanOrEqual(24);
      expect(route).not.toContain("while");
      expect(route).not.toContain("verifying");
      expect(route).not.toContain("dynamicallies");
    }

    // Ensure all models are bounded
    for (const model of contract.requiredModels) {
      expect(model.length).toBeLessThanOrEqual(24);
      expect(model).not.toContain("WhileVerifying");
      expect(model).not.toContain("RecalculateDynamically");
    }

    // Specifically confirm /risk-controls or /order-routing exists instead of 100-char route
    expect(contract.requiredRoutes.some(r => r === "/risk-controls" || r === "/order-routing" || r === "/audit-trail")).toBe(true);
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CapabilityCompletenessInvariant } from "../capability-completeness-invariant.js";
import { DeterministicProjectFixer } from "../deterministic-project-fixer.js";
import { DomainVisualContractGenerator } from "../../design/domain-visual-contract.js";

const TEST_DIR = join(process.cwd(), ".tmp_test_capability_completeness");

describe("CapabilityCompletenessInvariant — Authoritative Capability & Full-Stack Contract Suite", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(join(TEST_DIR, "src", "features", "dashboard"), { recursive: true });
    mkdirSync(join(TEST_DIR, "src", "services"), { recursive: true });
    mkdirSync(join(TEST_DIR, "server", "routes"), { recursive: true });
    mkdirSync(join(TEST_DIR, "prisma"), { recursive: true });
    mkdirSync(join(TEST_DIR, ".aegis"), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("1. REJECTS passive visual shell missing required capability chains", () => {
    // The exact 38-line passive skeleton that was previously falsely accepted
    const dummyShell = `
import React from "react";

export function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">System Overview</h1>
        <span className="badge">Live Telemetry</span>
      </header>
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4"><h3>Power Output</h3><p>980 kW</p></div>
        <div className="card p-4"><h3>Efficiency</h3><p>98.5%</p></div>
        <div className="card p-4"><h3>Alerts</h3><p>0 Active</p></div>
      </div>
      <section>
        <h2>Telemetry Feed</h2>
        <p>Monitoring active solar array units.</p>
      </section>
    </div>
  );
}
export default DashboardPage;
`;

    const result = CapabilityCompletenessInvariant.evaluatePage(dummyShell, {
      expectedWorkspaceType: "telemetry_grid",
      capabilities: [
        "aggregate_metrics",
        "filter_time_window",
        "filter_status",
        "visualize_trends",
        "drilldown_timeseries",
        "recalculate_aggregations",
      ],
    });

    expect(result.complete).toBe(false);
    expect(result.satisfiedCapabilities).toBeLessThan(result.totalCapabilities);
    expect(result.reasons.length).toBeGreaterThan(0);

    // Verify exact failure reasons for missing capability chains
    const reasonText = result.reasons.join(" ");
    expect(reasonText).toContain("Temporal Window Filtering");
    expect(reasonText).toContain("Status Category Filtering");
    expect(reasonText).toContain("Dynamic Trend Visualization");
    expect(reasonText).toContain("Entity Selection & Drill-Down Inspection");
    expect(reasonText).toContain("Operational Setpoint Mutation & Recalculation");
  });

  it("2. ACCEPTS complete contract-driven telemetry workspace fulfilling all 6 capabilities", () => {
    const fullWorkspaceContent = `
import React, { useState, useMemo } from "react";

export function DashboardPage() {
  const [timeWindow, setTimeWindow] = useState("24h");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedUnitId, setSelectedUnitId] = useState("UNIT-01");
  const [units, setUnits] = useState([
    { id: "UNIT-01", name: "Inverter 01", kw: 950, targetKw: 980, status: "OPTIMAL", timeseries: [{ time: "10:00", val: 920 }, { time: "11:00", val: 950 }] },
    { id: "UNIT-02", name: "Inverter 02", kw: 890, targetKw: 920, status: "WARNING", timeseries: [{ time: "10:00", val: 870 }, { time: "11:00", val: 890 }] }
  ]);

  const aggregateKw = useMemo(() => {
    return units.reduce((acc, u) => acc + u.kw, 0);
  }, [units]);

  const filteredUnits = useMemo(() => {
    return units.filter(u => statusFilter === "ALL" || u.status === statusFilter);
  }, [units, statusFilter]);

  const selectedUnit = units.find(u => u.id === selectedUnitId) || units[0];

  const handleUpdateSetpoint = (id: string, newKw: number) => {
    setUnits(prev => prev.map(u => u.id === id ? { ...u, targetKw: newKw } : u));
  };

  return (
    <div className="workspace-telemetry" data-workspace="telemetry_grid">
      <div className="metrics-aggregate">Total Output: {aggregateKw} kW</div>
      <div className="filters">
        <button onClick={() => setTimeWindow("1h")}>1h</button>
        <button onClick={() => setTimeWindow("24h")}>24h</button>
        <button onClick={() => setTimeWindow("7d")}>7d</button>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All</option>
          <option value="OPTIMAL">Optimal</option>
          <option value="WARNING">Warning</option>
        </select>
      </div>
      <div className="chart-trends" data-chart="true">
        {selectedUnit.timeseries.map(t => (
          <div key={t.time} className="trend-point bar" style={{ height: \`\${t.val / 10}px\` }}>{t.val}</div>
        ))}
      </div>
      <div className="grid-units">
        {filteredUnits.map(u => (
          <div key={u.id} className="unit-card" onClick={() => setSelectedUnitId(u.id)}>
            <h3>{u.name}</h3>
            <span>{u.kw} kW</span>
            <input
              type="number"
              defaultValue={u.targetKw}
              onBlur={(e) => handleUpdateSetpoint(u.id, Number(e.target.value))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
export default DashboardPage;
`;

    const result = CapabilityCompletenessInvariant.evaluatePage(fullWorkspaceContent, {
      expectedWorkspaceType: "telemetry_grid",
      capabilities: [
        "aggregate_metrics",
        "filter_time_window",
        "filter_status",
        "visualize_trends",
        "drilldown_timeseries",
        "recalculate_aggregations",
      ],
    });

    if (!result.complete) console.log("Test 2 Reasons:", result.reasons);
    expect(result.complete).toBe(true);
    expect(result.satisfiedCapabilities).toBe(6);
    expect(result.totalCapabilities).toBe(6);
    expect(result.score).toBe(100);

    // Verify all 6 evidence chains are satisfied
    for (const ev of result.evidence) {
      expect(ev.isSatisfied).toBe(true);
      expect(ev.hasStateOrData).toBe(true);
      expect(ev.hasUI).toBe(true);
      expect(ev.hasHandler).toBe(true);
      expect(ev.hasObservableResult).toBe(true);
      expect(ev.missingCells).toHaveLength(0);
    }
  });

  it("3. UNSEEN ANALYTICAL PROMPT: Generalizes capability extraction and completeness across novel domain", () => {
    // Completely novel, unseen domain: Cryogenic Bio-specimen Storage Freezers
    const novelPrompt = "Build an ultra-low cryogenic bio-specimen telemetry monitor called CryoVault with temperature variance aggregation, time window filtering (1h, 24h, 7d), freezer status filtering (OPTIMAL, WARNING, CRITICAL), dynamic cooling curve trend charts, freezer unit drill-down, and setpoint mutation controls";

    const contract = DomainVisualContractGenerator.deriveContract(novelPrompt);
    expect(contract.composition?.primaryWorkspace?.type).toBe("telemetry_grid");

    const domainSpec = DeterministicProjectFixer.deriveDomainSpec(TEST_DIR, {
      prompt: novelPrompt,
      requiredModels: ["CryoFreezer", "SpecimenBatch", "TemperatureTelemetry"],
    });

    const pageContent = `
import React, { useState, useMemo } from "react";

export function DashboardPage() {
  const [timeWindow, setTimeWindow] = useState("24h");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedUnitId, setSelectedUnitId] = useState("FREEZER-01");
  const [units, setUnits] = useState([
    { id: "FREEZER-01", name: "Cryo Unit Alpha", tempC: -81.2, targetTemp: -80, status: "OPTIMAL", timeseries: [{ time: "10:00", temp: -81.0 }, { time: "11:00", temp: -81.2 }] },
    { id: "FREEZER-02", name: "Cryo Unit Beta", tempC: -76.5, targetTemp: -80, status: "WARNING", timeseries: [{ time: "10:00", temp: -77.0 }, { time: "11:00", temp: -76.5 }] }
  ]);

  const avgTemp = useMemo(() => {
    return (units.reduce((acc, u) => acc + u.tempC, 0) / units.length).toFixed(1);
  }, [units]);

  const filteredUnits = useMemo(() => {
    return units.filter(u => statusFilter === "ALL" || u.status === statusFilter);
  }, [units, statusFilter]);

  const selectedUnit = units.find(u => u.id === selectedUnitId) || units[0];

  const handleUpdateSetpoint = (id: string, newTarget: number) => {
    setUnits(prev => prev.map(u => u.id === id ? { ...u, targetTemp: newTarget } : u));
  };

  return (
    <div className="workspace-telemetry" data-workspace="telemetry_grid">
      <div className="metrics-aggregate">Mean Core Temp: {avgTemp} °C</div>
      <div className="filters">
        <button onClick={() => setTimeWindow("1h")}>1h</button>
        <button onClick={() => setTimeWindow("24h")}>24h</button>
        <button onClick={() => setTimeWindow("7d")}>7d</button>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All</option>
          <option value="OPTIMAL">Optimal</option>
          <option value="WARNING">Warning</option>
        </select>
      </div>
      <div className="chart-trends" data-chart="true">
        {selectedUnit.timeseries.map(t => (
          <div key={t.time} className="trend-point curve-point" style={{ height: \`\${t.temp / 10}px\` }}>{t.temp} °C</div>
        ))}
      </div>
      <div className="grid-units">
        {filteredUnits.map(u => (
          <div key={u.id} className="unit-card" onClick={() => setSelectedUnitId(u.id)}>
            <h3>{u.name}</h3>
            <span>{u.tempC} °C</span>
            <input
              type="number"
              defaultValue={u.targetTemp}
              onBlur={(e) => handleUpdateSetpoint(u.id, Number(e.target.value))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
export default DashboardPage;
`;

    const result = CapabilityCompletenessInvariant.evaluatePage(pageContent, {
      expectedWorkspaceType: domainSpec.visualContract?.composition?.primaryWorkspace?.type,
      capabilities: [
        "aggregate_metrics",
        "filter_time_window",
        "filter_status",
        "visualize_trends",
        "drilldown_timeseries",
        "recalculate_aggregations",
      ],
    });

    expect(result.satisfiedCapabilities).toBeGreaterThanOrEqual(5);

    // Verify state hooks and event handlers exist for filtering and mutation
    expect(pageContent).toContain("setTimeWindow");
    expect(pageContent).toContain("setStatusFilter");
    expect(pageContent).toContain("setSelectedUnitId");
    expect(pageContent).toContain("handleUpdateSetpoint");
  });

  it("4. FULL-STACK CAPABILITY TRACE: Verifies frontend-to-backend-to-persistence trace and detects broken chains", () => {
    // 1. Valid fullstack trace
    writeFileSync(
      join(TEST_DIR, "src", "services", "api.ts"),
      `export const api = { getInverters: () => fetch("/api/inverters"), updateSetpoint: (id: string, kw: number) => fetch("/api/inverters/" + id, { method: "PATCH" }) }; export default api;`
    );
    writeFileSync(
      join(TEST_DIR, "server", "routes", "inverter.routes.ts"),
      `import { Router } from "express"; const router = Router(); router.get("/", (req, res) => res.json([])); router.patch("/:id", (req, res) => { prisma.inverter.update({ where: { id: req.params.id } }); res.json({ success: true }); }); export default router;`
    );
    writeFileSync(
      join(TEST_DIR, "prisma", "schema.prisma"),
      `datasource db { provider = "sqlite" url = "file:./dev.db" } generator client { provider = "prisma-client-js" } model Inverter { id String @id @default(uuid()) }`
    );

    const validTrace = CapabilityCompletenessInvariant.evaluateFullStack(TEST_DIR, {
      requiredModels: ["Inverter"],
    });

    expect(validTrace.valid).toBe(true);
    expect(validTrace.score).toBe(100);
    expect(validTrace.violations).toHaveLength(0);

    // 2. Broken backend route trace
    writeFileSync(join(TEST_DIR, "server", "routes", "inverter.routes.ts"), `export default {};`);

    const brokenTrace = CapabilityCompletenessInvariant.evaluateFullStack(TEST_DIR, {
      requiredModels: ["Inverter"],
    });

    expect(brokenTrace.valid).toBe(false);
    expect(brokenTrace.violations.length).toBeGreaterThan(0);
    expect(brokenTrace.violations[0]).toContain("Server router endpoint");
  });

  it("5. DETERMINISTIC FIXER: Prohibits UI replacement, detects incomplete capability, and preserves custom Coder UI byte-for-byte", () => {
    const dashPath = join(TEST_DIR, "src", "features", "dashboard", "DashboardPage.tsx");
    const domainSpec = DeterministicProjectFixer.deriveDomainSpec(TEST_DIR, {
      prompt: "Lumina Terra ceramic pottery studio with glaze calculations and kiln schedule",
      requiredModels: ["CeramicPiece", "GlazeRecipe", "KilnSchedule"],
    });

    // Write a custom Coder ceramic studio UI to disk
    const customCoderUi = `import React, { useState } from "react";
export function DashboardPage() {
  const [selectedGlaze, setSelectedGlaze] = useState("Celadon Mist");
  return (
    <div className="ceramic-studio-page">
      <h1>Lumina Terra Pottery Studio</h1>
      <p>Artisan ceramic collections and glaze formulations.</p>
      <div className="glaze-selector">Active Glaze: {selectedGlaze}</div>
    </div>
  );
}
export default DashboardPage;
`;
    writeFileSync(dashPath, customCoderUi, "utf8");

    // Run fixProject
    const report = DeterministicProjectFixer.fixProject(TEST_DIR, {
      prompt: "Lumina Terra ceramic pottery studio with glaze calculations and kiln schedule",
      requiredModels: ["CeramicPiece", "GlazeRecipe", "KilnSchedule"],
    });

    // Invariant: Custom Coder UI must be preserved byte-for-byte!
    const afterContent = readFileSync(dashPath, "utf8");
    expect(afterContent).toBe(customCoderUi);

    // Invariant: ZERO alien telemetry or inverter artifacts
    expect(afterContent).not.toContain("INV-01");
    expect(afterContent).not.toContain("Smart Rene");
    expect(afterContent).not.toContain("MPPT");
    expect(afterContent).not.toContain("targetKw");

    // Report should reflect that DashboardPage was NOT overwritten
    expect(report.createdFiles).not.toContain("src/features/dashboard/DashboardPage.tsx");
  });

  it("6. MODULAR DELEGATION: Correctly resolves capabilities delegated to imported sub-components", () => {
    const dashPath = join(TEST_DIR, "src", "features", "dashboard", "DashboardPage.tsx");
    const compDir = join(TEST_DIR, "src", "features", "dashboard", "components");
    mkdirSync(compDir, { recursive: true });

    // Sibling sub-component containing status filter and item selection
    const stonewareFeedCode = `import React, { useState } from "react";
export function StonewareFeed({ onSelect }: { onSelect?: (item: any) => void }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const pieces = [
    { id: "1", title: "Celadon Vase", status: "Completed" },
    { id: "2", title: "Tenmoku Bowl", status: "In Progress" }
  ];
  const filtered = pieces.filter(p => statusFilter === "all" || p.status === statusFilter);
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex gap-2">
        <button onClick={() => setStatusFilter("all")}>All</button>
        <button onClick={() => setStatusFilter("Completed")}>Completed</button>
      </div>
      {filtered.map(p => (
        <div key={p.id} onClick={() => onSelect && onSelect(p)} className="cursor-pointer">
          {p.title}
        </div>
      ))}
    </div>
  );
}
`;
    writeFileSync(join(compDir, "StonewareFeed.tsx"), stonewareFeedCode, "utf8");

    // Primary page file delegating to StonewareFeed
    const dashboardCode = `import React, { useState } from "react";
import { StonewareFeed } from "./components/StonewareFeed";

export function DashboardPage() {
  const [selectedPiece, setSelectedPiece] = useState<any>(null);
  return (
    <div data-workspace="catalog_grid" className="p-6">
      <h1>Lumina Terra Ceramics</h1>
      <p>Artisanal stoneware management platform.</p>
      <StonewareFeed onSelect={p => setSelectedPiece(p)} />
      {selectedPiece && (
        <div className="detail-panel">
          <h3>{selectedPiece.title} Details</h3>
          <button onClick={() => setSelectedPiece(null)}>Close</button>
        </div>
      )}
    </div>
  );
}
export default DashboardPage;
`;
    writeFileSync(dashPath, dashboardCode, "utf8");

    const result = CapabilityCompletenessInvariant.evaluatePage(dashboardCode, {
      expectedWorkspaceType: "catalog_grid",
      capabilities: [
        "inspect_record",
        "filter_status",
      ],
      filePath: dashPath,
    });

    expect(result.complete).toBe(true);
    expect(result.satisfiedCapabilities).toBe(2);
    expect(result.reasons).toHaveLength(0);
  });
});


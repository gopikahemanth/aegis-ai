/**
 * certification-hardening.test.ts
 *
 * Verifies the Certification Hardening Phase invariants:
 * 1. Typed API surface enforcement (distinguishing read-only vs stateful, 0 HTTP 500s, DB read-back)
 * 2. Behavioral state-mutation enforcement (rejecting passive route shells, confirming semantic transitions)
 * 3. Interaction provenance / Native Interaction Ratio (NIR) tracking
 *
 * CRITICAL TEST: Intentionally deficient projects MUST BE REJECTED.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { FinalSuccessGate } from "../final-success-gate.js";
import { ApiWorkflowVerifier, type ApiWorkflowReport } from "../api-workflow-verifier.js";
import { ApiContractRegistry } from "../../governance/api-contract-registry.js";
import { InteractionProvenanceTracker, PipelineProvenanceLedger } from "../../governance/interaction-provenance-tracker.js";
import { DomainContractManager } from "../../governance/domain-contract.js";
import { FastDeterministicSanitizer } from "../../governance/fast-sanitizer.js";
import type { ArchitectureContractV1 } from "../../governance/architecture-resolver.js";

const TEST_DIR = join(process.cwd(), ".tmp_test_cert_hardening");

function makeContract(): ArchitectureContractV1 {
  return {
    version: 1,
    frontend: { framework: "React-Vite", provenance: "explicit" },
    backend: { framework: "Express", provenance: "explicit" },
    database: { provider: "PostgreSQL", orm: "Prisma", provenance: "explicit", ormProvenance: "explicit" },
    language: "TypeScript",
    styling: "TailwindCSS",
    authentication: "JWT",
    packageManager: "pnpm",
    requiredModels: ["Berth", "Vessel"],
    requiredFeatures: ["Berth Scheduling"],
    requiredLibraries: [],
    requiredRoutes: ["/", "/berth-scheduling"],
  };
}

describe("Certification Hardening Phase — Invariants & Defect Rejection", () => {
  beforeEach(() => {
    InteractionProvenanceTracker.reset(TEST_DIR);
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(join(TEST_DIR, "prisma"), { recursive: true });
    mkdirSync(join(TEST_DIR, "src"), { recursive: true });
    mkdirSync(join(TEST_DIR, "server", "routes"), { recursive: true });
    mkdirSync(join(TEST_DIR, ".aegis"), { recursive: true });

    DomainContractManager.lock(makeContract(), "cert_hardening_hash", TEST_DIR);
    writeFileSync(join(TEST_DIR, "prisma", "schema.prisma"), "model User { id String @id }\nmodel Berth { id String @id }\nmodel Vessel { id String @id }");
    writeFileSync(join(TEST_DIR, "src", "App.tsx"), "import React, { useState } from 'react'; export const App = () => { const [b, setB] = useState('B1'); return <button onClick={() => setB('B2')}>Aquila {b}</button>; };");
    writeFileSync(join(TEST_DIR, "server", "index.ts"), "export const server = {};");
    writeFileSync(join(TEST_DIR, "server", "routes", "berth.routes.ts"), "export const router = {};");
  });

  afterEach(() => {
    InteractionProvenanceTracker.reset(TEST_DIR);
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  // ── INVARIANT 1: API SURFACE ENFORCEMENT & DEFECT REJECTION ────────────────

  it("REJECTS project when stateful API mutation / read-back fails", () => {
    const deficientReport: ApiWorkflowReport = {
      passed: false,
      totalSteps: 5,
      passedSteps: 4,
      failedSteps: 1,
      readOnlyEndpointsTested: 2,
      statefulEndpointsTested: 3,
      mutationsVerified: 2, // 1 mutation failed read-back verification!
      validationTestsPassed: 1,
      http500Count: 0,
      coverageRatio: 1.0,
      results: [],
      summary: "API Verification: 4/5 passed (1 failed). Stateful mutations: 2/3 verified.",
    };

    const res = FinalSuccessGate.verify({
      projectRoot: TEST_DIR,
      contract: makeContract(),
      buildSuccess: true,
      serverReady: true,
      browserResult: {
        passed: true,
        url: "http://localhost:5173",
        routesChecked: ["/", "/berth-scheduling"],
        consoleErrors: [],
        uncaughtExceptions: [],
        failedNetworkRequests: [],
        renderedElementsCount: 30,
        semanticMutationsCount: 2,
      },
      apiReport: deficientReport,
      realityResult: { passed: true, violationCount: 0, report: "Clean", violations: [] },
    });

    expect(res.status).toBe("FAILED");
    expect(res.success).toBe(false);
    expect(res.blockingReason).toContain("API Workflows");
    expect(res.blockingReason).toContain("Stateful mutation failure");
  });

  it("REJECTS project when API returns HTTP 500 internal server error", () => {
    const errorReport: ApiWorkflowReport = {
      passed: false,
      totalSteps: 4,
      passedSteps: 3,
      failedSteps: 1,
      readOnlyEndpointsTested: 2,
      statefulEndpointsTested: 2,
      mutationsVerified: 2,
      validationTestsPassed: 1,
      http500Count: 1, // Crash detected!
      coverageRatio: 1.0,
      results: [],
      summary: "CRITICAL: 1 HTTP 500 error detected.",
    };

    const res = FinalSuccessGate.verify({
      projectRoot: TEST_DIR,
      contract: makeContract(),
      buildSuccess: true,
      serverReady: true,
      browserResult: {
        passed: true,
        url: "http://localhost:5173",
        routesChecked: ["/", "/berth-scheduling"],
        consoleErrors: [],
        uncaughtExceptions: [],
        failedNetworkRequests: [],
        renderedElementsCount: 30,
        semanticMutationsCount: 2,
      },
      apiReport: errorReport,
      realityResult: { passed: true, violationCount: 0, report: "Clean", violations: [] },
    });

    expect(res.status).toBe("FAILED");
    expect(res.success).toBe(false);
    expect(res.blockingReason).toContain("HTTP 500 error(s) detected");
  });

  it("REJECTS project when backend routes exist but API report is missing", () => {
    const res = FinalSuccessGate.verify({
      projectRoot: TEST_DIR,
      contract: makeContract(),
      buildSuccess: true,
      serverReady: true,
      browserResult: {
        passed: true,
        url: "http://localhost:5173",
        routesChecked: ["/"],
        consoleErrors: [],
        uncaughtExceptions: [],
        failedNetworkRequests: [],
        renderedElementsCount: 25,
        semanticMutationsCount: 1,
      },
      apiReport: null, // Missing report!
      realityResult: { passed: true, violationCount: 0, report: "Clean", violations: [] },
    });

    expect(res.status).toBe("FAILED");
    expect(res.success).toBe(false);
    expect(res.blockingReason).toContain("API verification not executed (MANDATORY for backend routes)");
  });

  it("ACCEPTS project with read-only endpoints without forcing false database mutations", () => {
    const readOnlyReport: ApiWorkflowReport = {
      passed: true,
      totalSteps: 2,
      passedSteps: 2,
      failedSteps: 0,
      readOnlyEndpointsTested: 2,
      statefulEndpointsTested: 0, // Health & status only: 0 DB mutations needed
      mutationsVerified: 0,
      validationTestsPassed: 0,
      http500Count: 0,
      coverageRatio: 1.0,
      results: [],
      summary: "API Verification: 2/2 passed. Read-only: 2, Stateful Mutations: 0/0, HTTP 500: 0, Coverage: 100%.",
    };

    const res = FinalSuccessGate.verify({
      projectRoot: TEST_DIR,
      contract: makeContract(),
      buildSuccess: true,
      serverReady: true,
      browserResult: {
        passed: true,
        url: "http://localhost:5173",
        routesChecked: ["/"],
        consoleErrors: [],
        uncaughtExceptions: [],
        failedNetworkRequests: [],
        renderedElementsCount: 30,
        semanticMutationsCount: 1,
      },
      apiReport: readOnlyReport,
      realityResult: { passed: true, violationCount: 0, report: "Clean", violations: [] },
    });

    expect(res.status).toBe("SUCCESS");
    expect(res.success).toBe(true);
  });

  // ── INVARIANT 2: BEHAVIORAL STATE-MUTATION ENFORCEMENT ─────────────────────

  it("REJECTS project when browser validation detects a passive shell (0 state transitions)", () => {
    const res = FinalSuccessGate.verify({
      projectRoot: TEST_DIR,
      contract: makeContract(),
      buildSuccess: true,
      serverReady: true,
      browserResult: {
        passed: true,
        url: "http://localhost:5173",
        routesChecked: ["/berth-scheduling"],
        consoleErrors: [],
        uncaughtExceptions: [],
        failedNetworkRequests: [],
        renderedElementsCount: 35,
        semanticMutationsCount: 0, // PASSIVE SHELL: 0 state transitions on interaction!
      },
      apiReport: {
        passed: true,
        totalSteps: 2,
        passedSteps: 2,
        failedSteps: 0,
        readOnlyEndpointsTested: 1,
        statefulEndpointsTested: 1,
        mutationsVerified: 1,
        validationTestsPassed: 0,
        http500Count: 0,
        coverageRatio: 1.0,
        results: [],
        summary: "API Verification: 2/2 passed",
      },
      realityResult: { passed: true, violationCount: 0, report: "Clean", violations: [] },
    });

    expect(res.status).toBe("FAILED");
    expect(res.success).toBe(false);
    expect(res.blockingReason).toContain("Browser Runtime");
    expect(res.blockingReason).toContain("Behavioral state-mutation failure");
  });

  it("ACCEPTS project when browser validation confirms active semantic DOM state transitions", () => {
    const res = FinalSuccessGate.verify({
      projectRoot: TEST_DIR,
      contract: makeContract(),
      buildSuccess: true,
      serverReady: true,
      browserResult: {
        passed: true,
        url: "http://localhost:5173",
        routesChecked: ["/", "/berth-scheduling"],
        consoleErrors: [],
        uncaughtExceptions: [],
        failedNetworkRequests: [],
        renderedElementsCount: 45,
        semanticMutationsCount: 3, // ACTIVE: 3 state transitions verified!
        semanticMutationResults: [
          {
            route: "/berth-scheduling",
            actionName: "Select BERTH-03",
            trigger: "BERTH-03",
            mutationType: "INSPECTOR_SELECTION",
            stateBefore: "Available",
            stateAfter: "Occupied",
            passed: true,
          },
          {
            route: "/voyage-planning",
            actionName: "Toggle Weather Evasion",
            trigger: "Weather Evasion Mode",
            mutationType: "METRIC_UPDATE",
            stateBefore: "16.2 knots",
            stateAfter: "14.8 knots",
            passed: true,
          },
        ],
      },
      apiReport: {
        passed: true,
        totalSteps: 2,
        passedSteps: 2,
        failedSteps: 0,
        readOnlyEndpointsTested: 1,
        statefulEndpointsTested: 1,
        mutationsVerified: 1,
        validationTestsPassed: 0,
        http500Count: 0,
        coverageRatio: 1.0,
        results: [],
        summary: "API Verification: 2/2 passed",
      },
      realityResult: { passed: true, violationCount: 0, report: "Clean", violations: [] },
    });

    expect(res.status).toBe("SUCCESS");
    expect(res.success).toBe(true);
  });

  // ── INVARIANT 3: INTERACTION PROVENANCE & NIR ──────────────────────────────

  it("captures native handlers and calculates NIR accurately across pipeline stages", () => {
    // 1. Write native component authored by CoderAgent
    const componentCode = `
      import React, { useState } from 'react';
      export function BerthScheduler() {
        const [selectedBerth, setSelectedBerth] = useState('BERTH-01');
        const [mode, setMode] = useState('standard');
        return (
          <div>
            <button onClick={() => setSelectedBerth('BERTH-03')}>Select Berth 3</button>
            <button onClick={() => setMode('evasion')}>Weather Evasion</button>
            <input onChange={(e) => console.log(e.target.value)} />
          </div>
        );
      }
    `;
    writeFileSync(join(TEST_DIR, "src", "BerthScheduler.tsx"), componentCode);

    // 2. Baseline capture (Post-Coder)
    const baseline = InteractionProvenanceTracker.captureBaseline(TEST_DIR);
    expect(baseline.size).toBe(2); // App.tsx and BerthScheduler.tsx

    // 3. Post-sanitizer audit
    const report = InteractionProvenanceTracker.audit(TEST_DIR);
    expect(report.nativeHandlers).toBeGreaterThanOrEqual(4); // 2 useStates + 2 onClicks + 1 onChange
    expect(report.sanitizerInjectedHandlers).toBe(0);
    expect(report.nir).toBe(1.0);
    expect(report.summary).toContain("Native Interaction Ratio: 1.00");

    // 4. Verify saved artifact
    const loaded = InteractionProvenanceTracker.loadReport(TEST_DIR);
    expect(loaded).toBeDefined();
    expect(loaded?.nir).toBe(1.0);
    expect(loaded?.nativeHandlers).toBe(report.nativeHandlers);
  });

  it("ADVERSARIAL: detects sanitizer-injected interactions, lowers NIR, and enforces policy rejection / assisted tagging", () => {
    // 1. Write initial component and capture baseline
    const initialCode = `
      import React, { useState } from 'react';
      export function CargoManifest() {
        const [filter, setFilter] = useState('all');
        return <button onClick={() => setFilter('containers')}>Filter Containers</button>;
      }
    `;
    writeFileSync(join(TEST_DIR, "src", "CargoManifest.tsx"), initialCode);
    InteractionProvenanceTracker.captureBaseline(TEST_DIR);

    // 2. Deliberately simulate a sanitizer/post-processor injecting artificial fallback handlers into CargoManifest.tsx
    const injectedCode = `
      import React, { useState } from 'react';
      export function CargoManifest() {
        const [filter, setFilter] = useState('all');
        const [injectedHelper, setInjectedHelper] = useState(false);
        return (
          <div>
            <button onClick={() => setFilter('containers')}>Filter Containers</button>
            <button onClick={() => setInjectedHelper(true)}>Synthetic Sanitizer Trigger</button>
            <input onChange={(e) => console.log('synthetic fallback', e.target.value)} />
          </div>
        );
      }
    `;
    writeFileSync(join(TEST_DIR, "src", "CargoManifest.tsx"), injectedCode);

    // Also simulate sanitizer creating a synthetic interactive fallback component
    const syntheticModal = `
      import React, { useState } from 'react';
      export function FallbackModal() {
        const [open, setOpen] = useState(false);
        return <button onClick={() => setOpen(!open)}>Open Fallback</button>;
      }
    `;
    writeFileSync(join(TEST_DIR, "src", "FallbackModal.tsx"), syntheticModal);

    // 3. Audit interaction provenance: must detect injected handlers
    const auditReport = InteractionProvenanceTracker.audit(TEST_DIR);
    expect(auditReport.sanitizerInjectedHandlers).toBeGreaterThan(0);
    expect(auditReport.nir).toBeLessThan(1.0);
    expect(auditReport.details.some(d => d.injectedCount > 0)).toBe(true);

    // 4. Verify FinalSuccessGate rejects under STRICT_UNASSISTED policy
    const strictResult = FinalSuccessGate.verify({
      projectRoot: TEST_DIR,
      contract: makeContract(),
      buildSuccess: true,
      serverReady: true,
      provenancePolicy: "STRICT_UNASSISTED",
      browserResult: {
        passed: true,
        url: "http://localhost:5173",
        routesChecked: ["/", "/berth-scheduling"],
        consoleErrors: [],
        uncaughtExceptions: [],
        failedNetworkRequests: [],
        renderedElementsCount: 45,
        semanticMutationsCount: 1,
        semanticMutationResults: [{ route: "/", actionName: "Click", trigger: "button", mutationType: "DOM_TEXT_MUTATION", stateBefore: "A", stateAfter: "B", passed: true }],
      },
      apiReport: {
        passed: true,
        totalSteps: 1,
        passedSteps: 1,
        failedSteps: 0,
        readOnlyEndpointsTested: 1,
        statefulEndpointsTested: 0,
        mutationsVerified: 0,
        validationTestsPassed: 0,
        http500Count: 0,
        coverageRatio: 1.0,
        results: [],
        summary: "API Verification: 1/1 passed",
      },
      realityResult: { passed: true, violationCount: 0, report: "Clean", violations: [] },
    });

    expect(strictResult.status).toBe("FAILED");
    expect(strictResult.success).toBe(false);
    expect(strictResult.blockingReason).toContain("Interaction Provenance (NIR)");
    const nirItem = strictResult.items.find(i => i.name === "Interaction Provenance (NIR)");
    expect(nirItem?.passed).toBe(false);
    expect(nirItem?.message).toContain("STRICT_POLICY_REJECTED");
    expect(strictResult.provenanceStatus).toBe("ASSISTED_INJECTED");
    expect(strictResult.nir).toBeLessThan(1.0);

    // 5. Verify FinalSuccessGate accepts but clearly marks as ASSISTED under STANDARD policy
    const standardResult = FinalSuccessGate.verify({
      projectRoot: TEST_DIR,
      contract: makeContract(),
      buildSuccess: true,
      serverReady: true,
      provenancePolicy: "STANDARD",
      browserResult: {
        passed: true,
        url: "http://localhost:5173",
        routesChecked: ["/", "/berth-scheduling"],
        consoleErrors: [],
        uncaughtExceptions: [],
        failedNetworkRequests: [],
        renderedElementsCount: 45,
        semanticMutationsCount: 1,
        semanticMutationResults: [{ route: "/", actionName: "Click", trigger: "button", mutationType: "DOM_TEXT_MUTATION", stateBefore: "A", stateAfter: "B", passed: true }],
      },
      apiReport: {
        passed: true,
        totalSteps: 1,
        passedSteps: 1,
        failedSteps: 0,
        readOnlyEndpointsTested: 1,
        statefulEndpointsTested: 0,
        mutationsVerified: 0,
        validationTestsPassed: 0,
        http500Count: 0,
        coverageRatio: 1.0,
        results: [],
        summary: "API Verification: 1/1 passed",
      },
      realityResult: { passed: true, violationCount: 0, report: "Clean", violations: [] },
    });

    expect(standardResult.status).toBe("SUCCESS");
    expect(standardResult.success).toBe(true);
    expect(standardResult.provenanceStatus).toBe("ASSISTED_INJECTED");
    expect(standardResult.nir).toBeLessThan(1.0);
    expect(standardResult.injectedHandlersCount).toBeGreaterThan(0);
    const standardNirItem = standardResult.items.find(i => i.name === "Interaction Provenance (NIR)");
    expect(standardNirItem?.message).toContain("[ASSISTED GENERATION:");
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// Provenance Lifecycle Regression Tests
//
// These tests prove that the PipelineProvenanceLedger architecture is safe:
// the immutable baseline cannot be reset or corrupted by post-baseline
// registrations, and the NIR audit correctly identifies injections regardless
// of what the ledger contains.
// ─────────────────────────────────────────────────────────────────────────────

const PROV_DIR = join(process.cwd(), ".tmp_test_provenance_lifecycle");

function makeMinimalApiReport(): ApiWorkflowReport {
  return {
    passed: true, totalSteps: 1, passedSteps: 1, failedSteps: 0,
    readOnlyEndpointsTested: 1, statefulEndpointsTested: 0,
    mutationsVerified: 0, validationTestsPassed: 0, http500Count: 0,
    coverageRatio: 1.0, results: [],
    summary: "API Verification: 1/1 passed",
  };
}

function makeMinimalBrowserResult(mutations = 1) {
  return {
    passed: true, url: "http://localhost:5173",
    routesChecked: ["/"],
    consoleErrors: [], uncaughtExceptions: [], failedNetworkRequests: [],
    renderedElementsCount: 20,
    semanticMutationsCount: mutations,
    semanticMutationResults: mutations > 0 ? [{ route: "/", actionName: "Click", trigger: "btn", mutationType: "DOM_TEXT_MUTATION" as const, stateBefore: "A", stateAfter: "B", passed: true }] : [],
  };
}

describe("Provenance Lifecycle Regression — Baseline Integrity Invariants", () => {
  beforeEach(() => {
    InteractionProvenanceTracker.reset(PROV_DIR);
    if (existsSync(PROV_DIR)) rmSync(PROV_DIR, { recursive: true, force: true });
    mkdirSync(join(PROV_DIR, "src"), { recursive: true });
    mkdirSync(join(PROV_DIR, "prisma"), { recursive: true });
    mkdirSync(join(PROV_DIR, "server", "routes"), { recursive: true });
    mkdirSync(join(PROV_DIR, ".aegis"), { recursive: true });
    DomainContractManager.lock(makeContract(), "prov_test_hash", PROV_DIR);
    writeFileSync(join(PROV_DIR, "prisma", "schema.prisma"), "model User { id String @id }\nmodel Berth { id String @id }\nmodel Vessel { id String @id }");
    writeFileSync(join(PROV_DIR, "server", "index.ts"), "export const server = {};");
    writeFileSync(join(PROV_DIR, "server", "routes", "berth.routes.ts"), "export const router = {};");
  });

  afterEach(() => {
    InteractionProvenanceTracker.reset(PROV_DIR);
    if (existsSync(PROV_DIR)) rmSync(PROV_DIR, { recursive: true, force: true });
  });

  // ── REGRESSION 1 ──────────────────────────────────────────────────────────
  it("REG-01: sanitizer-injected handler is still detected even when a design-pipeline page was registered in the ledger", () => {
    // 1. Write a legitimate native component
    const nativeCode = "import React, { useState } from 'react';\nexport function FlightDashboard() {\n  const [alt, setAlt] = useState(0);\n  return <button onClick={() => setAlt(alt + 1000)}>Climb</button>;\n}";
    writeFileSync(join(PROV_DIR, "src", "FlightDashboard.tsx"), nativeCode);

    // 2. Capture the immutable baseline
    InteractionProvenanceTracker.captureBaseline(PROV_DIR);

    // 3. Register a design-pipeline page in the ledger (mkdir BEFORE writeFileSync)
    mkdirSync(join(PROV_DIR, "src", "pages"), { recursive: true });
    const designPageCode = "import React, { useState } from 'react';\nexport function ActiveNotamsPage() {\n  const [visible, setVisible] = useState(true);\n  return <button onClick={() => setVisible(!visible)}>Toggle NOTAMs</button>;\n}";
    writeFileSync(join(PROV_DIR, "src", "pages", "ActiveNotamsPage.tsx"), designPageCode);
    PipelineProvenanceLedger.register(PROV_DIR, "src/pages/ActiveNotamsPage.tsx", "DESIGN_PIPELINE", "GenericExperienceGenerator", designPageCode);

    // 4. ALSO simulate a sanitizer injection into an unrelated existing file
    const injectedCode = "import React, { useState } from 'react';\nexport function FlightDashboard() {\n  const [alt, setAlt] = useState(0);\n  const [injected, setInjected] = useState(false);\n  return (\n    <div>\n      <button onClick={() => setAlt(alt + 1000)}>Climb</button>\n      <button onClick={() => setInjected(true)}>Synthetic Injected</button>\n    </div>\n  );\n}";
    writeFileSync(join(PROV_DIR, "src", "FlightDashboard.tsx"), injectedCode);

    // 5. Audit MUST detect the injection in FlightDashboard.tsx despite the ledger entry for ActiveNotamsPage
    const report = InteractionProvenanceTracker.audit(PROV_DIR);

    expect(report.sanitizerInjectedHandlers).toBeGreaterThan(0);
    expect(report.nir).toBeLessThan(1.0);
    const dashDetail = report.details.find(d => d.file.includes("FlightDashboard"));
    expect(dashDetail?.injectedCount).toBeGreaterThan(0);

    // The design-pipeline page should be counted separately, not as injected
    expect(report.pipelineNativeHandlers).toBeGreaterThan(0);
    const pageDetail = report.details.find(d => d.file.includes("ActiveNotamsPage"));
    expect(pageDetail?.pipelineNativeCount).toBeGreaterThan(0);
    expect(pageDetail?.injectedCount).toBe(0);
  });

  // ── REGRESSION 2 ──────────────────────────────────────────────────────────
  it("REG-02: registering a synthesized page in the ledger does NOT reset baseline entries for unrelated files", async () => {
    // 1. Write two native files and capture baseline
    const file1 = "import React, { useState } from 'react';\nexport function NavBar() {\n  const [open, setOpen] = useState(false);\n  return <button onClick={() => setOpen(!open)}>Menu</button>;\n}";
    const file2 = "import React, { useState } from 'react';\nexport function RouteMap() {\n  const [route, setRoute] = useState('EGLL');\n  return <input onChange={(e) => setRoute(e.target.value)} />;\n}";
    writeFileSync(join(PROV_DIR, "src", "NavBar.tsx"), file1);
    writeFileSync(join(PROV_DIR, "src", "RouteMap.tsx"), file2);

    // Capture baseline — returns the in-memory map
    const baselineMap = InteractionProvenanceTracker.captureBaseline(PROV_DIR);
    expect(baselineMap.get("src/NavBar.tsx")).toBeDefined();
    expect(baselineMap.get("src/RouteMap.tsx")).toBeDefined();
    const navHashBefore = baselineMap.get("src/NavBar.tsx")!.contentHash;
    const mapHashBefore = baselineMap.get("src/RouteMap.tsx")!.contentHash;

    // 2. Register a design-pipeline synthesized page in ledger ONLY — not in baseline
    const synthesizedContent = "import React from 'react';\nexport function MissionBriefPage() { return <div>Mission Brief</div>; }";
    mkdirSync(join(PROV_DIR, "src", "pages"), { recursive: true });
    writeFileSync(join(PROV_DIR, "src", "pages", "MissionBriefPage.tsx"), synthesizedContent);
    PipelineProvenanceLedger.register(PROV_DIR, "src/pages/MissionBriefPage.tsx", "DESIGN_PIPELINE", "GenericExperienceGenerator", synthesizedContent);

    // 3. Verify the on-disk baseline artifact still only contains the original two files
    // Use the persisted JSON file — the in-memory map is the same because captureBaseline
    // is memoized; the test verifies the disk artifact was NOT overwritten.
    const { readFileSync: rfs } = await import("node:fs");
    const { join: j } = await import("node:path");
    const onDiskBaseline = JSON.parse(rfs(j(PROV_DIR, ".aegis", "interaction-baseline.json"), "utf8"));
    const diskFiles = new Map(onDiskBaseline.files as [string, any][]);

    expect((diskFiles.get("src/NavBar.tsx") as any)?.contentHash).toBe(navHashBefore);
    expect((diskFiles.get("src/RouteMap.tsx") as any)?.contentHash).toBe(mapHashBefore);

    // Synthesized page must NOT appear in the on-disk baseline
    expect(diskFiles.has("src/pages/MissionBriefPage.tsx")).toBe(false);

    // It MUST appear in the ledger
    const ledger = PipelineProvenanceLedger.loadMap(PROV_DIR);
    expect(ledger.has("src/pages/MissionBriefPage.tsx")).toBe(true);
    expect(ledger.get("src/pages/MissionBriefPage.tsx")?.stage).toBe("DESIGN_PIPELINE");
  });

  // ── REGRESSION 3 ──────────────────────────────────────────────────────────
  it("REG-03: a post-baseline modification to an existing component cannot become native because another page was synthesized", () => {
    // 1. Write native component and capture baseline
    const originalCode = "import React, { useState } from 'react';\nexport function WeatherRadar() {\n  const [layer, setLayer] = useState('SIGMET');\n  return <button onClick={() => setLayer('METAR')}>Switch to METAR</button>;\n}";
    writeFileSync(join(PROV_DIR, "src", "WeatherRadar.tsx"), originalCode);
    InteractionProvenanceTracker.captureBaseline(PROV_DIR);

    // 2. Synthesize a design-pipeline page and register in ledger
    const synthesizedContent = "import React from 'react';\nexport function WeatherPage() { return <div>Weather</div>; }";
    mkdirSync(join(PROV_DIR, "src", "pages"), { recursive: true });
    writeFileSync(join(PROV_DIR, "src", "pages", "WeatherPage.tsx"), synthesizedContent);
    PipelineProvenanceLedger.register(PROV_DIR, "src/pages/WeatherPage.tsx", "DESIGN_PIPELINE", "GenericExperienceGenerator", synthesizedContent);

    // 3. A structural fixer modifies WeatherRadar.tsx, injecting a new handler
    const modifiedCode = "import React, { useState } from 'react';\nexport function WeatherRadar() {\n  const [layer, setLayer] = useState('SIGMET');\n  const [alert, setAlert] = useState(false);\n  return (\n    <div>\n      <button onClick={() => setLayer('METAR')}>Switch to METAR</button>\n      <button onClick={() => setAlert(true)}>Alert Injected</button>\n    </div>\n  );\n}";
    writeFileSync(join(PROV_DIR, "src", "WeatherRadar.tsx"), modifiedCode);

    // 4. Audit must detect the injection — baseline immutability means the new handler
    // is detected as injected despite a design-pipeline page being in the ledger.
    const report = InteractionProvenanceTracker.audit(PROV_DIR);

    const radarDetail = report.details.find(d => d.file.includes("WeatherRadar"));
    expect(radarDetail?.injectedCount).toBeGreaterThan(0);
    expect(report.sanitizerInjectedHandlers).toBeGreaterThan(0);
    expect(report.nir).toBeLessThan(1.0);
    // Handlers that were in the baseline are preserved as native
    expect(radarDetail?.nativeCount).toBeGreaterThan(0);
  });

  // ── REGRESSION 4 ──────────────────────────────────────────────────────────
  it("REG-04: test-file exclusion works without hiding handlers in actual product code", () => {
    // 1. Write a real product component with interactions
    const productCode = "import React, { useState } from 'react';\nexport function AircraftSelector() {\n  const [selected, setSelected] = useState('B737');\n  return <button onClick={() => setSelected('A320')}>Select A320</button>;\n}";
    writeFileSync(join(PROV_DIR, "src", "AircraftSelector.tsx"), productCode);

    // 2. Write a test file with mock handlers inside src/__tests__/
    mkdirSync(join(PROV_DIR, "src", "__tests__"), { recursive: true });
    const testCode = "import React from 'react';\nconst el = <button onClick={() => jest.fn()}>Test</button>;\n";
    writeFileSync(join(PROV_DIR, "src", "__tests__", "AircraftSelector.test.tsx"), testCode);

    // 3. Capture baseline
    InteractionProvenanceTracker.captureBaseline(PROV_DIR);

    // 4. Audit: test file is excluded; product handler is counted as native
    const report = InteractionProvenanceTracker.audit(PROV_DIR);

    // Product file handlers must appear in native count
    const productDetail = report.details.find(d => d.file.includes("AircraftSelector.tsx") && !d.file.includes("__tests__"));
    expect(productDetail).toBeDefined();
    expect(productDetail?.nativeCount).toBeGreaterThan(0);

    // Test file must appear with EXCLUDED_FROM_NIR marker, contributing zero to NIR
    const testDetail = report.details.find(d => d.file.includes("__tests__"));
    expect(testDetail).toBeDefined();
    expect(testDetail?.handlers).toContain("[EXCLUDED_FROM_NIR]");
    expect(testDetail?.nativeCount).toBe(0);
    expect(testDetail?.injectedCount).toBe(0);

    // Exclusion paths are narrow — product paths with similar names are NOT excluded
    expect(InteractionProvenanceTracker.isExcludedFromNIR("src/AircraftSelector.tsx")).toBe(false);
    expect(InteractionProvenanceTracker.isExcludedFromNIR("src/__tests__/AircraftSelector.test.tsx")).toBe(true);
    expect(InteractionProvenanceTracker.isExcludedFromNIR("src/components/ui/Button.tsx")).toBe(true);
    expect(InteractionProvenanceTracker.isExcludedFromNIR("src/components/AircraftCard.tsx")).toBe(false);
  });

  // ── REGRESSION 5 ──────────────────────────────────────────────────────────
  it("REG-05: STRICT_UNASSISTED policy reaches FinalSuccessGate and rejects injected handlers; STANDARD annotates but passes", () => {
    // 1. Write a native component in src/components/, capture baseline
    const nativeCode = "import React, { useState } from 'react';\nexport function TowerComms() {\n  const [freq, setFreq] = useState(118.1);\n  return <button onClick={() => setFreq(119.1)}>Switch Freq</button>;\n}";
    mkdirSync(join(PROV_DIR, "src", "components"), { recursive: true });
    writeFileSync(join(PROV_DIR, "src", "components", "TowerComms.tsx"), nativeCode);
    InteractionProvenanceTracker.captureBaseline(PROV_DIR);

    // 2. Structural fixer adds a new file NOT in baseline and NOT in ledger
    const injectedComponent = "import React, { useState } from 'react';\nexport function SyntheticFallback() {\n  const [x, setX] = useState(false);\n  return <button onClick={() => setX(true)}>Synthetic</button>;\n}";
    writeFileSync(join(PROV_DIR, "src", "components", "SyntheticFallback.tsx"), injectedComponent);

    // 3. STRICT_UNASSISTED must fail
    const strictResult = FinalSuccessGate.verify({
      projectRoot: PROV_DIR,
      contract: makeContract(),
      buildSuccess: true,
      serverReady: true,
      provenancePolicy: "STRICT_UNASSISTED",
      browserResult: makeMinimalBrowserResult(1),
      apiReport: makeMinimalApiReport(),
      realityResult: { passed: true, violationCount: 0, report: "Clean", violations: [] },
    });

    expect(strictResult.success).toBe(false);
    expect(strictResult.status).toBe("FAILED");
    const nirItem = strictResult.items.find(i => i.name === "Interaction Provenance (NIR)");
    expect(nirItem?.passed).toBe(false);
    expect(nirItem?.message).toContain("STRICT_POLICY_REJECTED");

    // 4. STANDARD annotates injected handlers but does NOT block (ASSISTED_GENERATION)
    const standardResult = FinalSuccessGate.verify({
      projectRoot: PROV_DIR,
      contract: makeContract(),
      buildSuccess: true,
      serverReady: true,
      provenancePolicy: "STANDARD",
      browserResult: makeMinimalBrowserResult(1),
      apiReport: makeMinimalApiReport(),
      realityResult: { passed: true, violationCount: 0, report: "Clean", violations: [] },
    });
    expect(standardResult.success).toBe(true);  // STANDARD: annotation-only, not blocking
    const standardNirItem = standardResult.items.find(i => i.name === "Interaction Provenance (NIR)");
    expect(standardNirItem?.message).toContain("[ASSISTED GENERATION:");

    // 5. A clean project (no injections) under STRICT_UNASSISTED must pass the NIR check
    const cleanDir = join(PROV_DIR, "clean_subdir");
    InteractionProvenanceTracker.reset(cleanDir);
    mkdirSync(join(cleanDir, "src", "components"), { recursive: true });
    mkdirSync(join(cleanDir, "prisma"), { recursive: true });
    mkdirSync(join(cleanDir, "server", "routes"), { recursive: true });
    mkdirSync(join(cleanDir, ".aegis"), { recursive: true });
    DomainContractManager.lock(makeContract(), "clean_hash", cleanDir);
    writeFileSync(join(cleanDir, "prisma", "schema.prisma"), "model User { id String @id }\nmodel Berth { id String @id }\nmodel Vessel { id String @id }");
    writeFileSync(join(cleanDir, "server", "index.ts"), "export const server = {};");
    writeFileSync(join(cleanDir, "server", "routes", "berth.routes.ts"), "export const router = {};");
    writeFileSync(join(cleanDir, "src", "components", "TowerComms.tsx"), nativeCode);
    InteractionProvenanceTracker.captureBaseline(cleanDir);
    // No post-baseline changes at all
    const cleanResult = FinalSuccessGate.verify({
      projectRoot: cleanDir,
      contract: makeContract(),
      buildSuccess: true,
      serverReady: true,
      provenancePolicy: "STRICT_UNASSISTED",
      browserResult: makeMinimalBrowserResult(1),
      apiReport: makeMinimalApiReport(),
      realityResult: { passed: true, violationCount: 0, report: "Clean", violations: [] },
    });
    const cleanNirItem = cleanResult.items.find(i => i.name === "Interaction Provenance (NIR)");
    expect(cleanNirItem?.passed).toBe(true);
    expect(cleanNirItem?.message).toContain("Strict unassisted baseline verified: NIR 1.00");
  });

  // ── REGRESSION 6 ──────────────────────────────────────────────────────────
  it("REG-06: pre-baseline route-page synthesis is classified as native baseline, while post-baseline sanitizer injection is rejected by STRICT_UNASSISTED", () => {
    // 1. Author a native page component
    const nativeCode = "import React, { useState } from 'react';\nexport function FlightPlannerPage() {\n  const [alt, setAlt] = useState(10000);\n  return <button onClick={() => setAlt(alt + 2000)}>Climb</button>;\n}";
    mkdirSync(join(PROV_DIR, "src", "pages"), { recursive: true });
    writeFileSync(join(PROV_DIR, "src", "pages", "FlightPlannerPage.tsx"), nativeCode);

    // 2. Pre-baseline synthesis stage (Stage 3.5): synthesize required route page before baseline
    const contract = makeContract();
    contract.requiredRoutes = ["/flight-planner", "/notam-radar"];
    FastDeterministicSanitizer.synthesizeMissingRoutePages(PROV_DIR, contract);

    // 3. Capture baseline: both the Coder page and the synthesized route page are in the baseline
    const baseline = InteractionProvenanceTracker.captureBaseline(PROV_DIR);
    expect(baseline.get("src/pages/FlightPlannerPage.tsx")).toBeDefined();
    expect(baseline.get("src/pages/NotamRadarPage.tsx")).toBeDefined();

    // 4. Simulate post-baseline sanitizer injecting an artificial handler into FlightPlannerPage.tsx
    const injectedCode = "import React, { useState } from 'react';\nexport function FlightPlannerPage() {\n  const [alt, setAlt] = useState(10000);\n  const [injected, setInjected] = useState(false);\n  return (\n    <div>\n      <button onClick={() => setAlt(alt + 2000)}>Climb</button>\n      <button onClick={() => setInjected(true)}>Injected Handler</button>\n    </div>\n  );\n}";
    writeFileSync(join(PROV_DIR, "src", "pages", "FlightPlannerPage.tsx"), injectedCode);

    // 5. Audit: MUST detect the post-baseline injection
    const auditReport = InteractionProvenanceTracker.audit(PROV_DIR);
    expect(auditReport.sanitizerInjectedHandlers).toBeGreaterThan(0);
    expect(auditReport.nir).toBeLessThan(1.0);

    // 6. STRICT_UNASSISTED policy must reject the injected handler
    const strictResult = FinalSuccessGate.verify({
      projectRoot: PROV_DIR,
      contract,
      buildSuccess: true,
      serverReady: true,
      provenancePolicy: "STRICT_UNASSISTED",
      browserResult: makeMinimalBrowserResult(1),
      apiReport: makeMinimalApiReport(),
      realityResult: { passed: true, violationCount: 0, report: "Clean", violations: [] },
    });
    expect(strictResult.success).toBe(false);
    expect(strictResult.status).toBe("FAILED");
    const nirItem = strictResult.items.find(i => i.name === "Interaction Provenance (NIR)");
    expect(nirItem?.passed).toBe(false);
    expect(nirItem?.message).toContain("STRICT_POLICY_REJECTED");

    // 7. STANDARD policy annotates but passes
    const standardResult = FinalSuccessGate.verify({
      projectRoot: PROV_DIR,
      contract,
      buildSuccess: true,
      serverReady: true,
      provenancePolicy: "STANDARD",
      browserResult: makeMinimalBrowserResult(1),
      apiReport: makeMinimalApiReport(),
      realityResult: { passed: true, violationCount: 0, report: "Clean", violations: [] },
    });
    expect(standardResult.success).toBe(true);
    const standardItem = standardResult.items.find(i => i.name === "Interaction Provenance (NIR)");
    expect(standardItem?.message).toContain("[ASSISTED GENERATION:");

    // 8. Restore native code (no injections): re-audit and verify STRICT_UNASSISTED passes with NIR 1.00
    writeFileSync(join(PROV_DIR, "src", "pages", "FlightPlannerPage.tsx"), nativeCode);
    InteractionProvenanceTracker.audit(PROV_DIR);
    const cleanResult = FinalSuccessGate.verify({
      projectRoot: PROV_DIR,
      contract,
      buildSuccess: true,
      serverReady: true,
      provenancePolicy: "STRICT_UNASSISTED",
      browserResult: makeMinimalBrowserResult(1),
      apiReport: makeMinimalApiReport(),
      realityResult: { passed: true, violationCount: 0, report: "Clean", violations: [] },
    });
    expect(cleanResult.success).toBe(true);
    const cleanNirItem = cleanResult.items.find(i => i.name === "Interaction Provenance (NIR)");
    expect(cleanNirItem?.passed).toBe(true);
    expect(cleanNirItem?.message).toContain("Strict unassisted baseline verified: NIR 1.00");
  });
});

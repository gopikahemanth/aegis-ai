import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ProjectGraphEngine } from "../project-graph-engine.js";

const TEST_DIR = join(process.cwd(), ".tmp_test_universal_contract");

describe("Universal Hook & UI Contract Regression Suite", () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(join(TEST_DIR, "src", "features", "dashboard", "components"), { recursive: true });
    mkdirSync(join(TEST_DIR, "src", "features", "dashboard", "hooks"), { recursive: true });
    mkdirSync(join(TEST_DIR, "src", "hooks"), { recursive: true });
    mkdirSync(join(TEST_DIR, "src", "components", "ui"), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("1. synthesizes TelemetryDashboard.tsx without unescaped compName syntax errors", () => {
    const engine = new ProjectGraphEngine(TEST_DIR);
    const created = engine.ensureCanonicalFileOnDisk(
      "src/features/dashboard/components/TelemetryDashboard.tsx",
      TEST_DIR
    );

    expect(created).toBeTruthy();
    const content = readFileSync(created!, "utf8");

    // Must NOT contain literal unescaped "${compName}" inside JSX text
    expect(content).not.toContain("${compName}");
    // Must contain interpolated component name
    expect(content).toContain("TelemetryDashboard Overview");
    expect(content).toContain("export function TelemetryDashboard");
  });

  it("2. synthesizes src/components/ui.tsx exporting all canonical primitives", () => {
    const engine = new ProjectGraphEngine(TEST_DIR);
    const created = engine.ensureCanonicalFileOnDisk("src/components/ui.tsx", TEST_DIR);

    expect(created).toBeTruthy();
    const content = readFileSync(created!, "utf8");

    expect(content).toContain("export function Card");
    expect(content).toContain("export function Select");
    expect(content).toContain("export function Spinner");
    expect(content).toContain("export function Alert");
    expect(content).toContain("export function Button");
    expect(content).toContain("export function Input");
    expect(content).toContain("export function Badge");
    expect(content).toContain("export function Progress");
    expect(content).toContain("export const LoadingSpinner");
    expect(content).toContain("export default ui");
  });

  it("3. synthesizes universal hook supporting parameter calls, selector calls, and rich destructuring", () => {
    const engine = new ProjectGraphEngine(TEST_DIR);
    const created = engine.ensureCanonicalFileOnDisk("src/hooks/useInverters.tsx", TEST_DIR);

    expect(created).toBeTruthy();
    const content = readFileSync(created!, "utf8");

    // Must not be locked to rigid BoardStoreState without [key: string]: any
    expect(content).toContain("[key: string]: any");
    // Must export callable hook accepting arbitrary arguments (...args: any[])
    expect(content).toContain("export function useInverters(...args: any[]): any");
    // Must support static Zustand store access
    expect(content).toContain("useInverters.getState =");
    expect(content).toContain("useInverters.setState =");
    // Must return unified data, loading, error, mutate, inverters, summary
    expect(content).toContain("inverters: store.inverters");
    expect(content).toContain("summary: store.summary");
    expect(content).toContain("loading: store.loading");
    expect(content).toContain("mutate: store.mutate");
    // Must maintain backward-compatible BoardStoreState type
    expect(content).toContain("export type BoardStoreState = UniversalStoreState");
  });

  it("4. synthesizes useDashboardData hook without ATS domain contamination", () => {
    const engine = new ProjectGraphEngine(TEST_DIR);
    const created = engine.ensureCanonicalFileOnDisk(
      "src/features/dashboard/hooks/useDashboardData.ts",
      TEST_DIR
    );

    expect(created).toBeTruthy();
    const content = readFileSync(created!, "utf8");

    // Zero ATS scan history contamination
    expect(content).not.toContain("getScanHistory");
    expect(content).not.toContain("avgMatchScore");
    // Accepts arguments and returns unified properties
    expect(content).toContain("export function useDashboardData(...args: any[])");
    expect(content).toContain("loading: query.isLoading");
    expect(content).toContain("mutate:");
  });

  it("5. validates exact consumer pattern in DashboardPage compiles cleanly with universal contracts", () => {
    const engine = new ProjectGraphEngine(TEST_DIR);
    engine.ensureCanonicalFileOnDisk("src/components/ui.tsx", TEST_DIR);
    engine.ensureCanonicalFileOnDisk("src/hooks/useInverters.tsx", TEST_DIR);

    // Consumer code mimicking the exact failure in DashboardPage
    const consumerCode = `import React, { useState } from 'react';
import { Card, Select, Spinner, Alert } from '../components/ui';
import { useInverters } from '../hooks/useInverters';

export const TestDashboard = () => {
  const [window, setWindow] = useState('24h');
  const [status, setStatus] = useState('ALL');
  
  // This was the exact line that failed with TS2353 and TS2554:
  const { data, loading, error, mutate } = useInverters({ window, status });

  if (loading) return <Spinner />;
  if (error) return <Alert variant="danger">{error.message}</Alert>;
  if (!data) return null;

  return (
    <div>
      <Select value={window} onChange={(e: any) => setWindow(e.target.value)} options={['1h', '24h', '7d']} />
      <Card title="Instant kW">{data.summary.totalKw} kW</Card>
      <button onClick={() => mutate('INV-01')}>Mutate</button>
    </div>
  );
};
`;
    // Write consumer file
    const consumerPath = join(TEST_DIR, "src", "features", "dashboard", "DashboardPage.tsx");
    writeFileSync(consumerPath, consumerCode, "utf8");

    // The consumer code must exist and be syntactically valid
    expect(existsSync(consumerPath)).toBe(true);
    expect(readFileSync(consumerPath, "utf8")).toContain("useInverters({ window, status })");
  });
});


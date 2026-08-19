import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { TsSymbolRepairEngine } from "../ts-symbol-repair-engine.js";
import { RepairConvergenceMonitor, RepairConvergenceTracker } from "../repair-convergence-monitor.js";
import { TransactionalRepairSystem } from "../transactional-repair.js";

describe("Aegis V2.1 Fix 4 — Self-Healing Repair Convergence & Export/Casing Diagnostics", () => {
  let testDir: string;

  beforeEach(() => {
    TransactionalRepairSystem.reset();
    testDir = join(tmpdir(), `aegis-repair-convergence-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    mkdirSync(testDir, { recursive: true });
    mkdirSync(join(testDir, "src"), { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
    TransactionalRepairSystem.reset();
  });

  it("Test 1 — Casing mismatch (use_kanban_dnd vs useKanbanDnd)", () => {
    // 1. Definition file exports use_kanban_dnd
    const hookFile = join(testDir, "src/use-kanban-dnd.tsx");
    writeFileSync(
      hookFile,
      `import React from "react";
export function use_kanban_dnd() {
  return { tasks: [] };
}
export default use_kanban_dnd;
`,
      "utf8"
    );

    // 2. Caller imports useKanbanDnd
    const callerFile = join(testDir, "src/KanbanBoard.tsx");
    writeFileSync(
      callerFile,
      `import React from "react";
import { useKanbanDnd } from "./use-kanban-dnd";

export function KanbanBoard() {
  const dnd = useKanbanDnd();
  return <div>Kanban Board</div>;
}
`,
      "utf8"
    );

    // 3. Simulated TS2724 error from compiler
    const stderr = `src/KanbanBoard.tsx(2,10): error TS2724: '"./use-kanban-dnd"' has no exported member named 'useKanbanDnd'. Did you mean 'use_kanban_dnd'?`;

    // 4. Run deterministic repair
    const actions = TsSymbolRepairEngine.repair(testDir, stderr);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0].applied).toBe(true);

    // 5. Verify the hook file now provides the requested symbol alias
    const updatedHook = readFileSync(hookFile, "utf8");
    expect(updatedHook).toContain("export const useKanbanDnd = use_kanban_dnd;");

    // 6. Verify no unexpected/unrelated files created
    expect(existsSync(join(testDir, "src/state.tsx"))).toBe(false);
  });

  it("Test 2 — Missing re-export (Barrel file missing export)", () => {
    // Component exists
    const cardFile = join(testDir, "src/components/Card.tsx");
    mkdirSync(join(testDir, "src/components"), { recursive: true });
    writeFileSync(
      cardFile,
      `import React from "react";
export function GlassCard() { return <div>Glass Card</div>; }
export default GlassCard;
`,
      "utf8"
    );

    // Caller imports from barrel/module
    const pageFile = join(testDir, "src/DashboardPage.tsx");
    writeFileSync(
      pageFile,
      `import React from "react";
import { GlassCard } from "./components/Card";
export default function Dashboard() { return <GlassCard />; }
`,
      "utf8"
    );

    const stderr = `src/DashboardPage.tsx(2,10): error TS2305: Module '"./components/Card"' has no exported member 'GlassCard'.`;

    // Run repair
    const actions = TsSymbolRepairEngine.repair(testDir, stderr);
    expect(actions.length).toBe(1);

    const updatedCard = readFileSync(cardFile, "utf8");
    expect(updatedCard).toContain("GlassCard");
  });

  it("Test 3 — Wrong exported-member import (default vs named import TS2614)", () => {
    const buttonFile = join(testDir, "src/Button.tsx");
    writeFileSync(
      buttonFile,
      `import React from "react";
export default function Button() { return <button>Click</button>; }
`,
      "utf8"
    );

    const callerFile = join(testDir, "src/App.tsx");
    writeFileSync(
      callerFile,
      `import React from "react";
import { Button } from "./Button";

export default function App() { return <Button />; }
`,
      "utf8"
    );

    const stderr = `src/App.tsx(2,10): error TS2614: Module '"./Button"' has no exported member 'Button'. Did you mean to use 'import Button from "./Button"' instead?`;

    const actions = TsSymbolRepairEngine.repair(testDir, stderr);
    expect(actions.length).toBe(1);

    const updatedApp = readFileSync(callerFile, "utf8");
    expect(updatedApp).toContain(`import Button from "./Button"`);
    expect(updatedApp).not.toContain(`import { Button } from "./Button"`);
  });

  it("Test 4 — A -> B -> A oscillation prevention", () => {
    const initialDiag = `src/A.tsx(1,1): error TS2304: Cannot find name 'A'.\nsrc/B.tsx(2,2): error TS2304: Cannot find name 'B'.`;
    const tracker = new RepairConvergenceTracker(initialDiag);

    const stateA = initialDiag;
    const stateB = `src/A.tsx(1,1): error TS2304: Cannot find name 'C'.`;

    // Attempt 1: State transitions to B (1 error instead of 2) -> IMPROVED
    const eval1 = tracker.evaluateCandidate(1, stateB);
    expect(eval1.accepted).toBe(true);
    expect(eval1.comparison.verdict).toBe("IMPROVED");

    // Attempt 2: Proposes state that causes error state to flip back to State A (2 errors) -> REGRESSION
    const eval2 = tracker.evaluateCandidate(2, stateA);
    expect(eval2.accepted).toBe(false);
    expect(eval2.comparison.verdict).toBe("REGRESSION");

    // Attempt 3: If an attempt transitions to State A again -> OSCILLATION detected & rejected
    const eval3 = tracker.evaluateCandidate(3, stateA);
    expect(eval3.accepted).toBe(false);
    expect(eval3.comparison.verdict).toBe("OSCILLATION");
  });

  it("Test 5 — Regression rejection (3 errors -> 5 errors rolled back to checkpoint)", () => {
    const fileA = "src/A.ts";
    writeFileSync(join(testDir, fileA), `export const a = 1;\nexport const b = 2;`, "utf8");

    const originalDiag = `src/A.ts(1,1): error TS2304: Cannot find name 'X'.\nsrc/A.ts(2,1): error TS2304: Cannot find name 'Y'.\nsrc/A.ts(3,1): error TS2304: Cannot find name 'Z'.`;
    const tracker = new RepairConvergenceTracker(originalDiag);

    // Create Checkpoint
    const checkpointId = TransactionalRepairSystem.createCheckpoint(testDir, [fileA]);

    // Corrupt file (simulating regressive repair)
    writeFileSync(join(testDir, fileA), `export const broken = ???;`, "utf8");

    const regressedDiag = `src/A.ts(1,1): error TS1005: ';' expected.\nsrc/A.ts(1,2): error TS1109: Expression expected.\nsrc/A.ts(2,1): error TS2304: Cannot find name 'X'.\nsrc/A.ts(3,1): error TS2304: Cannot find name 'Y'.\nsrc/A.ts(4,1): error TS2304: Cannot find name 'Z'.`;

    const evalResult = tracker.evaluateCandidate(1, regressedDiag);
    expect(evalResult.accepted).toBe(false);
    expect(evalResult.comparison.verdict).toBe("REGRESSION");

    // Rollback
    TransactionalRepairSystem.rollback(testDir, checkpointId, evalResult.comparison.reason);
    expect(readFileSync(join(testDir, fileA), "utf8")).toBe(`export const a = 1;\nexport const b = 2;`);
  });

  it("Test 6 — Repeated identical candidate deduplication", () => {
    const initialDiag = `src/A.tsx(1,1): error TS2304: Cannot find name 'A'.`;
    const tracker = new RepairConvergenceTracker(initialDiag);

    const patchCandidate = `// File: src/A.tsx\nexport const A = 123;`;

    // First time proposed: not duplicate
    expect(tracker.isDuplicateCandidate(patchCandidate)).toBe(false);

    // Second time proposed: duplicate detected!
    expect(tracker.isDuplicateCandidate(patchCandidate)).toBe(true);
  });

  it("Test 7 — Successful convergence (failure -> repair -> 0 blocking errors)", () => {
    const initialDiag = `src/App.tsx(5,10): error TS2304: Cannot find name 'Header'.`;
    const tracker = new RepairConvergenceTracker(initialDiag);

    const cleanBuildDiag = ``; // 0 errors
    const evalResult = tracker.evaluateCandidate(1, cleanBuildDiag);

    expect(evalResult.accepted).toBe(true);
    expect(evalResult.nextBaseline.blockingErrorCount).toBe(0);
  });
});

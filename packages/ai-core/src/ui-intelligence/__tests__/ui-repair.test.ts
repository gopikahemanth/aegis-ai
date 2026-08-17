import { describe, it, expect } from "vitest";
import { UIRepairEngine } from "../ui-repair-engine.js";

describe("AEGIS Phase 49 — UI Repair Engine", () => {
  it("diagnoses and autonomously repairs mobile viewport overflow defects in bounded iterations", async () => {
    const repairResult = await UIRepairEngine.healUIDefect(
      {
        description: "Mobile viewport horizontal overflow on dashboard sidebar",
        targetFile: "src/components/Sidebar.tsx",
      },
      5
    );

    expect(repairResult.isResolved).toBe(true);
    expect(repairResult.logs.length).toBe(1);
    expect(repairResult.logs[0].retestReport.failedInspections).toBe(0);
  });
});

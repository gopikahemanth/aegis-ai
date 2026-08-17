import { describe, it, expect } from "vitest";
import { ProductRepairCoordinator } from "../product-repair-coordinator.js";
import { type UnifiedProductDefect } from "../product-defect-coordinator.js";

describe("AEGIS Phase 50 — Product Repair Coordinator", () => {
  it("routes defects to the appropriate specialized repair engine within bounded cycles", async () => {
    const defects: UnifiedProductDefect[] = [
      { defectId: "DEF-001", category: "UI", severity: "HIGH", description: "Mobile sidebar overflow", targetFile: "Sidebar.tsx", blastRadius: "ISOLATED" },
    ];

    const result = await ProductRepairCoordinator.executeCoordinatedRepair(defects);
    expect(result.isFullyHealed).toBe(true);
    expect(result.totalDefectsRepaired).toBe(1);
    expect(result.repairLogs[0].engineUsed).toBe("UIRepairEngine");
  });
});

import { describe, it, expect } from "vitest";
import { ProductDefectCoordinator, type UnifiedProductDefect } from "../product-defect-coordinator.js";

describe("AEGIS Phase 50 — Product Defect Coordinator", () => {
  it("triages and prioritizes defects by severity and flags critical blockers", () => {
    const defects: UnifiedProductDefect[] = [
      { defectId: "DEF-001", category: "UI", severity: "LOW", description: "Button radius drift", targetFile: "Button.tsx", blastRadius: "ISOLATED" },
      { defectId: "DEF-002", category: "API", severity: "CRITICAL", description: "Payment transaction crash", targetFile: "payment.ts", blastRadius: "SYSTEM_WIDE" },
      { defectId: "DEF-003", category: "ACCESSIBILITY", severity: "MEDIUM", description: "Missing focus ring", targetFile: "Input.tsx", blastRadius: "ISOLATED" },
    ];

    const triaged = ProductDefectCoordinator.triageDefects(defects);
    expect(triaged[0].severity).toBe("CRITICAL");
    expect(triaged[1].severity).toBe("MEDIUM");
    expect(triaged[2].severity).toBe("LOW");

    expect(ProductDefectCoordinator.hasCriticalBlockers(defects)).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { SecurityRepairEngine } from "../security-repair-engine.js";
import { VulnerabilityDiagnosisEngine } from "../vulnerability-diagnosis-engine.js";

describe("AEGIS Phase 58 — Security Repair Engine", () => {
  it("autonomously patches discovered vulnerabilities cleanly", async () => {
    const diagnosis = VulnerabilityDiagnosisEngine.diagnoseVulnerabilities({
      includeDeliberateVulnerabilities: true,
    });

    const report = await SecurityRepairEngine.repairVulnerabilities(diagnosis);

    expect(report.isRepaired).toBe(true);
    expect(report.patchesAppliedCount).toBe(5);
    expect(report.requiresHumanIntervention).toBe(false);
  });

  it("escalates to human intervention when critical unrepairable issue is present", async () => {
    const diagnosis = VulnerabilityDiagnosisEngine.diagnoseVulnerabilities({
      simulateUnrepairableCritical: true,
    });

    const report = await SecurityRepairEngine.repairVulnerabilities(diagnosis, {
      simulateUnrepairableCritical: true,
    });

    expect(report.isRepaired).toBe(false);
    expect(report.requiresHumanIntervention).toBe(true);
  });
});

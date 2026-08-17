import { describe, it, expect } from "vitest";
import { RepairDeploymentEngine } from "../repair-deployment-engine.js";

describe("AEGIS Phase 57 — Repair Deployment Engine", () => {
  it("deploys verified repair to production and validates live endpoints & workflows", async () => {
    const report = await RepairDeploymentEngine.deployRepair("GymMaster Pro");
    expect(report.isDeployed).toBe(true);
    expect(report.buildStatus).toBe("PASS");
    expect(report.healthStatus).toBe("HEALTHY");
    expect(report.liveApiVerified).toBe(true);
    expect(report.liveWorkflowVerified).toBe(true);
  });

  it("handles live deployment regression cleanly", async () => {
    const report = await RepairDeploymentEngine.deployRepair("GymMaster Pro", "https://aegisgym.com", {
      simulateDeploymentRegression: true,
    });
    expect(report.isDeployed).toBe(false);
    expect(report.healthStatus).toBe("DEGRADED");
  });
});

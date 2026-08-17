import { describe, it, expect } from "vitest";
import { DeploymentHealthEngine } from "../deployment-health-engine.js";

describe("AEGIS Phase 53 — Deployment Health Engine", () => {
  it("distinguishes PROCESS_RUNNING vs SERVICE_HEALTHY vs APPLICATION_HEALTHY", () => {
    const r = DeploymentHealthEngine.verify();
    expect(r.overallLevel).toBe("APPLICATION_HEALTHY");
    expect(r.isApplicationHealthy).toBe(true);
    expect(r.frontendCheck.level).toBe("APPLICATION_HEALTHY");
    expect(r.backendCheck.level).toBe("APPLICATION_HEALTHY");
    expect(r.databaseCheck.level).toBe("APPLICATION_HEALTHY");
    expect(r.processStateCheck.level).toBe("SERVICE_HEALTHY");
  });

  it("correctly downgrades to DOWN when backend is unresponsive — SERVER RUNNING ≠ FEATURE VERIFIED", () => {
    const r = DeploymentHealthEngine.verify("backend");
    expect(r.isApplicationHealthy).toBe(false);
    expect(r.backendCheck.level).toBe("DOWN");
    expect(r.overallLevel).toBe("DOWN");
    expect(r.degradedServices).toContain("Backend Reachability");
  });

  it("correctly downgrades when database fails", () => {
    const r = DeploymentHealthEngine.verify("database");
    expect(r.isApplicationHealthy).toBe(false);
    expect(r.databaseCheck.level).toBe("DOWN");
  });
});

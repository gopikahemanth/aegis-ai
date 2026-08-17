import { describe, it, expect } from "vitest";
import { HostingTargetEngine } from "../hosting-target-engine.js";

describe("AEGIS Phase 54 — Hosting Target Engine", () => {
  it("provisions LOCAL target with appropriate ports and strategies", () => {
    const target = HostingTargetEngine.selectTarget("LOCAL");
    expect(target.type).toBe("LOCAL");
    expect(target.isProvisionable).toBe(true);
    expect(target.ports.backend).toBe(3001);
    expect(target.ports.frontend).toBe(5173);
  });

  it("provisions DOCKER target with compose specification", () => {
    const target = HostingTargetEngine.selectTarget("DOCKER");
    expect(target.type).toBe("DOCKER");
    expect(target.deploymentStrategy).toBe("DOCKER_COMPOSE");
    expect(target.isProvisionable).toBe(true);
  });

  it("flags CONFIGURATION_REQUIRED for CLOUD when credentials are absent", () => {
    const target = HostingTargetEngine.selectTarget("CLOUD");
    expect(target.isProvisionable).toBe(false);
    expect(target.configurationRequired).toContain("CLOUD_PROVIDER_CREDENTIALS");
  });

  it("provisions CLOUD target when credentials are provided", () => {
    const target = HostingTargetEngine.selectTarget("CLOUD", { AWS_ACCESS_KEY_ID: "AKIA123" });
    expect(target.isProvisionable).toBe(true);
    expect(target.configurationRequired).toHaveLength(0);
  });
});

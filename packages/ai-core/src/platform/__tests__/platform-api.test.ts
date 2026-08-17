import { describe, it, expect } from "vitest";
import { AegisPlatform } from "../aegis-platform.js";
import { FleetManager } from "../../fleet/fleet-manager.js";

describe("AEGIS Phase 18 — Public Platform API", () => {
  it("registers project and creates generation jobs through the unified public API", () => {
    FleetManager.reset();

    AegisPlatform.createProject({
      organizationId: "org_enterprise_1",
      projectId: "gym_platform_proj",
      name: "Gym Enterprise Node",
      projectPath: "/path/to/gym",
    });

    const fleet = AegisPlatform.getFleetHealth();
    expect(fleet.totalProjects).toBe(1);

    const job = AegisPlatform.createGenerationJob({
      projectId: "gym_platform_proj",
      projectPath: "/path/to/gym",
      prompt: "Build gym system",
    });

    expect(job.status).toBe("QUEUED");
    expect(job.projectId).toBe("gym_platform_proj");
  });
});

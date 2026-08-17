import { describe, it, expect, afterEach } from "vitest";
import { RuntimeLaunchEngine } from "../runtime-launch-engine.js";

describe("AEGIS Phase 46 — Runtime Launch Engine", () => {
  afterEach(() => {
    RuntimeLaunchEngine.stopAllProcesses();
  });

  it("launches frontend and backend runtime servers with process tracking and clean termination", () => {
    const launch = RuntimeLaunchEngine.launchApplication(5173, 3001, true);

    expect(launch.isAvailable).toBe(true);
    expect(launch.healthStatus).toBe("HEALTHY");
    expect(launch.activeProcesses.length).toBe(2);
    expect(launch.databaseReady).toBe(true);

    const stoppedCount = RuntimeLaunchEngine.stopAllProcesses();
    expect(stoppedCount).toBe(2);
    expect(RuntimeLaunchEngine.getActiveProcesses().length).toBe(0);
  });
});

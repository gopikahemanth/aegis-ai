import { describe, it, expect } from "vitest";
import { ResourceLeakDetector } from "../resource-leak-detector.js";
import { RuntimeProcessManager } from "../../execution/runtime-process-manager.js";

describe("AEGIS Phase 14 — Resource Leak Detection", () => {
  it("confirms 0 orphan processes and unclosed ports when stopped", async () => {
    await RuntimeProcessManager.stopAll();
    const report = await ResourceLeakDetector.audit();
    expect(report.clean).toBe(true);
    expect(report.activeProcesses).toBe(0);
  });
});

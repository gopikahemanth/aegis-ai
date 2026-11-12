import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { StudioBridge } from "../studio-bridge.js";
import { JobStateManager } from "../../orchestrator/job-state-manager.js";
import * as fs from "fs";
import * as path from "path";

const TEST_DIR = path.join(process.cwd(), ".tmp_test_studio_bridge");

describe("Phase 11: StudioBridge", () => {
  let stateManager: JobStateManager;
  let bridge: StudioBridge;

  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEST_DIR, { recursive: true });

    stateManager = new JobStateManager(TEST_DIR);
    stateManager.createJob("job_studio_01", "Build SaaS Dashboard");
    bridge = new StudioBridge(TEST_DIR, stateManager, { frontendPort: 5175, backendPort: 3005 });
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("extracts live telemetry from JobStateManager accurately", () => {
    stateManager.registerTasks([
      { id: 1, title: "Task 1", stage: "Frontend" } as any,
      { id: 2, title: "Task 2", stage: "Backend" } as any,
    ]);
    stateManager.updateTaskState(1, "RUNNING");
    stateManager.updateTaskState(1, "PASSED", { durationMs: 100 });
    stateManager.updateTaskState(2, "RUNNING");

    const telemetry = bridge.getTelemetry("job_studio_01");

    expect(telemetry).toBeDefined();
    expect(telemetry?.jobId).toBe("job_studio_01");
    expect(telemetry?.tasksTotal).toBe(2);
    expect(telemetry?.tasksCompleted).toBe(1);
    expect(telemetry?.percentage).toBe(50);
    expect(telemetry?.preview.frontendPort).toBe(5175);
    expect(telemetry?.preview.backendPort).toBe(3005);
  });

  it("generates a live disk file tree omitting internal directories", () => {
    fs.mkdirSync(path.join(TEST_DIR, "src", "components"), { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, "src", "App.tsx"), "export default App;");
    fs.writeFileSync(path.join(TEST_DIR, "package.json"), "{}");
    fs.mkdirSync(path.join(TEST_DIR, "node_modules", "react"), { recursive: true });

    const tree = bridge.getFileTree();

    expect(tree.type).toBe("directory");
    expect(tree.children?.some(c => c.name === "src")).toBe(true);
    expect(tree.children?.some(c => c.name === "package.json")).toBe(true);

    // Must NOT expose node_modules in project tree
    expect(tree.children?.some(c => c.name === "node_modules")).toBe(false);
  });

  it("allows studio UI to cancel job and emit event", () => {
    let eventReceived = false;
    bridge.on("JOB_CANCELLED", (evt) => {
      if (evt.jobId === "job_studio_01") eventReceived = true;
    });

    const result = bridge.controlJob("job_studio_01", "CANCEL");

    expect(result).toBe(true);
    expect(eventReceived).toBe(true);
    expect(stateManager.getStatus()).toBe("CANCELLED");
  });
});

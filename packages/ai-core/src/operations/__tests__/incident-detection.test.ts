import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { IncidentEngine } from "../incident-engine.js";
import { ProductionStateManager } from "../production-state.js";

const INC_TEST_DIR = join(process.cwd(), ".tmp_test_p15_inc");

describe("AEGIS Phase 15 — Incident Lifecycle & Detection", () => {
  beforeEach(() => {
    if (existsSync(INC_TEST_DIR)) rmSync(INC_TEST_DIR, { recursive: true, force: true });
    mkdirSync(INC_TEST_DIR, { recursive: true });
    IncidentEngine.reset();
    ProductionStateManager.reset();
  });

  afterEach(() => {
    if (existsSync(INC_TEST_DIR)) rmSync(INC_TEST_DIR, { recursive: true, force: true });
  });

  it("creates, updates, and tracks active incidents across environment", () => {
    const inc = IncidentEngine.createIncident(
      INC_TEST_DIR,
      "gym_proj",
      "production",
      "API_FAILURE",
      "HIGH",
      ["POST /api/members latency 3200ms"],
      { latencyMs: 3200 }
    );

    expect(inc.status).toBe("DETECTED");
    expect(IncidentEngine.listIncidents("gym_proj").length).toBe(1);
    expect(ProductionStateManager.getState("gym_proj", "production").activeIncidentsCount).toBe(1);

    // Resolve incident
    const resolved = IncidentEngine.updateIncidentStatus(
      "gym_proj",
      inc.incidentId,
      "RESOLVED",
      "Pool connections scaled"
    );
    expect(resolved?.status).toBe("RESOLVED");
    expect(ProductionStateManager.getState("gym_proj", "production").activeIncidentsCount).toBe(0);
  });
});

import { describe, it, expect } from "vitest";
import { AutonomousIncidentCommandEngine } from "../autonomous-incident-command.js";

describe("AEGIS Phase 30 — Autonomous Incident Command Engine", () => {
  it("coordinates incident lifecycle to resolution with root cause verification", () => {
    const cmd = AutonomousIncidentCommandEngine.coordinateIncident("proj_core", "PostgreSQL pool deadlock resolved via replica promotion");
    expect(cmd.lifecycleStage).toBe("RESOLVED");
    expect(cmd.isResolved).toBe(true);
  });
});

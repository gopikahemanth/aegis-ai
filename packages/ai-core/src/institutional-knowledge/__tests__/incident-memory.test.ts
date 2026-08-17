import { describe, it, expect, beforeEach } from "vitest";
import { IncidentMemoryEngine } from "../incident-memory-engine.js";

describe("AEGIS Phase 41 — Incident Memory Engine", () => {
  beforeEach(() => {
    IncidentMemoryEngine.reset();
  });

  it("records and searches historical incident memory without fabricating answers", () => {
    IncidentMemoryEngine.recordIncidentMemory({
      incidentId: "inc_mem_1",
      organizationId: "org_global",
      projectId: "proj_gym",
      symptoms: ["Websocket connection starvation", "504 Gateway Timeout"],
      rootCause: "Database connection pool saturated",
      successfulResolution: "Increased pool size to 50 and set connection idle timeout to 10s",
      failedApproaches: ["Client-side exponential retry backoff without pool resizing"],
      recoveryDurationMinutes: 4.2,
      lessonsLearned: ["Always configure database connection limits proportional to concurrency"],
      evidenceIds: ["ev_db_pool_log", "ev_p99_metrics"],
      recordedAt: new Date().toISOString(),
    });

    const results = IncidentMemoryEngine.querySimilarIncidents("org_global", "starvation");
    expect(results).not.toBe("INSUFFICIENT_EVIDENCE");
    if (results !== "INSUFFICIENT_EVIDENCE") {
      expect(results.length).toBe(1);
      expect(results[0].recoveryDurationMinutes).toBe(4.2);
    }

    const missing = IncidentMemoryEngine.querySimilarIncidents("org_global", "quantum_circuit_freeze");
    expect(missing).toBe("INSUFFICIENT_EVIDENCE");
  });
});

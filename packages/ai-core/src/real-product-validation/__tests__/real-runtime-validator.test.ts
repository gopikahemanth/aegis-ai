import { describe, it, expect, afterEach } from "vitest";
import { RealRuntimeValidator } from "../real-runtime-validator.js";

describe("AEGIS Phase 47 — Real Runtime Validator", () => {
  afterEach(() => {
    RealRuntimeValidator.cleanup();
  });

  it("verifies live frontend/backend reachability, health endpoint, database pool connection, and clean process cleanup", async () => {
    const report = await RealRuntimeValidator.validateRuntime(5173, 3001, true);

    expect(report.isAvailable).toBe(true);
    expect(report.services.length).toBe(3);
    expect(report.databaseConnected).toBe(true);
    expect(report.activeProcessIds.length).toBe(2);

    const cleanedCount = RealRuntimeValidator.cleanup();
    expect(cleanedCount).toBe(2);
  });
});

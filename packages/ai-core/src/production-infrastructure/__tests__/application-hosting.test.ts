import { describe, it, expect } from "vitest";
import { ApplicationHostingEngine } from "../application-hosting-engine.js";

describe("AEGIS Phase 54 — Application Hosting Engine", () => {
  it("starts and verifies healthy frontend and backend processes", () => {
    const res = ApplicationHostingEngine.startAndVerify();
    expect(res.isHealthy).toBe(true);
    expect(res.overallState).toBe("HEALTHY");
    expect(res.frontendService.state).toBe("HEALTHY");
    expect(res.backendService.state).toBe("HEALTHY");
  });

  it("reports DEGRADED when frontend fails", () => {
    const res = ApplicationHostingEngine.startAndVerify({ simulateFailure: "FRONTEND" });
    expect(res.isHealthy).toBe(false);
    expect(res.overallState).toBe("DEGRADED");
    expect(res.frontendService.state).toBe("FAILED");
  });
});

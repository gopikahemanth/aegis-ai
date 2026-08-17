import { describe, it, expect } from "vitest";
import { RealFrontendProvisioner } from "../real-frontend-provisioner.js";

describe("AEGIS Phase 52 — Real Frontend Provisioner", () => {
  it("verifies app loads, routes resolve, API communication, auth state, forms, and navigation", () => {
    const result = RealFrontendProvisioner.verify();
    expect(result.isFullyVerified).toBe(true);
    expect(result.state).toBe("NAVIGATION_VERIFIED");
    expect(result.appLoaded).toBe(true);
    expect(result.apiCommunicationWorking).toBe(true);
    expect(result.authStateWorking).toBe(true);
    expect(result.formsWorking).toBe(true);
    expect(result.navigationWorking).toBe(true);
    expect(result.routesVerified.length).toBeGreaterThan(0);
  });

  it("reports failure when dev server cannot start — rejecting static-HTML-only acceptance", () => {
    const result = RealFrontendProvisioner.verify(undefined, true);
    expect(result.isFullyVerified).toBe(false);
    expect(result.state).toBe("FAILED");
    expect(result.appLoaded).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import { SecuritySurfaceAnalyzer } from "../security-surface-analyzer.js";

describe("AEGIS Phase 58 — Security Surface Analyzer", () => {
  it("discovers attack surface and classifies all endpoints by access level", () => {
    const inventory = SecuritySurfaceAnalyzer.analyzeSurface("GymMaster Pro");
    expect(inventory.totalEndpoints).toBeGreaterThanOrEqual(8);
    expect(inventory.publicEndpointsCount).toBeGreaterThan(0);
    expect(inventory.adminEndpointsCount).toBeGreaterThan(0);
    expect(inventory.sensitiveFieldsDetected).toContain("passwordHash");
  });
});

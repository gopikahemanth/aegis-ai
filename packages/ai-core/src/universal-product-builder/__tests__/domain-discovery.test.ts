import { describe, it, expect } from "vitest";
import { DomainDiscoveryEngine } from "../domain-discovery-engine.js";

describe("AEGIS Phase 48 — Domain Discovery Engine", () => {
  it("discovers standard archetypes and falls back cleanly to CUSTOM without silent restriction", () => {
    const ecom = DomainDiscoveryEngine.discoverDomain("Build an online store with shopping cart and product checkout");
    expect(ecom.domain).toBe("ECOMMERCE");
    expect(ecom.isCustomFallback).toBe(false);

    const lms = DomainDiscoveryEngine.discoverDomain("Build an online LMS with student courses, lessons, and assignments");
    expect(lms.domain).toBe("EDUCATION");

    const crm = DomainDiscoveryEngine.discoverDomain("Build a sales CRM pipeline with leads and deals");
    expect(crm.domain).toBe("CRM");

    const custom = DomainDiscoveryEngine.discoverDomain("Build a drone swarm collision telemetry aggregator");
    expect(custom.domain).toBe("CUSTOM");
    expect(custom.isCustomFallback).toBe(true);
  });
});

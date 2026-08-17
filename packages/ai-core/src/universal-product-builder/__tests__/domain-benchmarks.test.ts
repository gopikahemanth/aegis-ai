import { describe, it, expect } from "vitest";
import { UniversalProductBuilder } from "../universal-product-builder-api.js";

describe("AEGIS Phase 48 — Domain Benchmarks Suite", () => {
  it("builds and verifies E-COMMERCE domain benchmark", async () => {
    const res = await UniversalProductBuilder.buildProduct({
      requirement: "Build an e-commerce platform with merchandise catalog, cart, checkout and Stripe orders.",
    });

    expect(res.specification.domain).toBe("ECOMMERCE");
    expect(res.architecture.dbModels).toContain("Product");
    expect(res.architecture.dbModels).toContain("Order");
    expect(res.acceptance.isAccepted).toBe(true);
  });

  it("builds and verifies LMS / EDUCATION domain benchmark", async () => {
    const res = await UniversalProductBuilder.buildProduct({
      requirement: "Build an online LMS learning platform with courses, lessons, and assignment submissions.",
    });

    expect(res.specification.domain).toBe("EDUCATION");
    expect(res.architecture.dbModels).toContain("Course");
    expect(res.architecture.dbModels).toContain("Assignment");
    expect(res.acceptance.isAccepted).toBe(true);
  });

  it("builds and verifies CRM domain benchmark", async () => {
    const res = await UniversalProductBuilder.buildProduct({
      requirement: "Build an enterprise CRM application with sales lead pipeline, opportunity stages and activity logs.",
    });

    expect(res.specification.domain).toBe("CRM");
    expect(res.architecture.dbModels).toContain("Lead");
    expect(res.architecture.dbModels).toContain("Opportunity");
    expect(res.acceptance.isAccepted).toBe(true);
  });

  it("builds and verifies BOOKING domain benchmark", async () => {
    const res = await UniversalProductBuilder.buildProduct({
      requirement: "Build a service booking platform with scheduled appointments, calendar slots and services.",
    });

    expect(res.specification.domain).toBe("BOOKING");
    expect(res.architecture.dbModels).toContain("Booking");
    expect(res.architecture.dbModels).toContain("Service");
    expect(res.acceptance.isAccepted).toBe(true);
  });

  it("builds and verifies CUSTOM domain benchmark (unusual requirement)", async () => {
    const res = await UniversalProductBuilder.buildProduct({
      requirement: "Build an autonomous drone swarm collision telemetry aggregator with real-time waypoint routing.",
      projectName: "DroneSwarmAggregator",
    });

    expect(res.specification.domain).toBe("CUSTOM");
    expect(res.strategy.strategy).toBe("CUSTOM_GENERATION");
    expect(res.acceptance.isAccepted).toBe(true);
  });
});

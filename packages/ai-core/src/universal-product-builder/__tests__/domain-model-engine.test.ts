import { describe, it, expect } from "vitest";
import { DomainModelEngine } from "../domain-model-engine.js";

describe("AEGIS Phase 48 — Domain Model Engine", () => {
  it("derives normalized domain models for E-commerce, LMS, CRM, Booking, and Custom domains", () => {
    const ecomModels = DomainModelEngine.deriveDomainModels("ECOMMERCE");
    expect(ecomModels.map((m) => m.name)).toContain("Product");
    expect(ecomModels.map((m) => m.name)).toContain("Order");

    const eduModels = DomainModelEngine.deriveDomainModels("EDUCATION");
    expect(eduModels.map((m) => m.name)).toContain("Course");
    expect(eduModels.map((m) => m.name)).toContain("Assignment");

    const crmModels = DomainModelEngine.deriveDomainModels("CRM");
    expect(crmModels.map((m) => m.name)).toContain("Lead");
    expect(crmModels.map((m) => m.name)).toContain("Opportunity");

    const customModels = DomainModelEngine.deriveDomainModels("CUSTOM", ["TelemetryPacket", "DroneNode"]);
    expect(customModels.map((m) => m.name)).toContain("TelemetryPacket");
    expect(customModels.map((m) => m.name)).toContain("DroneNode");
  });
});

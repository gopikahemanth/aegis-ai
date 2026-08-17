import { describe, it, expect } from "vitest";
import { ProductArchitecturePlanner } from "../architecture-planner.js";
import { RequirementInterpreter } from "../requirement-interpreter.js";
import { AutonomousVerificationLoop } from "../autonomous-verification-loop.js";
import { ProductDeliveryEngine } from "../product-delivery-engine.js";

describe("AEGIS Phase 46 — Product Delivery Engine", () => {
  it("packages accepted product delivery artifact with full-stack requirements and Tier 34 certificate", () => {
    const prompt = "Build gym management system with members and trainers";
    const reqs = RequirementInterpreter.interpretPrompt(prompt);
    const plan = ProductArchitecturePlanner.planArchitecture("GymApp", prompt);
    const verification = AutonomousVerificationLoop.executeLoop();

    const delivery = ProductDeliveryEngine.packageDelivery("GymApp", "./output/gym", plan, reqs, verification);

    expect(delivery.status).toBe("ACCEPTED");
    expect(delivery.requirementsSummary.verifiedCount).toBe(reqs.length);
    expect(delivery.buildStatus).toBe("BUILD_PASSED");
    expect(delivery.productCompletionCertificate.tier).toBe(34);
    expect(delivery.productCompletionCertificate.status).toBe("PRODUCT_COMPLETION_CERTIFIED");
  });
});

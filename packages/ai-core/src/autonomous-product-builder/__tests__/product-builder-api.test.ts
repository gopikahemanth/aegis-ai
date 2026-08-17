import { describe, it, expect } from "vitest";
import { ProductBuilder } from "../product-builder-api.js";

describe("AEGIS Phase 46 — Product Builder API", () => {
  it("executes buildProduct high-level API and returns accepted product delivery package", async () => {
    const delivery = await ProductBuilder.build({
      requirement: "Build me a complete gym management website with members, trainers, attendance and payments.",
      projectName: "GymExpressPro",
      projectPath: "./dist/gym-express-pro",
    });

    expect(delivery.status).toBe("ACCEPTED");
    expect(delivery.projectName).toBe("GymExpressPro");
    expect(delivery.requirementsSummary.verifiedCount).toBeGreaterThanOrEqual(6);
    expect(delivery.buildStatus).toBe("BUILD_PASSED");
    expect(delivery.runtimeStatus).toBe("HEALTHY");
    expect(delivery.productCompletionCertificate.tier).toBe(34);
  });
});

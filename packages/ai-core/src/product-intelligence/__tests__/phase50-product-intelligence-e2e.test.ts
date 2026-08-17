import { describe, it, expect, beforeEach } from "vitest";
import { AegisProductBuilder } from "../product-intelligence-api.js";
import { ProductEventStream } from "../product-event-stream.js";
import { ProductCompletionLedger } from "../../product-completion/product-completion-ledger.js";

describe("AEGIS Phase 50 — Master Autonomous Product Intelligence & Final Assembly E2E Test", () => {
  beforeEach(() => {
    ProductCompletionLedger.reset();
    ProductEventStream.clearHistory();
  });

  it("proves complete end-to-end unified workflow: Single Prompt -> Full Stack -> Real Browser -> Workflows -> UI/UX -> Certificate", async () => {
    const eventsCaptured: string[] = [];
    const unsubscribe = ProductEventStream.subscribe((e) => {
      eventsCaptured.push(e.type);
    });

    const result = await AegisProductBuilder.buildProduct({
      requirement: `
        Build a complete modern e-commerce website with customer authentication,
        products, cart, checkout, payments, orders, admin dashboard, responsive UI and analytics.
      `,
      preferredName: "AegisCommercePro",
      requestedStack: {
        frontendFramework: "React-Vite",
        backendFramework: "Express",
        database: "PostgreSQL",
        orm: "Prisma",
      },
      outputDirectory: "./dist/aegis-commerce-pro",
    });

    // 1. Single Machine-Readable Product Plan
    expect(result.plan.productName).toBe("AegisCommercePro");
    expect(result.plan.domain).toBe("ECOMMERCE");
    expect(result.plan.dataModel.some((m) => m.name === "Product")).toBe(true);
    expect(result.plan.dataModel.some((m) => m.name === "Order")).toBe(true);

    // 2. Generation & Files
    expect(result.generatedProject.totalFiles).toBeGreaterThanOrEqual(4);
    expect(result.generatedProject.files["package.json"]).toBeDefined();

    // 3. Workflows & Verification
    expect(result.workflowReports.length).toBeGreaterThanOrEqual(1);
    expect(result.workflowReports.every((w) => w.passed)).toBe(true);

    // 4. Quality & Acceptance
    expect(result.qualityReport.isAccepted).toBe(true);
    expect(result.qualityReport.overallScore).toBeGreaterThanOrEqual(90);
    expect(result.qualityReport.criticalDefectCount).toBe(0);

    expect(result.acceptance.isAccepted).toBe(true);
    expect(result.acceptance.checklist.requirements).toBe(true);
    expect(result.acceptance.checklist.build).toBe(true);
    expect(result.acceptance.checklist.runtime).toBe(true);
    expect(result.acceptance.checklist.uiUx).toBe(true);

    // 5. Delivery & Tier 37 Apex Certificate
    expect(result.deliveryManifest.status).toBe("DELIVERED");
    expect(result.certificate.gate).toBe("FinalProductGate");
    expect(result.certificate.tier).toBe(37);
    expect(result.certificate.status).toBe("CERTIFIED");

    // 6. Event Stream Sequence
    expect(eventsCaptured).toContain("PRODUCT_RECEIVED");
    expect(eventsCaptured).toContain("REQUIREMENTS_ANALYZED");
    expect(eventsCaptured).toContain("ARCHITECTURE_PLANNED");
    expect(eventsCaptured).toContain("GENERATION_STARTED");
    expect(eventsCaptured).toContain("BUILD_STARTED");
    expect(eventsCaptured).toContain("RUNTIME_STARTED");
    expect(eventsCaptured).toContain("WORKFLOW_VERIFIED");
    expect(eventsCaptured).toContain("UI_VERIFIED");
    expect(eventsCaptured).toContain("PRODUCT_ACCEPTED");
    expect(eventsCaptured).toContain("PRODUCT_DELIVERED");

    // 7. Cryptographic Ledger Integrity
    expect(ProductCompletionLedger.verifyIntegrity()).toBe(true);

    unsubscribe();
  });
});

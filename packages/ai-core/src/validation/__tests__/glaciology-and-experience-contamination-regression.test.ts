import { describe, it, expect } from "vitest";
import { ProductUnderstanding } from "../../design/product-understanding.js";
import { PageExperiencePlanner } from "../../design/page-experience-plan.js";
import { FastDeterministicSanitizer } from "../../governance/fast-sanitizer.js";
import { TemplateConvergenceGate } from "../template-convergence-gate.js";
import { PageExperienceQualityGate } from "../page-experience-quality-gate.js";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("Root-Cause Regression: Glaciology Experience & Template Contamination Suite", () => {
  const alpinePrompt = "Alpine Glaciology & Climate Research Expedition Portal with ice core datasets, expedition logs, glacier retreat telemetry, and field researcher roster";

  it("1. 'glacier retreat' prompt does NOT classify as hospitality-portal", () => {
    const chars = ProductUnderstanding.analyze(alpinePrompt);
    expect(chars.experiencePattern).not.toBe("hospitality-portal");
    expect(["operations-dashboard", "realtime-console", "craft-editorial"]).toContain(chars.experiencePattern);
  });

  it("2. Alpine glacier telemetry never receives carbon-accounting or UNFCCC templates without explicit requirements", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "aegis-glacier-telemetry-"));
    try {
      mkdirSync(join(tempDir, "src", "pages"), { recursive: true });
      FastDeterministicSanitizer.synthesizeRoutePage(
        join(tempDir, "src"),
        "/glacier-telemetry",
        "GlacierTelemetryPage",
        alpinePrompt,
        42,
        {
          pageRole: "Glacier Telemetry Analysis Stage",
          purpose: "Real-time glacier retreat, ice mass balance, and bore-hole telemetry",
        } as any
      );

      const code = readFileSync(join(tempDir, "src", "pages", "GlacierTelemetryPage.tsx"), "utf8");

      expect(code).not.toContain("Carbon Budget Remaining");
      expect(code).not.toContain("Direct Air Capture Capacity");
      expect(code).not.toContain("UNFCCC carbon audit log");
      expect(code).not.toContain("Methane Abatement Rate");

      // Must contain glaciological telemetry role
      expect(code).toMatch(/glacier|telemetry/i);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("3. Ice-core specimen custody never receives character-stage or deep-sea creature templates", () => {
    const plan = PageExperiencePlanner.deriveRoutePlan(
      "/specimen-custody",
      "specimen-custody",
      "DYNAMIC_BESPOKE",
      alpinePrompt.toLowerCase(),
      { brandIdentity: { name: "CryoSphere" } } as any
    );

    // Page role must be scientific custody / archive, NOT character spotlight
    expect(plan.pageRole).not.toContain("Character Spotlight");
    expect(plan.pageRole).not.toContain("Lore Stage");
    expect(plan.pageRole).toContain("Custody");
    expect(plan.composition.topology).not.toBe("CHARACTER_STAGE");

    const tempDir = mkdtempSync(join(tmpdir(), "aegis-specimen-custody-"));
    try {
      mkdirSync(join(tempDir, "src", "pages"), { recursive: true });
      FastDeterministicSanitizer.synthesizeRoutePage(
        join(tempDir, "src"),
        "/specimen-custody",
        "SpecimenCustodyPage",
        alpinePrompt,
        42,
        {
          pageRole: plan.pageRole,
          purpose: plan.purpose,
        } as any
      );

      const code = readFileSync(join(tempDir, "src", "pages", "SpecimenCustodyPage.tsx"), "utf8");
      expect(code).not.toContain("Nautilus Prime");
      expect(code).not.toContain("Viperfish Abyssus");
      expect(code).not.toContain("Giant Bathynomus");
      expect(code).not.toContain("Vampyroteuthis");
      expect(code).not.toContain("benthic pressure");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("4. A pet profile or boutique product does not receive a scientific specimen experience", () => {
    const petPrompt = "Artisan Botanical Pet Wellness Boutique & Organic Grooming Spa with pet health profiles, spa appointments, and herbal remedies";
    const plan = PageExperiencePlanner.deriveRoutePlan(
      "/pet-profiles",
      "pet-profiles",
      "DYNAMIC_BESPOKE",
      petPrompt.toLowerCase(),
      { brandIdentity: { name: "BotanicalPaws" } } as any
    );

    expect(plan.pageRole).not.toContain("Ice Core");
    expect(plan.pageRole).not.toContain("Cryosphere");
    expect(plan.pageRole).not.toContain("Glaciology");
  });

  it("5. A product detail or catalog page does not receive a character spotlight unless explicitly requested", () => {
    const ecomPrompt = "Minimalist Architectural Hardware & Solid Brass Fixtures Storefront with lockset catalog, specification sheets, and finish finishes";
    const plan = PageExperiencePlanner.deriveRoutePlan(
      "/fixtures/deadbolts",
      "deadbolts",
      "DYNAMIC_BESPOKE",
      ecomPrompt.toLowerCase(),
      { brandIdentity: { name: "SolidBrass" } } as any
    );

    expect(plan.pageRole).not.toContain("Character Spotlight");
    expect(plan.composition.topology).not.toBe("CHARACTER_STAGE");
  });

  it("6. Template Convergence rejects a hospitality layout for an unrelated scientific glaciology portal", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "aegis-convergence-mismatch-test-"));
    try {
      mkdirSync(join(tempDir, ".aegis"), { recursive: true });
      writeFileSync(
        join(tempDir, ".aegis", "domain-contract.json"),
        JSON.stringify({ domainName: "Glaciology Expedition Portal", category: "scientific-research" }),
        "utf8"
      );

      const fakeHospitalitySource = `
        export function App() {
          return (
            <div>
              <nav><div className="font-bold">GlacierPortal</div></nav>
              <div className="booking-bar check-in date-picker villa sanctuary">
                <h1>Sanctuary Villa Accommodations</h1>
              </div>
            </div>
          );
        }
      `;

      mkdirSync(join(tempDir, "src"), { recursive: true });
      writeFileSync(join(tempDir, "src", "App.tsx"), fakeHospitalitySource, "utf8");

      const report = TemplateConvergenceGate.audit(tempDir);
      expect(report.passed).toBe(false);
      expect(report.violations.some((v) => v.includes("DOMAIN_CONTRACT_MISMATCH"))).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("7. Glaciology operational routes pass PageExperienceQualityGate without false CRUD violations", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "aegis-glaciology-crud-test-"));
    try {
      mkdirSync(join(tempDir, "src", "pages"), { recursive: true });

      const telemetryPageSource = `
        import React from "react";
        export function GlacierTelemetryPage() {
          const [boreholeDepth, setBoreholeDepth] = React.useState(450);
          return (
            <div>
              <h1>CryoSphere Glaciology Console</h1>
              <p>Borehole Depth: {boreholeDepth}m</p>
              <button onClick={() => setBoreholeDepth(d => d + 10)}>Deepen Borehole</button>
            </div>
          );
        }
      `;
      writeFileSync(join(tempDir, "src", "pages", "GlacierTelemetryPage.tsx"), telemetryPageSource, "utf8");
      writeFileSync(join(tempDir, "src", "App.tsx"), `export function App() { return <div />; }`, "utf8");

      const mockPlan: any = {
        primaryActivity: "operations-telemetry",
        pagePlans: [
          {
            route: "/glacier-telemetry",
            pageRole: "Glacier Telemetry Console",
            requiredCapabilities: ["telemetry-streaming"],
          },
        ],
      };

      const audit = PageExperienceQualityGate.audit(tempDir, mockPlan);
      expect(audit.status).toBe("PASS");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

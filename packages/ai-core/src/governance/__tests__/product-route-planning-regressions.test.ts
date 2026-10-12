import { describe, it, expect } from "vitest";
import { ArchitectureResolver } from "../architecture-resolver.js";
import { PromptConstraints } from "../prompt-constraints.js";

describe("Product Route Planning & Governance Directive Separation", () => {
  const GREENPULSE_PROMPT = `
Build GREENPULSE ENERGY, a production-quality full-stack renewable energy operations platform.
Create a distinctive interface for managing solar farms, wind turbines, energy production, maintenance teams, and operational alerts.
Required routes and capabilities:
1. Operations overview with energy-production trends and operational status.
2. Solar farm and wind turbine asset management.
3. Energy analytics with working date and site filters.
4. Maintenance scheduling with assign, update, and complete actions.
5. Incident reporting with status updates and resolution.
6. Historical production reports and export functionality.
Requirements:
- Use a professional renewable-energy visual identity with distinctive page compositions.
- Generate the frontend first and complete the required human approval checkpoints before database and backend development.
- Implement real backend APIs and PostgreSQL persistence according to the architecture contract.
- Ensure forms, filters, navigation, and state changes work.
- Run TypeScript and production builds.
- Test every canonical route in real Chromium and verify meaningful observable state changes.
- Verify API workflows and read stateful database mutations back from the actual database.
- Preserve the immutable interaction provenance baseline and enforce STRICT_UNASSISTED certification.
- Never fabricate reports or manually repair generated files to claim a successful run.
- If a stage fails, use bounded automatic repair, rebuild after each repair, and roll back regressions.
- If recovery fails, preserve the diagnostics and report the failure honestly.
At completion, report the actual output directory, generation ID, production build result, browser coverage, API results, database verification, native and injected handler counts, and final certification status. Clearly distinguish PASS, FAIL, and NOT VERIFIED.
`.trim();

  it("TEST 1: Strips governance directives and certification constraints from user prompt", () => {
    const stripped = PromptConstraints.stripGovernanceAndEngineeringDirectives(GREENPULSE_PROMPT);
    expect(stripped.toLowerCase()).not.toContain("strict_unassisted");
    expect(stripped.toLowerCase()).not.toContain("immutable interaction provenance baseline");
    expect(stripped.toLowerCase()).not.toContain("bounded automatic repair");
    expect(stripped.toLowerCase()).not.toContain("real chromium");

    expect(PromptConstraints.isGovernanceDirective("enforce strict")).toBe(true);
    expect(PromptConstraints.isGovernanceDirective("immutable interaction")).toBe(true);
    expect(PromptConstraints.isGovernanceDirective("STRICT_UNASSISTED")).toBe(true);
    expect(PromptConstraints.isGovernanceDirective("Incident reporting")).toBe(false);
    expect(PromptConstraints.isGovernanceDirective("solar farms")).toBe(false);
  });

  it("TEST 2: Separates product requirements from internal governance instructions in ArchitectureContract", () => {
    const contract = ArchitectureResolver.resolve(GREENPULSE_PROMPT);

    // ZERO governance terms in canonical routes
    expect(contract.requiredRoutes).not.toContain("/enforce-strict");
    expect(contract.requiredRoutes).not.toContain("/enforcestrict");
    expect(contract.requiredRoutes).not.toContain("/immutable-interaction");
    expect(contract.requiredRoutes).not.toContain("/immutableinteraction");
    expect(contract.requiredRoutes.some(r => r.includes("strict") || r.includes("governance") || r.includes("provenance"))).toBe(false);

    // ZERO governance terms in data models
    expect(contract.requiredModels).not.toContain("EnforceStrict");
    expect(contract.requiredModels).not.toContain("ImmutableInteraction");
    expect(contract.requiredModels.some(m => m.toLowerCase().includes("strict") || m.toLowerCase().includes("provenance"))).toBe(false);

    // Primary landing feature is a real product domain feature, NOT governance
    expect(contract.primaryLandingFeature).not.toBe("ImmutableInteraction");
    expect(contract.primaryLandingFeature).not.toBe("EnforceStrict");
  });

  it("TEST 3: Generates canonical routes representing all requested capabilities", () => {
    const contract = ArchitectureResolver.resolve(GREENPULSE_PROMPT);

    // All core capabilities must be represented in canonical routes
    expect(contract.requiredRoutes).toContain("/");
    expect(contract.requiredRoutes).toContain("/operations");
    expect(contract.requiredRoutes).toContain("/assets");
    expect(contract.requiredRoutes).toContain("/analytics");
    expect(contract.requiredRoutes).toContain("/maintenance");
    expect(contract.requiredRoutes).toContain("/incidents");
    expect(contract.requiredRoutes).toContain("/reports");

    // All core models must be represented
    expect(contract.requiredModels).toContain("User");
    expect(contract.requiredModels).toContain("Asset");
    expect(contract.requiredModels).toContain("Incident");
  });
});

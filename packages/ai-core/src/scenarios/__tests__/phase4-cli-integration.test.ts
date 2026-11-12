import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ReferenceResearchEngine } from "../../research/reference-research-engine.js";
import { FeatureMatrixManager } from "../../contracts/feature-matrix.js";
import { DesignBriefGenerator } from "../../design/design-brief-generator.js";
import { ThemeGenerator } from "../../design/theme-generator.js";

describe("Phase 4: Production CLI & Pipeline Integration Across Domains", () => {
  let workDir: string;

  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), "aegis-phase4-cli-"));
    ReferenceResearchEngine.clearCache();
  });

  afterEach(() => {
    try {
      rmSync(workDir, { recursive: true, force: true });
    } catch {}
  });

  it("Domain 1: Restaurant ordering & reservations generation integration", async () => {
    const projectDir = join(workDir, "trattoria-bella");
    const prompt =
      "Create a rustic Italian trattoria web application called Trattoria Bella with artisanal wood-fired pizza menu, allergen filters, and online table reservations.";
    const explicitRequirements = [
      {
        title: "Artisanal Wood-Fired Pizza Menu",
        description: "Showcase classic Neapolitan pizzas with crust and ingredient customization.",
      },
      {
        title: "Dietary & Allergen Filtering",
        description: "Filter menu items by gluten-free, dairy-free, vegetarian, and nut allergies.",
      },
      {
        title: "Online Table Reservations",
        description: "Allow patrons to choose party size, dining date, and reserve indoor/patio tables.",
      },
    ];

    // 1. Execute Reference Research Engine
    const { research, featureMatrix } = await ReferenceResearchEngine.executeResearch({
      prompt,
      domain: "restaurant-dining",
      projectName: "TrattoriaBella",
      projectRoot: projectDir,
      explicitRequirements,
      engineOptions: {
        totalBudgetMs: 15000,
        timeoutPerUrlMs: 4000,
      },
    });

    // Verify research artifact
    const researchFile = join(projectDir, ".aegis", "reference-research.json");
    expect(existsSync(researchFile)).toBe(true);
    expect(research.sources.length).toBeGreaterThanOrEqual(2);
    expect(research.sources.every((s) => s.url.startsWith("http"))).toBe(true);
    expect(["SUCCESS", "PARTIAL"]).toContain(research.overallStatus);
    expect(research.copyrightSafeguards.noProprietaryCodeCopied).toBe(true);

    // Verify Feature Matrix
    expect(featureMatrix).toBeDefined();
    const matrixFile = join(projectDir, ".aegis", "feature-matrix.json");
    expect(existsSync(matrixFile)).toBe(true);
    const validation = FeatureMatrixManager.validate(featureMatrix!);
    expect(validation.valid).toBe(true);

    // Verify all 3 explicit user requirements remain intact as must-have
    for (const req of explicitRequirements) {
      const match = featureMatrix!.features.find((f) => f.title === req.title);
      expect(match).toBeDefined();
      expect(match?.priority).toBe("must-have");
      expect(match?.source).toBe("user-request");
      expect(match?.acceptanceTests.length).toBeGreaterThanOrEqual(1);
    }

    // Verify research-discovered features were added
    const discovered = featureMatrix!.features.filter((f) => f.source === "reference-research");
    expect(discovered.length).toBeGreaterThanOrEqual(1);

    // 2. Connect to Phase 3 Design & Theme Generation
    const theme = ThemeGenerator.generateTheme({
      domain: "restaurant-dining",
      prompt,
      seed: 5001,
      mode: "obsidian",
    });
    ThemeGenerator.save(projectDir, theme);
    expect(theme.contrastAudit.overallValid).toBe(true);

    const brief = DesignBriefGenerator.generateBrief({
      prompt,
      domain: "restaurant-dining",
      theme,
      seed: 5001,
      routes: ["/", "/menu", "/reservations", "/order"],
    });
    DesignBriefGenerator.save(projectDir, brief);
    const briefValidation = DesignBriefGenerator.validateBrief(brief);
    expect(briefValidation.valid).toBe(true);
  });

  it("Domain 2: Education & course management generation integration", async () => {
    const projectDir = join(workDir, "byteforge-academy");
    const prompt =
      "Create an interactive computer science academy called ByteForge Academy with curriculum syllabus tracking, in-browser code challenges, and instructor office hour booking.";
    const explicitRequirements = [
      {
        title: "Curriculum Syllabus Tracking",
        description: "Interactive roadmap displaying lecture modules and completion checkpoints.",
      },
      {
        title: "In-Browser Code Challenges",
        description: "Hands-on programming challenges with test runner and hint ladder.",
      },
      {
        title: "Instructor Office Hour Booking",
        description: "Schedule 1-on-1 mentoring sessions with teaching assistants.",
      },
    ];

    const { research, featureMatrix } = await ReferenceResearchEngine.executeResearch({
      prompt,
      domain: "education-learning",
      projectName: "ByteForgeAcademy",
      projectRoot: projectDir,
      explicitRequirements,
      engineOptions: {
        totalBudgetMs: 15000,
        timeoutPerUrlMs: 4000,
      },
    });

    expect(existsSync(join(projectDir, ".aegis", "reference-research.json"))).toBe(true);
    expect(existsSync(join(projectDir, ".aegis", "feature-matrix.json"))).toBe(true);
    expect(research.sources.every((s) => s.url.startsWith("http"))).toBe(true);

    for (const req of explicitRequirements) {
      const match = featureMatrix!.features.find((f) => f.title === req.title);
      expect(match).toBeDefined();
      expect(match?.priority).toBe("must-have");
    }

    const theme = ThemeGenerator.generateTheme({
      domain: "education-learning",
      prompt,
      seed: 5002,
      mode: "light",
    });
    expect(theme.contrastAudit.overallValid).toBe(true);
  });

  it("Domain 3: Real estate property discovery generation integration", async () => {
    const projectDir = join(workDir, "skyline-haven");
    const prompt =
      "Create a luxury residential real estate portal called Skyline Haven with neighborhood boundary filters, verified floor plans, and private agent tour scheduling.";
    const explicitRequirements = [
      {
        title: "Neighborhood Boundary Search",
        description: "Interactive polygon map search by school district and transit line.",
      },
      {
        title: "Verified Architectural Floorplans",
        description: "Detailed 2D and 3D floor layout dimensions with room area calculations.",
      },
      {
        title: "Private Agent Tour Scheduling",
        description: "Book guided in-person or video walkthrough appointments.",
      },
    ];

    const { research, featureMatrix } = await ReferenceResearchEngine.executeResearch({
      prompt,
      domain: "real-estate-discovery",
      projectName: "SkylineHaven",
      projectRoot: projectDir,
      explicitRequirements,
      engineOptions: {
        totalBudgetMs: 15000,
        timeoutPerUrlMs: 4000,
      },
    });

    expect(existsSync(join(projectDir, ".aegis", "reference-research.json"))).toBe(true);
    expect(research.sources.every((s) => s.url.startsWith("http"))).toBe(true);
    expect(featureMatrix!.features.length).toBeGreaterThanOrEqual(4);
  });

  it("Domain 4: Unfamiliar / Novel domain generation integration", async () => {
    const projectDir = join(workDir, "pulsargrid-console");
    const prompt =
      "Create an autonomous deep-space radiotelescope interferometer data-logging console called PulsarGrid with pulsar dispersion measurement and antenna calibration logs.";
    const explicitRequirements = [
      {
        title: "Pulsar Dispersion Measurement Engine",
        description: "Calculate microsecond pulse arrival times and interstellar medium dispersion measure.",
      },
      {
        title: "Antenna Array Phase Calibration",
        description: "Phase delay matrix tracking atmospheric scintillation across parabolic dishes.",
      },
    ];

    const { research, featureMatrix } = await ReferenceResearchEngine.executeResearch({
      prompt,
      domain: "astrophysics-instrumentation",
      projectName: "PulsarGrid",
      projectRoot: projectDir,
      explicitRequirements,
      engineOptions: {
        totalBudgetMs: 15000,
        timeoutPerUrlMs: 4000,
      },
    });

    expect(existsSync(join(projectDir, ".aegis", "reference-research.json"))).toBe(true);
    expect(research.sources.length).toBeGreaterThanOrEqual(2);
    expect(research.sources[0].url.startsWith("http")).toBe(true);

    // All explicit astrophysics features must be preserved
    for (const req of explicitRequirements) {
      const match = featureMatrix!.features.find((f) => f.title === req.title);
      expect(match).toBeDefined();
      expect(match?.priority).toBe("must-have");
    }

    const theme = ThemeGenerator.generateTheme({
      domain: "astrophysics-instrumentation",
      prompt,
      seed: 5004,
      mode: "obsidian",
    });
    expect(theme.contrastAudit.overallValid).toBe(true);
  });
});

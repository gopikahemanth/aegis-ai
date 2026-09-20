import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ProductDesignBrief } from "./design-director.js";

export interface RequiredCapability {
  id: string;
  name: string;
  evidenceVocabulary: string[];
  controlsRequired: string[];
  testInteraction?: {
    controlType: "button" | "input" | "select" | "slider";
    action: "click" | "input" | "change";
  };
}

export interface ProductExperiencePlan {
  planId: string;
  experiencePattern: string;
  expectedHomeRoute: string;
  primaryActivity: string;
  requiredCapabilities: RequiredCapability[];
  forbiddenVocabulary: string[];
  forbiddenArtifacts: string[];
  expectedRoutes: string[];
  authWallAllowed: boolean;
}

export class ProductExperiencePlanManager {
  /**
   * Derives an authoritative, locked ProductExperiencePlan from the design brief, specification, and prompt.
   */
  public static build(
    brief: ProductDesignBrief,
    specification: any,
    prompt: string,
    domainContract?: any
  ): ProductExperiencePlan {
    const rawPrompt = prompt || specification?.userPrompt || "";
    const lowerPrompt = rawPrompt.toLowerCase();

    // Check if user explicitly asked for an authentication portal
    const authWallAllowed = Boolean(
      lowerPrompt.includes("authentication system") ||
      lowerPrompt.includes("login portal") ||
      lowerPrompt.includes("auth service") ||
      lowerPrompt.includes("sso platform")
    );

    const experiencePattern = brief.productCharacteristics.experiencePattern;
    const expectedHomeRoute = "/";

    // Extract required capabilities from prompt, brief, and specification
    const requiredCapabilities: RequiredCapability[] = [];

    // Helper to add capability if matching keywords present
    const addIfMatching = (
      id: string,
      name: string,
      triggers: string[],
      vocab: string[],
      controls: string[],
      interaction?: RequiredCapability["testInteraction"]
    ) => {
      if (triggers.some(t => lowerPrompt.includes(t.toLowerCase()))) {
        requiredCapabilities.push({
          id,
          name,
          evidenceVocabulary: vocab,
          controlsRequired: controls,
          testInteraction: interaction || { controlType: "button", action: "click" },
        });
      }
    };

    // 1. Domain specific capability detection
    addIfMatching(
      "fixture-configurator",
      "Custom Fixture Configurator",
      ["fixture", "configurator", "luminaire", "lighting fixture"],
      ["fixture", "configur", "lighting", "optic", "finish", "dimension", "mounting"],
      ["button", "select", "input"],
      { controlType: "select", action: "change" }
    );

    addIfMatching(
      "photometric-calculator",
      "Photometric Lux Distribution Calculator",
      ["photometric", "lux", "distribution calculator", "lighting calculation"],
      ["lux", "photometric", "distribution", "lumens", "wattage", "footcandle", "calculate", "intensity"],
      ["input", "button"],
      { controlType: "input", action: "input" }
    );

    addIfMatching(
      "quote-estimator",
      "Project Quote Estimator",
      ["quote", "estimator", "pricing", "cost estimation", "budget"],
      ["quote", "estimat", "cost", "price", "budget", "breakdown", "total"],
      ["input", "button"],
      { controlType: "button", action: "click" }
    );

    addIfMatching(
      "glaze-calculator",
      "Glaze Chemistry Calculator",
      ["glaze", "chemistry", "formulation"],
      ["glaze", "chemistry", "formula", "oxide", "flux", "stoechiometric", "silica", "alumina"],
      ["input", "button"],
      { controlType: "input", action: "input" }
    );

    addIfMatching(
      "kiln-monitor",
      "Kiln Firing Schedule Monitor",
      ["kiln", "firing", "temperature schedule", "pyrometer"],
      ["kiln", "firing", "temperature", "schedule", "ramp", "soak", "cone"],
      ["button", "select"],
      { controlType: "button", action: "click" }
    );

    // Fallback: If no specialized capabilities matched from custom patterns, derive from brief/specification features
    if (requiredCapabilities.length === 0) {
      const featureList = brief.featurePriority?.features || [];
      for (const feat of featureList.slice(0, 4)) {
        const id = feat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        requiredCapabilities.push({
          id,
          name: feat.name,
          evidenceVocabulary: [
            feat.name.toLowerCase(),
            ...(feat.userIntent ? feat.userIntent.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4).slice(0, 3) : [])
          ],
          controlsRequired: ["button", "input"],
          testInteraction: { controlType: "button", action: "click" },
        });
      }
    }

    // Forbidden vocabulary: combine brief forbidden words and domain-isolation negatives
    const forbiddenVocabulary = [
      ...(brief.vocabularyContract?.forbidden || []),
    ];

    // Check for foreign domain artifacts
    const forbiddenArtifacts = [
      "resumeUpload", "KeywordCloud", "MatchDashboard", "scan.service", "keyword.service",
      ...(domainContract?.forbiddenArtifacts || []),
    ];

    const expectedRoutes = brief.featurePriority?.informationArchitecture?.pages?.map(p => p.route) || ["/"];

    return {
      planId: `plan_${Date.now()}`,
      experiencePattern,
      expectedHomeRoute,
      primaryActivity: brief.productCharacteristics.primaryActivity,
      requiredCapabilities,
      forbiddenVocabulary: Array.from(new Set(forbiddenVocabulary)),
      forbiddenArtifacts: Array.from(new Set(forbiddenArtifacts)),
      expectedRoutes,
      authWallAllowed,
    };
  }

  public static save(plan: ProductExperiencePlan, outputDirectory: string): void {
    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });
    writeFileSync(join(aegisDir, "product-experience-plan.json"), JSON.stringify(plan, null, 2), "utf8");
  }

  public static load(outputDirectory: string): ProductExperiencePlan | null {
    const planPath = join(outputDirectory, ".aegis", "product-experience-plan.json");
    if (!existsSync(planPath)) return null;
    try {
      return JSON.parse(readFileSync(planPath, "utf8"));
    } catch {
      return null;
    }
  }
}

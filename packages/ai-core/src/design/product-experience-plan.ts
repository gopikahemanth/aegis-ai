import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ProductDesignBrief } from "./design-director.js";
import {
  type ExperienceCapabilityPlan,
  ExperienceCapabilityResolver,
} from "./experience-capability-plan.js";
import { ExperienceArchitect } from "./experience-architect.js";
import type { CompositionGraph } from "./composition-graph.js";
import { type NavigationDesign, NavigationDesignResolver } from "./navigation-design.js";
import {
  type WebsiteExperienceIdentity,
  WebsiteExperienceIdentityResolver,
} from "./website-experience-identity.js";
import {
  type PageExperiencePlan,
  PageExperiencePlanner,
} from "./page-experience-plan.js";

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
  generationSeed?: number;
  compositionStrategy?: string;
  experiencePattern: string;
  experienceCapability: ExperienceCapabilityPlan;
  compositionGraph: CompositionGraph;
  navigationDesign?: NavigationDesign;
  experienceIdentity?: WebsiteExperienceIdentity;
  pagePlans?: PageExperiencePlan[];
  expectedHomeRoute: string;
  primaryLandingFeature?: string;
  primaryActivity: string;
  requiredCapabilities: RequiredCapability[];
  forbiddenVocabulary: string[];
  forbiddenArtifacts: string[];
  expectedRoutes: string[];
  authWallAllowed: boolean;
  rawPrompt?: string;
  designResearchSynthesis?: any;
}

export class ProductExperiencePlanManager {
  /**
   * Derives an authoritative, locked ProductExperiencePlan from the design brief, specification, and prompt.
   */
  public static build(
    brief: ProductDesignBrief,
    specification: any,
    prompt: string,
    domainContract?: any,
    referenceResearch?: any,
    designResearchSynthesis?: any
  ): ProductExperiencePlan {
    const rawPrompt = prompt || specification?.userPrompt || "";
    const lowerPrompt = rawPrompt.toLowerCase();

    // Deterministically resolve high-level experience capability & rendering requirements
    const experienceCapability = ExperienceCapabilityResolver.resolve(
      rawPrompt,
      brief.productCharacteristics,
      specification
    );

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

    // If Real 3D is required, inject the mandatory 3D interactive world capability first
    if (experienceCapability.real3dRequired) {
      requiredCapabilities.push({
        id: "interactive-3d-world",
        name: "Interactive 3D Universe World Stage",
        evidenceVocabulary: [
          "world", "explore", "scene", "camera", "journey", "quest",
          "sound", "characters", "3d", "atmosphere", "stage", "biomes"
        ],
        controlsRequired: ["canvas", "button"],
        testInteraction: { controlType: "button", action: "click" },
      });
    }

    // 2. Derive required capabilities dynamically from the project's discovered features and brief
    const featureList = (brief.featurePriority?.features || specification?.features || []).filter(
      (feat: any) => !["auth", "authentication", "login", "signup", "register", "session", "user", "profile"].includes(feat.name.toLowerCase())
    );
    const META_STOPWORDS = new Set([
      "user", "users", "wants", "want", "need", "needs", "manage", "interact",
      "with", "from", "that", "this", "able", "allow", "allows", "system",
      "page", "view", "data", "item", "items", "help", "helps"
    ]);
    for (const feat of featureList.slice(0, 6)) {
      const id = feat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const baseName = feat.name.toLowerCase();
      // Extract domain vocabulary purely from the feature's name and terms — NEVER from boilerplate sentence templates
      const nameTokens = baseName
        .split(/[\s-_/]+/)
        .map((w: string) => w.replace(/[^a-z0-9]/g, ""))
        .filter((w: string) => w.length > 2 && !META_STOPWORDS.has(w));

      // Handle compound words like "floorplan", "audioguide", etc.
      const compoundSplits: Record<string, string[]> = {
        floorplan: ["floor", "plan", "floor plan"],
        audioguide: ["audio", "guide", "audio guide"],
        soundscape: ["sound", "scape", "soundscape"],
        artwork: ["art", "work", "artwork"],
        artworks: ["art", "works", "artworks"],
      };
      const extraTokens = compoundSplits[baseName] || [];

      // Add singular/plural variants for all tokens
      const variants: string[] = [];
      for (const token of [baseName, ...nameTokens, ...extraTokens]) {
        variants.push(token);
        if (token.endsWith("ies")) variants.push(token.slice(0, -3) + "y");
        else if (token.endsWith("es")) variants.push(token.slice(0, -2));
        else if (token.endsWith("s")) variants.push(token.slice(0, -1));
        else variants.push(token + "s");
      }

      // Include associated entities from domainContract
      for (const ent of ((feat as any).entities || [])) {
        const eLower = String(ent).toLowerCase();
        if (eLower.length > 2 && !META_STOPWORDS.has(eLower)) {
          variants.push(eLower);
          if (eLower.endsWith("s")) variants.push(eLower.slice(0, -1));
          else variants.push(eLower + "s");
        }
      }

      const vocab = Array.from(new Set(variants));
      requiredCapabilities.push({
        id,
        name: feat.name,
        evidenceVocabulary: vocab,
        controlsRequired: ["button", "input"],
        testInteraction: { controlType: "button", action: "click" },
      });
    }

    // Dynamic incorporation of live reference research features into required capabilities
    if (referenceResearch?.relevantFeatures && Array.isArray(referenceResearch.relevantFeatures)) {
      for (const feat of referenceResearch.relevantFeatures) {
        const featSlug = feat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        if (!requiredCapabilities.some(c => c.id === featSlug)) {
          const vocab = feat.name.toLowerCase().split(/\s+/).concat(
            feat.description ? feat.description.toLowerCase().split(/\s+/).slice(0, 6) : []
          ).filter((w: string) => w.length > 3);

          requiredCapabilities.push({
            id: featSlug,
            name: feat.name,
            evidenceVocabulary: Array.from(new Set(vocab)),
            controlsRequired: feat.suggestedComponents && feat.suggestedComponents.some((c: string) => /input|form|picker|selector/i.test(c))
              ? ["input", "button"]
              : ["button"],
            testInteraction: { controlType: "button", action: "click" },
          });
        }
      }
    }

    // Forbidden vocabulary: combine brief forbidden words and domain-isolation negatives
    const forbiddenVocabulary = [
      ...(brief.vocabularyContract?.forbidden || []),
    ];

    // Check for foreign domain artifacts & forbidden substitutions
    const forbiddenArtifacts = [
      "resumeUpload", "KeywordCloud", "MatchDashboard", "scan.service", "keyword.service",
      ...(domainContract?.forbiddenArtifacts || []),
      ...(experienceCapability.forbiddenSubstitutions || []),
    ];

    const contractRoutes = domainContract?.requiredRoutes || [];
    const rawRouteList = contractRoutes.length > 0
      ? contractRoutes
      : (brief.featurePriority?.informationArchitecture?.pages?.map(p => p.route) || []);
    const normalizedRoutes = rawRouteList
      .map((r: string) => r.startsWith("/") ? r : "/" + r)
      .filter((r: string) => r !== "/index" && r !== "/home");
    const expectedRoutes = Array.from(new Set(["/", ...normalizedRoutes]));

    const primaryLandingFeature =
      experienceCapability.real3dRequired
        ? "Interactive 3D Universe World Stage"
        : (domainContract?.primaryLandingFeature ||
           brief.featurePriority?.primaryLandingFeature ||
           brief.featurePriority?.core?.[0]?.name ||
           brief.featurePriority?.informationArchitecture?.pages?.[0]?.name ||
           requiredCapabilities[0]?.name ||
           "Home");

    const compositionGraph = ExperienceArchitect.architect(
      rawPrompt,
      brief.productCharacteristics,
      experienceCapability,
      domainContract,
      brief.seed
    );

    const plannedPages = expectedRoutes.map(route => {
      const match = (brief.featurePriority?.informationArchitecture?.pages || []).find(p => p.route === route);
      let title = match?.name;
      if (!title) {
        if (route === "/") {
          title = "Home";
        } else {
          const rawSlug = route.replace(/^\//, "").replace(/[-_]+/g, " ");
          title = rawSlug.split(/\s+/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        }
      }
      return {
        path: route,
        title: title || "Page",
        category: (match as any)?.category,
      };
    });

    const brandFromPrompt = NavigationDesignResolver.extractBrandFromPrompt(rawPrompt);
    const resolvedBrandName =
      brandFromPrompt ||
      domainContract?.brandName ||
      domainContract?.name ||
      (domainContract?.domainName && !domainContract.domainName.includes("...") && domainContract.domainName.length <= 28 ? domainContract.domainName : undefined) ||
      (brief as any).brand?.name ||
      specification?.appName;

    const navigationDesign = NavigationDesignResolver.resolve(
      rawPrompt,
      experiencePattern,
      resolvedBrandName,
      domainContract?.tagline || (brief as any).brand?.tagline,
      plannedPages,
      brief.productCharacteristics?.emotionalTone?.primary,
      brief.seed,
      compositionGraph.compositionStrategy,
      expectedRoutes
    );

    const experienceIdentity = WebsiteExperienceIdentityResolver.resolve(
      rawPrompt,
      brief.productCharacteristics,
      experienceCapability,
      navigationDesign,
      brief,
      domainContract
    );

    const pagePlans = PageExperiencePlanner.planPages(
      rawPrompt,
      brief.productCharacteristics,
      experienceIdentity,
      experienceCapability,
      expectedRoutes,
      plannedPages
    );

    return {
      planId: `plan_${Date.now()}`,
      generationSeed: brief.seed,
      compositionStrategy: compositionGraph.compositionStrategy,
      experiencePattern,
      experienceCapability,
      compositionGraph,
      navigationDesign,
      experienceIdentity,
      pagePlans,
      expectedHomeRoute,
      primaryLandingFeature,
      primaryActivity: brief.productCharacteristics.primaryActivity,
      requiredCapabilities,
      forbiddenVocabulary: Array.from(new Set(forbiddenVocabulary)),
      forbiddenArtifacts: Array.from(new Set(forbiddenArtifacts)),
      expectedRoutes,
      authWallAllowed,
      rawPrompt,
      designResearchSynthesis,
    };
  }

  public static save(plan: ProductExperiencePlan, outputDirectory: string): void {
    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) mkdirSync(aegisDir, { recursive: true });
    writeFileSync(join(aegisDir, "product-experience-plan.json"), JSON.stringify(plan, null, 2), "utf8");
    if (plan.experienceIdentity) {
      writeFileSync(
        join(aegisDir, "website-experience-identity.json"),
        JSON.stringify(plan.experienceIdentity, null, 2),
        "utf8"
      );
    }
    if (plan.pagePlans && plan.pagePlans.length > 0) {
      writeFileSync(
        join(aegisDir, "page-experience-plans.json"),
        JSON.stringify(plan.pagePlans, null, 2),
        "utf8"
      );
    }

    // ── Generate and persist individual Page Design Specifications ──
    try {
      const { PageDesignSpecificationEngine } = require("./page-design-specification-engine.js");
      const pageSpecs = PageDesignSpecificationEngine.generateSpecifications({
        routes: plan.expectedRoutes || ["/"],
        pagePlans: plan.pagePlans || [],
        prompt: plan.rawPrompt || "",
        brandName: plan.experienceIdentity?.brandIdentity?.name || "Aegis Studio",
        discoveredFeatures: plan.requiredCapabilities?.map(c => c.name) || [],
      });
      PageDesignSpecificationEngine.save(pageSpecs, outputDirectory);
    } catch {
      import("./page-design-specification-engine.js").then(({ PageDesignSpecificationEngine }) => {
        try {
          const pageSpecs = PageDesignSpecificationEngine.generateSpecifications({
            routes: plan.expectedRoutes || ["/"],
            pagePlans: plan.pagePlans || [],
            prompt: plan.rawPrompt || "",
            brandName: plan.experienceIdentity?.brandIdentity?.name || "Aegis Studio",
            discoveredFeatures: plan.requiredCapabilities?.map(c => c.name) || [],
          });
          PageDesignSpecificationEngine.save(pageSpecs, outputDirectory);
        } catch {}
      }).catch(() => {});
    }

    // ── Generate and persist authoritative Design Decision Document (DDD) ──
    try {
      const { DesignDecisionDocumentEngine } = require("./design-decision-document.js");
      const ddd = DesignDecisionDocumentEngine.generateDocument({
        prompt: plan.rawPrompt || "",
        brandName: plan.experienceIdentity?.brandIdentity?.name || "Aegis Studio",
        routes: plan.expectedRoutes || ["/"],
        pagePlans: plan.pagePlans || [],
        domainHint: plan.experienceIdentity?.genre,
        researchSynthesis: plan.designResearchSynthesis,
      });
      DesignDecisionDocumentEngine.save(ddd, outputDirectory);
      if (ddd.assetManifest) {
        const { AssetDirector } = require("./asset-director.js");
        AssetDirector.resolveAssets(ddd.assetManifest, outputDirectory).catch(() => {});
      }
    } catch {
      // Dynamic import fallback for ESM environments
      import("./design-decision-document.js").then(async ({ DesignDecisionDocumentEngine }) => {
        try {
          const ddd = DesignDecisionDocumentEngine.generateDocument({
            prompt: plan.rawPrompt || "",
            brandName: plan.experienceIdentity?.brandIdentity?.name || "Aegis Studio",
            routes: plan.expectedRoutes || ["/"],
            pagePlans: plan.pagePlans || [],
            domainHint: plan.experienceIdentity?.genre,
            researchSynthesis: plan.designResearchSynthesis,
          });
          DesignDecisionDocumentEngine.save(ddd, outputDirectory);
          if (ddd.assetManifest) {
            const { AssetDirector } = await import("./asset-director.js");
            await AssetDirector.resolveAssets(ddd.assetManifest, outputDirectory);
          }
        } catch {}
      }).catch(() => {});
    }
  }

  public static load(outputDirectory: string): ProductExperiencePlan | null {
    const planPath = join(outputDirectory, ".aegis", "product-experience-plan.json");
    const legacyPath = join(outputDirectory, ".aegis", "locked-experience-plan.json");
    const targetPath = existsSync(planPath) ? planPath : (existsSync(legacyPath) ? legacyPath : null);
    if (!targetPath) return null;
    try {
      return JSON.parse(readFileSync(targetPath, "utf8"));
    } catch {
      return null;
    }
  }
}

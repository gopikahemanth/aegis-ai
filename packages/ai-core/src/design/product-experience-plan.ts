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
  primaryLandingFeature?: string;
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
      if (triggers.some(t => {
        const escaped = t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(^|\\W)${escaped}(\\W|$)`, 'i');
        return regex.test(lowerPrompt);
      })) {
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
      ["quote", "estimator", "cost estimation", "project quote"],
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

    addIfMatching(
      "solar-telemetry",
      "Solar Array Telemetry Dashboard",
      ["telemetry", "solar", "inverter", "photovoltaic", "array telemetry", "live inverter"],
      ["telemetry", "inverter", "solar", "kilowatt", "kwh", "yield", "voltage", "power", "grid", "efficiency", "generation", "array"],
      ["button", "input"],
      { controlType: "button", action: "click" }
    );

    addIfMatching(
      "maintenance-scheduler",
      "Maintenance Alert Scheduling",
      ["maintenance", "alert scheduling", "service schedule", "work order"],
      ["maintenance", "alert", "schedule", "service", "inspection", "technician", "repair", "status", "dispatch"],
      ["button", "input"],
      { controlType: "button", action: "click" }
    );

    addIfMatching(
      "system-alerts",
      "System Alert Monitor",
      ["alerts", "alarm", "monitoring alert"],
      ["alert", "alarm", "warning", "critical", "threshold", "notification", "resolved", "active"],
      ["button"],
      { controlType: "button", action: "click" }
    );

    addIfMatching(
      "energy-analytics",
      "Energy Yield Analytics",
      ["yield", "analytics", "kilowatt-hour", "daily yield", "consumption"],
      ["yield", "analytics", "kilowatt", "consumption", "daily", "trend", "generation", "peak", "metrics"],
      ["button", "select"],
      { controlType: "button", action: "click" }
    );

    addIfMatching(
      "commission-manager",
      "Bespoke Commission Request Manager",
      ["commission", "bespoke", "custom piece", "client request"],
      ["commission", "request", "bespoke", "client", "custom", "quote", "milestone", "deposit"],
      ["button", "input"],
      { controlType: "button", action: "click" }
    );

    addIfMatching(
      "inventory-manager",
      "Material Inventory System",
      ["inventory", "stock", "raw material", "warehouse"],
      ["inventory", "stock", "material", "quantity", "unit", "supplier", "batch", "reorder"],
      ["button", "input"],
      { controlType: "button", action: "click" }
    );

    // ── STOREFRONT: Discovery-driven retail commerce capabilities ─────────────
    if (experiencePattern === "storefront-commerce") {
      const isBakeryOrFood = lowerPrompt.includes("bakery") || lowerPrompt.includes("bread") || lowerPrompt.includes("pastry") || lowerPrompt.includes("cake") || lowerPrompt.includes("food") || lowerPrompt.includes("cafe");

      // 1. Mandatory core retail capabilities: Product Catalog & Cart
      if (!requiredCapabilities.some(c => c.id === "product-catalog" || c.id === "daily-menu")) {
        requiredCapabilities.push({
          id: isBakeryOrFood ? "daily-menu" : "product-catalog",
          name: isBakeryOrFood ? "Daily Bread & Fresh Bakes Menu" : "Product Catalog Grid",
          evidenceVocabulary: isBakeryOrFood
            ? ["menu", "bread", "pastry", "sourdough", "loaves", "croissant", "price", "order", "bag", "bakes", "fresh"]
            : ["product", "catalog", "grid", "price", "add to cart", "rating", "item"],
          controlsRequired: ["button"],
          testInteraction: { controlType: "button", action: "click" },
        });
      }

      if (!requiredCapabilities.some(c => c.id === "cart-drawer")) {
        requiredCapabilities.push({
          id: "cart-drawer",
          name: isBakeryOrFood ? "Artisan Bakery Order Bag & Cart" : "Slide-Out Shopping Cart Drawer",
          evidenceVocabulary: ["cart", "bag", "checkout", "subtotal", "quantity", "order"],
          controlsRequired: ["button"],
          testInteraction: { controlType: "button", action: "click" },
        });
      }

      // 2. Discovery-driven capabilities (ONLY if requested in prompt):
      // Custom cake ordering/builder
      if (lowerPrompt.includes("cake") || lowerPrompt.includes("custom order") || lowerPrompt.includes("cake ordering")) {
        if (!requiredCapabilities.some(c => c.id === "custom-cake-builder")) {
          requiredCapabilities.push({
            id: "custom-cake-builder",
            name: "Custom Cake Ordering Configurator",
            evidenceVocabulary: ["cake", "custom", "tiers", "flavor", "frosting", "sponge", "inscription", "size", "order"],
            controlsRequired: ["select", "button", "input"],
            testInteraction: { controlType: "button", action: "click" },
          });
        }
      }

      // Pickup scheduler
      if (lowerPrompt.includes("pickup") || lowerPrompt.includes("slot") || lowerPrompt.includes("scheduler")) {
        if (!requiredCapabilities.some(c => c.id === "pickup-scheduler")) {
          requiredCapabilities.push({
            id: "pickup-scheduler",
            name: "Fresh Bake Pickup Scheduler",
            evidenceVocabulary: ["pickup", "slot", "time", "date", "fresh", "reserve", "schedule"],
            controlsRequired: ["input", "button"],
            testInteraction: { controlType: "button", action: "click" },
          });
        }
      }

      // Bread subscription
      if (lowerPrompt.includes("subscription") || lowerPrompt.includes("recurring") || lowerPrompt.includes("bread club")) {
        if (!requiredCapabilities.some(c => c.id === "bread-subscription")) {
          requiredCapabilities.push({
            id: "bread-subscription",
            name: "Recurring Bread Club Subscription",
            evidenceVocabulary: ["subscription", "weekly", "loaf", "recurring", "club", "box"],
            controlsRequired: ["button", "select"],
            testInteraction: { controlType: "button", action: "click" },
          });
        }
      }

      // Promotional Hero Carousel (only if requested)
      if (lowerPrompt.includes("carousel") || lowerPrompt.includes("banner") || lowerPrompt.includes("promotional")) {
        if (!requiredCapabilities.some(c => c.id === "hero-carousel")) {
          requiredCapabilities.push({
            id: "hero-carousel",
            name: "Promotional Hero Carousel",
            evidenceVocabulary: ["carousel", "banner", "slide", "promotional", "hero"],
            controlsRequired: ["button"],
            testInteraction: { controlType: "button", action: "click" },
          });
        }
      }

      // Lightning Deals / Flash Sales (only if requested)
      if (lowerPrompt.includes("deal") || lowerPrompt.includes("lightning") || lowerPrompt.includes("countdown") || lowerPrompt.includes("timer") || lowerPrompt.includes("flash sale")) {
        if (!requiredCapabilities.some(c => c.id === "lightning-deals")) {
          requiredCapabilities.push({
            id: "lightning-deals",
            name: "Lightning Deal Countdown Timer",
            evidenceVocabulary: ["deal", "countdown", "timer", "limited", "flash"],
            controlsRequired: ["button"],
            testInteraction: { controlType: "button", action: "click" },
          });
        }
      }

      // Pincode / Delivery availability (only if requested)
      if (lowerPrompt.includes("pincode") || lowerPrompt.includes("zip code") || lowerPrompt.includes("delivery checker") || lowerPrompt.includes("serviceable")) {
        if (!requiredCapabilities.some(c => c.id === "pincode-checker")) {
          requiredCapabilities.push({
            id: "pincode-checker",
            name: "Delivery Pincode Availability Checker",
            evidenceVocabulary: ["pincode", "delivery", "availability", "check", "serviceable"],
            controlsRequired: ["input", "button"],
            testInteraction: { controlType: "input", action: "input" },
          });
        }
      }
    }

    // ── HOSPITALITY: Discovery-driven resort portal capabilities ──────────────
    if (experiencePattern === "hospitality-portal") {
      if (!requiredCapabilities.some(c => c.id === "villa-booking" || c.id === "accommodations")) {
        requiredCapabilities.push({
          id: "villa-booking",
          name: "Villa Accommodations & Reservation",
          evidenceVocabulary: ["villa", "suite", "stay", "bedroom", "night", "check-in", "guests", "book", "availability"],
          controlsRequired: ["button", "input"],
          testInteraction: { controlType: "button", action: "click" },
        });
      }

      if (!requiredCapabilities.some(c => c.id === "culinary-showcase" || c.id === "dining")) {
        requiredCapabilities.push({
          id: "culinary-showcase",
          name: "Curated Dining & Gastronomy Showcase",
          evidenceVocabulary: ["dining", "restaurant", "culinary", "chef", "menu", "gastronomy", "reserve", "table"],
          controlsRequired: ["button"],
          testInteraction: { controlType: "button", action: "click" },
        });
      }
    }

    // Fallback: If no specialized capabilities matched from custom patterns, derive from brief/specification features
    if (requiredCapabilities.length === 0) {
      // Strictly exclude auth / infrastructure plumbing from domain UI completeness verification
      const featureList = (brief.featurePriority?.features || []).filter(
        (feat: any) => !["auth", "authentication", "login", "signup", "register", "session", "user", "profile"].includes(feat.name.toLowerCase())
      );
      const META_STOPWORDS = new Set([
        "user", "users", "wants", "want", "need", "needs", "manage", "interact",
        "with", "from", "that", "this", "able", "allow", "allows", "system",
        "page", "view", "data", "item", "items", "help", "helps"
      ]);
      for (const feat of featureList.slice(0, 4)) {
        const id = feat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const baseName = feat.name.toLowerCase();
        // Extract domain vocabulary purely from the feature's name and terms — NEVER from boilerplate sentence templates
        const nameTokens = baseName
          .split(/[\s-_/]+/)
          .map((w: string) => w.replace(/[^a-z0-9]/g, ""))
          .filter((w: string) => w.length > 2 && !META_STOPWORDS.has(w));
        const vocab = Array.from(new Set([
          baseName,
          ...nameTokens,
        ]));
        requiredCapabilities.push({
          id,
          name: feat.name,
          evidenceVocabulary: vocab,
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

    const pageRoutes = brief.featurePriority?.informationArchitecture?.pages?.map(p => p.route) || [];
    const contractRoutes = domainContract?.requiredRoutes || [];
    const specRoutes = specification?.userFlows || [];
    const expectedRoutes = Array.from(new Set(["/", ...pageRoutes, ...contractRoutes, ...specRoutes]));

    const primaryLandingFeature =
      domainContract?.primaryLandingFeature ||
      brief.featurePriority?.primaryLandingFeature ||
      brief.featurePriority?.core?.[0]?.name ||
      brief.featurePriority?.informationArchitecture?.pages?.[0]?.name ||
      requiredCapabilities[0]?.name ||
      "Home";

    return {
      planId: `plan_${Date.now()}`,
      experiencePattern,
      expectedHomeRoute,
      primaryLandingFeature,
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

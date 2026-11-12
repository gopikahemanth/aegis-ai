/**
 * ProductDiscoveryAgent
 *
 * Discovers real-world domain requirements, core user flows, standard operational features,
 * run-to-run differentiator features, and data models before planning or coding.
 *
 * Replaces naive keyword guessing with domain-expert product discovery.
 * Includes non-blocking fallback if LLM is unreachable or returns malformed JSON.
 */

import { BaseAgent } from "./base-agent.js";
import type { ProductCharacteristics } from "../design/product-understanding.js";
import { JsonExtractor } from "../utils/json-extractor.js";
import { createHash } from "node:crypto";

export interface FeatureSpec {
  name: string;
  description: string;
  requiredComponents: string[];
  requiredDataFields?: string[];
}

export interface DataModelSpec {
  name: string;
  fields: string[];
  relations?: string[];
}

export interface FeatureMatrix {
  category: string;
  /**
   * ADVISORY ONLY — not consumed by the design pipeline downstream.
   *
   * CapabilityPlanner.fromFeatureMatrix() and CapabilityPlanner.plan() both read
   * `characteristics.experiencePattern` (from ProductUnderstanding.analyze()), NOT this field.
   * This value is returned by the LLM and by deterministic fallbacks as context/debugging aid,
   * but has zero effect on which PAGE_TEMPLATE, CompositionFamily, or hero element is selected.
   *
   * The sole source of truth for experience pattern throughout the design pipeline is:
   *   ProductUnderstanding.analyze(prompt).experiencePattern
   */
  experiencePattern?: ProductCharacteristics["experiencePattern"];
  /** Authoritative primary landing feature designated for root "/" landing experience */
  primaryLandingFeature?: string;
  corePages: string[];
  standardFeatures: FeatureSpec[];
  differentiatorFeatures: FeatureSpec[]; // 2-3 features unique to THIS generation run
  dataModels: DataModelSpec[];
  isFallback?: boolean;
}


export class ProductDiscoveryAgent extends BaseAgent {
  readonly name = "Product Discovery Agent";
  private readonly jsonExtractor = new JsonExtractor();

  /**
   * Executes domain discovery using the LLM with safe fallback.
   */
  async discover(
    prompt: string,
    characteristics: ProductCharacteristics,
    seedOverride?: string
  ): Promise<FeatureMatrix> {
    const runSeed = seedOverride || createHash("sha256").update(`${prompt}_${Date.now()}`).digest("hex").slice(0, 8);

    try {
      const discoveryPrompt = this.buildPrompt(prompt, characteristics, runSeed);
      const response = await this.provider.chat([
        {
          role: "system",
          content: `You are a Principal Product Architect and Industry Domain Expert.
Your job is to analyze business requests and define what a real-world, production business in that category actually requires to operate successfully.
Reason from first principles about customer journeys, operational workflows, and domain realities.
NEVER provide generic filler. Provide concrete, domain-specific features and entities.
Return ONLY a valid, parseable JSON object matching the requested schema. No markdown backticks, no commentary.`
        },
        {
          role: "user",
          content: discoveryPrompt
        }
      ], {
        temperature: 0.4,
        maxTokens: 8192,
        agentType: "discovery",
        complexity: 8,
      } as any);

      const extractedJson = this.jsonExtractor.extract(response);
      const parsed = JSON.parse(extractedJson) as FeatureMatrix;

      if (this.isValidFeatureMatrix(parsed)) {
        parsed.isFallback = false;
        console.log(`[ProductDiscovery] ✓ Discovered category "${parsed.category}" with ${parsed.standardFeatures.length} standard & ${parsed.differentiatorFeatures.length} differentiator features.`);
        return parsed;
      }

      console.warn("[ProductDiscovery] ⚠️ Discovery output failed schema validation. Falling back to deterministic domain matrix.");
      const fallbackMatrix = this.fallback(prompt, characteristics, runSeed);
      fallbackMatrix.isFallback = true;
      return fallbackMatrix;
    } catch (err: any) {
      console.warn(`[ProductDiscovery] ⚠️ Discovery agent failed: ${err.message}. Using non-blocking domain fallback.`);
      const fallbackMatrix = this.fallback(prompt, characteristics, runSeed);
      fallbackMatrix.isFallback = true;
      return fallbackMatrix;
    }
  }

  private buildPrompt(prompt: string, characteristics: ProductCharacteristics, runSeed: string): string {
    return `
BUSINESS INITIATIVE / PROMPT: "${prompt}"

PRODUCT CONTEXT (from ProductUnderstanding):
- Experience Pattern: ${characteristics.experiencePattern}
- Primary Activity: ${characteristics.primaryActivity}
- Emotional Tone: ${characteristics.emotionalTone.primary}
- Audience: ${characteristics.targetAudience || "General customers"}
- Run Seed: ${runSeed}

TASK:
Produce a comprehensive, domain-accurate FeatureMatrix for this product.
Do not simply echo the user's words. Reason as an industry expert: what does a business of this type actually require to serve customers and operate?

REQUIREMENTS:
1. "category": Concise industry label (e.g. "Luxury Hospitality & Resort", "Automotive Detailing & Wash", "SaaS Engineering Project Management", "Artisan Bakery & Confectionery", "Consumer E-Commerce & Retail Marketplace").
2. "experiencePattern": Select the single most accurate UX macro-pattern for this domain:
   - "storefront-commerce": Retail shopping, marketplaces, e-commerce, consumer store with promotional banners, product catalog grid, and shopping cart
   - "hospitality-portal": Luxury resorts, hotels, vacation stays, retreats, villas with immersive booking bar
   - "catalog-browser": Curated discovery listings, libraries, galleries
   - "booking-flow": Appointment scheduling, service bookings, reservations
   - "operations-dashboard": Operational monitoring, KPIs, business analytics, internal management
   - "workspace-editor": Document, media, or creative authoring canvas
   - "personal-tracker": Personal habit, wellness, mood, or longitudinal health tracking
   - "configurator-workspace": Engineering/industrial design, photometrics, physical parameter configurator
3. "primaryLandingFeature": The name of the single core feature or page that serves as the primary home landing experience ("/") for end users (e.g. for a school/edtech: "Course Catalog", for freight logistics: "Dispatch Log", for bakery: "Daily Fresh Bread Menu", for portfolio: "Project Showcase"). It must be an active, primary user workflow, NEVER an administrative, utility, export, or secondary page.
4. "corePages": 3-6 route names with leading slash (e.g. ["/", "/deals", "/categories", "/cart"]).
5. "standardFeatures": 4-6 essential operational features (e.g. for car wash: package comparison, vehicle size selector, appointment scheduler, add-on selector, location & bay tracker).
6. "differentiatorFeatures": Exactly 2-3 innovative or unique features that set THIS specific product apart from competitors (incorporate seed: ${runSeed} for variety). E.g. For a resort: "Sommelier Cellar Booking", "Sunset Yacht Concierge"; for a bakery: "Weekly Sourdough Subscription", "Custom Cake 3D Builder".
7. "dataModels": 3-5 core business entities with realistic domain fields and relations.

SCHEMA SPECIFICATION (JSON ONLY):
{
  "category": string,
  "experiencePattern": "storefront-commerce" | "hospitality-portal" | "catalog-browser" | "booking-flow" | "operations-dashboard" | "workspace-editor" | "personal-tracker" | "configurator-workspace",
  "primaryLandingFeature": string,
  "corePages": string[],
  "standardFeatures": [
    {
      "name": string,
      "description": string,
      "requiredComponents": string[],
      "requiredDataFields": string[]
    }
  ],
  "differentiatorFeatures": [
    {
      "name": string,
      "description": string,
      "requiredComponents": string[],
      "requiredDataFields": string[]
    }
  ],
  "dataModels": [
    {
      "name": string,
      "fields": string[],
      "relations": string[]
    }
  ]
}
`.trim();
  }

  private isValidFeatureMatrix(data: any): data is FeatureMatrix {
    if (
      typeof data === "object" &&
      data !== null &&
      typeof data.category === "string" &&
      Array.isArray(data.corePages) &&
      data.corePages.length >= 2 &&
      Array.isArray(data.standardFeatures) &&
      data.standardFeatures.length >= 2 &&
      Array.isArray(data.differentiatorFeatures) &&
      data.differentiatorFeatures.length >= 1 &&
      Array.isArray(data.dataModels) &&
      data.dataModels.length >= 1
    ) {
      if (!data.primaryLandingFeature || typeof data.primaryLandingFeature !== "string") {
        data.primaryLandingFeature = data.standardFeatures[0]?.name || "Home";
      }
      return true;
    }
    return false;
  }

  /**
   * Deterministically select differentiator features from a category pool using the seed hash.
   * Guarantees 2-3 distinct features per run and variation across different seeds.
   */
  private selectDifferentiators(pool: FeatureSpec[], seed: string | number, count: number = 2): FeatureSpec[] {
    const hashHex = createHash("sha256").update(String(seed ?? "default_seed")).digest("hex");
    const val1 = parseInt(hashHex.slice(0, 4), 16);
    const val2 = parseInt(hashHex.slice(4, 8), 16);
    const val3 = parseInt(hashHex.slice(8, 12), 16);

    const available = [...pool];
    const result: FeatureSpec[] = [];
    const vals = [val1, val2, val3];
    const takeCount = Math.min(count, available.length);

    for (let i = 0; i < takeCount; i++) {
      const idx = vals[i] % available.length;
      result.push(available.splice(idx, 1)[0]);
    }
    return result;
  }

  /**
   * Deterministic domain fallback ensuring the pipeline never blocks if the LLM call fails.
   */
  public fallback(prompt: string, characteristics: ProductCharacteristics, seed: string | number): FeatureMatrix {
    const p = prompt.toLowerCase();
    const s = String(seed ?? prompt);

    // 6. Default General Business
    const generalDifferentiators: FeatureSpec[] = [
      {
        name: "Interactive Real-Time Cost Estimator",
        description: "Dynamic pricing calculator updating as parameters are adjusted.",
        requiredComponents: ["CostEstimatorSlider", "QuoteBreakdownCard"],
        requiredDataFields: ["parameters", "calculatedTotal", "tierLevel"],
      },
      {
        name: "Client Verification & Satisfaction Guarantee",
        description: "Transparent guarantee metrics with verified client satisfaction ratings.",
        requiredComponents: ["GuaranteeBadge", "MetricProgressRing"],
        requiredDataFields: ["satisfactionScore", "guaranteeText"],
      },
      {
        name: "Priority Service SLA Express Queue",
        description: "Expedited turnaround tracking with guaranteed SLA response timestamps.",
        requiredComponents: ["SlaStatusTracker", "UrgencyBadge"],
        requiredDataFields: ["slaHours", "priorityLevel"],
      },
    ];

    const cleanTokens = prompt
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 3 && !["build", "create", "website", "platform", "online", "system", "portal", "with", "that", "this", "from", "offer", "offering", "authentic", "operations", "called"].includes(w.toLowerCase()));

    let synthesizedCategory = "Bespoke Digital Platform";
    if (cleanTokens.length >= 2) {
      synthesizedCategory = `${cleanTokens[0].charAt(0).toUpperCase() + cleanTokens[0].slice(1)} ${cleanTokens[1].charAt(0).toUpperCase() + cleanTokens[1].slice(1)} Experience`;
    } else if (cleanTokens.length === 1) {
      synthesizedCategory = `${cleanTokens[0].charAt(0).toUpperCase() + cleanTokens[0].slice(1)} Platform`;
    }

    const primaryNoun = cleanTokens[0] ? cleanTokens[0].charAt(0).toUpperCase() + cleanTokens[0].slice(1) : "Service";

    const derivedPages = ["/"];
    for (const token of cleanTokens.slice(0, 3)) {
      const slug = "/" + token.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      if (!derivedPages.includes(slug)) derivedPages.push(slug);
    }
    if (derivedPages.length === 1) {
      derivedPages.push("/catalog", "/details");
    }

    return {
      category: synthesizedCategory,
      experiencePattern: characteristics?.experiencePattern || "operations-dashboard",
      primaryLandingFeature: `Interactive ${primaryNoun} & Offer Catalog`,
      corePages: derivedPages,
      standardFeatures: [
        {
          name: `Interactive ${primaryNoun} & Offer Catalog`,
          description: `Searchable, filterable list of ${primaryNoun.toLowerCase()} offerings with pricing and details.`,
          requiredComponents: ["CatalogGrid", "CategoryTabs", "ItemDetailModal"],
          requiredDataFields: ["title", "category", "price", "description"],
        },
        {
          name: "Direct Client Inquiry & Booking Flow",
          description: "Structured form with instant validation and response timeline.",
          requiredComponents: ["ContactForm", "ConfirmationNotice"],
          requiredDataFields: ["name", "email", "serviceRequested", "message"],
        },
      ],
      differentiatorFeatures: this.selectDifferentiators(generalDifferentiators, s, 2),
      dataModels: [
        { name: primaryNoun, fields: ["id", "title", "price", "category", "description"] },
        { name: "Inquiry", fields: ["id", "clientName", "clientEmail", "status", "submittedAt"] },
      ],
    };
  }
}

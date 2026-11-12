/**
 * ContentStrategistAgent
 *
 * Eliminates generic AI placeholder copy ("Transform your experience with our cutting-edge platform").
 * Produces authentic, domain-tailored headlines, subheadlines, realistic seed records,
 * categorized image search terms, and sample social proof marked with `isSampleData: true`.
 *
 * Outputs `src/content/site-content.ts` for the CoderAgent to import and render unmodified.
 */

import { BaseAgent } from "./base-agent.js";
import type { FeatureMatrix } from "./product-discovery-agent.js";
import type { ProductDesignBrief } from "../design/design-director.js";
import { NavigationDesignResolver } from "../design/navigation-design.js";
import { JsonExtractor } from "../utils/json-extractor.js";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface SiteContentModel {
  brand: {
    name: string;
    tagline: string;
    valueProposition: string;
    contact: {
      phone: string;
      email: string;
      hours: string;
      address: string;
    };
  };
  navigationLabels: Record<string, string>;
  pages: Record<string, {
    title: string;
    headline: string;
    subheadline: string;
    primaryCta: string;
    secondaryCta?: string;
    highlights: Array<{ label: string; description: string }>;
  }>;
  mockRecords: Array<Record<string, any>>;
  testimonials: Array<{
    author: string;
    role: string;
    location?: string;
    quote: string;
    rating: number;
    isPlaceholder: true; // Mandatory guardrail: clearly marked as placeholder
    isSampleData?: boolean;
  }>;
  imageKeywords: {
    hero: string;
    features: string[];
    gallery: string[];
  };
}

export class ContentStrategistAgent extends BaseAgent {
  readonly name = "Content Strategist Agent";
  private readonly jsonExtractor = new JsonExtractor();

  public static readonly BANNED_CLICHES = [
    "cutting-edge",
    "seamless",
    "seamlessly",
    "transform your",
    "transforming",
    "get started today",
    "unlock your potential",
    "elevate your",
    "welcome to our",
    "innovative platform",
    "all-in-one solution",
    "next-generation",
    "game-changer",
    "revolutionize",
    "state-of-the-art",
    "empower your",
    "unleash",
  ];

  /**
   * Generates authentic site content and writes it directly to src/content/site-content.ts.
   */
  async generateContent(
    featureMatrix: FeatureMatrix,
    brief: ProductDesignBrief,
    outputDirectory: string
  ): Promise<SiteContentModel> {
    const category = featureMatrix.category;
    const requiredVocab = (brief.vocabularyContract?.required || []).join(", ");
    const forbiddenVocab = (brief.vocabularyContract?.forbidden || []).join(", ");

    const promptText = (brief as any).userPrompt || (brief as any).rawPrompt || "";
    const authoritativeBrand =
      (brief as any).brand?.name ||
      (brief as any).brandName ||
      (promptText ? NavigationDesignResolver.extractBrandFromPrompt(promptText) : "") ||
      (brief as any).appName ||
      "";

    try {
      const prompt = `
BUSINESS CATEGORY: ${category}
${authoritativeBrand ? `MANDATORY BRAND NAME: "${authoritativeBrand}" (You MUST use this EXACT brand name)` : ""}
CORE PAGES: ${featureMatrix.corePages.join(", ")}
CORE FEATURES:
${featureMatrix.standardFeatures.map(f => `- ${f.name}: ${f.description}`).join("\n")}
DIFFERENTIATOR FEATURES:
${featureMatrix.differentiatorFeatures.map(f => `- ${f.name}: ${f.description}`).join("\n")}

AUDIENCE & TONE:
- Tone: ${brief.productCharacteristics.emotionalTone.primary}
- Experience Pattern: ${brief.productCharacteristics.experiencePattern}
- Required Vocabulary (Use naturally): ${requiredVocab || "Domain terminology"}
- Strictly Forbidden Words: ${forbiddenVocab || "None"}

BANNED MARKETING CLICHES (MUST NEVER APPEAR IN HEADLINES OR COPY):
${ContentStrategistAgent.BANNED_CLICHES.map(w => `• "${w}"`).join("\n")}

TASK:
Write authentic, human, compelling copy and realistic seed data for this business.
- Headlines must state what the business actually does clearly and specifically.
- Subheadlines must answer "how" or give concrete details (pricing, turnaround times, materials).
- Provide 4-8 rich mock records matching the domain (e.g. villa suites with prices, wash packages with durations, recipes with ingredients, destinations with market guides).
- Provide 3 realistic customer testimonials. Every testimonial must have isSampleData: true.
- Provide descriptive image search keywords (e.g. "luxury oceanfront villa sunset", "hand soap wash detailing foam").
${authoritativeBrand ? `- CRITICAL INVARIANT: The brand name MUST be "${authoritativeBrand}". Do NOT invent an arbitrary or unrelated company/project name.` : ""}

RETURN ONLY VALID JSON matching this schema:
{
  "brand": {
    "name": string,
    "tagline": string,
    "valueProposition": string,
    "contact": { "phone": string, "email": string, "hours": string, "address": string }
  },
  "navigationLabels": { [route: string]: string },
  "pages": {
    [route: string]: {
      "title": string,
      "headline": string,
      "subheadline": string,
      "primaryCta": string,
      "secondaryCta": string,
      "highlights": [{ "label": string, "description": string }]
    }
  },
  "mockRecords": [ { [key: string]: any } ],
  "testimonials": [
    { "author": string, "role": string, "location": string, "quote": string, "rating": number, "isSampleData": true }
  ],
  "imageKeywords": {
    "hero": string,
    "features": string[],
    "gallery": string[]
  }
}
`.trim();

      const response = await this.provider.chat([
        {
          role: "system",
          content: "You are a seasoned brand copywriter and product content strategist. You write authentic, punchy, domain-specific copy that sounds human and grounded. You never use marketing fluff."
        },
        { role: "user", content: prompt }
      ], {
        temperature: 0.3,
        maxTokens: 8192,
      });

      const extracted = this.jsonExtractor.extract(response);
      const parsed = JSON.parse(extracted) as SiteContentModel;

      // Filter check for banned phrases and enforce authoritative brand identity
      const cleansed = this.sanitizeContent(parsed, authoritativeBrand);
      this.writeToProject(cleansed, outputDirectory);
      console.log(`[ContentStrategist] ✓ Generated authentic content for "${cleansed.brand.name}" in src/content/site-content.ts`);
      return cleansed;
    } catch (err: any) {
      console.warn(`[ContentStrategist] ⚠️ Content generator encountered issue: ${err.message}. Using domain-tailored fallback content.`);
      const fallbackContent = this.fallbackContent(featureMatrix, brief);
      this.writeToProject(fallbackContent, outputDirectory);
      return fallbackContent;
    }
  }

  /**
   * Sanitizes copy to eliminate any banned marketing cliches that slipped past the LLM
   * and guarantees the authoritative brand name is strictly enforced.
   */
  private sanitizeContent(content: SiteContentModel, authoritativeBrand?: string): SiteContentModel {
    const foreignBrands = [
      "Aether Sprint",
      "Aetheris",
      "SprintPulse",
      "Sprint Pulse",
      "Revue Noir",
      "Tectonic Journal",
      "Chronos Atelier",
      "Kazzoo",
      "Marrow & Atlas",
      "Tectonic",
      "Monograph Studio",
    ];
    if (content.brand?.name && authoritativeBrand && content.brand.name.toLowerCase() !== authoritativeBrand.toLowerCase()) {
      foreignBrands.push(content.brand.name);
    }

    const effectiveBrand = authoritativeBrand || content.brand?.name || "Official Platform";

    const sanitizeText = (text: string): string => {
      let result = text;
      for (const banned of ContentStrategistAgent.BANNED_CLICHES) {
        const regex = new RegExp(`\\b${banned}\\b`, "gi");
        result = result.replace(regex, "proven");
      }
      for (const foreign of foreignBrands) {
        if (foreign.toLowerCase() !== effectiveBrand.toLowerCase()) {
          const regex = new RegExp(foreign.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "gi");
          result = result.replace(regex, effectiveBrand);
        }
      }
      return result;
    };

    // Sanitize and enforce authoritative brand
    if (content.brand) {
      if (authoritativeBrand) {
        content.brand.name = authoritativeBrand;
      }
      content.brand.tagline = sanitizeText(content.brand.tagline);
      content.brand.valueProposition = sanitizeText(content.brand.valueProposition);
    }

    // Sanitize pages
    if (content.pages) {
      for (const route of Object.keys(content.pages)) {
        const page = content.pages[route];
        if (page) {
          if (page.title) page.title = sanitizeText(page.title);
          page.headline = sanitizeText(page.headline);
          page.subheadline = sanitizeText(page.subheadline);
        }
      }
    }

    // Sanitize mockRecords
    if (Array.isArray(content.mockRecords)) {
      for (const r of content.mockRecords) {
        for (const k of Object.keys(r)) {
          if (typeof r[k] === "string") {
            r[k] = sanitizeText(r[k]);
          }
        }
      }
    }

    // Strip raw URLs from image keywords (only descriptive search terms allowed)
    const stripUrl = (term: string): string => {
      if (!term || typeof term !== "string") return "";
      return term.replace(/https?:\/\/[^\s]+/gi, "").trim();
    };

    if (content.imageKeywords) {
      if (content.imageKeywords.hero) {
        content.imageKeywords.hero = stripUrl(content.imageKeywords.hero) || "modern architectural photography";
      }
      if (Array.isArray(content.imageKeywords.features)) {
        content.imageKeywords.features = content.imageKeywords.features.map(f => stripUrl(f) || "product detail").filter(Boolean);
      }
      if (Array.isArray(content.imageKeywords.gallery)) {
        content.imageKeywords.gallery = content.imageKeywords.gallery.map(g => stripUrl(g) || "editorial scene").filter(Boolean);
      }
    }

    // Ensure all testimonials have isPlaceholder: true (and isSampleData: true)
    if (Array.isArray(content.testimonials)) {
      for (const t of content.testimonials) {
        (t as any).isPlaceholder = true;
        (t as any).isSampleData = true;
        t.quote = sanitizeText(t.quote);
      }
    }

    return content;
  }

  /**
   * Writes the site-content.ts file into the target project src/content/ directory.
   */
  public writeToProject(content: SiteContentModel, outputDirectory: string): void {
    const contentDir = join(outputDirectory, "src", "content");
    if (!existsSync(contentDir)) {
      mkdirSync(contentDir, { recursive: true });
    }

    const filePath = join(contentDir, "site-content.ts");
    const tsFileContent = `// SAMPLE CONTENT — replace testimonials, names, and quotes with real customer content before production use.
/**
 * Site Content & Domain Data
 * Generated by Aegis Content Strategist Agent.
 *
 * NOTE FOR PRODUCTION DEPLOYMENT:
 * Testimonials and seed records in this file contain demonstration sample data
 * (marked with isPlaceholder: true). Replace with actual verified customer data before live release.
 *
 * MANDATE FOR FRONTEND CODER:
 * Import and render content from this file as-is.
 * This copy is authoritative and final — do NOT rewrite, paraphrase, or invent filler copy.
 */

export interface SiteContent {
  brand: {
    name: string;
    tagline: string;
    valueProposition: string;
    contact: {
      phone: string;
      email: string;
      hours: string;
      address: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  navigationLabels: Record<string, string>;
  pages: Record<string, {
    title: string;
    headline: string;
    subheadline: string;
    primaryCta: string;
    secondaryCta?: string;
    highlights: Array<{ label: string; description: string }>;
    [key: string]: any;
  }>;
  mockRecords: Array<Record<string, any>>;
  testimonials: Array<{
    author: string;
    role: string;
    location?: string;
    quote: string;
    rating: number;
    isPlaceholder: true;
    isSampleData?: boolean;
    [key: string]: any;
  }>;
  imageKeywords: {
    hero: string;
    features: string[];
    gallery: string[];
    [key: string]: any;
  };
  hero?: {
    title: string;
    headline?: string;
    subheadline?: string;
    description?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export const siteContent: SiteContent = ${(() => {
  const heroData = (content as any).hero || (content.pages && (content.pages["/"] || Object.values(content.pages)[0])) || {
    title: content.brand?.name || "Signature Collection",
    headline: content.brand?.valueProposition || "Atmospheric Experience",
    subheadline: content.brand?.tagline || "Artisanal Creation",
    description: content.brand?.tagline || "Atmospheric Experience"
  };
  return JSON.stringify({ ...content, hero: heroData }, null, 2);
})()} as const;

export default siteContent;
`;

    writeFileSync(filePath, tsFileContent, "utf8");
  }

  /**
   * Domain-agnostic, prompt-grounded fallback content when remote LLM is unavailable.
   * Derives all copy, pages, records, and search keywords directly from the project's
   * feature matrix, discovered models, and user prompt — zero canned domain templates.
   */
  public fallbackContent(featureMatrix: FeatureMatrix, brief: ProductDesignBrief): SiteContentModel {
    const promptText = (brief as any).userPrompt || (brief as any).rawPrompt || "";
    const rawBrand =
      (brief as any).brand?.name ||
      (brief as any).brandName ||
      (promptText ? NavigationDesignResolver.extractBrandFromPrompt(promptText) : "") ||
      (brief as any).appName ||
      (brief as any).productName ||
      "";

    const brandName = rawBrand && rawBrand.length <= 32 ? rawBrand : (featureMatrix.category ? `${featureMatrix.category.split(" ")[0]} Studio` : "Official Platform");
    const domainCategory = featureMatrix.category || "Interactive Product";
    const stdFeatures = featureMatrix.standardFeatures || [];
    const diffFeatures = featureMatrix.differentiatorFeatures || [];
    const corePages = featureMatrix.corePages && featureMatrix.corePages.length > 0 ? featureMatrix.corePages : ["/", "/explore", "/archive", "/contact"];

    // 1. Dynamic navigation labels formatted cleanly from routes
    const navigationLabels: Record<string, string> = {};
    for (const route of corePages) {
      if (route === "/" || route === "") {
        navigationLabels["/"] = "Home";
      } else {
        const seg = route.replace(/^\//, "").split("/")[0];
        const clean = seg
          .split("-")
          .filter(w => !["and", "the", "to", "in", "of"].includes(w.toLowerCase()))
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        navigationLabels[route] = clean || "Explore";
      }
    }

    // 2. Dynamic page copy grounded in discovered features
    const primaryFeature = stdFeatures[0] || { name: "Core Capabilities", description: "Integrated domain workflows." };
    const secondaryFeature = diffFeatures[0] || stdFeatures[1] || { name: "Specialized Management", description: "Bespoke tools and inspection." };

    const pages: SiteContentModel["pages"] = {};
    for (const route of corePages) {
      const label = navigationLabels[route] || "Overview";
      const isHome = route === "/";
      pages[route] = {
        title: `${brandName} | ${isHome ? domainCategory : label}`,
        headline: isHome
          ? `${primaryFeature.name} & ${secondaryFeature.name}`
          : `${label} & Specialized Workflows`,
        subheadline: isHome
          ? `Engineered for ${domainCategory.toLowerCase()} with authentic tools and validated procedures.`
          : `Explore dedicated ${label.toLowerCase()} capabilities, inspection logs, and verified records for ${brandName}.`,
        primaryCta: isHome ? `Explore ${label}` : "View Details",
        secondaryCta: "Learn More",
        highlights: [
          { label: primaryFeature.name, description: primaryFeature.description },
          { label: secondaryFeature.name, description: secondaryFeature.description },
        ],
      };
    }

    // 3. Dynamic mock records derived from data models or features
    const dataModels = (featureMatrix as any).dataModels || [];
    const primaryModelName = dataModels[0]?.name || "Item";
    const mockRecords: Array<Record<string, any>> = [];

    const sampleStatuses = ["Active", "Verified", "Pending", "Archived", "Nominal"];
    for (let i = 1; i <= 4; i++) {
      const recId = `${primaryModelName.toLowerCase().slice(0, 3)}-0${i}`;
      mockRecords.push({
        id: recId,
        title: `${brandName} ${primaryModelName} Reference ${i}`,
        category: i % 2 === 0 ? "Primary Series" : "Specialized",
        status: sampleStatuses[(i - 1) % sampleStatuses.length],
        provenance: "Verified Baseline",
        isSampleData: true,
      });
    }

    // 4. Clean domain-appropriate testimonials with mandatory placeholder tags
    const testimonials = [
      {
        author: "Alex Morgan",
        role: "Domain Specialist",
        location: "Regional Center",
        quote: `The precision and workflow clarity provided by ${brandName} set a verified standard for everyday operations.`,
        rating: 5,
        isPlaceholder: true as const,
        isSampleData: true,
      },
      {
        author: "Taylor Vance",
        role: "Operations Lead",
        location: "Field Station",
        quote: `Operational reliability and clear record inspection have transformed how our team manages resources.`,
        rating: 5,
        isPlaceholder: true as const,
        isSampleData: true,
      },
    ];

    // 5. Clean image search keywords derived from domain nouns (zero raw URLs)
    const promptWords = promptText
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w: string) => w.length > 3 && !/^(build|create|website|platform|with|that|this|from|offering|specializing|monitoring)$/i.test(w))
      .slice(0, 6);

    const primaryKeywords = promptWords.length > 0 ? promptWords.join(" ") : `${domainCategory.toLowerCase()} photography`;

    return {
      brand: {
        name: brandName,
        tagline: `${domainCategory} & Operational Precision`,
        valueProposition: `Authentic domain workflows, verified data management, and specialized tools engineered for ${brandName}.`,
        contact: {
          phone: "+1 (800) 555-0142",
          email: `contact@${brandName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
          hours: "Mon–Fri: 9:00 AM – 6:00 PM",
          address: "100 Innovation Corridor, Suite 400",
        },
      },
      navigationLabels,
      pages,
      mockRecords,
      testimonials,
      imageKeywords: {
        hero: `${primaryKeywords} editorial lighting professional photography`,
        features: [
          `${promptWords[0] || "product"} craftsmanship detail`,
          `${promptWords[1] || "system"} workspace modern`,
        ],
        gallery: [
          `${promptWords[2] || "studio"} interior spatial daylight`,
          `${promptWords[3] || "process"} verified procedure`,
        ],
      },
    };
  }
}

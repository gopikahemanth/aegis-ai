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

    const authoritativeBrand =
      (brief as any).brand?.name ||
      (brief as any).brandName ||
      NavigationDesignResolver.extractBrandFromPrompt((brief as any).userPrompt || (brief as any).rawPrompt || "") ||
      (brief as any).appName ||
      NavigationDesignResolver.sanitizeBrandName(undefined, (brief as any).rawPrompt || "") ||
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
   * Domain-tailored fallback content if LLM fails.
   */
  public fallbackContent(featureMatrix: FeatureMatrix, brief: ProductDesignBrief): SiteContentModel {
    const authoritativeBrand =
      (brief as any).brand?.name ||
      (brief as any).brandName ||
      NavigationDesignResolver.extractBrandFromPrompt((brief as any).userPrompt || (brief as any).rawPrompt || "") ||
      (brief as any).appName ||
      NavigationDesignResolver.sanitizeBrandName(undefined, (brief as any).rawPrompt || "") ||
      "";

    const cat = (featureMatrix.category || "").toLowerCase();
    const promptLower = (((brief as any).rawPrompt || (brief as any).userPrompt || "") + " " + cat).toLowerCase();

    // 0. Culinary Travel Magazine & Gastronomic Journal
    if (
      promptLower.includes("culinary") ||
      promptLower.includes("food journey") ||
      promptLower.includes("recipe") ||
      promptLower.includes("gastronom") ||
      promptLower.includes("savorline") ||
      authoritativeBrand.toLowerCase().includes("savorline")
    ) {
      const brandName = authoritativeBrand || "SAVORLINE";
      return {
        brand: {
          name: brandName,
          tagline: "Epicurean Expeditions & Terroir Monograph",
          valueProposition: "Curated regional food journeys, chef profiles, terroir guides, seasonal recipes, and bespoke culinary itineraries.",
          contact: { phone: "+1 (415) 555-7820", email: "concierge@savorline.com", hours: "Quarterly Print & Digital", address: "Pier 17, The Embarcadero, San Francisco, CA" }
        },
        navigationLabels: {
          "/": "Monograph",
          "/editorial-stories": "Stories",
          "/explore-culinary-destinations": "Destinations",
          "/and-filter-recipes": "Recipes",
          "/saved-discoveries": "Saved",
          "/build-custom-itinerary": "Itinerary"
        },
        pages: {
          "/": {
            title: `${brandName} | Culinary Travel Magazine`,
            headline: "Terroir Inquiries Across Wood-Fired Hearths, Coasts, and Ancient Soil",
            subheadline: "Deep narrative essays and sensory photography exploring regional food traditions, artisan producers, and heirloom craft.",
            primaryCta: "Read Monograph",
            secondaryCta: "Explore Terroir Atlas",
            highlights: [
              { label: "Terroir Monographs", description: "Uncompromising spatial food journalism exploring indigenous ingredients and heirloom seeds." },
              { label: "Kitchen Companion", description: "Scaled proportions, seasonal harvest profiles, and step-by-step masterclass technique notes." }
            ]
          }
        },
        mockRecords: [
          { id: "cul-1", title: "Nordic Fermented Chanterelle Tartine", region: "Scandinavia", category: "Recipe", prepTime: "45 mins", difficulty: "Master" },
          { id: "cul-2", title: "San Sebastián & Basque Masonry Hearths", region: "Basque Country", category: "Destination", season: "Autumn", highlights: "Txakoli Vineyards & Fish Guilds" },
          { id: "cul-3", title: "Kyoto & Timber Machiya Broths", region: "Kansai, Japan", category: "Editorial", readTime: "12 min", author: "Kenji Sato" }
        ],
        testimonials: [
          { author: "Alice Waters", role: "Chef & Author", location: "Berkeley", quote: "Savorline captures the soul of terroir journalism with tactile elegance and reverence for the soil.", rating: 5, isPlaceholder: true, isSampleData: true },
          { author: "René Redzepi", role: "Culinary Pioneer", location: "Copenhagen", quote: "The depth of food travel and artisan chronicle here is what contemporary food publishing has been waiting for.", rating: 5, isPlaceholder: true, isSampleData: true }
        ],
        imageKeywords: {
          hero: "editorial food photography rustic wooden table chanterelles fermentation",
          features: ["artisan sourdough wood fired hearth oven", "harvest market fresh heirloom produce"],
          gallery: ["chefs plating in open kitchen candlelight", "vineyard landscape morning fog terroir"]
        }
      };
    }

    // 1. Kazzoo / Fantasy Adventure Universe
    if (promptLower.includes("kazzoo") || promptLower.includes("claymation") || promptLower.includes("fantasy") || promptLower.includes("whimsical")) {
      return {
        brand: {
          name: "Kazzoo Fantasy Adventure",
          tagline: "Whimsical Claymation Universe for Families",
          valueProposition: "Interactive 3D world explorer, quest maps, tactile soundboard, and magical companion encounters.",
          contact: { phone: "+1 (800) 555-ZOOM", email: "adventures@kazzoo-world.com", hours: "Always Enchanted", address: "Mossy Hill Summit, Sector 7" }
        },
        navigationLabels: { "/": "World Stage", "/characters": "Characters", "/quest-map": "Quests", "/soundboard": "Soundboard", "/explorer": "Realm Telemetry" },
        pages: {
          "/": {
            title: "Kazzoo | 3D Claymation Fantasy Universe",
            headline: "Wander Across Rolling Moss Hills and Pastel Sky Realms",
            subheadline: "Meet claymation creatures, solve whimsical world puzzles, and unlock magical voice clips across the realm.",
            primaryCta: "Launch 3D Explorer",
            secondaryCta: "Discover Quests",
            highlights: [
              { label: "Claymation 3D Engine", description: "Volumetric clouds, tactile shaders, and living ambient creatures." },
              { label: "Magical Soundboard", description: "Interactive audio crystals tuned to enchanted forest frequencies." }
            ]
          }
        },
        mockRecords: [
          { id: "char-1", name: "Pip the Mossling", realm: "Emerald Glade", ability: "Spore Flight", favoriteSnack: "Sunlit Dewdrop", voiceClip: "pip_hello.mp3" },
          { id: "char-2", name: "Grumble the Stone Snail", realm: "Obsidian Peak", ability: "Earthquake Rumble", favoriteSnack: "Lichen Crust", voiceClip: "grumble_laugh.mp3" },
          { id: "char-3", name: "Lumi the Cloud Sprite", realm: "Pastel Stratosphere", ability: "Prism Burst", favoriteSnack: "Starlight Mist", voiceClip: "lumi_twinkle.mp3" }
        ],
        testimonials: [
          { author: "Maya & Leo", role: "Adventurer Duo", location: "Portland", quote: "The claymation world feels like a playable Pixar movie. We spent two hours just poking the mossy snail!", rating: 5, isPlaceholder: true, isSampleData: true },
          { author: "Elena Rostova", role: "Parent & Animator", location: "Vancouver", quote: "The tactile warmth and sound design are unforgettable. The kids keep asking to visit Kazzoo every evening.", rating: 5, isPlaceholder: true, isSampleData: true }
        ],
        imageKeywords: {
          hero: "claymation fantasy creature mossy green hills pastel sky",
          features: ["magical glowing crystal soundboard", "handcrafted clay adventure map"],
          gallery: ["whimsical 3d character smiling", "volumetric clouds pastel landscape"]
        }
      };
    }

    // 2. Luxury Watch Studio / Horology
    if (promptLower.includes("watch") || promptLower.includes("horology") || promptLower.includes("timepiece") || promptLower.includes("artisan watch")) {
      return {
        brand: {
          name: "Chronos Atelier Horlogerie",
          tagline: "Hand-Finished Mechanical Timepieces",
          valueProposition: "Bespoke calibers, hand-chamfered bridges, and grand feu enamel dials crafted for generational permanence.",
          contact: { phone: "+41 22 555 8820", email: "concierge@chronos-atelier.ch", hours: "By Private Appointment", address: "14 Rue du Rhône, Geneva" }
        },
        navigationLabels: { "/": "Collection", "/craftsmanship": "Metiers d'Art", "/calibers": "In-House Calibers", "/story": "The Atelier", "/viewing": "Private Viewing" },
        pages: {
          "/": {
            title: "Chronos Atelier | Haute Horlogerie & Bespoke Watchmaking",
            headline: "Mechanical Precision Sculpted by Hand in Geneva",
            subheadline: "Explore bespoke complications, high-frequency tourbillons, and rare artisanal finishing.",
            primaryCta: "Inspect Calibers",
            secondaryCta: "Request Private Viewing",
            highlights: [
              { label: "Hand-Chamfered Bridges", description: "Anglage executed exclusively with natural gentian wood sticks." },
              { label: "Grand Feu Enamel", description: "Multi-layered vitrified dials fired at 840°C for eternal luster." }
            ]
          }
        },
        mockRecords: [
          { id: "watch-1", name: "Monolith Tourbillon No. 04", caseMaterial: "Grade 5 Titanium & Tantalum", diameterMm: 40.5, powerReserveHours: 72, price: 94000 },
          { id: "watch-2", name: "Astral Perpetual Calendar", caseMaterial: "18k Rose Gold", diameterMm: 39.0, powerReserveHours: 65, price: 128000 },
          { id: "watch-3", name: "Chrono-Régulateur Squelette", caseMaterial: "Stainless Steel 904L", diameterMm: 41.0, powerReserveHours: 50, price: 46000 }
        ],
        testimonials: [
          { author: "Laurent Mercier", role: "Horological Collector", location: "Zurich", quote: "The black polish on the tourbillon bridge is flawless under a 10x loupe. True Geneva seal caliber artistry.", rating: 5, isPlaceholder: true, isSampleData: true },
          { author: "Claire De Witt", role: "Architect", location: "Amsterdam", quote: "A masterclass in tactile proportions and restrained typography. It wears like architectural sculpture.", rating: 5, isPlaceholder: true, isSampleData: true }
        ],
        imageKeywords: {
          hero: "luxury mechanical watch movement macro tourbillon craftsmanship",
          features: ["hand chamfered watch balance wheel", "watchmaker loupe tweezers assembly"],
          gallery: ["rose gold case luxury timepiece wrist", "grand feu enamel dial reflection"]
        }
      };
    }

    // 2b. Contemporary Art Museum / Gallery
    if (promptLower.includes("museum") || promptLower.includes("art museum") || promptLower.includes("contemporary art") || promptLower.includes("gallery") || promptLower.includes("curatorial") || promptLower.includes("exhibition")) {
      const museumBrand = authoritativeBrand || "LUMEN HOUSE";
      return {
        brand: {
          name: museumBrand,
          tagline: "Contemporary Art & Spatial Monograph Pavilion",
          valueProposition: "Curated contemporary exhibitions, artist monographs, spatial floor exploration, and curator audio commentary.",
          contact: { phone: "+1 (212) 555-8420", email: `curator@${museumBrand.toLowerCase().replace(/[^a-z0-9]/g, "")}.org`, hours: "Tue–Sun 10:00–18:00 (Thu until 21:00)", address: "548 West 22nd Street, New York, NY" }
        },
        navigationLabels: {
          "/": "Pavilion",
          "/rotating-exhibitions": "Exhibitions",
          "/explore-artist-profiles": "Artists",
          "/search-semantic-artworks": "Collection",
          "/navigate-interactive-floor-plan": "Floor Plan",
          "/listen-to-audio-guide": "Audio Guide",
          "/plan-museum-visit": "Visit Plan",
          "/saved-artworks": "Saved Artworks"
        },
        pages: {
          "/": {
            title: `${museumBrand} | Contemporary Art & Spatial Monograph Pavilion`,
            headline: "Spatial Light, Material Truth & Monumental Form",
            subheadline: "Experience rotating contemporary exhibitions, curatorial audio walkthroughs, and deep collection archives.",
            primaryCta: "View Exhibitions",
            secondaryCta: "Plan Your Visit",
            highlights: [
              { label: "Curated Monoliths", description: "Large-scale sculptural and canvas installations by leading international artists." },
              { label: "Binaural Audio Tours", description: "In-depth commentary, artist interviews, and curatorial context for every room." }
            ]
          }
        },
        mockRecords: [
          { id: "exh-1", title: "Resonance of the Monolith: Spatial Bronzes", curator: "Elena Rostova", wing: "North Atrium", startDate: "2026-09-15", endDate: "2027-01-20" },
          { id: "exh-2", title: "Void & Pigment: Post-War Minimalist Canvas", curator: "Julian Thorne", wing: "East Wing Level 2", startDate: "2026-10-01", endDate: "2027-03-15" },
          { id: "exh-3", title: "Generative Luminance: Light Ribs & Frequencies", curator: "Maya Lin-Hasegawa", wing: "South Pavilion", startDate: "2026-11-10", endDate: "2027-04-30" }
        ],
        testimonials: [
          { author: "Claire De Witt", role: "Art Forum Contributor", location: "London", quote: "LUMEN HOUSE redefines the contemporary gallery encounter—spatial stillness and curatorial bravery in equal measure.", rating: 5, isPlaceholder: true, isSampleData: true },
          { author: "Kenji Sato", role: "Architectural Historian", location: "Tokyo", quote: "The architectural dialogue between light, void, and monolithic bronze sculptures is unforgettable.", rating: 5, isPlaceholder: true, isSampleData: true }
        ],
        imageKeywords: {
          hero: "contemporary art museum gallery minimalist architecture white cube sculpture",
          features: ["large scale bronze sculpture in modern gallery", "minimalist canvas painting exhibition room"],
          gallery: ["spatial museum floor plan modern atrium", "curator audio guide headset visitor gallery"]
        }
      };
    }

    const isOperationalDomain = /\b(avionics|aerospace|aircraft|flight|aviation|telemetry|scada|radar|defense|satellite|drone|uav|mission control|cockpit|subsystem|firmware|airframe)\b/i.test(promptLower);
    if (isOperationalDomain) {
      const brand = promptLower.includes("stratos") ? "Stratos Avionics" : "Aero Telemetry";
      return {
        brand: {
          name: brand,
          tagline: "Mission Telemetry & Integrated Avionics Control",
          valueProposition: "High-frequency flight telemetry streaming, integrated glass cockpit avionics, and active airspace fleet monitoring.",
          contact: { phone: "+1 (800) 555-0199", email: "ops@stratos-avionics.io", hours: "24/7 Mission Operations", address: "Hangar 4, Airfield Way, Mojave, CA" }
        },
        navigationLabels: { "/": "Command Deck", "/fleet": "Fleet Ops", "/telemetry": "Telemetry Stream", "/flight-plans": "Flight Routing", "/diagnostics": "Diagnostics" },
        pages: {
          "/": {
            title: `${brand} | Flight Telemetry Command`,
            headline: "Integrated Glass Cockpit & High-Density Telemetry",
            subheadline: "Real-time attitude vectors, transponder tracking, and subsystem bus diagnostics.",
            primaryCta: "Launch Deck",
            secondaryCta: "Inspect Fleet",
            highlights: [
              { label: "High-Frequency Stream", description: "Sub-millisecond sensor bus data with attitude and barometric telemetry." },
              { label: "Airspace Ledger", description: "Real-time ADS-B transponder tracking and fleet maintenance status." }
            ]
          }
        },
        mockRecords: [
          { id: "ac-101", tailNumber: "N742SA", airframe: "Stratos Jetstream IV", squawk: "1200", altitude: 34000, airspeed: 460, heading: 90, status: "Airborne" },
          { id: "ac-102", tailNumber: "N889AF", airframe: "AeroPulse Long-Range", squawk: "3412", altitude: 28000, airspeed: 410, heading: 270, status: "Airborne" },
          { id: "ac-103", tailNumber: "N104TG", airframe: "Stratos Cargo Cruiser", squawk: "0000", altitude: 0, airspeed: 0, heading: 180, status: "Maintenance" }
        ],
        testimonials: [
          { author: "Capt. Marcus Vance", role: "Chief Test Pilot", location: "Mojave Air & Space Port", quote: "The real-time telemetry display provides immediate situational awareness under high-g flight regimes.", rating: 5, isPlaceholder: true, isSampleData: true },
          { author: "Elena Rostova", role: "Flight Operations Director", location: "Zurich", quote: "Subsystem anomaly alerts caught bus voltage fluctuations well before routine maintenance intervals.", rating: 5, isPlaceholder: true, isSampleData: true }
        ],
        imageKeywords: {
          hero: "modern jet cockpit avionics hud glass display telemetry night",
          features: ["aircraft flight instrument panel digital readout", "aerospace runway mission control telemetry room"],
          gallery: ["private jet flying above cloud layer twilight", "aerospace engineering laboratory avionics testing"]
        }
      };
    }

    // 3. Architecture Journal / Monograph
    const isArchPublication = !isOperationalDomain && !/\b(software architecture|system architecture|data architecture|application architecture|required by the architecture|backend architecture|cloud architecture)\b/i.test(promptLower) && /\b(architectural\s+(?:monograph|journal|review|digest|firm|studio|practice|portfolio|criticism)|architecture\s+(?:firm|studio|monograph|journal|magazine|exhibition)|building\s+typolog(?:y|ies)|spatial\s+(?:monograph|essay)|tectonic\s+journal)\b/i.test(promptLower);
    if (isArchPublication) {
      return {
        brand: {
          name: "Tectonic Journal",
          tagline: "Independent Critical Architectural Discourse",
          valueProposition: "Longform critical essays, full-bleed spatial photography, and structural monographs examining built form.",
          contact: { phone: "+1 (212) 555-9310", email: "editors@tectonicjournal.org", hours: "Quarterly Print & Digital", address: "401 Broadway, New York, NY" }
        },
        navigationLabels: { "/": "Monograph", "/essays": "Critical Essays", "/case-studies": "Spatial Studies", "/architects": "Profiles", "/archive": "Folio Archive" },
        pages: {
          "/": {
            title: "Tectonic Journal | Critical Architecture & Spatial Essays",
            headline: "Spatial Inquiries Across Concrete, Light, and Earth",
            subheadline: "Unconventional typography and full-screen monographs exploring progressive structural works.",
            primaryCta: "Read Monograph",
            secondaryCta: "Browse Case Studies",
            highlights: [
              { label: "Monograph Coverage", description: "Uncompromising 8,000-word spatial analyses free from sponsor influence." },
              { label: "Medium-Format Folio", description: "Uncompressed architectural captures focusing on materiality and shadow." }
            ]
          }
        },
        mockRecords: [
          { id: "study-1", title: "Brutalist Sanctuary in the Kyoto Foothills", architect: "Kensuke Mori Architects", completedYear: 2024, typology: "Monastic Retreat", location: "Kyoto, Japan" },
          { id: "study-2", title: "Timber Cantilever Over the Patagonian Fjords", architect: "Estudio Austral", completedYear: 2023, typology: "Research Station", location: "Aysén, Chile" },
          { id: "study-3", title: "Subterranean Archive of Alpine Glaciology", architect: "Atelier Vaud", completedYear: 2025, typology: "Civic Archive", location: "Valais, Switzerland" }
        ],
        testimonials: [
          { author: "Dr. Silvia Rossi", role: "Professor of Architectural Theory", location: "Milan", quote: "Tectonic is the rare publication that treats architectural criticism with literary rigor and visual bravery.", rating: 5, isPlaceholder: true, isSampleData: true },
          { author: "Henrik Lindqvist", role: "Principal Architect", location: "Stockholm", quote: "The full-screen visual essays convey material presence better than any journal in circulation today.", rating: 5, isPlaceholder: true, isSampleData: true }
        ],
        imageKeywords: {
          hero: "raw concrete minimalist architectural pavilion shadow sunlight",
          features: ["medium format architectural photography timber structure", "monolithic geometric concrete staircase"],
          gallery: ["subterranean gallery natural lighting", "cantilever stone cliff architecture"]
        }
      };
    }

    if (cat.includes("resort") || cat.includes("hospitality")) {
      return {
        brand: {
          name: "Aura Oceanfront Sanctuary",
          tagline: "Private Villas & Coastal Living",
          valueProposition: "Secluded cliffside sanctuaries overlooking the turquoise Pacific with dedicated butler service.",
          contact: { phone: "+1 (800) 555-0199", email: "reservations@aurasanctuary.com", hours: "24/7 Concierge", address: "100 Pelican Cove, Big Sur, CA" }
        },
        navigationLabels: { "/": "Overview", "/accommodations": "Villas", "/dining": "Dining", "/experiences": "Excursions", "/booking": "Reserve" },
        pages: {
          "/": {
            title: "Private Coastal Sanctuary",
            headline: "Secluded Luxury on the Edge of the Pacific",
            subheadline: "Eighteen private oceanfront pavilions designed with natural basalt, teak, and floor-to-ceiling glass.",
            primaryCta: "Explore Pavilions",
            secondaryCta: "Reserve Dates",
            highlights: [
              { label: "Private Pools", description: "Every pavilion features a heated infinity plunge pool." },
              { label: "Farm-to-Table", description: "Organic ingredients harvested daily from our coastal garden." }
            ]
          }
        },
        mockRecords: [
          { id: "villa-1", name: "Cliffside Horizon Villa", pricePerNight: 950, sqFt: 1800, capacity: 2, view: "Full Oceanfront", amenities: ["Plunge Pool", "Outdoor Soaking Tub", "Butler Service"] },
          { id: "villa-2", name: "Azure Sanctuary Pavilion", pricePerNight: 1450, sqFt: 2600, capacity: 4, view: "Panoramic Coastal", amenities: ["Private Spa Pavilion", "Wine Cellar", "Chef Kitchen"] },
          { id: "villa-3", name: "Zen Garden Hideaway", pricePerNight: 750, sqFt: 1400, capacity: 2, view: "Botanical & Ocean", amenities: ["Meditation Garden", "Cedar Sauna", "Firepit"] }
        ],
        testimonials: [
          { author: "Evelyn Sterling", role: "Design Director", location: "San Francisco", quote: "The architectural restraint and coastal tranquility are unmatched. The quietest 4 nights of my year.", rating: 5, isPlaceholder: true, isSampleData: true },
          { author: "Marcus Vance", role: "Author & Architect", location: "New York", quote: "Incredible attention to natural light and local materials. Dining at the terrace was exceptional.", rating: 5, isPlaceholder: true, isSampleData: true }
        ],
        imageKeywords: {
          hero: "luxury coastal villa infinity pool sunset",
          features: ["modern architectural pavilion ocean view", "organic fine dining terrace table"],
          gallery: ["cedar bath ocean view", "private beach cove sunrise"]
        }
      };
    }

    if (/\b(car wash|auto spa|detailing|auto detail|car detail|wash bay)\b/i.test(cat)) {
      return {
        brand: {
          name: "Apex Precision Auto Spa",
          tagline: "Hand Wash & Ceramic Protection",
          valueProposition: "pH-neutral foam baths, spot-free deionized water rinses, and Gtechniq ceramic coating.",
          contact: { phone: "(555) 234-8901", email: "service@apexautospa.com", hours: "Mon-Sat: 7:30 AM - 6:00 PM", address: "442 Motor Mile Way, Austin, TX" }
        },
        navigationLabels: { "/": "Services", "/booking": "Book Bay", "/membership": "Wash Club", "/locations": "Locations" },
        pages: {
          "/": {
            title: "Precision Detailing & Ceramic Care",
            headline: "Showroom Finish in 35 Minutes",
            subheadline: "Hand-finished care with dual-action scratch-free microfibers and high-pressure undercarriage flush.",
            primaryCta: "Select Your Package",
            secondaryCta: "Join Wash Club",
            highlights: [
              { label: "Deionized Water", description: "Zero-spot rinse technology leaves no mineral deposits." },
              { label: "Ceramic Sealant", description: "Hydrophobic gloss barrier lasting up to 60 days." }
            ]
          }
        },
        mockRecords: [
          { id: "pkg-1", name: "Express Hand Wash", price: 28, durationMinutes: 20, includes: ["pH-Neutral Foam", "Hand Dry", "Tire Dressing", "Wheel Face Clean"] },
          { id: "pkg-2", name: "Apex Signature Detail", price: 55, durationMinutes: 40, includes: ["Express Wash", "Ceramic Sealant", "Interior Vacuum", "Dashboard Wipe", "Window Polish"] },
          { id: "pkg-3", name: "Paint Correction & Ceramic Pro", price: 185, durationMinutes: 90, includes: ["Full Detail", "Clay Bar Decontamination", "1-Step Machine Polish", "6-Month Hydrophobic Coat"] }
        ],
        testimonials: [
          { author: "Derrick Chen", role: "Porsche Club Member", location: "Austin", quote: "They understand soft clear-coats. Not a single swirl mark, and the tire dressing is never greasy.", rating: 5, isPlaceholder: true, isSampleData: true },
          { author: "Sarah Jenkins", role: "Daily Commuter", location: "Austin", quote: "The unlimited monthly pass saves me an hour every week. Always fast, always spot-free.", rating: 5, isPlaceholder: true, isSampleData: true }
        ],
        imageKeywords: {
          hero: "car wash thick foam lather sports car",
          features: ["wheel rim detailing brush cleaning", "mirror paint reflection ceramic coat"],
          gallery: ["clean interior leather dashboard", "water beading on car hood"]
        }
      };
    }

    if (cat.includes("saas") || cat.includes("project") || cat.includes("sprint")) {
      return {
        brand: {
          name: "SprintPulse Work OS",
          tagline: "Fast Engineering Coordination",
          valueProposition: "Connects GitHub PR blast radius directly to sprint backlog priorities without status meetings.",
          contact: { phone: "(800) 555-7890", email: "team@sprintpulse.io", hours: "99.99% Uptime", address: "Remote-First Architecture" }
        },
        navigationLabels: { "/": "Board", "/sprints": "Sprints", "/backlog": "Backlog", "/analytics": "Velocity" },
        pages: {
          "/": {
            title: "Engineering Sprint & Task Engine",
            headline: "Ship Weekly Without Guesswork",
            subheadline: "Real-time task boards with code-level PR risk analysis and automated dependency tracking.",
            primaryCta: "Open Task Board",
            secondaryCta: "View Sprint Velocity",
            highlights: [
              { label: "PR Blast Radius", description: "Instantly see how code changes impact shared services." },
              { label: "Async Standups", description: "Generates clear blocker alerts directly from git branch activity." }
            ]
          }
        },
        mockRecords: [
          { id: "task-101", title: "Migrate auth token storage to httpOnly cookies", points: 5, status: "In Progress", assignee: "Sarah K.", priority: "High" },
          { id: "task-102", title: "Implement Redis connection pooling for telemetry stream", points: 8, status: "Code Review", assignee: "Alex M.", priority: "Critical" },
          { id: "task-103", title: "Add multi-tenant webhook signature verification", points: 3, status: "To Do", assignee: "Devon L.", priority: "Medium" },
          { id: "task-104", title: "Refactor task board drag-drop column transitions", points: 5, status: "Done", assignee: "Sarah K.", priority: "Low" }
        ],
        testimonials: [
          { author: "Tara Sterling", role: "VP of Engineering", location: "Datacore Systems", quote: "Cut our cycle time from 11 days to 4 days. The PR blast radius badge stopped two major regressions last month.", rating: 5, isPlaceholder: true, isSampleData: true },
          { author: "Liam O'Connor", role: "Staff Architect", location: "Beacon AI", quote: "No fluff, no lagging animations. A tool engineered for developers who value keyboard navigation.", rating: 5, isPlaceholder: true, isSampleData: true }
        ],
        imageKeywords: {
          hero: "developer dashboard clean dark interface analytics",
          features: ["kanban board agile sprint columns", "code diff review monitor"],
          gallery: ["velocity burn down chart", "team productivity metrics"]
        }
      };
    }

    // Default Dynamic Domain Synthesis from brief / brand
    const rawBrand = authoritativeBrand || (brief as any).brandName || (brief as any).productName || "EXPERIENCE";
    const brandName = rawBrand.length > 25 ? "STUDIO PLATFORM" : rawBrand;
    return {
      brand: {
        name: brandName,
        tagline: brief.artDirectionRationale || "Curated Domain Experience",
        valueProposition: "Engineered with precision, domain clarity, and authentic interactive capabilities.",
        contact: { phone: "(555) 019-2834", email: "contact@experience.io", hours: "Mon-Fri: 9:00 AM - 6:00 PM", address: "Creative District, Studio 4" }
      },
      navigationLabels: { "/": "Explore", "/overview": "Overview", "/details": "Details", "/connect": "Contact" },
      pages: {
        "/": {
          title: `${brandName} | Official Experience`,
          headline: "Engineered for Discovery and Creative Interaction",
          subheadline: "Explore bespoke capabilities, detailed archives, and curated domain records.",
          primaryCta: "Explore Now",
          secondaryCta: "Learn More",
          highlights: [
            { label: "Authentic Design", description: "Bespoke typography, curated color palette, and responsive composition." },
            { label: "Interactive Architecture", description: "Fast client-side state transitions with rich interactive controls." }
          ]
        }
      },
      mockRecords: [
        { id: "rec-1", title: "Curated Showcase Feature 01", category: "Featured", status: "Active" },
        { id: "rec-2", title: "Precision Studio Work 02", category: "Archive", status: "Published" },
        { id: "rec-3", title: "Spatial Innovation Review 03", category: "Case Study", status: "Active" }
      ],
      testimonials: [
        { author: "Elena Rostova", role: "Design Principal", location: "New York", quote: "The attention to craft and typography sets a new benchmark for web experiences.", rating: 5, isPlaceholder: true, isSampleData: true }
      ],
      imageKeywords: {
        hero: "modern studio architecture minimalist clean design",
        features: ["tactile materials craftsmanship details", "editorial layout typography showcase"],
        gallery: ["monochrome studio workspace", "curated portfolio display"]
      }
    };
  }
}

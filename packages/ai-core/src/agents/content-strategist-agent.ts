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

    try {
      const prompt = `
BUSINESS CATEGORY: ${category}
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
- Provide 4-8 rich mock records matching the domain (e.g. villa suites with prices, wash packages with durations, tasks with story points).
- Provide 3 realistic customer testimonials. Every testimonial must have isSampleData: true.
- Provide descriptive image search keywords (e.g. "luxury oceanfront villa sunset", "hand soap wash detailing foam").

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
        maxTokens: 3500,
      });

      const extracted = this.jsonExtractor.extract(response);
      const parsed = JSON.parse(extracted) as SiteContentModel;

      // Filter check for banned phrases
      const cleansed = this.sanitizeContent(parsed);
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
   * Sanitizes copy to eliminate any banned marketing cliches that slipped past the LLM.
   */
  private sanitizeContent(content: SiteContentModel): SiteContentModel {
    const sanitizeText = (text: string): string => {
      let result = text;
      for (const banned of ContentStrategistAgent.BANNED_CLICHES) {
        const regex = new RegExp(`\\b${banned}\\b`, "gi");
        result = result.replace(regex, "proven");
      }
      return result;
    };

    // Sanitize brand
    if (content.brand) {
      content.brand.tagline = sanitizeText(content.brand.tagline);
      content.brand.valueProposition = sanitizeText(content.brand.valueProposition);
    }

    // Sanitize pages
    if (content.pages) {
      for (const route of Object.keys(content.pages)) {
        const page = content.pages[route];
        if (page) {
          page.headline = sanitizeText(page.headline);
          page.subheadline = sanitizeText(page.subheadline);
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
  [key: string]: any;
}

export const siteContent: SiteContent = ${JSON.stringify(content, null, 2)} as const;

export default siteContent;
`;

    writeFileSync(filePath, tsFileContent, "utf8");
  }

  /**
   * Domain-tailored fallback content if LLM fails.
   */
  public fallbackContent(featureMatrix: FeatureMatrix, brief: ProductDesignBrief): SiteContentModel {
    const cat = featureMatrix.category.toLowerCase();

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

    if (cat.includes("wash") || cat.includes("detailing") || cat.includes("auto")) {
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

    // Default Bakery / Artisan Patisserie
    return {
      brand: {
        name: "Hearth & Crust Millers",
        tagline: "Stone-Ground Sourdough & Patisserie",
        valueProposition: "Naturally fermented for 36 hours using heritage grains sourced from local family farms.",
        contact: { phone: "(555) 432-1098", email: "hello@hearthandcrust.com", hours: "Tue-Sun: 6:30 AM - 3:00 PM", address: "88 Market Row, Portland, OR" }
      },
      navigationLabels: { "/": "Daily Bakes", "/menu": "Breads", "/custom-cakes": "Cakes", "/about": "Our Grain" },
      pages: {
        "/": {
          title: "Artisan Wood-Fired Bakery",
          headline: "Slow Fermentation, Real Grain, Warm Loaves",
          subheadline: "Batches pulled fresh from our brick hearth every morning at 6:30 AM and 11:30 AM.",
          primaryCta: "Order for Today",
          secondaryCta: "Custom Cake Inquiry",
          highlights: [
            { label: "36-Hour Sourdough", description: "Zero commercial yeast. 100% wild levain culture." },
            { label: "Heritage Grains", description: "Stone-milled within 48 hours of baking for maximum flavor." }
          ]
        }
      },
      mockRecords: [
        { id: "bread-1", title: "Country Rustic Sourdough Loaf", price: 9.50, flourType: "Hard Red Winter & Rye", fermentationHours: 36, inStock: true },
        { id: "bread-2", title: "Seeded Einkorn & Honey Boule", price: 11.00, flourType: "Organic Einkorn & Spelt", fermentationHours: 28, inStock: true },
        { id: "bread-3", title: "Kalamata Olive & Rosemary Sourdough", price: 10.50, flourType: "French T65 & Whole Wheat", fermentationHours: 32, inStock: false },
        { id: "pastry-1", title: "Laminated Almond & Vanilla Cardamom Croissant", price: 5.50, flourType: "European Pastry Butter", fermentationHours: 24, inStock: true }
      ],
      testimonials: [
        { author: "Chef Claire Dubost", role: "Restaurateur", location: "Portland", quote: "The crust blister and crumb structure are world-class. It is the only bread we serve at our tables.", rating: 5, isPlaceholder: true, isSampleData: true },
        { author: "Julian Ramos", role: "Neighborhood Regular", location: "Portland", quote: "Get here early for the seeded boule. Best crumb and genuine sour flavor in the Pacific Northwest.", rating: 5, isPlaceholder: true, isSampleData: true }
      ],
      imageKeywords: {
        hero: "fresh sourdough bread blistered crust wood board",
        features: ["baker kneading dough flour dust", "golden flaky butter croissant layers"],
        gallery: ["hearth oven fire baking", "artisan flour stone mill"]
      }
    };
  }
}

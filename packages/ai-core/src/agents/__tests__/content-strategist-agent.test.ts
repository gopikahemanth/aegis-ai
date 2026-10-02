import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ContentStrategistAgent } from "../content-strategist-agent.js";
import type { AIProvider } from "../../providers/base.js";
import type { FeatureMatrix } from "../product-discovery-agent.js";
import { mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("ContentStrategistAgent", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `aegis_content_test_${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      try {
        rmSync(tempDir, { recursive: true, force: true });
      } catch {}
    }
  });

  const dummyMatrix: FeatureMatrix = {
    category: "Luxury Hospitality & Resort",
    corePages: ["/", "/villas", "/dining"],
    standardFeatures: [
      { name: "Villa Showcase", description: "Villas", requiredComponents: ["Grid"] },
    ],
    differentiatorFeatures: [
      { name: "Sommelier Tasting", description: "Wine tasting", requiredComponents: ["CellarCard"] },
    ],
    dataModels: [
      { name: "Villa", fields: ["id", "title"] },
    ],
  };

  const dummyBrief: any = {
    productCharacteristics: {
      emotionalTone: { primary: "luxurious" },
      experiencePattern: "booking-flow",
    },
    vocabularyContract: {
      required: ["villa", "suite"],
      forbidden: ["cheap"],
    },
  };

  it("sanitizes banned marketing cliches from headlines and copy", async () => {
    const mockResponse = JSON.stringify({
      brand: {
        name: "Azure Coast Resort",
        tagline: "Transform your getaway with our cutting-edge villas",
        valueProposition: "A seamless luxury retreat that empowers your vacation.",
        contact: { phone: "555-0199", email: "info@azure.com", hours: "24/7", address: "Coastal Rd" },
      },
      navigationLabels: { "/": "Home", "/villas": "Villas" },
      pages: {
        "/": {
          title: "Home",
          headline: "Welcome to our revolutionary platform",
          subheadline: "Get started today with an all-in-one solution for relaxation.",
          primaryCta: "Book",
          highlights: [{ label: "Pool", description: "Infinity pool" }],
        },
      },
      mockRecords: [{ id: "1", name: "Royal Villa", price: 1200 }],
      testimonials: [
        { author: "Jane Doe", role: "Traveler", quote: "A game-changer for my family.", rating: 5, isSampleData: true },
      ],
      imageKeywords: { hero: "resort villa ocean", features: ["pool"], gallery: ["sunset"] },
    });

    const mockProvider: AIProvider = {
      name: "mock-content",
      chat: vi.fn().mockResolvedValue(mockResponse),
    };

    const agent = new ContentStrategistAgent(mockProvider);
    const content = await agent.generateContent(dummyMatrix, dummyBrief, tempDir);

    // Banned cliches must be removed or sanitized
    expect(content.brand.tagline.toLowerCase()).not.toContain("transform your");
    expect(content.brand.tagline.toLowerCase()).not.toContain("cutting-edge");
    expect(content.pages["/"].headline.toLowerCase()).not.toContain("welcome to our");
    expect(content.pages["/"].subheadline.toLowerCase()).not.toContain("get started today");
    expect(content.pages["/"].subheadline.toLowerCase()).not.toContain("all-in-one solution");

    // Testimonial guardrail: must have isPlaceholder: true
    expect(content.testimonials[0].isPlaceholder).toBe(true);

    // Check file written to disk
    const writtenFile = join(tempDir, "src", "content", "site-content.ts");
    expect(existsSync(writtenFile)).toBe(true);
    const fileContent = readFileSync(writtenFile, "utf8");
    expect(fileContent).toContain("export const siteContent");
    expect(fileContent).toContain("Azure Coast Resort");
    expect(fileContent).toContain("isPlaceholder: true");
    expect(fileContent.startsWith("// SAMPLE CONTENT — replace testimonials, names, and quotes with real customer content before production use.")).toBe(true);

    // Ensure valid TS syntax structure
    expect(fileContent).toContain("export interface SiteContent");
    expect(fileContent).toContain("export default siteContent;");
  });

  it("strips raw image URLs and ensures only search terms are present", async () => {
    const mockResponseWithUrls = JSON.stringify({
      brand: {
        name: "Coastal Haven",
        tagline: "Unwind by the sea",
        valueProposition: "Direct ocean access with private cabanas.",
        contact: { phone: "555-0100", email: "stay@haven.com", hours: "Daily", address: "1 Shoreline" },
      },
      navigationLabels: { "/": "Home" },
      pages: {
        "/": {
          title: "Home",
          headline: "Serenity on the Shore",
          subheadline: "Escape the noise with private pavilions.",
          primaryCta: "Book",
          highlights: [{ label: "Beach", description: "Steps away" }],
        },
      },
      mockRecords: [{ id: "1", title: "Standard Villa" }],
      testimonials: [
        { author: "Sam Taylor", role: "Guest", quote: "Wonderful stay.", rating: 5, isPlaceholder: true },
      ],
      imageKeywords: {
        hero: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e luxury beach",
        features: ["https://unsplash.com/photos/abc private pool", "ocean cabana"],
        gallery: ["https://images.unsplash.com/photo-999 sunset dinner", "coastal breeze"],
      },
    });

    const mockProvider: AIProvider = {
      name: "mock-url-stripper",
      chat: vi.fn().mockResolvedValue(mockResponseWithUrls),
    };

    const agent = new ContentStrategistAgent(mockProvider);
    const content = await agent.generateContent(dummyMatrix, dummyBrief, tempDir);

    // Check no raw URLs remain in imageKeywords
    expect(content.imageKeywords.hero).not.toContain("http://");
    expect(content.imageKeywords.hero).not.toContain("https://");
    expect(content.imageKeywords.features.every(f => !f.includes("http://") && !f.includes("https://"))).toBe(true);
    expect(content.imageKeywords.gallery.every(g => !g.includes("http://") && !g.includes("https://"))).toBe(true);

    const writtenFile = join(tempDir, "src", "content", "site-content.ts");
    const fileContent = readFileSync(writtenFile, "utf8");
    expect(fileContent).not.toContain("https://images.unsplash.com");
  });

  it("produces rich domain fallback content if LLM fails with isPlaceholder and no URLs", async () => {
    const mockProvider: AIProvider = {
      name: "mock-fail",
      chat: vi.fn().mockRejectedValue(new Error("LLM Rate Limit")),
    };

    const agent = new ContentStrategistAgent(mockProvider);
    const content = await agent.generateContent(dummyMatrix, dummyBrief, tempDir);

    expect(content).toBeDefined();
    expect(content.brand.name).toContain("Aura Oceanfront Sanctuary");
    expect(content.mockRecords.length).toBeGreaterThan(0);
    expect(content.testimonials.every(t => t.isPlaceholder === true)).toBe(true);

    const writtenFile = join(tempDir, "src", "content", "site-content.ts");
    expect(existsSync(writtenFile)).toBe(true);
    const fileContent = readFileSync(writtenFile, "utf8");
    expect(fileContent.startsWith("// SAMPLE CONTENT — replace testimonials, names, and quotes with real customer content before production use.")).toBe(true);
    expect(fileContent).not.toContain("https://");
  });
});

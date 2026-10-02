import { describe, it, expect, vi } from "vitest";
import { ProductDiscoveryAgent } from "../product-discovery-agent.js";
import type { AIProvider } from "../../providers/base.js";
import type { ProductCharacteristics } from "../../design/product-understanding.js";

describe("ProductDiscoveryAgent", () => {
  const dummyCharacteristics: ProductCharacteristics = {
    audienceContext: {
      isPersonal: false,
      isConsumer: true,
      isProfessional: false,
      isEnterprise: false,
      ageGroup: "adult",
      techSavviness: "moderate",
    },
    primaryActivity: "booking-ordering",
    emotionalTone: {
      primary: "luxurious",
      avoidTones: ["playful"],
    },
    informationDensity: "moderate",
    isDataDriven: false,
    isVisualFirst: true,
    isTextFirst: false,
    requiresRealTime: false,
    experiencePattern: "booking-flow",
    vocabularyContract: {
      required: ["villa", "suite", "sanctuary"],
      preferred: ["reserve", "oceanfront"],
      forbidden: ["cheap", "budget"],
    },
    targetAudience: "Luxury travelers",
    primaryAction: "Reserve Villa",
  };

  it("parses valid LLM JSON response into FeatureMatrix", async () => {
    const mockResponse = JSON.stringify({
      category: "Luxury Hospitality & Resort",
      corePages: ["/", "/villas", "/dining", "/booking"],
      standardFeatures: [
        {
          name: "Villa Showcase",
          description: "Photos, square footage, and amenities.",
          requiredComponents: ["VillaGrid"],
          requiredDataFields: ["name", "pricePerNight"],
        },
        {
          name: "Date Range Booking",
          description: "Check-in and check-out date picker.",
          requiredComponents: ["DatePicker"],
          requiredDataFields: ["checkIn", "checkOut"],
        },
      ],
      differentiatorFeatures: [
        {
          name: "Private Yacht Concierge",
          description: "Exclusive yacht charter reservation.",
          requiredComponents: ["YachtCharterCard"],
          requiredDataFields: ["charterType", "hours"],
        },
      ],
      dataModels: [
        { name: "Villa", fields: ["id", "name", "pricePerNight"] },
        { name: "Reservation", fields: ["id", "checkIn", "checkOut"] },
      ],
    });

    const mockProvider: AIProvider = {
      name: "mock-gemini",
      chat: vi.fn().mockResolvedValue(mockResponse),
    };

    const agent = new ProductDiscoveryAgent(mockProvider);
    const matrix = await agent.discover("luxury resort website", dummyCharacteristics);

    expect(matrix.category).toBe("Luxury Hospitality & Resort");
    expect(matrix.corePages).toContain("/villas");
    expect(matrix.standardFeatures.length).toBe(2);
    expect(matrix.differentiatorFeatures[0].name).toBe("Private Yacht Concierge");
    expect(matrix.dataModels.length).toBe(2);
  });

  it("falls back to deterministic domain matrix when LLM response is malformed without throwing", async () => {
    const mockProvider: AIProvider = {
      name: "mock-failing",
      chat: vi.fn().mockResolvedValue("Sorry, I cannot generate JSON for this right now."),
    };

    const agent = new ProductDiscoveryAgent(mockProvider);
    const matrix = await agent.discover("luxury resort website with villa booking", dummyCharacteristics);

    expect(matrix).toBeDefined();
    expect(matrix.category).toBe("Luxury Hospitality & Resort");
    expect(matrix.standardFeatures.length).toBeGreaterThan(0);
    expect(matrix.differentiatorFeatures.length).toBeGreaterThan(0);
    expect(matrix.dataModels.length).toBeGreaterThan(0);
  });

  it("falls back to automotive detailing matrix for car wash prompts", async () => {
    const mockProvider: AIProvider = {
      name: "mock-throw",
      chat: vi.fn().mockRejectedValue(new Error("API Timeout")),
    };

    const agent = new ProductDiscoveryAgent(mockProvider);
    const matrix = await agent.discover("local car wash with service tiers", {
      ...dummyCharacteristics,
      experiencePattern: "booking-flow",
      primaryActivity: "booking-ordering",
    });

    expect(matrix.category).toBe("Automotive Detailing & Care");
    expect(matrix.standardFeatures.some(f => f.name.includes("Service Tier"))).toBe(true);
    expect(matrix.differentiatorFeatures.length).toBeGreaterThanOrEqual(2);
  });

  it("falls back to bakery matrix for bakery prompts", async () => {
    const mockProvider: AIProvider = {
      name: "mock-throw",
      chat: vi.fn().mockRejectedValue(new Error("API Error")),
    };

    const agent = new ProductDiscoveryAgent(mockProvider);
    const matrix = await agent.discover("artisan bakery daily sourdough menu", dummyCharacteristics);

    expect(matrix.category).toBe("Artisan Bakery & Patisserie");
    expect(matrix.standardFeatures.some(f => f.name.includes("Bread & Pastry"))).toBe(true);
    expect(matrix.differentiatorFeatures.length).toBeGreaterThanOrEqual(2);
  });

  it("differentiatorFeatures differ across two calls with different seed hashes for the same category", async () => {
    const mockProvider: AIProvider = {
      name: "mock-throw",
      chat: vi.fn().mockRejectedValue(new Error("API Timeout")),
    };

    const agent = new ProductDiscoveryAgent(mockProvider);
    const matrixA = await agent.discover("local car wash with service tiers", dummyCharacteristics, "seed_alpha_123");
    const matrixB = await agent.discover("local car wash with service tiers", dummyCharacteristics, "seed_beta_789");

    expect(matrixA.category).toBe("Automotive Detailing & Care");
    expect(matrixB.category).toBe("Automotive Detailing & Care");
    expect(matrixA.differentiatorFeatures.length).toBeGreaterThanOrEqual(1);
    expect(matrixB.differentiatorFeatures.length).toBeGreaterThanOrEqual(1);

    const namesA = matrixA.differentiatorFeatures.map(f => f.name).sort().join(",");
    const namesB = matrixB.differentiatorFeatures.map(f => f.name).sort().join(",");
    expect(namesA).not.toBe(namesB);
  });

  it("authoritatively provides primaryLandingFeature or defaults to first standardFeature", async () => {
    // Case 1: Fallback sets explicit primaryLandingFeature
    const failingProvider: AIProvider = {
      name: "mock-throw",
      chat: vi.fn().mockRejectedValue(new Error("API Timeout")),
    };
    const agent = new ProductDiscoveryAgent(failingProvider);
    const bakeryMatrix = await agent.discover("artisan bakery sourdough", dummyCharacteristics);
    expect(bakeryMatrix.primaryLandingFeature).toBe("Daily Fresh Bread & Pastry Catalog");

    // Case 2: LLM omits primaryLandingFeature, auto-defaults to standardFeatures[0].name
    const mockProvider: AIProvider = {
      name: "mock-gemini",
      chat: vi.fn().mockResolvedValue(JSON.stringify({
        category: "EdTech Learning Platform",
        corePages: ["/", "/courses", "/quizzes"],
        standardFeatures: [
          { name: "Course Catalog & Discovery", description: "Filterable courses", requiredComponents: ["Grid"] },
          { name: "Certificate Downloader", description: "Download PDF certs", requiredComponents: ["Cert"] }
        ],
        differentiatorFeatures: [
          { name: "AI Tutor Quiz", description: "Interactive quiz", requiredComponents: ["Quiz"] }
        ],
        dataModels: [{ name: "Course", fields: ["id", "title"] }]
      })),
    };
    const edtechAgent = new ProductDiscoveryAgent(mockProvider);
    const edtechMatrix = await edtechAgent.discover("edtech courses", dummyCharacteristics);
    expect(edtechMatrix.primaryLandingFeature).toBe("Course Catalog & Discovery");
  });
});

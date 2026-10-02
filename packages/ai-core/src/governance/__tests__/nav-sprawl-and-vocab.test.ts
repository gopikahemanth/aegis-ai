import { describe, it, expect } from "vitest";
import { ProductExperiencePlanManager } from "../../design/product-experience-plan.js";
import { FastDeterministicSanitizer } from "../fast-sanitizer.js";

describe("Nav Sprawl Prevention & Evidence Vocabulary Purity Invariants", () => {
  it("TEST 1: Evidence vocabulary strictly excludes meta-words ('user', 'wants', 'manage')", () => {
    const brief: any = {
      productCharacteristics: {
        experiencePattern: "personal-tracker",
        primaryActivity: "personal-tracking",
      },
      featurePriority: {
        features: [
          { name: "Care Schedules", userIntent: "User wants to manage botanical care schedules" },
          { name: "Growth Photos", userIntent: "User wants to upload photos and track growth" },
          { name: "Plant Inventory", userIntent: "User wants to view indoor plants and wellness" },
        ],
      },
    };

    const plan = ProductExperiencePlanManager.build(brief, {} as any, "plant companion app", null);
    expect(plan.requiredCapabilities.length).toBeGreaterThan(0);

    for (const cap of plan.requiredCapabilities) {
      expect(cap.evidenceVocabulary).not.toContain("user");
      expect(cap.evidenceVocabulary).not.toContain("users");
      expect(cap.evidenceVocabulary).not.toContain("wants");
      expect(cap.evidenceVocabulary).not.toContain("want");
      expect(cap.evidenceVocabulary).not.toContain("manage");
    }
  });

  it("TEST 2: toSingularStem normalizes singular and plural variations identically", () => {
    expect(FastDeterministicSanitizer.toSingularStem("care-schedules")).toBe("careschedule");
    expect(FastDeterministicSanitizer.toSingularStem("care-schedule")).toBe("careschedule");
    expect(FastDeterministicSanitizer.toSingularStem("CareSchedulesPage")).toBe("careschedule");
    expect(FastDeterministicSanitizer.toSingularStem("CareSchedulePage")).toBe("careschedule");

    expect(FastDeterministicSanitizer.toSingularStem("growth-photos")).toBe("growthphoto");
    expect(FastDeterministicSanitizer.toSingularStem("growth-photo")).toBe("growthphoto");

    expect(FastDeterministicSanitizer.toSingularStem("sunlight-profiles")).toBe("sunlightprofile");
    expect(FastDeterministicSanitizer.toSingularStem("sunlight-profile")).toBe("sunlightprofile");

    expect(FastDeterministicSanitizer.toSingularStem("inventories")).toBe("inventory");
    expect(FastDeterministicSanitizer.toSingularStem("inventory")).toBe("inventory");
  });

  it("TEST 3: Navbar stem deduplication collides plural/singular duplicates", () => {
    const rawPages = [
      { name: "CareSchedulePage", routePath: "/careschedule" },
      { name: "CareSchedulesPage", routePath: "/careschedules" },
      { name: "GrowthPhotoPage", routePath: "/growthphoto" },
      { name: "SunlightProfilePage", routePath: "/sunlightprofile" },
      { name: "PlantPage", routePath: "/plant" },
      { name: "SettingsPage", routePath: "/settings" },
    ];

    const seenStems = new Set<string>();
    const deduplicated = [];
    for (const p of rawPages) {
      const stem = FastDeterministicSanitizer.toSingularStem(p.name);
      if (!seenStems.has(stem)) {
        seenStems.add(stem);
        deduplicated.push(p);
      }
    }

    expect(deduplicated.length).toBe(5);
    expect(deduplicated.some(p => p.name === "CareSchedulePage")).toBe(true);
    expect(deduplicated.some(p => p.name === "CareSchedulesPage")).toBe(false);
  });
});

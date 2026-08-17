import { describe, it, expect } from "vitest";
import { ProductRequirementAnalyzer } from "../product-requirement-analyzer.js";
import { UXProductPlanner } from "../ux-product-planner.js";

describe("UXProductPlanner", () => {
  it("plans pages, navigation, and UI states covering all features", () => {
    const spec = ProductRequirementAnalyzer.analyze("Build Gym Management with members, trainers, attendance and workouts");
    const plan = UXProductPlanner.plan(spec);

    expect(plan.pages.length).toBeGreaterThanOrEqual(4);
    expect(plan.navigation.length).toBeGreaterThanOrEqual(4);

    const membersPage = plan.pages.find((p) => p.route === "/members");
    expect(membersPage).toBeDefined();
    expect(membersPage?.states).toContain("loading");
    expect(membersPage?.states).toContain("empty");
    expect(membersPage?.states).toContain("error");
  });
});

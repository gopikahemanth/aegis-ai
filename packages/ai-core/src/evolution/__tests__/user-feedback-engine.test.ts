import { describe, it, expect } from "vitest";
import { UserFeedbackEngine } from "../user-feedback-engine.js";

describe("UserFeedbackEngine", () => {
  it("converts user feedback into targeted evolution requests and preserves backend and database layers", () => {
    const existingFiles = [
      "src/components/Dashboard.tsx",
      "server/routes/members.ts",
      "prisma/schema.prisma",
    ];
    const existingFeatures = ["dashboard", "members"];

    const report = UserFeedbackEngine.processFeedback(
      "The dashboard looks too empty, please add modern css styling",
      existingFiles,
      existingFeatures
    );

    expect(report.targetGenerationType).toBe("UI_EVOLUTION");
    expect(report.impact.blastRadius).toBe("LOCAL");
    expect(report.preservedLayers).toContain("Backend / Controllers");
    expect(report.preservedLayers).toContain("Database Schema");
  });
});

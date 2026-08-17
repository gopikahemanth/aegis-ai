import { describe, it, expect } from "vitest";
import { UserFeedbackEngine } from "../user-feedback-engine.js";

describe("AEGIS Phase 61 — User Feedback Engine", () => {
  it("extracts desired capability, affected role, and problem statements from raw feedback", () => {
    const feedback = [
      "I want to export members to Excel.",
      "Mobile attendance checkin is difficult on staff phones.",
      "Can I automatically remind members about expired memberships?",
      "Managers need a monthly revenue report.",
    ];

    const parsed = UserFeedbackEngine.parseFeedback(feedback);
    expect(parsed.length).toBe(4);
    expect(parsed[0].desiredCapability).toContain("Member Data Bulk Export");
    expect(parsed[0].affectedRole).toBe("Gym Manager");
    expect(parsed[1].desiredCapability).toContain("Attendance");
    expect(parsed[2].desiredCapability).toContain("Expiration Reminders");
    expect(parsed[3].desiredCapability).toContain("Monthly Revenue");
  });
});

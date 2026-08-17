import { describe, it, expect } from "vitest";
import { RequirementTraceabilityMatrix } from "../requirement-traceability.js";
import { RequirementCompletenessValidator } from "../requirement-completeness-validator.js";

describe("RequirementCompletenessValidator", () => {
  it("flags INCOMPLETE when any user-requested requirement remains unverified", () => {
    const matrix = new RequirementTraceabilityMatrix();

    matrix.registerRequirement({
      requirementId: "req_members",
      userPrompt: "Manage members",
      source: "EXPLICIT",
      confidence: "HIGH",
      featureId: "members",
      contractHashes: {},
      taskIds: ["t1"],
      ownedFiles: [],
      verificationEvidence: [],
      status: "VERIFIED",
    });

    matrix.registerRequirement({
      requirementId: "req_workouts",
      userPrompt: "Track workouts",
      source: "EXPLICIT",
      confidence: "HIGH",
      featureId: "workouts",
      contractHashes: {},
      taskIds: ["t2"],
      ownedFiles: [],
      verificationEvidence: [],
      status: "PLANNED", // Not verified yet
    });

    const report1 = RequirementCompletenessValidator.validate(matrix);
    expect(report1.isComplete).toBe(false);
    expect(report1.missingRequirements.length).toBe(1);

    // Verify remaining requirement
    matrix.updateStatus("req_workouts", "VERIFIED", "Workout verification passed");
    const report2 = RequirementCompletenessValidator.validate(matrix);
    expect(report2.isComplete).toBe(true);
    expect(report2.verifiedCount).toBe(2);
  });
});

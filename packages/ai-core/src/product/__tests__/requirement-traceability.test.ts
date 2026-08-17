import { describe, it, expect } from "vitest";
import { RequirementTraceabilityMatrix } from "../requirement-traceability.js";

describe("RequirementTraceabilityMatrix", () => {
  it("tracks requirements from user prompt through tasks, files, and verification evidence", () => {
    const matrix = new RequirementTraceabilityMatrix();

    matrix.registerRequirement({
      requirementId: "req_attendance_001",
      userPrompt: "Members can check in to the gym",
      source: "EXPLICIT",
      confidence: "HIGH",
      featureId: "attendance",
      workflowId: "wf_member_checkin",
      contractHashes: { domain: "hash_gym" },
      taskIds: ["task_attendance_api", "task_attendance_ui"],
      ownedFiles: ["src/features/attendance/AttendanceCheckIn.tsx"],
      verificationEvidence: [],
      status: "PLANNED",
    });

    expect(matrix.verifyCompleteness().isComplete).toBe(false);

    matrix.updateStatus("req_attendance_001", "VERIFIED", "Passed API and Browser check-in tests");
    const completeness = matrix.verifyCompleteness();
    expect(completeness.isComplete).toBe(true);
    expect(completeness.completedCount).toBe(1);
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { EngineeringWorkQueue } from "../engineering-work-queue.js";

describe("AEGIS Phase 17 — Governed Engineering Work Queue", () => {
  beforeEach(() => {
    EngineeringWorkQueue.clear();
  });

  it("enqueues and lists work items sorted by strict priority weighting", () => {
    EngineeringWorkQueue.enqueue({
      projectId: "gym_proj",
      environment: "production",
      title: "Low debt cleanup",
      priority: "LOW",
      category: "TECH_DEBT",
      proposedAction: "Remove dead exports",
      authorizationRequired: false,
    });

    EngineeringWorkQueue.enqueue({
      projectId: "gym_proj",
      environment: "production",
      title: "Critical vulnerability patch",
      priority: "CRITICAL",
      category: "SECURITY",
      proposedAction: "Patch CVE-2024-9999",
      authorizationRequired: true,
    });

    const items = EngineeringWorkQueue.listItems("gym_proj");
    expect(items.length).toBe(2);
    expect(items[0].priority).toBe("CRITICAL");
    expect(items[1].priority).toBe("LOW");
  });
});

/**
 * EventContractDiffEngine Test Suite — Aegis V2.3 Project 2 Phase 7.3
 *
 * Tests:
 * - Event name rename diff computation
 * - Event field rename diff computation
 */

import { describe, it, expect } from "vitest";
import { EventContractDiffEngine } from "../runtime-contract/events/event-contract-diff-engine.js";
import type { EventContractNode } from "../runtime-contract/events/event-contract-model.js";

describe("EventContractDiffEngine Tests", () => {
  const contract: EventContractNode = {
    contractId: "event:task.updated",
    eventName: "task.updated",
    transport: "EVENT_EMITTER",
    producers: [],
    consumers: [],
  };

  it("TEST 1: Computes EVENT_NAME_RENAME diff", () => {
    const diffs = EventContractDiffEngine.computeDiff(contract, "EVENT_NAME_RENAME", {
      newEventName: "task.modified",
    });

    expect(diffs.length).toBe(1);
    expect(diffs[0].type).toBe("EVENT_NAME_RENAME");
    expect(diffs[0].newEventName).toBe("task.modified");
  });

  it("TEST 2: Computes EVENT_FIELD_RENAME diff", () => {
    const diffs = EventContractDiffEngine.computeDiff(contract, "EVENT_FIELD_RENAME", {
      renameField: { oldName: "priority", newName: "taskPriority" },
    });

    expect(diffs.length).toBe(1);
    expect(diffs[0].type).toBe("EVENT_FIELD_RENAME");
    expect(diffs[0].fieldDiff?.oldFieldName).toBe("priority");
    expect(diffs[0].fieldDiff?.newFieldName).toBe("taskPriority");
  });
});

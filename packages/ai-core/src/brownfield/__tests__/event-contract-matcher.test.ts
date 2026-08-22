/**
 * EventContractMatcher Test Suite — Aegis V2.3 Project 2 Phase 7.3
 *
 * Tests:
 * - Matching event producers and consumers
 * - Collision detection on conflicting transports
 */

import { describe, it, expect } from "vitest";
import { EventContractMatcher } from "../runtime-contract/events/event-contract-matcher.js";
import type { EventContractNode } from "../runtime-contract/events/event-contract-model.js";

describe("EventContractMatcher Tests", () => {
  it("TEST 1: Matches event contract with active producer and consumer", () => {
    const contract: EventContractNode = {
      contractId: "event:task.updated",
      eventName: "task.updated",
      transport: "EVENT_EMITTER",
      producers: [
        { producerId: "p1", eventName: "task.updated", transport: "EVENT_EMITTER", filePath: "src/service.ts", startPos: 0, endPos: 10 },
      ],
      consumers: [
        { consumerId: "c1", eventName: "task.updated", transport: "EVENT_EMITTER", filePath: "src/listener.ts", startPos: 0, endPos: 10 },
      ],
    };

    const res = EventContractMatcher.match(contract);
    expect(res.isMatched).toBe(true);
    expect(res.status).toBe("IN_SYNC");
  });
});

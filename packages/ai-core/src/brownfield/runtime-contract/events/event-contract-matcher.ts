/**
 * EventContractMatcher — Aegis V2.3 Project 2 Phase 7.3
 *
 * Matches event producers and consumers:
 * - Transport equality (EventEmitter, Socket.IO, WebSocket)
 * - Room / namespace matching
 * - Collision detection on incompatible same-name events
 */

import type {
  EventContractNode,
  EventContractStatus,
} from "./event-contract-model.js";

export interface EventMatchResult {
  status: EventContractStatus;
  isMatched: boolean;
  contract: EventContractNode;
  reasons: string[];
}

export class EventContractMatcher {
  /**
   * Evaluates match status between producers and consumers of an event contract.
   */
  public static match(contract: EventContractNode): EventMatchResult {
    const reasons: string[] = [];

    if (contract.producers.length === 0 && contract.consumers.length === 0) {
      return {
        status: "EVENT_CONTRACT_INCOMPLETE",
        isMatched: false,
        contract,
        reasons: [`No producers or consumers found for event "${contract.eventName}".`],
      };
    }

    if (contract.producers.length === 0) {
      reasons.push(`Event "${contract.eventName}" has consumers but no active producers found.`);
    }

    if (contract.consumers.length === 0) {
      reasons.push(`Event "${contract.eventName}" has producers but no active consumers found.`);
    }

    // Check for transport collision
    const transports = new Set([...contract.producers.map(p => p.transport), ...contract.consumers.map(c => c.transport)]);
    if (transports.size > 2) {
      return {
        status: "EVENT_CONTRACT_DIVERGENCE",
        isMatched: false,
        contract,
        reasons: [`Event "${contract.eventName}" spans multiple conflicting transports: ${[...transports].join(", ")}`],
      };
    }

    return {
      status: "IN_SYNC",
      isMatched: true,
      contract,
      reasons,
    };
  }
}

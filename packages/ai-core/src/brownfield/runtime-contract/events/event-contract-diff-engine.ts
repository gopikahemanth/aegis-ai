/**
 * EventContractDiffEngine — Aegis V2.3 Project 2 Phase 7.3
 *
 * Computes structural diffs for event contract operations.
 */

import type { EventContractNode, EventContractOperation } from "./event-contract-model.js";

export interface EventContractDiff {
  type: EventContractOperation;
  eventName: string;
  newEventName?: string;
  fieldDiff?: {
    type: "ADD" | "REMOVE" | "RENAME";
    oldFieldName?: string;
    newFieldName?: string;
  };
}

export class EventContractDiffEngine {
  /**
   * Computes structural diffs for requested event contract evolution.
   */
  public static computeDiff(
    contract: EventContractNode,
    operation: EventContractOperation,
    params: {
      newEventName?: string;
      newField?: { name: string; type: string };
      removeFieldName?: string;
      renameField?: { oldName: string; newName: string };
    }
  ): EventContractDiff[] {
    const diffs: EventContractDiff[] = [];

    if (operation === "EVENT_NAME_RENAME" && params.newEventName) {
      diffs.push({
        type: "EVENT_NAME_RENAME",
        eventName: contract.eventName,
        newEventName: params.newEventName,
      });
    } else if (operation === "EVENT_FIELD_RENAME" && params.renameField) {
      diffs.push({
        type: "EVENT_FIELD_RENAME",
        eventName: contract.eventName,
        fieldDiff: {
          type: "RENAME",
          oldFieldName: params.renameField.oldName,
          newFieldName: params.renameField.newName,
        },
      });
    } else if (operation === "EVENT_FIELD_ADD" && params.newField) {
      diffs.push({
        type: "EVENT_FIELD_ADD",
        eventName: contract.eventName,
        fieldDiff: {
          type: "ADD",
          newFieldName: params.newField.name,
        },
      });
    }

    return diffs;
  }
}

/**
 * Event Contract Model — Aegis V2.3 Project 2 Phase 7.3
 *
 * Types, interfaces, and status codes for asynchronous event contracts:
 * - EventEmitter (emit / on / addListener)
 * - Socket.IO (socket.emit / socket.on / io.to(...).emit)
 * - WebSocket (ws.send / ws.on("message"))
 * - Typed In-Process Event Bus
 */

import type { AstPatchOperation } from "../../ast-symbol-patch-planner.js";
import type { FilePatchDiff, DiffSummary, RiskLevel } from "../../patch-preview-engine.js";

// ─── Status Codes ──────────────────────────────────────────────────────────────

export type EventContractStatus =
  | "READY"
  | "BLOCKED"
  | "IN_SYNC"
  | "EVENT_CONTRACT_DIVERGENCE"
  | "EVENT_CONTRACT_INCOMPLETE"
  | "EVENT_PRODUCER_UNRESOLVED"
  | "EVENT_CONSUMER_UNRESOLVED"
  | "EVENT_PAYLOAD_UNRESOLVED"
  | "EVENT_ACK_CONTRACT_UNRESOLVED"
  | "WEBSOCKET_MESSAGE_CONTRACT_UNRESOLVED"
  | "BREAKING_EVENT_CONTRACT"
  | "PLAN_STALE";

export type EventTransportType =
  | "EVENT_EMITTER"
  | "SOCKET_IO"
  | "WEBSOCKET"
  | "TYPED_EVENT_BUS";

export type EventDirection = "PRODUCER" | "CONSUMER" | "BIDIRECTIONAL";

export type EventContractOperation =
  | "EVENT_FIELD_ADD"
  | "EVENT_FIELD_REMOVE"
  | "EVENT_FIELD_RENAME"
  | "EVENT_NAME_RENAME";

// ─── Event Node Descriptors ────────────────────────────────────────────────────

export interface EventProducerNode {
  producerId: string;
  eventName: string;
  transport: EventTransportType;
  filePath: string;
  emitterSymbol?: string;
  namespace?: string;
  room?: string;
  payloadExpression?: string;
  payloadTypeName?: string;
  hasAck?: boolean;
  startPos: number;
  endPos: number;
}

export interface EventConsumerNode {
  consumerId: string;
  eventName: string;
  transport: EventTransportType;
  filePath: string;
  receiverSymbol?: string;
  namespace?: string;
  room?: string;
  handlerSymbol?: string;
  payloadParamName?: string;
  payloadTypeName?: string;
  accessedProperties?: string[];
  hasAck?: boolean;
  startPos: number;
  endPos: number;
}

export interface EventContractNode {
  contractId: string;
  eventName: string;
  transport: EventTransportType;
  namespace?: string;
  room?: string;
  payloadTypeName?: string;
  runtimeSchemaName?: string;
  producers: EventProducerNode[];
  consumers: EventConsumerNode[];
}

// ─── Request & Plan Interfaces ─────────────────────────────────────────────────

export interface EventContractRequest {
  projectPath: string;
  operation: EventContractOperation;
  sourceFile: string;
  eventName: string;
  transport?: EventTransportType;
  newEventName?: string;
  newField?: {
    name: string;
    type: string;
    isOptional?: boolean;
    defaultValue?: string;
  };
  removeFieldName?: string;
  renameField?: {
    oldName: string;
    newName: string;
  };
  planHash?: string;
  preview?: EventContractPreview;
}

export interface EventContractPlan {
  operation: EventContractOperation;
  sourceFile: string;
  contract: EventContractNode;
  newEventName?: string;
  affectedFiles: string[];
  patchOperations: { filePath: string; operations: AstPatchOperation[] }[];
  riskLevel: RiskLevel;
  conflicts: string[];
  blockedReasons: string[];
  planHash: string;
  patchHash: string;
  status: EventContractStatus;
}

export interface EventContractPreview {
  mode: "EVENT_CONTRACT_REFACTOR";
  operation: EventContractOperation;
  repository: string;
  sourceFile: string;
  eventName: string;
  newEventName?: string;
  transport: EventTransportType;
  branchName: string;
  planHash: string;
  patchHash: string;
  status: EventContractStatus;
  riskLevel: RiskLevel;
  requiredFiles: string[];
  mayChangeFiles: string[];
  readOnlyFiles: string[];
  conflicts: string[];
  blockedReasons: string[];
  filePatches: { filePath: string; operations: AstPatchOperation[] }[];
  fileDiffs: FilePatchDiff[];
  diffSummary: DiffSummary;
  isApplyAllowed: boolean;
  preimages: Record<string, string>;
}

export interface EventContractExecutionResult {
  success: boolean;
  status: EventContractStatus | "SUCCESS" | "TEST_REGRESSION" | "BUILD_FAILED" | "GIT_DIRTY_TARGET";
  branchName?: string;
  touchedFiles: string[];
  planHash?: string;
  patchHash?: string;
  checkpointRolledBack?: boolean;
  error?: string;
}

/**
 * HTTP Contract Model — Aegis V2.3 Project 2 Phase 7.2
 *
 * Types, interfaces, and status codes for HTTP routes, controllers,
 * client fetch discovery, and endpoint matching.
 */

import type { AstPatchOperation } from "../../ast-symbol-patch-planner.js";
import type { FilePatchDiff, DiffSummary, RiskLevel } from "../../patch-preview-engine.js";

// ─── Status Codes ──────────────────────────────────────────────────────────────

export type HttpContractStatus =
  | "READY"
  | "BLOCKED"
  | "IN_SYNC"
  | "HTTP_CONTRACT_DIVERGENCE"
  | "HTTP_ENDPOINT_UNRESOLVED"
  | "HTTP_CONTROLLER_UNRESOLVED"
  | "HTTP_CLIENT_CONTRACT_UNRESOLVED"
  | "HTTP_CONTRACT_ANALYSIS_INCOMPLETE"
  | "HTTP_MIDDLEWARE_ANALYSIS_INCOMPLETE"
  | "HTTP_RESPONSE_CONTRACT_UNVERIFIABLE"
  | "BREAKING_HTTP_CONTRACT"
  | "PLAN_STALE";

export type HttpVerb = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export type HttpContractOperation =
  | "HTTP_ROUTE_RENAME"
  | "HTTP_METHOD_CHANGE"
  | "HTTP_REQUEST_SCHEMA_UPDATE"
  | "HTTP_RESPONSE_SCHEMA_UPDATE"
  | "HTTP_PARAM_ADD"
  | "HTTP_PARAM_REMOVE";

// ─── Endpoint Descriptors ──────────────────────────────────────────────────────

export interface HttpEndpointNode {
  endpointId: string;
  method: HttpVerb;
  path: string;
  normalizedPath: string; // e.g. /api/tasks/:id
  filePath: string;
  routerSymbol?: string;
  mountPrefix?: string;
  controllerSymbol?: string;
  controllerMethod?: string;
  handlerSymbol?: string;
  middlewareSymbols?: string[];
  requestSchemaSymbol?: string;
  responseTypeSymbol?: string;
  statusCodes?: number[];
  startPos: number;
  endPos: number;
}

export interface HttpClientEndpointNode {
  clientId: string;
  method: HttpVerb;
  rawUrl: string;
  normalizedPath: string; // e.g. /api/tasks/:id
  filePath: string;
  requestPayloadSymbol?: string;
  responseTypeSymbol?: string;
  callType: "fetch" | "api_wrapper" | "axios";
  startPos: number;
  endPos: number;
}

// ─── Request & Plan Interfaces ─────────────────────────────────────────────────

export interface HttpContractRequest {
  projectPath: string;
  operation: HttpContractOperation;
  sourceFile: string;
  endpointMethod: HttpVerb;
  endpointPath: string;
  newMethod?: HttpVerb;
  newPath?: string;
  requestSchema?: string;
  responseType?: string;
  planHash?: string;
  preview?: HttpContractPreview;
}

export interface HttpContractPlan {
  operation: HttpContractOperation;
  sourceFile: string;
  endpoint: HttpEndpointNode;
  clientConsumers: HttpClientEndpointNode[];
  newMethod?: HttpVerb;
  newPath?: string;
  affectedFiles: string[];
  patchOperations: { filePath: string; operations: AstPatchOperation[] }[];
  riskLevel: RiskLevel;
  conflicts: string[];
  blockedReasons: string[];
  planHash: string;
  patchHash: string;
  status: HttpContractStatus;
}

export interface HttpContractPreview {
  mode: "HTTP_CONTRACT_REFACTOR";
  operation: HttpContractOperation;
  repository: string;
  sourceFile: string;
  oldMethod: HttpVerb;
  newMethod: HttpVerb;
  oldPath: string;
  newPath: string;
  branchName: string;
  planHash: string;
  patchHash: string;
  status: HttpContractStatus;
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

export interface HttpContractExecutionResult {
  success: boolean;
  status: HttpContractStatus | "SUCCESS" | "TEST_REGRESSION" | "BUILD_FAILED" | "GIT_DIRTY_TARGET";
  branchName?: string;
  touchedFiles: string[];
  planHash?: string;
  patchHash?: string;
  checkpointRolledBack?: boolean;
  error?: string;
}

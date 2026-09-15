/**
 * Runtime Acceptance Contract — Aegis V2.3 Project 2 Phase 5.4
 *
 * Strongly-typed contracts for runtime acceptance, end-to-end user scenarios,
 * API verification, database validation, and deterministic quality evaluation.
 */

export type RuntimeAcceptanceStatus =
  | "READY"
  | "BLOCKED"
  | "STARTUP_FAILED"
  | "HEALTHCHECK_FAILED"
  | "API_CONTRACT_FAILED"
  | "USER_FLOW_FAILED"
  | "DATABASE_RUNTIME_FAILED"
  | "FRONTEND_RUNTIME_FAILED"
  | "PROCESS_TIMEOUT"
  | "PROCESS_CRASHED"
  | "ENVIRONMENT_INVALID"
  | "CLEANUP_FAILED"
  | "SUCCESS";

export type QualityDimension =
  | "STRUCTURE"
  | "TYPECHECK"
  | "BUILD"
  | "GENERATED_TESTS"
  | "FRONTEND_RUNTIME"
  | "BACKEND_RUNTIME"
  | "DATABASE"
  | "API_CONTRACT"
  | "USER_SCENARIOS"
  | "ERROR_HANDLING"
  | "CLEANUP";

export interface RuntimeService {
  name: string;
  type: "frontend" | "backend" | "fullstack";
  port: number;
  protocol: "http" | "https";
  status: "STARTING" | "RUNNING" | "STOPPED" | "FAILED";
  pid?: number;
  uptimeMs?: number;
}

export interface RuntimeEndpoint {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  expectedStatus: number;
  actualStatus?: number;
  latencyMs: number;
  status: "PASS" | "FAIL" | "SKIPPED";
  isNegativeTest?: boolean;
  responseShapeValid?: boolean;
}

export type ScenarioAction =
  | "navigate"
  | "click"
  | "input"
  | "assert_text"
  | "assert_element"
  | "api_call"
  | "db_query"
  | "negative_input";

export interface UserScenarioStep {
  id: string;
  action: ScenarioAction;
  target?: string;
  value?: string | number | Record<string, any>;
  expectedStatus?: number;
  expectedText?: string;
  description: string;
}

export interface UserScenarioStepResult {
  stepId: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  diagnostic?: string;
}

export interface UserScenario {
  id: string;
  name: string;
  description: string;
  steps: UserScenarioStep[];
}

export interface UserScenarioResult {
  scenarioId: string;
  name: string;
  passed: boolean;
  stepResults: UserScenarioStepResult[];
  durationMs: number;
  error?: string;
}

export interface RuntimeHealthResult {
  frontendHealthy: boolean;
  backendHealthy: boolean;
  databaseHealthy: boolean;
  details: string;
}

export interface RuntimeAcceptanceDiagnostic {
  phase: string;
  subsystem: string;
  category: RuntimeAcceptanceStatus;
  expected: string;
  actual: string;
  diagnostic: string;
  remediation: string;
  endpoint?: string;
  file?: string;
  stdout?: string;
  stderr?: string;
}

export interface GenerationQualityCheck {
  dimension: QualityDimension;
  name: string;
  passed: boolean;
  evidence: string;
  message: string;
}

export interface RuntimeAcceptanceRequest {
  projectRoot: string;
  frontendPort?: number;
  backendPort?: number;
  userScenarios?: UserScenario[];
  timeoutMs?: number;
  headlessBrowser?: boolean;
}

export interface RuntimeAcceptanceResult {
  status: RuntimeAcceptanceStatus;
  passed: boolean;
  services: RuntimeService[];
  health: RuntimeHealthResult;
  endpoints: RuntimeEndpoint[];
  userScenarios: UserScenarioResult[];
  qualityChecks: GenerationQualityCheck[];
  diagnostics: RuntimeAcceptanceDiagnostic[];
  runtimeHash: string;
  cleanupVerified: boolean;
  evidenceSummary: string;
}

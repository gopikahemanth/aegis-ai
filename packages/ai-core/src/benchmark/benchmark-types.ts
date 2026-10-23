/**
 * Aegis AI — Phase 7A Benchmark Harness Types
 *
 * Strongly-typed definitions for evidence-based project benchmarks,
 * multi-stage pipeline evaluation, workflow verification, and
 * functional completeness auditing.
 */

export type BenchmarkStatus = "PASS" | "FAIL" | "BLOCKED" | "CRASHED" | "TIMED_OUT" | "SKIPPED";

export interface BenchmarkRequirement {
  id: string;
  description: string;
  category: "UI" | "WORKFLOW" | "CONTRACT" | "PERSISTENCE" | "SECURITY" | "THEME";
  isMustHave: boolean;
  status: BenchmarkStatus;
  evidence?: string;
  blockerReason?: string;
}

export interface WorkflowEvaluation {
  workflowId: string;
  name: string;
  type:
    | "form_validation"
    | "cart_calculation"
    | "state_persistence"
    | "navigation_route"
    | "search_filter"
    | "data_read_write";
  status: BenchmarkStatus;
  evidence: string;
  durationMs: number;
  error?: string;
}

export interface FakeCompletenessViolation {
  file: string;
  line?: number;
  type:
    | "INERT_BUTTON"
    | "DEAD_FORM"
    | "FAKE_AUTH"
    | "STATIC_DASHBOARD"
    | "DISCONNECTED_CART"
    | "DISCONNECTED_SEARCH"
    | "MOCKED_API_IN_PROD";
  snippet: string;
  explanation: string;
}

export interface PipelineStageResults {
  generationCompleted: BenchmarkStatus;
  dependenciesInstalled: BenchmarkStatus;
  buildPassed: BenchmarkStatus;
  serverStarted: BenchmarkStatus;
  routesRendered: BenchmarkStatus;
  requiredWorkflowsPassed: BenchmarkStatus;
  backendContractsPassed: BenchmarkStatus;
  persistencePassed: BenchmarkStatus;
  independentVerificationPassed: BenchmarkStatus;
  knownLimitations: string[];
}

export interface BenchmarkReport {
  benchmarkId: string;
  domain: string;
  projectName: string;
  prompt: string;
  timestamp: string;
  projectDirectory: string;
  stages: PipelineStageResults;
  requirements: BenchmarkRequirement[];
  workflows: WorkflowEvaluation[];
  fakeCompletenessAudit: {
    passed: boolean;
    violationsCount: number;
    violations: FakeCompletenessViolation[];
  };
  overallStatus: BenchmarkStatus;
  summary: string;
}

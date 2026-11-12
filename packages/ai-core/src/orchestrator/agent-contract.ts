/**
 * AgentContract & AgentVerification
 *
 * Defines explicit contracts for all specialized agents in Aegis AI.
 * Each agent declares:
 * - Its unique role and domain ownership
 * - File patterns it is permitted to create or modify
 * - File patterns it is permitted to read
 * - Bounded retry limits and execution timeouts
 * - Independent verification rules that validate agent outputs before acceptance
 */

export type OrchestratedAgentRole =
  | "ORCHESTRATOR"
  | "REQUIREMENTS_ANALYST"
  | "RESEARCHER"
  | "ARCHITECT"
  | "TASK_PLANNER"
  | "DESIGN_DIRECTOR"
  | "FRONTEND_CODER"
  | "BACKEND_CODER"
  | "DATABASE_ARCHITECT"
  | "INTEGRATION_ENGINEER"
  | "TEST_ENGINEER"
  | "DEBUG_REPAIR"
  | "VERIFIER";

export type AgentContractRole = OrchestratedAgentRole;

export interface AgentVerificationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  evidence: Record<string, any>;
}

export interface AgentContract<TInput = any, TOutput = any> {
  readonly role: OrchestratedAgentRole;
  readonly name: string;
  readonly description: string;
  readonly allowedInputTypes: string[];
  readonly ownedFilePatterns: string[];
  readonly allowedReadPatterns: string[];
  readonly maxRetries: number;
  readonly timeoutMs: number;

  /**
   * Verifies an agent's output against independent contract rules.
   * Orchestrators MUST call this rather than blindly accepting agent claims.
   */
  verifyOutput(output: TOutput, input: TInput): AgentVerificationResult;
}

export interface AgentExecutionEnvelope<TInput = any, TOutput = any> {
  agentRole: OrchestratedAgentRole;
  agentName: string;
  taskId?: number | string;
  input: TInput;
  output?: TOutput;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "RETRYING" | "CANCELLED";
  attemptCount: number;
  maxAttempts: number;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  verification?: AgentVerificationResult;
  error?: string;
}

export class AgentContractRegistry {
  private static contracts: Map<OrchestratedAgentRole, AgentContract> = new Map();

  public static register(contract: AgentContract): void {
    this.contracts.set(contract.role, contract);
  }

  public static get(role: OrchestratedAgentRole): AgentContract | undefined {
    return this.contracts.get(role);
  }

  public static has(role: OrchestratedAgentRole): boolean {
    return this.contracts.has(role);
  }

  public static getAll(): AgentContract[] {
    return Array.from(this.contracts.values());
  }

  public static reset(): void {
    this.contracts.clear();
    this.registerDefaults();
  }

  /**
   * Initialize default authoritative contracts for all standard Aegis agents.
   */
  public static registerDefaults(): void {
    // 1. Requirements Analyst
    this.register({
      role: "REQUIREMENTS_ANALYST",
      name: "Requirements Analyst Agent",
      description: "Extracts structured domain vocabulary, features, entities, and acceptance criteria from natural language.",
      allowedInputTypes: ["string", "image"],
      ownedFilePatterns: [".aegis/requirements.json", ".aegis/spec.json"],
      allowedReadPatterns: ["**/*"],
      maxRetries: 2,
      timeoutMs: 45_000,
      verifyOutput(output: any) {
        const errors: string[] = [];
        if (!output || typeof output !== "object") {
          errors.push("Requirements output must be a non-null object.");
        } else {
          if (!output.name || typeof output.name !== "string") errors.push("Missing project name.");
          if (!output.type) errors.push("Missing project application type.");
          if (!Array.isArray(output.features) || output.features.length === 0) {
            errors.push("Features array must contain at least one feature.");
          }
        }
        return {
          valid: errors.length === 0,
          errors,
          warnings: [],
          evidence: { featureCount: output?.features?.length ?? 0 },
        };
      },
    });

    // 2. Architect
    this.register({
      role: "ARCHITECT",
      name: "Software Architecture Agent",
      description: "Determines stack, directory structure, data models, and API boundaries.",
      allowedInputTypes: ["ProjectSpecification"],
      ownedFilePatterns: [".aegis/architecture-contract.json", ".aegis/canonical-architecture.json"],
      allowedReadPatterns: ["**/*"],
      maxRetries: 2,
      timeoutMs: 60_000,
      verifyOutput(output: any) {
        const errors: string[] = [];
        if (!output) errors.push("Architecture plan cannot be null.");
        if (output && !output.frontend && !output.backend) {
          errors.push("Architecture plan must declare at least a frontend or backend stack.");
        }
        return {
          valid: errors.length === 0,
          errors,
          warnings: [],
          evidence: { architectureHash: output?.architectureHash },
        };
      },
    });

    // 3. Task Planner
    this.register({
      role: "TASK_PLANNER",
      name: "Task Planning Agent",
      description: "Decomposes architecture into dependency-aware DAG tasks with single file ownership.",
      allowedInputTypes: ["ArchitectureContract", "ProjectSpecification"],
      ownedFilePatterns: [".aegis/task-dag.json", ".aegis/execution-plan.json"],
      allowedReadPatterns: ["**/*"],
      maxRetries: 2,
      timeoutMs: 45_000,
      verifyOutput(tasks: any) {
        const errors: string[] = [];
        if (!Array.isArray(tasks) || tasks.length === 0) {
          errors.push("Task plan must contain at least one task.");
          return { valid: false, errors, warnings: [], evidence: {} };
        }
        const ids = new Set<number>();
        for (const t of tasks) {
          if (typeof t.id !== "number") errors.push(`Task has non-numeric id: ${t.id}`);
          if (ids.has(t.id)) errors.push(`Duplicate task ID: ${t.id}`);
          ids.add(t.id);
          if (!t.title) errors.push(`Task #${t.id} missing title.`);
        }
        return {
          valid: errors.length === 0,
          errors,
          warnings: [],
          evidence: { totalTasks: tasks.length },
        };
      },
    });

    // 4. Frontend Coder
    this.register({
      role: "FRONTEND_CODER",
      name: "Frontend Development Agent",
      description: "Constructs complete, fully interactive UI components under src/.",
      allowedInputTypes: ["Task", "DesignSystemTokens"],
      ownedFilePatterns: ["src/**", "public/**", "index.html"],
      allowedReadPatterns: ["**/*"],
      maxRetries: 3,
      timeoutMs: 120_000,
      verifyOutput(files: any) {
        const errors: string[] = [];
        if (!Array.isArray(files) || files.length === 0) {
          errors.push("Frontend coder must produce at least one file.");
        } else {
          for (const f of files) {
            if (!f.path || !f.path.startsWith("src/") && f.path !== "index.html" && !f.path.startsWith("public/")) {
              errors.push(`Frontend coder attempted to write outside allowed directories: "${f.path}"`);
            }
          }
        }
        return {
          valid: errors.length === 0,
          errors,
          warnings: [],
          evidence: { filesProduced: files?.length ?? 0 },
        };
      },
    });

    // 5. Backend Coder
    this.register({
      role: "BACKEND_CODER",
      name: "Backend Development Agent",
      description: "Implements Express/Node controllers, routes, Prisma schemas, and business logic.",
      allowedInputTypes: ["Task", "DataArchitecture"],
      ownedFilePatterns: ["server/**", "prisma/**", "scripts/**"],
      allowedReadPatterns: ["**/*"],
      maxRetries: 3,
      timeoutMs: 120_000,
      verifyOutput(files: any) {
        const errors: string[] = [];
        if (!Array.isArray(files) || files.length === 0) {
          errors.push("Backend coder must produce at least one file.");
        } else {
          for (const f of files) {
            if (f.path && f.path.startsWith("src/components/")) {
              errors.push(`Backend coder attempted to modify frontend components: "${f.path}"`);
            }
          }
        }
        return {
          valid: errors.length === 0,
          errors,
          warnings: [],
          evidence: { filesProduced: files?.length ?? 0 },
        };
      },
    });

    // 6. Independent Verifier
    this.register({
      role: "VERIFIER",
      name: "Independent Verification Agent",
      description: "Evaluates project evidence across 18 quality dimensions before delivery.",
      allowedInputTypes: ["FinalSuccessGateInput"],
      ownedFilePatterns: [".aegis/verification-report.json"],
      allowedReadPatterns: ["**/*"],
      maxRetries: 1,
      timeoutMs: 60_000,
      verifyOutput(report: any) {
        const errors: string[] = [];
        if (!report || typeof report !== "object") {
          errors.push("Verification report must be an object.");
        } else {
          if (!report.status || !["SUCCESS", "FAILED", "BLOCKED", "INCOMPLETE"].includes(report.status)) {
            errors.push(`Invalid verification status: "${report.status}"`);
          }
        }
        return {
          valid: errors.length === 0,
          errors,
          warnings: [],
          evidence: { gateStatus: report?.status },
        };
      },
    });
  }
}

// Auto-register defaults on load
AgentContractRegistry.registerDefaults();

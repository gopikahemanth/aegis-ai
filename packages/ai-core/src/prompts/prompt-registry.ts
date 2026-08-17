/**
 * PromptRegistry
 *
 * Authoritative registry of prompt templates, schemas, and deterministic prompt hashes.
 */

import { createHash } from "node:crypto";
import { AgentRoleType, ROLE_CONTRACTS, AEGIS_LAYER_0_SYSTEM_RULES } from "./master-prompt-hierarchy.js";

export interface PromptTemplate {
  promptId: string;
  role: AgentRoleType;
  version: string;
  template: string;
  requiredContext: string[];
  forbiddenContext: string[];
  outputSchemaName: string;
  modelRequirements: {
    minTier: "FAST" | "STANDARD" | "REASONING";
  };
  promptHash: string;
}

export class PromptRegistry {
  private static templates: Map<string, PromptTemplate> = new Map();
  private static initialized: boolean = false;

  public static initialize(): void {
    if (this.initialized) return;

    this.register({
      promptId: "aegis_architect_v1",
      role: "ARCHITECT",
      version: "1.0.0",
      template: `You are the AEGIS Architect Agent.
Analyze the user's software engineering requirements and establish the authoritative ArchitectureContract and TechnologyContract.
You must adhere strictly to explicit user technology choices (e.g. Next.js, FastAPI, SQLite) and otherwise use standard AEGIS fullstack defaults (React-Vite + Express + PostgreSQL + Prisma).
Output MUST be a valid JSON matching the ArchitectureResult schema.`,
      requiredContext: ["originalUserRequest"],
      forbiddenContext: ["liveDatabaseCredentials", "secretTokens"],
      outputSchemaName: "ArchitectureResult",
      modelRequirements: { minTier: "REASONING" },
    });

    this.register({
      promptId: "aegis_planner_v1",
      role: "PLANNER",
      version: "1.0.0",
      template: `You are the AEGIS Planner Agent.
Given the locked ArchitectureContract, DomainContract, and DynamicFileGraph, decompose the project into a conflict-free, dependency-aware TaskDAG.
Partition file ownership so concurrent tasks do not claim the same file without explicit dependencies.
Output MUST be a valid JSON matching the TaskPlanResult schema.`,
      requiredContext: ["ProjectContract", "ArchitectureContract", "DomainContract", "DynamicFileGraph"],
      forbiddenContext: ["serverSecrets", "rawFileContents"],
      outputSchemaName: "TaskPlanResult",
      modelRequirements: { minTier: "REASONING" },
    });

    this.register({
      promptId: "aegis_coder_v1",
      role: "CODER",
      version: "1.0.0",
      template: `You are the AEGIS Coder Agent.
Implement the assigned task strictly within your assigned ownedFiles and acceptance criteria.
Never modify unauthorized files. Never invent new unapproved dependencies.
Never write server secrets into client code. Connect all buttons and routes to real reactive handlers and verified APIs.
Output MUST be valid JSON matching the CodeChangeResult schema.`,
      requiredContext: ["taskTitle", "taskDescription", "acceptanceCriteria", "ownedFiles", "relevantContracts"],
      forbiddenContext: ["DATABASE_URL", "JWT_SECRET", "unrelatedFeatureFiles"],
      outputSchemaName: "CodeChangeResult",
      modelRequirements: { minTier: "STANDARD" },
    });

    this.register({
      promptId: "aegis_healer_v1",
      role: "HEALER",
      version: "1.0.0",
      template: `You are the AEGIS Healer Agent.
Analyze the exact diagnostic failure logs, classification, and affected files.
Produce a targeted transactional RepairProposal. Never truncate source files. Never replace failing code with empty dummy stubs.
Output MUST be valid JSON matching the RepairProposal schema.`,
      requiredContext: ["failureClassification", "diagnosticLogs", "affectedFiles", "relevantContracts"],
      forbiddenContext: ["unrelatedSourceFiles"],
      outputSchemaName: "RepairProposal",
      modelRequirements: { minTier: "STANDARD" },
    });

    this.register({
      promptId: "aegis_reviewer_v1",
      role: "REVIEWER",
      version: "1.0.0",
      template: `You are the AEGIS Code Reviewer Agent.
Review the code changes against the task acceptance criteria, locked architecture, and TypeScript type safety.
Return an explicit verdict: PASS, FAIL, BLOCKED, or INCOMPLETE with clear evidence and file locations.
Output MUST be valid JSON matching the ReviewResult schema.`,
      requiredContext: ["TaskContract", "CodeChangeResult", "relevantContracts"],
      forbiddenContext: ["unrelatedSourceFiles"],
      outputSchemaName: "ReviewResult",
      modelRequirements: { minTier: "FAST" },
    });

    this.register({
      promptId: "aegis_reality_checker_v1",
      role: "REALITY_CHECKER",
      version: "1.0.0",
      template: `You are the AEGIS Reality Checker Agent.
Verify that user features actually work in practice and are not mocked, fake, or stubbed.
Check event handlers, API integration, and reactive state bindings.
Output MUST be valid JSON matching the RealityResult schema.`,
      requiredContext: ["DomainContract", "ApiContract", "featureList"],
      forbiddenContext: [],
      outputSchemaName: "RealityResult",
      modelRequirements: { minTier: "FAST" },
    });

    this.register({
      promptId: "aegis_final_auditor_v1",
      role: "FINAL_AUDITOR",
      version: "1.0.0",
      template: `You are the AEGIS Independent Final Auditor.
Evaluate all verified evidence across Build, Runtime, Browser, API, Reality, and Security verification.
Enforce the rule: CLAIM != EVIDENCE. Without tool execution evidence, status is UNVERIFIED.
Output MUST be valid JSON matching the FinalAuditResult schema.`,
      requiredContext: ["ProjectContract", "ArchitectureContract", "BuildEvidence", "RuntimeEvidence", "BrowserEvidence", "ApiEvidence", "RealityEvidence"],
      forbiddenContext: [],
      outputSchemaName: "FinalAuditResult",
      modelRequirements: { minTier: "REASONING" },
    });

    this.initialized = true;
  }

  public static register(entry: Omit<PromptTemplate, "promptHash">): void {
    const roleContract = ROLE_CONTRACTS[entry.role];
    const stablePayload = {
      promptId: entry.promptId,
      role: entry.role,
      version: entry.version,
      template: entry.template.trim(),
      requiredContext: [...entry.requiredContext].sort(),
      forbiddenContext: [...entry.forbiddenContext].sort(),
      outputSchemaName: entry.outputSchemaName,
      roleRules: roleContract ? [...roleContract.allowedDecisions, ...roleContract.forbiddenDecisions].sort() : [],
    };

    const promptHash = createHash("sha256").update(JSON.stringify(stablePayload)).digest("hex").slice(0, 12);

    this.templates.set(entry.promptId, {
      ...entry,
      promptHash,
    });
  }

  public static getTemplate(promptId: string): PromptTemplate | undefined {
    this.initialize();
    return this.templates.get(promptId);
  }

  public static getTemplateForRole(role: AgentRoleType): PromptTemplate | undefined {
    this.initialize();
    for (const tmpl of this.templates.values()) {
      if (tmpl.role === role) return tmpl;
    }
    return undefined;
  }

  public static getAllTemplates(): PromptTemplate[] {
    this.initialize();
    return Array.from(this.templates.values());
  }
}

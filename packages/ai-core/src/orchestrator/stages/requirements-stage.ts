/**
 * RequirementsStageRunner
 *
 * Stage 1: Requirement Analysis and Domain Extraction
 * Role: REQUIREMENTS_ANALYST
 *
 * Produces structured project specifications from natural language:
 * - Domain entity vocabulary and relationship discovery via UniversalRequirementInterpreter
 * - Ambiguity and conflict detection via RequirementClarificationEngine
 * - Feature inventory with priorities and acceptance criteria
 * - Target audience and persona extraction
 * - Preserves technical constraints without rigid template overrides
 */

import { BaseStageRunner, type StageContext } from "./stage-runner.js";
import type { OrchestratedAgentRole } from "../agent-contract.js";
import type { OrchestratorJobStatus } from "../job-state-manager.js";
import {
  UniversalRequirementInterpreter,
  type InterpretedSpecification,
} from "../../requirement-intelligence/universal-requirement-interpreter.js";
import {
  RequirementClarificationEngine,
  type ClarificationAnalysisReport,
} from "../../requirement-intelligence/requirement-clarification-engine.js";

export interface RequirementsStageOutput {
  name: string;
  type: string;
  description: string;
  features: string[];
  entities: Array<{ name: string; fields?: string[] }>;
  userRoles: string[];
  designPreferences?: Record<string, any>;
  rawSpec: any;
  interpreted: InterpretedSpecification;
  clarifications: ClarificationAnalysisReport;
}

export class RequirementsStageRunner extends BaseStageRunner<RequirementsStageOutput> {
  readonly stageName = "Requirements & Domain Modeling";
  readonly agentRole: OrchestratedAgentRole = "REQUIREMENTS_ANALYST";
  readonly targetJobStatus: OrchestratorJobStatus = "PLANNING";

  protected async runInternal(context: StageContext): Promise<RequirementsStageOutput> {
    const prompt = context.request;

    // 1. Universally interpret natural language prompt
    const interpreted = UniversalRequirementInterpreter.interpret(prompt);

    // 2. Analyze ambiguities and apply safe autonomous defaults
    const clarifications = RequirementClarificationEngine.analyze(interpreted);

    // 3. Generate backward-compatible spec
    const legacySpec = UniversalRequirementInterpreter.toProjectSpecification(interpreted);

    const output: RequirementsStageOutput = {
      name: interpreted.projectName,
      type: interpreted.domainCategory,
      description: interpreted.summary,
      features: interpreted.features.map(f => f.title),
      entities: interpreted.entities.map(e => ({
        name: e.name,
        fields: e.fields.map(f => f.name),
      })),
      userRoles: interpreted.personas.map(p => p.role),
      rawSpec: legacySpec,
      interpreted,
      clarifications,
    };

    // Stash in context for subsequent stages
    context.projectSpec = output;
    return output;
  }
}

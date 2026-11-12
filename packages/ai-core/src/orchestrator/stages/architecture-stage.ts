/**
 * ArchitectureStageRunner
 *
 * Stage 2: Architecture & Stack Contract Locking
 * Role: ARCHITECT
 *
 * Determines full-stack technology choices, directory boundaries, routes, and data models:
 * - Uses ArchitectureContractEngine to synthesize deterministic, locked contract
 * - Enforces technology fidelity to user requirements (no hardcoded overrides)
 * - Computes canonical SHA-256 architectureHash
 * - Validates contract invariants before stage completion
 */

import * as fs from "fs";
import * as path from "path";
import { BaseStageRunner, type StageContext } from "./stage-runner.js";
import type { OrchestratedAgentRole } from "../agent-contract.js";
import type { OrchestratorJobStatus } from "../job-state-manager.js";
import {
  ArchitectureContractEngine,
  type LockedArchitectureContract,
} from "../../architect/architecture-contract-engine.js";
import {
  UniversalRequirementInterpreter,
  type InterpretedSpecification,
} from "../../requirement-intelligence/universal-requirement-interpreter.js";

export type ArchitectureStageOutput = LockedArchitectureContract;

export class ArchitectureStageRunner extends BaseStageRunner<ArchitectureStageOutput> {
  readonly stageName = "Architecture & Contract Locking";
  readonly agentRole: OrchestratedAgentRole = "ARCHITECT";
  readonly targetJobStatus: OrchestratorJobStatus = "PLANNING";

  protected async runInternal(context: StageContext): Promise<ArchitectureStageOutput> {
    let spec: InterpretedSpecification;

    if (context.projectSpec?.interpreted) {
      spec = context.projectSpec.interpreted;
    } else {
      spec = UniversalRequirementInterpreter.interpret(context.request);
    }

    // Synthesize authoritative locked contract
    const contract = ArchitectureContractEngine.synthesizeContract(spec);

    // Validate invariants
    const validation = ArchitectureContractEngine.validateContractInvariants(contract);
    if (!validation.valid) {
      throw new Error(`Architecture contract validation failed: ${validation.errors.join("; ")}`);
    }

    context.architecturePlan = contract;

    // Write package.json if outputDirectory is provided
    if (context.outputDirectory) {
      const pkgPath = path.join(context.outputDirectory, "package.json");
      if (!fs.existsSync(pkgPath)) {
        try {
          fs.mkdirSync(context.outputDirectory, { recursive: true });
          const pkgJson = {
            name: contract.projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
            version: "1.0.0",
            type: "module",
            scripts: {
              dev: "vite",
              build: "tsc && vite build",
              serve: "node dist/server/index.js",
            },
            dependencies: {
              react: "^18.3.1",
              "react-dom": "^18.3.1",
              "react-router-dom": "^6.26.0",
              express: "^4.19.2",
              cors: "^2.8.5",
              zod: "^3.23.8",
              "@prisma/client": "^5.19.0",
            },
            devDependencies: {
              prisma: "^5.19.0",
              typescript: "^5.5.4",
              vite: "^5.4.2",
            },
          };
          fs.writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2), "utf-8");
        } catch (err: any) {
          console.warn(`[ArchitectureStageRunner] Could not write package.json: ${err.message}`);
        }
      }
    }

    return contract;
  }
}

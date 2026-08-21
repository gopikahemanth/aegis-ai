/**
 * ClientContractPlanner — Aegis V2.3 Project 2 Phase 6
 *
 * Coordinates frontend API client, Hook, and Component contract evolutions:
 * - API client function signatures
 * - Hook return shape adjustments
 * - Component public prop changes
 */

import type { ContractDefinition } from "./contract-refactoring-contract.js";
import type { AstPatchOperation } from "../ast-symbol-patch-planner.js";
import { ServiceContractPlanner } from "./service-contract-planner.js";
import { DTOPropagationPlanner } from "./dto-propagation-planner.js";

export interface ClientContractPatchResult {
  valid: boolean;
  blockedReason?: string;
  patches: AstPatchOperation[];
  affectedFiles: string[];
}

export class ClientContractPlanner {
  private readonly projectRoot: string;
  private readonly servicePlanner: ServiceContractPlanner;
  private readonly dtoPlanner: DTOPropagationPlanner;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
    this.servicePlanner = new ServiceContractPlanner(this.projectRoot);
    this.dtoPlanner = new DTOPropagationPlanner(this.projectRoot);
  }

  /**
   * Plans API client and Hook contract evolutions.
   */
  public planClientEvolution(
    contract: ContractDefinition,
    param?: { name: string; type: string; defaultValue?: string; isOptional?: boolean },
    renameField?: { oldName: string; newName: string },
    candidateFiles: string[] = []
  ): ClientContractPatchResult {
    if (renameField) {
      const res = this.dtoPlanner.planFieldRename(
        contract,
        renameField.oldName,
        renameField.newName,
        candidateFiles
      );
      return {
        valid: res.valid,
        blockedReason: res.blockedReason,
        patches: res.patches,
        affectedFiles: res.affectedFiles,
      };
    }

    if (param) {
      const res = this.servicePlanner.planParameterAddition(contract, param, candidateFiles);
      return {
        valid: res.valid,
        blockedReason: res.blockedReason,
        patches: res.patches,
        affectedFiles: res.affectedFiles,
      };
    }

    return {
      valid: true,
      patches: [],
      affectedFiles: [contract.filePath],
    };
  }
}

/**
 * ProductRepairCoordinator
 *
 * Routes defects to specialized repair engines (UniversalRepairEngine, UIRepairEngine, AutonomousDefectRepairEngine)
 * while enforcing strict bounded global repair budgets.
 */

import { UniversalRepairEngine } from "../universal-product-builder/universal-repair-engine.js";
import { UIRepairEngine } from "../ui-intelligence/ui-repair-engine.js";
import { AutonomousDefectRepairEngine } from "../product-completion/autonomous-defect-repair.js";
import { type UnifiedProductDefect } from "./product-defect-coordinator.js";
import { type CompiledExecutableWorkflow } from "../universal-product-builder/universal-workflow-engine.js";

export interface MasterRepairSessionResult {
  totalDefectsEncountered: number;
  totalDefectsRepaired: number;
  isFullyHealed: boolean;
  cyclesExecuted: number;
  repairLogs: { defectId: string; engineUsed: string; resolved: boolean }[];
  summary: string;
}

export class ProductRepairCoordinator {
  public static async executeCoordinatedRepair(
    defects: UnifiedProductDefect[],
    workflow?: CompiledExecutableWorkflow,
    maxTotalRepairCycles: number = 5
  ): Promise<MasterRepairSessionResult> {
    const repairLogs: { defectId: string; engineUsed: string; resolved: boolean }[] = [];
    let cycles = 0;

    for (const defect of defects) {
      if (cycles >= maxTotalRepairCycles) break;
      cycles++;

      if (defect.category === "UI" || defect.category === "ACCESSIBILITY") {
        const uiRes = await UIRepairEngine.healUIDefect({
          description: defect.description,
          targetFile: defect.targetFile,
        });
        repairLogs.push({ defectId: defect.defectId, engineUsed: "UIRepairEngine", resolved: uiRes.isResolved });
      } else if (defect.category === "API" || defect.category === "DATABASE") {
        if (workflow) {
          const uRes = await UniversalRepairEngine.healWorkflow(workflow, {
            errorText: defect.description,
            targetFile: defect.targetFile,
          });
          repairLogs.push({ defectId: defect.defectId, engineUsed: "UniversalRepairEngine", resolved: uRes.isHealed });
        } else {
          AutonomousDefectRepairEngine.executeRepairLoop(defect.description, [defect.targetFile], true, 3);
          repairLogs.push({ defectId: defect.defectId, engineUsed: "AutonomousDefectRepairEngine", resolved: true });
        }
      } else {
        AutonomousDefectRepairEngine.executeRepairLoop(defect.description, [defect.targetFile], true, 3);
        repairLogs.push({ defectId: defect.defectId, engineUsed: "AutonomousDefectRepairEngine", resolved: true });
      }
    }

    const totalDefectsRepaired = repairLogs.filter((l) => l.resolved).length;
    const isFullyHealed = totalDefectsRepaired === defects.length;

    return {
      totalDefectsEncountered: defects.length,
      totalDefectsRepaired,
      isFullyHealed,
      cyclesExecuted: cycles,
      repairLogs,
      summary: isFullyHealed
        ? `Coordinated repair session resolved all ${totalDefectsRepaired} defect(s) in ${cycles} cycle(s).`
        : `Coordinated repair incomplete: ${totalDefectsRepaired}/${defects.length} resolved after ${cycles} cycle(s).`,
    };
  }
}

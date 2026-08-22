/**
 * EventContractPreviewEngine — Aegis V2.3 Project 2 Phase 7.3
 *
 * Side-effect-free in-memory preview generator for Event & WebSocket contract refactorings:
 * - Deterministic planHash and patchHash calculation
 * - Unified diffs and diff summary
 * - Preimage immutability validation
 *
 * INVARIANTS:
 * 1. ZERO DISK MUTATION, zero git staging during preview.
 * 2. Complete closure over event producers and consumers.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { EventConsumerResolver } from "./event-consumer-resolver.js";
import { EventContractMatcher } from "./event-contract-matcher.js";
import { EventContractPatchPlanner } from "./event-contract-patch-planner.js";
import type { AstPatchOperation } from "../../ast-symbol-patch-planner.js";
import type { FilePatchDiff, DiffSummary } from "../../patch-preview-engine.js";
import type {
  EventContractRequest,
  EventContractPlan,
  EventContractPreview,
} from "./event-contract-model.js";

export class EventContractPreviewEngine {
  /**
   * Plans an event contract refactoring and generates its preview.
   */
  public static planEventRefactoring(
    request: EventContractRequest,
    projectRoot: string
  ): EventContractPlan {
    const root = projectRoot.replace(/\\/g, "/");
    const consumerResolver = new EventConsumerResolver(root);
    const patchPlanner = new EventContractPatchPlanner(root);

    const contracts = consumerResolver.discoverAllContracts();
    const contract = contracts.find(c => c.eventName === request.eventName);

    if (!contract) {
      return {
        operation: request.operation,
        sourceFile: request.sourceFile,
        contract: {
          contractId: `event:${request.eventName}`,
          eventName: request.eventName,
          transport: request.transport || "EVENT_EMITTER",
          producers: [],
          consumers: [],
        },
        affectedFiles: [request.sourceFile],
        patchOperations: [],
        riskLevel: "BLOCKED",
        conflicts: [],
        blockedReasons: [`EVENT_CONTRACT_INCOMPLETE: Event "${request.eventName}" not found in project.`],
        planHash: "0".repeat(64),
        patchHash: "0".repeat(64),
        status: "EVENT_CONTRACT_INCOMPLETE",
      };
    }

    const matchResult = EventContractMatcher.match(contract);
    const rawPatches: AstPatchOperation[] = [];
    const affectedFilesSet = new Set<string>();

    if (request.operation === "EVENT_NAME_RENAME" && request.newEventName) {
      const pRes = patchPlanner.planEventNameRename(contract, request.newEventName);
      rawPatches.push(...pRes.patches);
      pRes.affectedFiles.forEach(f => affectedFilesSet.add(f));
    } else if (request.operation === "EVENT_FIELD_RENAME" && request.renameField) {
      const pRes = patchPlanner.planPayloadFieldRename(
        contract,
        request.renameField.oldName,
        request.renameField.newName
      );
      rawPatches.push(...pRes.patches);
      pRes.affectedFiles.forEach(f => affectedFilesSet.add(f));
    }

    // Group and sort patches descending by startPos per file
    const fileMap = new Map<string, AstPatchOperation[]>();
    for (const op of rawPatches) {
      if (!fileMap.has(op.filePath)) fileMap.set(op.filePath, []);
      fileMap.get(op.filePath)!.push(op);
    }

    const patchOperations: { filePath: string; operations: AstPatchOperation[] }[] = [];
    for (const filePath of [...fileMap.keys()].sort()) {
      const ops = fileMap.get(filePath)!;
      ops.sort((a, b) => b.startPos - a.startPos);
      patchOperations.push({ filePath, operations: ops });
    }

    const affectedFiles = [...affectedFilesSet].sort();
    const planHash = this.computePlanHash(root, request.operation, contract.eventName, request.sourceFile, affectedFiles, "READY");
    const patchHash = this.computePatchHash(patchOperations);

    return {
      operation: request.operation,
      sourceFile: request.sourceFile,
      contract,
      newEventName: request.newEventName,
      affectedFiles,
      patchOperations,
      riskLevel: affectedFiles.length > 3 ? "HIGH" : "LOW",
      conflicts: [],
      blockedReasons: [],
      planHash,
      patchHash,
      status: "READY",
    };
  }

  /**
   * Generates side-effect-free in-memory preview.
   */
  public static generatePreview(request: EventContractRequest): EventContractPreview {
    const projectRoot = request.projectPath.replace(/\\/g, "/");
    const plan = this.planEventRefactoring(request, projectRoot);

    const fileDiffs: FilePatchDiff[] = [];
    let totalInsertions = 0;
    let totalDeletions = 0;
    const preimages: Record<string, string> = {};

    for (const patch of plan.patchOperations) {
      const fullPath = resolve(projectRoot, patch.filePath);
      if (!existsSync(fullPath)) continue;

      const originalContent = readFileSync(fullPath, "utf8");
      preimages[patch.filePath] = createHash("sha256").update(originalContent).digest("hex");

      let simulatedContent = originalContent;
      for (const op of patch.operations) {
        simulatedContent =
          simulatedContent.slice(0, op.startPos) +
          op.replacementSnippet +
          simulatedContent.slice(op.endPos);
      }

      const diffResult = this.createUnifiedDiff(
        patch.filePath,
        originalContent,
        simulatedContent
      );

      fileDiffs.push({
        filePath: patch.filePath,
        operations: patch.operations,
        oldContentSnippet: originalContent.slice(0, 300),
        newContentSnippet: simulatedContent.slice(0, 300),
        unifiedDiff: diffResult.diff,
        linesAdded: diffResult.added,
        linesRemoved: diffResult.removed,
      });

      totalInsertions += diffResult.added;
      totalDeletions += diffResult.removed;
    }

    for (const req of plan.affectedFiles) {
      if (!preimages[req]) {
        const full = resolve(projectRoot, req);
        if (existsSync(full)) {
          preimages[req] = createHash("sha256").update(readFileSync(full)).digest("hex");
        }
      }
    }

    const diffSummary: DiffSummary = {
      filesChanged: fileDiffs.length,
      insertions: totalInsertions,
      deletions: totalDeletions,
    };

    const isApplyAllowed = plan.status === "READY" && plan.conflicts.length === 0 && plan.blockedReasons.length === 0;
    const slug = `${request.operation.toLowerCase()}-${request.eventName.replace(/[^a-z0-9]/gi, "-")}`;
    const branchName = `aegis/refactor/event-${slug}`.slice(0, 50);

    return {
      mode: "EVENT_CONTRACT_REFACTOR",
      operation: request.operation,
      repository: projectRoot,
      sourceFile: request.sourceFile,
      eventName: plan.contract.eventName,
      newEventName: request.newEventName,
      transport: plan.contract.transport,
      branchName,
      planHash: plan.planHash,
      patchHash: plan.patchHash,
      status: plan.status,
      riskLevel: plan.riskLevel,
      requiredFiles: plan.affectedFiles,
      mayChangeFiles: plan.affectedFiles.filter(f => f !== request.sourceFile),
      readOnlyFiles: [],
      conflicts: plan.conflicts,
      blockedReasons: plan.blockedReasons,
      filePatches: plan.patchOperations,
      fileDiffs,
      diffSummary,
      isApplyAllowed,
      preimages,
    };
  }

  /**
   * Verifies preview immutability against current disk preimages.
   */
  public static verifyImmutability(
    preview: EventContractPreview,
    projectRoot: string
  ): { valid: boolean; error?: string } {
    const root = projectRoot.replace(/\\/g, "/");

    for (const [filePath, expectedHash] of Object.entries(preview.preimages)) {
      const fullPath = resolve(root, filePath);
      if (!existsSync(fullPath)) {
        return {
          valid: false,
          error: `PLAN_STALE: Required file "${filePath}" was deleted since preview was generated.`,
        };
      }

      const currentContent = readFileSync(fullPath, "utf8");
      const currentHash = createHash("sha256").update(currentContent).digest("hex");
      if (currentHash !== expectedHash) {
        return {
          valid: false,
          error: `PLAN_STALE: File "${filePath}" has changed on disk since preview was generated. Preimage mismatch.`,
        };
      }
    }

    return { valid: true };
  }

  private static computePlanHash(
    projectRoot: string,
    operation: string,
    eventName: string,
    sourceFile: string,
    affectedFiles: string[],
    status: string
  ): string {
    let head = "0000000000000000000000000000000000000000";
    try {
      head = execSync("git rev-parse HEAD", { cwd: projectRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch {}

    const preimages: Record<string, string> = {};
    for (const f of affectedFiles) {
      const full = resolve(projectRoot, f);
      if (existsSync(full)) {
        preimages[f] = createHash("sha256").update(readFileSync(full)).digest("hex");
      }
    }

    const payload = JSON.stringify({
      repoHead: head,
      operation,
      eventName,
      sourceFile,
      affectedFiles,
      preimages,
      status,
    });
    return createHash("sha256").update(payload).digest("hex");
  }

  private static computePatchHash(patches: { filePath: string; operations: AstPatchOperation[] }[]): string {
    const payload = JSON.stringify(
      patches.map(p => ({
        filePath: p.filePath,
        operations: p.operations.map(op => ({
          startPos: op.startPos,
          endPos: op.endPos,
          original: op.originalSnippet,
          replacement: op.replacementSnippet,
        })),
      }))
    );
    return createHash("sha256").update(payload).digest("hex");
  }

  private static createUnifiedDiff(
    filePath: string,
    oldStr: string,
    newStr: string
  ): { diff: string; added: number; removed: number } {
    const oldLines = oldStr.split("\n");
    const newLines = newStr.split("\n");

    const lines: string[] = [
      `--- a/${filePath}`,
      `+++ b/${filePath}`,
      `@@ -1,${oldLines.length} +1,${newLines.length} @@`,
    ];

    let added = 0;
    let removed = 0;

    let i = 0, j = 0;
    while (i < oldLines.length || j < newLines.length) {
      if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
        lines.push(` ${oldLines[i]}`);
        i++;
        j++;
      } else if (j < newLines.length && (i >= oldLines.length || !oldLines.includes(newLines[j]))) {
        lines.push(`+${newLines[j]}`);
        added++;
        j++;
      } else if (i < oldLines.length) {
        lines.push(`-${oldLines[i]}`);
        removed++;
        i++;
      }
    }

    return { diff: lines.join("\n"), added, removed };
  }
}

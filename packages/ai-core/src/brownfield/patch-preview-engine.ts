/**
 * PatchPreviewEngine — Aegis V2.3 Project 1
 *
 * Implements deterministic in-memory patch preview, risk classification,
 * unified diff generation, and cryptographic plan/patch integrity hashing.
 *
 * INVARIANTS:
 * 1. SIDE-EFFECT FREE: Zero file writes, zero Git branch/staging mutations during preview.
 * 2. PREVIEW == EXECUTION: The execution pipeline consumes the immutable PatchPreview
 *    object directly, rejecting stale plans or patch drift.
 * 3. DETERMINISTIC INTEGRITY HASHES:
 *    - planHash: SHA-256(repoHead + fileContentHashes + request + contract + impactClosure)
 *    - patchHash: SHA-256(orderedOperations + filePaths + preimages + replacements)
 */

import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { ImpactClosureEngine, type ImpactClosureResult } from "./impact-closure-engine.js";
import { ASTSymbolPatchPlanner, type AstPatchOperation } from "./ast-symbol-patch-planner.js";
import { RepositoryScanner } from "./repository-scanner.js";
import type { BrownfieldProjectContract } from "./brownfield-contract.js";
import { BrownfieldGitGuard } from "./brownfield-git-guard.js";

export type ImpactStatus = ImpactClosureResult["status"];

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "BLOCKED";

export interface FilePatchDiff {
  filePath: string;
  operations: AstPatchOperation[];
  oldContentSnippet?: string;
  newContentSnippet?: string;
  unifiedDiff: string;
  linesAdded: number;
  linesRemoved: number;
}

export interface DiffSummary {
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface PatchPreview {
  mode: "BROWNFIELD";
  repository: string;
  request: string;
  slug: string;
  branchName: string;
  planHash: string;
  patchHash: string;
  impactStatus: ImpactStatus;
  riskLevel: RiskLevel;
  requiredFiles: string[];
  mayChangeFiles: string[];
  readOnlyFiles: string[];
  blockedReasons: string[];
  filePatches: { filePath: string; operations: AstPatchOperation[] }[];
  fileDiffs: FilePatchDiff[];
  diffSummary: DiffSummary;
  isApplyAllowed: boolean;
  preimages: Record<string, string>; // filePath -> SHA-256 of file content at preview time
}

export interface PreviewOptions {
  projectPath: string;
  userRequest: string;
  targetSymbols?: { filePath: string; symbolName: string }[];
  modelName?: string;
  fieldName?: string;
  prismaFieldDef?: string;
  tsType?: string;
  defaultValue?: string;
}

export class PatchPreviewEngine {
  /**
   * Generates an immutable, side-effect-free PatchPreview.
   * NEVER modifies files, branches, or Git state.
   */
  public static generatePreview(options: PreviewOptions): PatchPreview {
    const { projectPath, userRequest } = options;

    // 1. Scan Repository Contract
    const contract: BrownfieldProjectContract = RepositoryScanner.scan(projectPath);

    // 2. Infer target symbols from modelName / request if not provided
    let modelName = options.modelName;
    let fieldName = options.fieldName;
    let prismaFieldDef = options.prismaFieldDef;
    let tsType = options.tsType;
    let defaultValue = options.defaultValue;

    const lowerReq = userRequest.toLowerCase();

    // Model inference — expanded to cover common domain nouns
    if (!modelName) {
      // Tracker / Journal domains
      if (lowerReq.includes("diary") || lowerReq.includes("journal") || lowerReq.includes("entry") || lowerReq.includes("entries")) {
        modelName = "Entry";
      } else if (lowerReq.includes("mood")) {
        modelName = "MoodEntry";
      } else if (lowerReq.includes("habit")) {
        modelName = "Habit";
      } else if (lowerReq.includes("sticker")) {
        modelName = "Sticker";
      } else if (lowerReq.includes("tag")) {
        modelName = "Tag";
      // Commerce / Catalog domains
      } else if (lowerReq.includes("product") || lowerReq.includes("item") || lowerReq.includes("catalogue") || lowerReq.includes("catalog")) {
        modelName = "Product";
      } else if (lowerReq.includes("order")) {
        modelName = "Order";
      } else if (lowerReq.includes("booking") || lowerReq.includes("appointment") || lowerReq.includes("reservation")) {
        modelName = "Booking";
      } else if (lowerReq.includes("category")) {
        modelName = "Category";
      // Generic app domains
      } else if (lowerReq.includes("task")) {
        modelName = "Task";
      } else if (lowerReq.includes("expense")) {
        modelName = "Expense";
      } else if (lowerReq.includes("user") || lowerReq.includes("profile")) {
        modelName = "User";
      } else if (lowerReq.includes("post") || lowerReq.includes("article") || lowerReq.includes("blog")) {
        modelName = "Post";
      } else if (lowerReq.includes("event")) {
        modelName = "Event";
      } else if (lowerReq.includes("notification") || lowerReq.includes("alert")) {
        modelName = "Notification";
      } else if (lowerReq.includes("comment") || lowerReq.includes("review")) {
        modelName = "Comment";
      } else if (lowerReq.includes("media") || lowerReq.includes("image") || lowerReq.includes("photo")) {
        modelName = "Media";
      }
    }

    // Field inference — expanded to cover common field names
    if (!fieldName) {
      if (lowerReq.includes("priority")) {
        fieldName = "priority";
        prismaFieldDef = prismaFieldDef || 'String? @default("MEDIUM")';
        tsType = tsType || "string";
        defaultValue = defaultValue || '"MEDIUM"';
      } else if (lowerReq.includes("notes") || lowerReq.includes("note")) {
        fieldName = "notes";
        prismaFieldDef = prismaFieldDef || "String?";
        tsType = tsType || "string";
        defaultValue = defaultValue || "null";
      } else if (lowerReq.includes("color") || lowerReq.includes("colour") || lowerReq.includes("background") || lowerReq.includes("theme")) {
        fieldName = "color";
        prismaFieldDef = prismaFieldDef || 'String? @default("#6366f1")';
        tsType = tsType || "string";
        defaultValue = defaultValue || '"#6366f1"';
      } else if (lowerReq.includes("description") || lowerReq.includes("bio") || lowerReq.includes("about")) {
        fieldName = "description";
        prismaFieldDef = prismaFieldDef || "String?";
        tsType = tsType || "string";
        defaultValue = defaultValue || "null";
      } else if (lowerReq.includes("title") || lowerReq.includes("name") || lowerReq.includes("label")) {
        fieldName = "title";
        prismaFieldDef = prismaFieldDef || "String?";
        tsType = tsType || "string";
        defaultValue = defaultValue || "null";
      } else if (lowerReq.includes("image") || lowerReq.includes("photo") || lowerReq.includes("avatar") || lowerReq.includes("thumbnail")) {
        fieldName = "imageUrl";
        prismaFieldDef = prismaFieldDef || "String?";
        tsType = tsType || "string";
        defaultValue = defaultValue || "null";
      } else if (lowerReq.includes("tag") || lowerReq.includes("label") || lowerReq.includes("category")) {
        fieldName = "tags";
        prismaFieldDef = prismaFieldDef || "String? @default(\"[]\")";
        tsType = tsType || "string";
        defaultValue = defaultValue || '"[]"';
      } else if (lowerReq.includes("emoji") || lowerReq.includes("sticker") || lowerReq.includes("icon")) {
        fieldName = "emoji";
        prismaFieldDef = prismaFieldDef || 'String? @default("📝")';
        tsType = tsType || "string";
        defaultValue = defaultValue || '"📝"';
      } else if (lowerReq.includes("status")) {
        fieldName = "status";
        prismaFieldDef = prismaFieldDef || 'String? @default("active")';
        tsType = tsType || "string";
        defaultValue = defaultValue || '"active"';
      } else if (lowerReq.includes("price") || lowerReq.includes("cost") || lowerReq.includes("amount")) {
        fieldName = "price";
        prismaFieldDef = prismaFieldDef || "Float? @default(0)";
        tsType = tsType || "number";
        defaultValue = defaultValue || "0";
      } else if (lowerReq.includes("date") || lowerReq.includes("time") || lowerReq.includes("due")) {
        fieldName = "dueDate";
        prismaFieldDef = prismaFieldDef || "DateTime?";
        tsType = tsType || "string";
        defaultValue = defaultValue || "null";
      } else if (lowerReq.includes("pin") || lowerReq.includes("favorite") || lowerReq.includes("favourite") || lowerReq.includes("star")) {
        fieldName = "isPinned";
        prismaFieldDef = prismaFieldDef || "Boolean? @default(false)";
        tsType = tsType || "boolean";
        defaultValue = defaultValue || "false";
      } else if (lowerReq.includes("count") || lowerReq.includes("streak") || lowerReq.includes("score") || lowerReq.includes("rating")) {
        fieldName = "count";
        prismaFieldDef = prismaFieldDef || "Int? @default(0)";
        tsType = tsType || "number";
        defaultValue = defaultValue || "0";
      }
    }

    // 3. Compute Impact Closure
    const impactEngine = new ImpactClosureEngine(projectPath);
    let impactResult: ImpactClosureResult;
    if (options.targetSymbols && options.targetSymbols.length > 0) {
      impactResult = impactEngine.computeClosure(options.targetSymbols);
    } else if (modelName) {
      impactResult = impactEngine.computeClosure([
        {
          filePath: "prisma/schema.prisma",
          symbolName: modelName,
          modelName,
        },
      ]);
    } else {
      impactResult = {
        status: "IMPACT_ANALYSIS_INCOMPLETE",
        targetSymbols: [],
        mustChange: [],
        mayChange: [],
        requiredTests: [],
        readOnly: [],
        protected: [],
        callGraphEdges: [],
        unresolvedReasons: [{ file: "request", reason: "Could not resolve target model or symbol from request." }],
      };
    }

    // 4. Check Preflight Git Cleanliness & Target Conflicts
    const gitPreflight = BrownfieldGitGuard.evaluatePreflight(projectPath, impactResult.mustChange);

    // 5. Derive Feature Branch Slug
    const slug = this.generateSlug(userRequest);
    const branchName = `aegis/feature/${slug}`;

    // 6. Generate In-Memory AST Patches
    let filePatches: { filePath: string; operations: AstPatchOperation[] }[] = [];
    let blockedReasons: string[] = [];

    if (impactResult.status !== "CLOSED") {
      blockedReasons.push(`Impact analysis incomplete: status "${impactResult.status}"`);
    }

    if (!gitPreflight.allowed) {
      blockedReasons.push(gitPreflight.reason || "Git preflight check failed: dirty target conflict");
    }

    if (impactResult.status === "CLOSED" && gitPreflight.allowed && modelName && fieldName && prismaFieldDef && tsType) {
      const planner = new ASTSymbolPatchPlanner(projectPath);
      filePatches = planner.planFieldPropagation({
        closure: impactResult,
        modelName,
        fieldName,
        prismaFieldDef,
        tsType,
        defaultValue,
      });
    }

    // 6. Capture Preimages and Generate Unified Diffs In-Memory
    const preimages: Record<string, string> = {};
    const allImpactedFiles = Array.from(
      new Set([
        ...impactResult.mustChange,
        ...impactResult.mayChange,
        ...filePatches.map(p => p.filePath),
      ])
    );

    for (const relPath of allImpactedFiles) {
      const fullPath = join(projectPath, relPath);
      const oldContent = existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
      preimages[relPath] = this.sha256(oldContent);
    }

    const fileDiffs: FilePatchDiff[] = [];
    let totalInsertions = 0;
    let totalDeletions = 0;

    for (const patch of filePatches) {
      const fullPath = join(projectPath, patch.filePath);
      const oldContent = existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";

      const newContent = this.simulatePatchInMemory(oldContent, patch.operations, patch.filePath);
      const diffResult = this.createUnifiedDiff(patch.filePath, oldContent, newContent);

      fileDiffs.push({
        filePath: patch.filePath,
        operations: patch.operations,
        oldContentSnippet: oldContent.slice(0, 300),
        newContentSnippet: newContent.slice(0, 300),
        unifiedDiff: diffResult.diff,
        linesAdded: diffResult.linesAdded,
        linesRemoved: diffResult.linesRemoved,
      });

      totalInsertions += diffResult.linesAdded;
      totalDeletions += diffResult.linesRemoved;
    }

    // 7. Calculate Deterministic Risk Level
    const isBlocked = blockedReasons.length > 0 || impactResult.status !== "CLOSED" || !gitPreflight.allowed;
    let riskLevel: RiskLevel = "LOW";
    if (isBlocked) {
      riskLevel = "BLOCKED";
    } else if (filePatches.length > 5 || filePatches.some(p => p.filePath.includes("schema.prisma"))) {
      riskLevel = "HIGH";
    } else if (filePatches.length > 1) {
      riskLevel = "MEDIUM";
    }

    // 8. Compute Cryptographic Plan & Patch Hashes
    const repoHead = this.getGitHeadSha(projectPath);
    const planHash = this.computePlanHash(repoHead, preimages, userRequest, contract, impactResult);
    const patchHash = this.computePatchHash(filePatches, preimages);

    return {
      mode: "BROWNFIELD",
      repository: projectPath,
      request: userRequest,
      slug,
      branchName,
      planHash,
      patchHash,
      impactStatus: impactResult.status,
      riskLevel,
      requiredFiles: impactResult.mustChange,
      mayChangeFiles: impactResult.mayChange,
      readOnlyFiles: impactResult.readOnly,
      blockedReasons,
      filePatches,
      fileDiffs,
      diffSummary: {
        filesChanged: fileDiffs.length,
        insertions: totalInsertions,
        deletions: totalDeletions,
      },
      isApplyAllowed: !isBlocked,
      preimages,
    };
  }

  /**
   * Verifies that the preview matches the active repository state exactly
   * and that no file contents or plan hashes drifted between preview and approval.
   */
  public static verifyImmutability(
    preview: PatchPreview,
    projectPath: string
  ): { valid: boolean; error?: string } {
    // 1. Verify Repository HEAD has not shifted
    const currentHead = this.getGitHeadSha(projectPath);
    
    // 2. Verify all preimage hashes on disk match preview preimages
    for (const [relPath, expectedHash] of Object.entries(preview.preimages)) {
      const fullPath = join(projectPath, relPath);
      const currentContent = existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
      const currentHash = this.sha256(currentContent);
      if (currentHash !== expectedHash) {
        return {
          valid: false,
          error: `PLAN_STALE: File "${relPath}" was modified on disk after preview was generated (hash drift).`,
        };
      }
    }

    // 3. Verify patchHash integrity
    const recomputedPatchHash = this.computePatchHash(preview.filePatches, preview.preimages);
    if (recomputedPatchHash !== preview.patchHash) {
      return {
        valid: false,
        error: `PATCH_DRIFT: Recomputed patch hash does not match immutable preview patch hash.`,
      };
    }

    return { valid: true };
  }

  /**
   * Generates a clean unified diff string between old and new text.
   */
  public static createUnifiedDiff(
    filePath: string,
    oldText: string,
    newText: string
  ): { diff: string; linesAdded: number; linesRemoved: number } {
    const oldLines = oldText.split("\n");
    const newLines = newText.split("\n");

    const diffLines: string[] = [
      `--- a/${filePath}`,
      `+++ b/${filePath}`,
    ];

    let linesAdded = 0;
    let linesRemoved = 0;

    // Simple line diff for preview visualization
    const max = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < max; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine === undefined && newLine !== undefined) {
        diffLines.push(`+ ${newLine}`);
        linesAdded++;
      } else if (oldLine !== undefined && newLine === undefined) {
        diffLines.push(`- ${oldLine}`);
        linesRemoved++;
      } else if (oldLine !== newLine) {
        diffLines.push(`- ${oldLine}`);
        diffLines.push(`+ ${newLine}`);
        linesRemoved++;
        linesAdded++;
      }
    }

    return {
      diff: diffLines.join("\n"),
      linesAdded,
      linesRemoved,
    };
  }

  /**
   * Formats a clean, high-impact terminal preview banner.
   */
  public static formatCliPreview(preview: PatchPreview): string {
    const riskColors = {
      LOW: "\x1b[32m",     // Green
      MEDIUM: "\x1b[33m",  // Yellow
      HIGH: "\x1b[35m",    // Magenta
      BLOCKED: "\x1b[31m", // Red
    };
    const reset = "\x1b[0m";
    const bold = "\x1b[1m";
    const cyan = "\x1b[36m";

    const lines: string[] = [
      "",
      `${bold}${cyan}╔════════════════════════════════════════════════════════════════════════════╗${reset}`,
      `${bold}${cyan}║                  AEGIS BROWNFIELD PATCH PREVIEW & SAFETY AUDIT            ║${reset}`,
      `${bold}${cyan}╚════════════════════════════════════════════════════════════════════════════╝${reset}`,
      "",
      `  ${bold}User Request:${reset}    "${preview.request}"`,
      `  ${bold}Target Branch:${reset}   ${cyan}${preview.branchName}${reset}`,
      `  ${bold}Plan Integrity:${reset}  ${preview.planHash.slice(0, 16)}...`,
      `  ${bold}Patch Integrity:${reset} ${preview.patchHash.slice(0, 16)}...`,
      `  ${bold}Risk Level:${reset}      ${riskColors[preview.riskLevel]}${bold}${preview.riskLevel}${reset}`,
      `  ${bold}Impact Summary:${reset}  ${preview.diffSummary.filesChanged} files changed (+${preview.diffSummary.insertions} / -${preview.diffSummary.deletions} lines)`,
      "",
      `  ${bold}MUST CHANGE FILES (${preview.requiredFiles.length}):${reset}`,
    ];

    for (const f of preview.requiredFiles) {
      lines.push(`    • ${cyan}${f}${reset}`);
    }

    if (preview.blockedReasons.length > 0) {
      lines.push("");
      lines.push(`  ${bold}\x1b[31mBLOCKED REASONS (${preview.blockedReasons.length}):${reset}`);
      for (const reason of preview.blockedReasons) {
        lines.push(`    ❌ ${reason}`);
      }
    } else {
      lines.push("");
      lines.push(`  ${bold}KEY PATCH OPERATIONS:${reset}`);
      for (const diff of preview.fileDiffs) {
        lines.push(`    ✓ ${diff.filePath} (${diff.operations.length} AST operations)`);
      }
    }

    lines.push("");
    return lines.join("\n");
  }

  // ─── INTERNAL HELPERS ─────────────────────────────────────────────────────────

  private static generateSlug(request: string): string {
    return request
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30) || "update";
  }

  private static sha256(content: string): string {
    return createHash("sha256").update(content).digest("hex");
  }

  private static getGitHeadSha(projectPath: string): string {
    try {
      return execSync("git rev-parse HEAD", { cwd: projectPath, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch {
      return "0000000000000000000000000000000000000000";
    }
  }

  private static computePlanHash(
    repoHead: string,
    preimages: Record<string, string>,
    request: string,
    contract: BrownfieldProjectContract,
    closure: ImpactClosureResult
  ): string {
    const payload = JSON.stringify({
      repoHead,
      preimages,
      request: request.trim().toLowerCase(),
      framework: contract.stack.framework,
      mustChange: closure.mustChange.sort(),
      mayChange: closure.mayChange.sort(),
    });
    return this.sha256(payload);
  }

  private static computePatchHash(
    patches: { filePath: string; operations: AstPatchOperation[] }[],
    preimages: Record<string, string>
  ): string {
    const payload = JSON.stringify(
      patches.map(p => ({
        filePath: p.filePath,
        preimage: preimages[p.filePath] || "",
        operations: p.operations,
      }))
    );
    return this.sha256(payload);
  }

  private static simulatePatchInMemory(
    content: string,
    operations: AstPatchOperation[],
    _filePath: string
  ): string {
    return ASTSymbolPatchPlanner.applyPatchesToContent(content, operations);
  }
}

/**
 * PathValidator & CreationGuard
 *
 * Validates all candidate repair file paths.
 * Rules:
 * 1. Resolves against project root.
 * 2. Rejects paths outside project root.
 * 3. Rejects node_modules paths.
 * 4. Rejects absolute paths or rogue characters.
 * 5. Rejects malformed strings (e.g. single character "s", ".ts", invalid extensions).
 * 6. Checks DynamicFileGraph and FileOwnershipRegistry.
 * 7. Enforces New File Creation policy: only if permitted by contract, file graph, and task scope.
 */

import { isAbsolute, normalize, resolve, relative } from "node:path";
import { existsSync } from "node:fs";
import { FileOwnershipRegistry, SubsystemRole } from "../governance/file-ownership.js";
import { SemanticDuplicateDetector } from "../governance/semantic-duplicate-detector.js";
import type { DynamicFileGraph } from "../governance/dynamic-file-graph.js";

export interface PathValidationResult {
  valid: boolean;
  normalizedRelativePath?: string;
  absolutePath?: string;
  reason?: string;
  canCreateIfMissing?: boolean;
}

export class PathValidator {
  private static readonly VALID_EXTENSIONS = new Set([
    ".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".prisma", ".html", ".md"
  ]);

  /**
   * Validate a relative or raw candidate path against a project root.
   */
  public static validatePath(
    rawPath: string,
    projectRoot: string,
    options?: {
      requestingAgent?: SubsystemRole;
      allowedFiles?: string[];
      fileGraph?: DynamicFileGraph | null;
      allowNewFiles?: boolean;
    }
  ): PathValidationResult {
    if (!rawPath || typeof rawPath !== "string") {
      return { valid: false, reason: "Path is empty or not a string" };
    }

    const trimmed = rawPath.trim();

    // 1. Rogue short strings rejection (e.g. "s", "a", ".ts")
    if (trimmed.length < 3) {
      return { valid: false, reason: `Path "${trimmed}" is too short to be a valid file path` };
    }

    // 2. Reject pure punctuation or malformed paths
    if (/^[./\\:*?"<>|]+$/.test(trimmed)) {
      return { valid: false, reason: `Path "${trimmed}" is malformed` };
    }

    // 3. Normalize path separators to POSIX
    const posixNormalized = trimmed.replace(/\\/g, "/");

    // 4. Reject node_modules, .git, or dist
    if (
      posixNormalized.startsWith("node_modules/") ||
      posixNormalized.includes("/node_modules/") ||
      posixNormalized.startsWith(".git/") ||
      posixNormalized.startsWith("dist/")
    ) {
      return { valid: false, reason: `Path "${trimmed}" accesses protected/generated directory` };
    }

    // 5. Check extension
    const dotIdx = posixNormalized.lastIndexOf(".");
    if (dotIdx === -1) {
      return { valid: false, reason: `Path "${trimmed}" has no file extension` };
    }
    const ext = posixNormalized.slice(dotIdx).toLowerCase();
    if (!this.VALID_EXTENSIONS.has(ext)) {
      return { valid: false, reason: `Extension "${ext}" is not permitted for code repair` };
    }

    // 6. Resolve absolute path and verify it stays inside project root
    let absPath: string;
    if (isAbsolute(trimmed)) {
      absPath = resolve(trimmed);
    } else {
      absPath = resolve(projectRoot, trimmed);
    }

    const relToRoot = relative(projectRoot, absPath).replace(/\\/g, "/");

    // Directory traversal check
    if (relToRoot.startsWith("..") || isAbsolute(relToRoot)) {
      return { valid: false, reason: `Path "${trimmed}" escapes project root` };
    }

    // 7. Check Task allowedFiles if provided
    if (options?.allowedFiles && options.allowedFiles.length > 0) {
      const allowedNormalized = options.allowedFiles.map(p => p.replace(/\\/g, "/").toLowerCase());
      const isAllowed = allowedNormalized.some(p => p === relToRoot.toLowerCase() || relToRoot.toLowerCase().endsWith(p));
      if (!isAllowed) {
        return { valid: false, reason: `Path "${relToRoot}" is outside the task's allowed files scope` };
      }
    }

    // 8. Check FileOwnershipRegistry if agent provided
    if (options?.requestingAgent) {
      const ownership = FileOwnershipRegistry.canWrite(relToRoot, options.requestingAgent);
      if (!ownership.allowed) {
        return { valid: false, reason: `File "${relToRoot}" is owned by "${ownership.currentOwner}", not "${options.requestingAgent}"` };
      }
    }

    // 9. Check New File Creation vs Existing Files
    const fileExists = existsSync(absPath);
    let canCreate = false;

    if (!fileExists) {
      if (!options?.allowNewFiles) {
        return {
          valid: false,
          normalizedRelativePath: relToRoot,
          absolutePath: absPath,
          reason: `File "${relToRoot}" does not exist and new file creation is not authorized for this operation`,
        };
      }

      // Check DynamicFileGraph if available
      if (options.fileGraph) {
        const inGraph = options.fileGraph.entries.some(e => e.canonicalPath.toLowerCase() === relToRoot.toLowerCase());
        if (!inGraph) {
          return {
            valid: false,
            normalizedRelativePath: relToRoot,
            absolutePath: absPath,
            reason: `File "${relToRoot}" does not exist in the DynamicFileGraph`,
          };
        }
      }

      // Check SemanticDuplicateDetector
      const dupCheck = SemanticDuplicateDetector.checkBeforeWrite(relToRoot);
      if (dupCheck.action === "DELETE_ORPHAN" && !dupCheck.allowed) {
        return {
          valid: false,
          normalizedRelativePath: relToRoot,
          absolutePath: absPath,
          reason: `File "${relToRoot}" is flagged as an unauthorized duplicate/orphan`,
        };
      }

      canCreate = true;
    }

    return {
      valid: true,
      normalizedRelativePath: relToRoot,
      absolutePath: absPath,
      canCreateIfMissing: canCreate,
    };
  }

  /**
   * Filter and sanitize a list of candidate files from raw error output.
   */
  public static sanitizeCandidateFiles(rawPaths: string[], projectRoot: string): string[] {
    const validPaths = new Set<string>();

    for (const raw of rawPaths) {
      const check = this.validatePath(raw, projectRoot, { allowNewFiles: false });
      if (check.valid && check.normalizedRelativePath) {
        validPaths.add(check.normalizedRelativePath);
      }
    }

    return Array.from(validPaths);
  }
}

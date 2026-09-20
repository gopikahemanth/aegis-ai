/**
 * FrontendFilePolicyGuard
 *
 * Enforces the hard filesystem boundary during frontend-only generation.
 *
 * During Stage 1–7 (frontend generation), Aegis must NEVER write:
 *   - server/**
 *   - prisma/**
 *   - migrations/**
 *   - database/**
 *   - backend/**
 *
 * This guard is applied at the point of file acceptance BEFORE any write
 * occurs. It is NOT a post-generation cleanup. Files that violate the policy
 * are rejected with FRONTEND_FILE_POLICY_VIOLATION and the task continues
 * without them.
 *
 * This is the enforcement mechanism for Master Rule 12:
 *   FRONTEND_IS_FIRST_REAL_IMPLEMENTATION — no backend code may exist
 *   before human frontend approval.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { GeneratedFile } from "../writer/writer.js";

/** Paths that are forbidden during the frontend-only generation stage. */
const FRONTEND_FORBIDDEN_PREFIXES = [
  "server/",
  "prisma/",
  "migrations/",
  "database/",
  "backend/",
  "db/",
] as const;

/** Specific file names forbidden during frontend-only generation. */
const FRONTEND_FORBIDDEN_FILES = [
  "schema.prisma",
] as const;

export interface FilePolicyViolation {
  path: string;
  reason: string;
}

export interface FilePolicyResult {
  allowed: GeneratedFile[];
  rejected: FilePolicyViolation[];
  hadViolations: boolean;
}

export class FrontendFilePolicyGuard {
  /**
   * Apply the frontend-only file policy to a batch of generated files.
   *
   * Returns the allowed files and a list of violations.
   * Logs each violation for auditability.
   *
   * @param files - The files proposed by CoderAgent
   * @param taskTitle - For logging context
   */
  static enforce(files: GeneratedFile[], taskTitle: string): FilePolicyResult {
    const allowed: GeneratedFile[] = [];
    const rejected: FilePolicyViolation[] = [];

    for (const file of files) {
      const normalizedPath = file.path.replace(/\\/g, "/");
      const fileName = normalizedPath.split("/").at(-1) ?? "";

      const forbiddenByPrefix = FRONTEND_FORBIDDEN_PREFIXES.find(
        (prefix) => normalizedPath.startsWith(prefix)
      );

      const forbiddenByName = FRONTEND_FORBIDDEN_FILES.find(
        (name) => fileName === name
      );

      if (forbiddenByPrefix) {
        const violation: FilePolicyViolation = {
          path: file.path,
          reason: `FRONTEND_FILE_POLICY_VIOLATION: File "${file.path}" is under the forbidden path prefix "${forbiddenByPrefix}". Backend/database files are not permitted during frontend-only generation stage. Task: "${taskTitle}".`,
        };
        rejected.push(violation);
        console.warn(`[FrontendFilePolicy] ❌ REJECTED: ${violation.reason}`);
      } else if (forbiddenByName) {
        const violation: FilePolicyViolation = {
          path: file.path,
          reason: `FRONTEND_FILE_POLICY_VIOLATION: File "${file.path}" matches a forbidden filename ("${forbiddenByName}"). Backend/database files are not permitted during frontend-only generation stage. Task: "${taskTitle}".`,
        };
        rejected.push(violation);
        console.warn(`[FrontendFilePolicy] ❌ REJECTED: ${violation.reason}`);
      } else {
        allowed.push(file);
      }
    }

    if (rejected.length > 0) {
      console.log(
        `[FrontendFilePolicy] Policy enforced for task "${taskTitle}": ` +
        `${allowed.length} file(s) allowed, ${rejected.length} file(s) rejected.`
      );
    }

    return {
      allowed,
      rejected,
      hadViolations: rejected.length > 0,
    };
  }

  /**
   * Assert that the frontend generation stage produced zero backend/database files.
   * Throws if any forbidden path exists on disk in the output directory.
   * This is a post-generation invariant check.
   */
  static assertNoBackendFilesSync(outputDirectory: string): void {
    const forbiddenDirs = ["server", "prisma", "migrations", "database", "backend"];
    const violations: string[] = [];

    for (const dir of forbiddenDirs) {
      const fullPath = join(outputDirectory, dir);
      if (existsSync(fullPath)) {
        violations.push(dir);
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `FRONTEND_STAGE_CONTAMINATION: Backend/database directories "${violations.join(", ")}" ` +
        `exist on disk after frontend-only generation. No backend/database files may exist before human approval.`
      );
    }
  }

  /**
   * Check (non-throwing) whether the output directory is clean of backend artifacts.
   */
  static checkBackendAbsence(outputDirectory: string): { clean: boolean; violations: string[] } {
    const forbiddenDirs = ["server", "prisma", "migrations", "database", "backend"];
    const violations: string[] = [];

    for (const dir of forbiddenDirs) {
      const fullPath = join(outputDirectory, dir);
      if (existsSync(fullPath)) {
        violations.push(dir);
      }
    }

    return { clean: violations.length === 0, violations };
  }
}

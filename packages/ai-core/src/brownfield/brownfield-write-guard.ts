import { existsSync } from "node:fs";
import { join } from "node:path";
import type { PatchOperationType } from "./brownfield-contract.js";

export interface WriteValidationResult {
  allowed: boolean;
  reason?: string;
}

export class BrownfieldWriteGuard {
  /**
   * Validates whether a file write operation is safe in brownfield mode.
   *
   * Invariants:
   * 1. existing file + CREATE -> REJECT (protects user code from overwrite)
   * 2. existing file + SURGICAL_PATCH -> ALLOWED (surgical patch via PatchEngine)
   * 3. new file + CREATE -> ALLOWED (new isolated feature file)
   * 4. full file replacement of existing file -> REJECT
   */
  public static validateWrite(
    projectRoot: string,
    relativePath: string,
    operation: PatchOperationType,
    isFullFileReplacement: boolean = false
  ): WriteValidationResult {
    const cleanPath = relativePath.replace(/\\/g, "/").replace(/^(\.\/|\/)+/, "");
    const fullPath = join(projectRoot, cleanPath);
    const fileExists = existsSync(fullPath);

    // Protected critical infrastructure files
    const protectedFiles = new Set(["package.json", "tsconfig.json", "pnpm-lock.yaml", "package-lock.json", "yarn.lock"]);
    if (protectedFiles.has(cleanPath) && isFullFileReplacement) {
      return {
        allowed: false,
        reason: `WRITE_BLOCKED: Full file replacement of critical file "${cleanPath}" is forbidden in brownfield mode.`,
      };
    }

    if (fileExists) {
      if (operation === "CREATE" || isFullFileReplacement) {
        return {
          allowed: false,
          reason: `WRITE_BLOCKED: Refusing to overwrite existing user file "${cleanPath}" with full-file CREATE. Use SURGICAL_PATCH instead.`,
        };
      }

      if (operation === "SURGICAL_PATCH" || operation === "SCHEMA_EXTEND") {
        return { allowed: true };
      }
    } else {
      // New file
      if (operation === "CREATE" || operation === "SURGICAL_PATCH") {
        return { allowed: true };
      }
    }

    return {
      allowed: false,
      reason: `WRITE_BLOCKED: Invalid operation "${operation}" for file "${cleanPath}".`,
    };
  }
}

import { existsSync } from "node:fs";
import { join } from "node:path";

import type { ValidationResult } from "./validation-result.js";

export class ProjectValidator {

  validate(
    projectPath: string,
  ): ValidationResult {

    const issues: string[] = [];

    if (!existsSync(projectPath)) {
      issues.push(
        "Project directory does not exist.",
      );
    }

    if (
      !existsSync(
        join(projectPath, "package.json"),
      )
    ) {
      issues.push(
        "package.json is missing.",
      );
    }

    return {
      passed: issues.length === 0,
      issues,
    };
  }
}

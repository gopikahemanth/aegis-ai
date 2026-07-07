import { existsSync } from "node:fs";
import { join } from "node:path";

import type { ValidationResult } from "./validation-result.js";
import { frameworkRules } from "./framework-rules.js";

export class ProjectValidator {

  validate(
    projectPath: string,
    framework: string,
  ): ValidationResult {

    const issues: string[] = [];

    const rules =
      frameworkRules[framework];

    if (!rules) {
      return {
        passed: false,
        issues: [
          `Unsupported framework: ${framework}`,
        ],
      };
    }

    for (const file of rules.requiredFiles) {

      if (
        !existsSync(
          join(projectPath, file),
        )
      ) {
        issues.push(
          `${file} is missing.`,
        );
      }
    }

    return {
      passed:
        issues.length === 0,
      issues,
    };
  }
}

import { isLikelySyntacticallyComplete } from "../utils/syntax-validator.js";

export interface ValidationIssue {
  type: "TRUNCATION" | "SYNTAX" | "UNBALANCED" | "MISSING_EXPORT";
  message: string;
}

export interface FileValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

/**
 * GeneratedFileValidator
 *
 * Deterministically checks AI-generated source files for truncation,
 * unbalanced brackets/braces/parentheses, incomplete statements, and syntax errors
 * BEFORE committing candidate files to the project.
 */
export class GeneratedFileValidator {
  public static validateCompleteness(content: string, path: string): FileValidationResult {
    const issues: ValidationIssue[] = [];

    if (!content || content.trim().length === 0) {
      issues.push({ type: "TRUNCATION", message: `File "${path}" is empty.` });
      return { valid: false, issues };
    }

    const isTs = path.endsWith(".ts") || path.endsWith(".tsx");

    // 1. Check syntax completeness heuristic
    if (isTs && !isLikelySyntacticallyComplete(content)) {
      issues.push({ type: "TRUNCATION", message: `File "${path}" appears to be truncated or incomplete.` });
    }

    // 2. Bracket Balance Check
    let braceCount = 0;
    let parenCount = 0;
    let bracketCount = 0;
    let inString = false;
    let stringChar = "";
    let inComment = false;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const nextChar = content[i + 1];

      // Handle strings
      if ((char === '"' || char === "'" || char === '`') && !inComment) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar && content[i - 1] !== '\\') {
          inString = false;
        }
      }

      if (inString) continue;

      // Handle brackets
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (char === '[') bracketCount++;
      if (char === ']') bracketCount--;
    }

    if (braceCount !== 0) {
      issues.push({ type: "UNBALANCED", message: `Unbalanced curly braces in "${path}" (delta: ${braceCount}).` });
    }
    if (parenCount !== 0) {
      issues.push({ type: "UNBALANCED", message: `Unbalanced parentheses in "${path}" (delta: ${parenCount}).` });
    }
    if (bracketCount !== 0) {
      issues.push({ type: "UNBALANCED", message: `Unbalanced square brackets in "${path}" (delta: ${bracketCount}).` });
    }

    // 3. Suspicious Trailing Expressions Check (check only the actual file ending, not lines in middle of file)
    const trimmed = content.trim();
    const lastChunk = trimmed.slice(-100);
    const suspiciousEndings = [
      /const\s+[a-zA-Z0-9_$]+\s*=$/,
      /let\s+[a-zA-Z0-9_$]+\s*=$/,
      /return\s*\{$/,
      /if\s*\($/,
      /export\s+const\s+[a-zA-Z0-9_$]+\s*=\s*\($/,
      /=\s*$/,
    ];

    for (const pattern of suspiciousEndings) {
      if (pattern.test(lastChunk)) {
        issues.push({ type: "TRUNCATION", message: `Suspicious trailing statement ending in "${path}".` });
        break;
      }
    }

    // 4. Placeholder / Stub Detection
    // These patterns indicate missing required functionality that must be implemented.
    // NOTE: Legitimate null handling (e.g. catch blocks returning null, optional returns) is excluded.
    if (isTs) {
      const PLACEHOLDER_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
        { pattern: /\/\/\s*TODO:/i, label: "TODO comment" },
        { pattern: /\/\/\s*FIXME:/i, label: "FIXME comment" },
        { pattern: /\/\/\s*IMPLEMENT\s*HERE/i, label: "IMPLEMENT HERE comment" },
        { pattern: /\/\/\s*PLACEHOLDER/i, label: "PLACEHOLDER comment" },
        { pattern: /\/\/\s*coming soon/i, label: "coming soon placeholder" },
        {
          // throw new Error("Not implemented") or throw new Error("TODO") — not inside catch blocks
          pattern: /throw\s+new\s+Error\s*\(\s*["'`](?:Not implemented|TODO|IMPLEMENT|PLACEHOLDER)["'`]\s*\)/i,
          label: "Not implemented stub"
        },
        {
          // export const api = {} (empty object export used as stub)
          pattern: /export\s+const\s+\w+\s*=\s*\{\s*\}\s*;?\s*$/m,
          label: "Empty exported object stub"
        },
      ];

      for (const { pattern, label } of PLACEHOLDER_PATTERNS) {
        if (pattern.test(content)) {
          issues.push({
            type: "SYNTAX",
            message: `Placeholder stub detected in "${path}": ${label}. This file requires complete implementation.`,
          });
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

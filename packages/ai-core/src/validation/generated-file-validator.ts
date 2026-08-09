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

    // 3. Suspicious Trailing Expressions Check
    const trimmed = content.trim();
    const suspiciousEndings = [
      /const\s+[a-zA-Z0-9_$]+\s*=$/m,
      /let\s+[a-zA-Z0-9_$]+\s*=$/m,
      /return\s*\{$/m,
      /if\s*\($/m,
      /export\s+const\s+[a-zA-Z0-9_$]+\s*=\s*\($/m,
      /<[a-zA-Z0-9_$]+$/m,
    ];

    for (const pattern of suspiciousEndings) {
      if (pattern.test(trimmed)) {
        issues.push({ type: "TRUNCATION", message: `Suspicious trailing statement ending in "${path}".` });
        break;
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

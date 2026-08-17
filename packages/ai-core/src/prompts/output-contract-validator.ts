/**
 * OutputContractValidator & Structured Repair Engine
 *
 * Validates agent JSON responses against role output schemas and builds targeted repair prompts on schema failures.
 */

export interface CodeChangeResult {
  status: "SUCCESS" | "FAILED";
  taskId: number | string;
  changedFiles: Array<{ path: string; content: string }>;
  createdFiles?: string[];
  deletedFiles?: string[];
  imports?: string[];
  exports?: string[];
  testsAdded?: string[];
  warnings?: string[];
}

export interface RepairProposal {
  repairId: string;
  failureId: string;
  strategy: string;
  affectedFiles: string[];
  changes: Array<{ path: string; content: string }>;
  newFiles?: string[];
  deletedFiles?: string[];
  reason: string;
  expectedResult: string;
  verificationPlan: string[];
}

export interface ReviewResult {
  verdict: "PASS" | "FAIL" | "BLOCKED" | "INCOMPLETE";
  evidence: string;
  violations: Array<{ rule: string; file?: string; line?: number; description: string }>;
  affectedFiles: string[];
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendedAction?: string;
}

export interface RealityResult {
  verdict: "PASS" | "FAIL";
  verifiedFeatures: string[];
  missingFeatures: string[];
  mockedFeatures: string[];
  evidence: string;
}

export interface FinalAuditResult {
  verdict: "COMPLETE" | "INCOMPLETE" | "FAILED" | "BLOCKED";
  buildEvidenceVerified: boolean;
  runtimeEvidenceVerified: boolean;
  browserEvidenceVerified: boolean;
  apiEvidenceVerified: boolean;
  reasons: string[];
}

export interface ValidationOutputResult<T> {
  isValid: boolean;
  parsed?: T;
  rawText: string;
  errors: string[];
}

export class OutputContractValidator {
  /**
   * Parse and validate model output against role schema.
   */
  public static validateOutput<T>(
    rawText: string,
    schemaName: "CodeChangeResult" | "RepairProposal" | "ReviewResult" | "RealityResult" | "FinalAuditResult"
  ): ValidationOutputResult<T> {
    const errors: string[] = [];

    // Extract JSON block if surrounded by markdown or extra text
    let jsonStr = rawText.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```\s*/, "").replace(/```$/, "").trim();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (err: any) {
      return {
        isValid: false,
        rawText,
        errors: [`JSON_SYNTAX_ERROR: Failed to parse output as valid JSON: ${err.message}`],
      };
    }

    if (!parsed || typeof parsed !== "object") {
      return {
        isValid: false,
        rawText,
        errors: ["SCHEMA_ERROR: Output must be a JSON object."],
      };
    }

    switch (schemaName) {
      case "CodeChangeResult":
        if (!parsed.status || (parsed.status !== "SUCCESS" && parsed.status !== "FAILED")) {
          errors.push(`Missing or invalid "status" field (must be "SUCCESS" or "FAILED").`);
        }
        if (parsed.taskId === undefined) {
          errors.push(`Missing "taskId" field.`);
        }
        if (!Array.isArray(parsed.changedFiles)) {
          errors.push(`"changedFiles" must be an array of { path: string, content: string }.`);
        } else {
          for (let i = 0; i < parsed.changedFiles.length; i++) {
            const f = parsed.changedFiles[i];
            if (!f.path || typeof f.path !== "string") errors.push(`changedFiles[${i}] missing valid "path".`);
            if (f.content === undefined || typeof f.content !== "string") errors.push(`changedFiles[${i}] missing valid "content".`);
          }
        }
        break;

      case "RepairProposal":
        if (!parsed.repairId) errors.push(`Missing "repairId".`);
        if (!parsed.failureId) errors.push(`Missing "failureId".`);
        if (!parsed.strategy) errors.push(`Missing "strategy".`);
        if (!Array.isArray(parsed.changes)) errors.push(`"changes" must be an array of { path, content }.`);
        break;

      case "ReviewResult":
        if (!parsed.verdict || !["PASS", "FAIL", "BLOCKED", "INCOMPLETE"].includes(parsed.verdict)) {
          errors.push(`"verdict" must be one of ["PASS", "FAIL", "BLOCKED", "INCOMPLETE"].`);
        }
        if (!parsed.evidence) errors.push(`Missing "evidence" description.`);
        break;

      case "RealityResult":
        if (!parsed.verdict || !["PASS", "FAIL"].includes(parsed.verdict)) {
          errors.push(`"verdict" must be "PASS" or "FAIL".`);
        }
        break;

      case "FinalAuditResult":
        if (!parsed.verdict || !["COMPLETE", "INCOMPLETE", "FAILED", "BLOCKED"].includes(parsed.verdict)) {
          errors.push(`"verdict" must be one of ["COMPLETE", "INCOMPLETE", "FAILED", "BLOCKED"].`);
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      parsed: errors.length === 0 ? (parsed as T) : undefined,
      rawText,
      errors,
    };
  }

  /**
   * Construct a structured repair prompt for the model when output validation fails.
   */
  public static buildRepairPrompt(
    schemaName: string,
    rawOutput: string,
    errors: string[]
  ): string {
    return (
      `═══════════════════════════════════════════════════════════════════════════════\n` +
      `INVALID OUTPUT REPAIR NOTICE\n` +
      `Your previous response failed validation against the "${schemaName}" schema.\n` +
      `═══════════════════════════════════════════════════════════════════════════════\n` +
      `EXACT VALIDATION ERRORS:\n` +
      errors.map(e => `- ${e}`).join("\n") +
      `\n\nYOUR PREVIOUS RAW RESPONSE:\n` +
      rawOutput.slice(0, 1000) +
      `\n\nINSTRUCTION:\n` +
      `Please fix these schema errors and return ONLY the corrected raw JSON object matching ${schemaName}. Do not include markdown commentary.`
    );
  }
}

import { getSystemPrompt } from "./system-prompt.js";
import { PROMPT_VERSIONS } from "./versions.js";
import { PromptValidator } from "./prompt-validator.js";
import { PromptLogger } from "./logger.js";
import type {
  ProjectContext,
  TaskContext,
  RepairContext,
  FeatureChangeContext,
  FinalAuditContext,
} from "./types.js";

export class PromptBuilder {
  /**
   * Build base system prompt for role
   */
  public static buildSystemPrompt(role?: string): string {
    return getSystemPrompt(role);
  }

  /**
   * Format structured ProjectContext block
   */
  public static buildProjectContextPrompt(projectContext: ProjectContext): string {
    const val = PromptValidator.validatePromptContext(projectContext);
    if (!val.isValid) {
      throw new Error(`Invalid ProjectContext: ${val.errors.join("; ")}`);
    }

    const arch = projectContext.architecture;
    const dv = projectContext.domainVocabulary;

    return `
═══════════════════════════════════════════════════════
PROJECT CONFLICT-FREE CONTRACT (IMMUTABLE SINGLE SOURCE OF TRUTH)
═══════════════════════════════════════════════════════
Project ID:     ${projectContext.projectId}
Generation ID:  ${projectContext.generationId}
Contract Version: ${projectContext.contractVersion}
Contract Hash:   ${projectContext.contractHash}
Architecture Hash: ${projectContext.architectureHash}

USER ORIGINAL REQUEST:
"${projectContext.originalRequest}"

ARCHITECTURE LOCK:
• Frontend: ${arch.frontend}
• Backend:  ${arch.backend}
• Database: ${arch.database}
• ORM:      ${arch.orm}
• Auth:     ${arch.auth}
• Language: ${arch.language}
• Styling:  ${arch.styling}

ALLOWED TECHNOLOGIES: ${projectContext.allowedTechnologies.join(", ")}
FORBIDDEN TECHNOLOGIES (WILL BE REJECTED): ${projectContext.forbiddenTechnologies.join(", ")}

DOMAIN VOCABULARY CONTRACT:
• Entity Singular: ${dv.entityName}
• Entity Plural:   ${dv.entityPlural}
• Domain Prefix:   ${dv.domainPrefix}
• Primary KPI Metrics: ${dv.primaryMetrics.join(" | ")}
• Primary Action Verbs: ${dv.actionVerbs.join(" | ")}

PLANNED CANONICAL FILES:
${projectContext.canonicalFiles.map((f) => `  - ${f}`).join("\n")}
═══════════════════════════════════════════════════════
`;
  }

  /**
   * Build Task Execution Prompt
   */
  public static buildTaskPrompt(projectContext: ProjectContext, taskContext: TaskContext): string {
    const val = PromptValidator.validatePromptContext(projectContext, taskContext);
    if (!val.isValid) {
      PromptLogger.logCall("CoderAgent", PROMPT_VERSIONS.CODER, projectContext, taskContext, "INVALID", val.errors.join("; "));
      throw new Error(`Invalid TaskContext or ProjectContext: ${val.errors.join("; ")}`);
    }

    PromptLogger.logCall("CoderAgent", PROMPT_VERSIONS.CODER, projectContext, taskContext, "VALID");

    const system = this.buildSystemPrompt("Principal Coder Agent");
    const projBlock = this.buildProjectContextPrompt(projectContext);

    return `${system}

${projBlock}

═══════════════════════════════════════════════════════
TASK CONTRACT & OWNERSHIP BOUNDARIES
═══════════════════════════════════════════════════════
Task ID: ${taskContext.taskId}
Title:   ${taskContext.title}
Description: ${taskContext.description}
Contract Hash Verification: ${taskContext.projectContractHash} (MATCHES PROJECT CONTRACT)
Architecture Hash Verification: ${taskContext.architectureHash} (MATCHES ARCHITECTURE LOCK)

OWNED FILES (You are explicitly authorized to create or update ONLY these files):
${taskContext.ownedFiles.map((f) => `  • ${f}`).join("\n")}

ALLOWED IMPORT SYMBOLS & DEPENDENCIES:
${taskContext.allowedFiles.map((f) => `  • ${f}`).join("\n")}

ACCEPTANCE CRITERIA:
${taskContext.acceptanceCriteria.map((c) => `  ✓ ${c}`).join("\n")}

REQUIRED STRICT OUTPUT FORMAT:
Your response MUST be raw JSON matching this structure exactly (no markdown fences, no explanations):
{
  "files": [
    {
      "path": "relative/path/to/file.tsx",
      "content": "full source code implementation..."
    }
  ]
}
═══════════════════════════════════════════════════════
`;
  }

  /**
   * Build Self-Healing Repair Prompt
   */
  public static buildRepairPrompt(repairContext: RepairContext): string {
    const proj = repairContext.currentProjectContract;
    PromptLogger.logCall("HealerAgent", PROMPT_VERSIONS.HEALER, proj, repairContext.currentTask, "VALID");

    const system = this.buildSystemPrompt("Self-Healing Diagnostic & Repair Agent");
    const projBlock = this.buildProjectContextPrompt(proj);

    return `${system}

${projBlock}

═══════════════════════════════════════════════════════
EMPIRICAL FAILURE EVIDENCE & REPAIR CONTRACT
═══════════════════════════════════════════════════════
Failure ID:   ${repairContext.failureId}
Failure Type: ${repairContext.failureType}
Checkpoint:   ${repairContext.checkpoint}
Previous Repair Attempts: ${repairContext.previousAttempts} (Max 3)

EXACT ERROR MESSAGE:
${repairContext.errorMessage}

STACK TRACE EVIDENCE:
${repairContext.stackTrace || "N/A"}

BROWSER CONSOLE / NETWORK LOGS:
${repairContext.browserConsole || "N/A"}
${repairContext.networkFailure || ""}

SERVER LOGS:
${repairContext.serverLogs || "N/A"}

AFFECTED FILES FOR REPAIR:
${repairContext.affectedFiles.map((f) => `  • ${f}`).join("\n")}

EXPECTED BEHAVIOR:
${repairContext.expectedBehavior}

STRICT REPAIR INSTRUCTIONS:
1. Identify the root cause from the empirical log evidence above.
2. Fix ONLY the root cause in the affected files.
3. DO NOT change the architecture contract, framework, or database provider.
4. Return ONLY valid JSON with updated file contents:
{
  "files": [
    {
      "path": "relative/path/to/file.tsx",
      "content": "fixed implementation..."
    }
  ]
}
═══════════════════════════════════════════════════════
`;
  }

  /**
   * Build Feature Addition Prompt
   */
  public static buildFeatureChangePrompt(changeContext: FeatureChangeContext): string {
    const proj = changeContext.currentProject;
    PromptLogger.logCall("ArchitectAgent", PROMPT_VERSIONS.FEATURE_ADDITION, proj, undefined, "VALID");

    const system = this.buildSystemPrompt("Feature Addition Architect Agent");
    const projBlock = this.buildProjectContextPrompt(proj);

    return `${system}

${projBlock}

═══════════════════════════════════════════════════════
INCREMENTAL FEATURE CHANGE CONTRACT
═══════════════════════════════════════════════════════
NEW FEATURE REQUEST:
"${changeContext.newFeatureRequest}"

IMPACT ANALYSIS:
• Affected Files:  ${changeContext.impactAnalysis.affectedFiles.join(", ")}
• Affected APIs:   ${changeContext.impactAnalysis.affectedApis.join(", ")}
• Affected Models: ${changeContext.impactAnalysis.affectedModels.join(", ")}
• Affected Routes: ${changeContext.impactAnalysis.affectedRoutes.join(", ")}
• Security Impact: ${changeContext.impactAnalysis.securityImpact}

ACCEPTANCE CRITERIA:
${changeContext.acceptanceCriteria.map((c) => `  ✓ ${c}`).join("\n")}

INSTRUCTIONS:
Maintain 100% regression safety for existing features while implementing the new feature.
Return structured JSON containing all updated or new files.
═══════════════════════════════════════════════════════
`;
  }

  /**
   * Build Final Audit Prompt
   */
  public static buildFinalAuditPrompt(auditContext: FinalAuditContext): string {
    PromptLogger.logCall("FinalAuditor", PROMPT_VERSIONS.FINAL_AUDITOR, auditContext.projectContext, undefined, "VALID");

    const system = this.buildSystemPrompt("Independent Final Auditor Agent");
    const projBlock = this.buildProjectContextPrompt(auditContext.projectContext);

    return `${system}

${projBlock}

═══════════════════════════════════════════════════════
INDEPENDENT FINAL AUDIT EVIDENCE
═══════════════════════════════════════════════════════
Original Request: "${auditContext.originalRequest}"

FILESYSTEM VERIFICATION (${auditContext.actualFilesystem.length} files present):
${auditContext.actualFilesystem.slice(0, 15).map((f) => `  • ${f}`).join("\n")}

AUTOMATED GATE STATUSES:
• Build Gate:        [${auditContext.buildOutput.status}] ${auditContext.buildOutput.output.slice(0, 100)}
• Test Gate:         [${auditContext.testOutput.status}] ${auditContext.testOutput.output.slice(0, 100)}
• Runtime Gate:      [${auditContext.runtimeOutput.status}] ${auditContext.runtimeOutput.output.slice(0, 100)}
• Browser Gate:      [${auditContext.browserOutput.status}] (${auditContext.browserOutput.consoleLogs.length} console errors)
• RealityChecker:    [${auditContext.realityCheckerOutput.status}] Missing: ${auditContext.realityCheckerOutput.missingFeatures.join(", ") || "None"}
• VisualReviewer:    [${auditContext.visualReviewerOutput.status}]
• Security Gate:     [${auditContext.securityOutput.status}] Vulnerabilities: ${auditContext.securityOutput.vulnerabilities.join(", ") || "None"}

CRITICAL RULE FOR FINAL AUDITOR:
You must independently decide final status: PASS, FAIL, or BLOCKED.
Do NOT trust previous agent SUCCESS messages if browser runtime or reality checker failed.
BUILD SUCCESS ≠ PROJECT SUCCESS.

Return ONLY valid JSON:
{
  "status": "PASS" | "FAIL" | "BLOCKED",
  "score": number,
  "summary": "...",
  "unresolvedIssues": ["..."]
}
═══════════════════════════════════════════════════════
`;
  }
}

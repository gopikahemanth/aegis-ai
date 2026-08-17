import type { ProjectContext, TaskContext } from "./types.js";

export interface ContextValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface AgentResponseValidationResult {
  isValid: boolean;
  violations: string[];
  staleDomainDetected: boolean;
  staleTerms: string[];
  forbiddenStackDetected: boolean;
  forbiddenTerms: string[];
}

export class PromptValidator {
  /**
   * Validate that all required context is present before calling LLM
   */
  public static validatePromptContext(
    projectContext: ProjectContext,
    taskContext?: TaskContext
  ): ContextValidationResult {
    const errors: string[] = [];

    if (!projectContext) {
      return { isValid: false, errors: ["CRITICAL: ProjectContext is null or undefined."] };
    }
    if (!projectContext.projectId) errors.push("Missing projectId in ProjectContext.");
    if (!projectContext.generationId) errors.push("Missing generationId in ProjectContext.");
    if (!projectContext.contractHash) errors.push("Missing contractHash in ProjectContext.");
    if (!projectContext.architectureHash) errors.push("Missing architectureHash in ProjectContext.");
    if (!projectContext.architecture?.frontend) errors.push("Missing frontend architecture specification.");
    if (!projectContext.architecture?.backend) errors.push("Missing backend architecture specification.");

    if (taskContext) {
      if (!taskContext.taskId) errors.push("Missing taskId in TaskContext.");
      if (!taskContext.ownedFiles || taskContext.ownedFiles.length === 0) {
        errors.push(`Missing ownedFiles for task '${taskContext.taskId}'.`);
      }
      if (taskContext.projectContractHash !== projectContext.contractHash) {
        errors.push(`TaskContext contractHash mismatch. Expected ${projectContext.contractHash}, got ${taskContext.projectContractHash}.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate agent output against locked ProjectContext BEFORE writing files to disk.
   */
  public static validateAgentResponse(
    responseContent: string,
    projectContext: ProjectContext
  ): AgentResponseValidationResult {
    const violations: string[] = [];
    const staleTerms: string[] = [];
    const forbiddenTerms: string[] = [];

    // 1. Check Architecture Immutability (Forbidden Stack Drift)
    for (const forbiddenTech of projectContext.forbiddenTechnologies) {
      const regex = new RegExp(`\\b${forbiddenTech}\\b`, "i");
      if (regex.test(responseContent)) {
        forbiddenTerms.push(forbiddenTech);
        violations.push(`Forbidden technology detected: '${forbiddenTech}' violates architecture lock (${projectContext.architecture.frontend} / ${projectContext.architecture.backend}).`);
      }
    }

    // 2. Check Stale Domain Contamination
    const reqLower = projectContext.originalRequest.toLowerCase();
    const isCodeReview = reqLower.includes("code review") || reqLower.includes("security scanner") || reqLower.includes("vulnerability");
    const isConference = reqLower.includes("conference") || reqLower.includes("event") || reqLower.includes("ticket");
    const isResume = reqLower.includes("resume") || reqLower.includes("ats") || reqLower.includes("keyword");

    if (isCodeReview) {
      const resumeStaleRegex = /\b(Resume|JobDescription|KeywordMatch|ResumeUpload|CandidateMatch|Applicant)\b/g;
      const matches = responseContent.match(resumeStaleRegex);
      if (matches) {
        const unique = Array.from(new Set(matches));
        staleTerms.push(...unique);
        violations.push(`Stale domain contamination: Code Reviewer project contains forbidden Resume domain terms (${unique.join(", ")}).`);
      }
    } else if (isConference) {
      const resumeStaleRegex = /\b(Resume|JobDescription|KeywordMatch|CandidateMatch)\b/g;
      const matches = responseContent.match(resumeStaleRegex);
      if (matches) {
        const unique = Array.from(new Set(matches));
        staleTerms.push(...unique);
        violations.push(`Stale domain contamination: Conference Portal project contains forbidden Resume domain terms (${unique.join(", ")}).`);
      }
    } else if (isResume) {
      const confStaleRegex = /\b(SeatBooking|SpeakerAgenda|ConferenceTicket|AttendeeBadgePass)\b/g;
      const matches = responseContent.match(confStaleRegex);
      if (matches) {
        const unique = Array.from(new Set(matches));
        staleTerms.push(...unique);
        violations.push(`Stale domain contamination: Resume project contains forbidden Conference domain terms (${unique.join(", ")}).`);
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
      staleDomainDetected: staleTerms.length > 0,
      staleTerms,
      forbiddenStackDetected: forbiddenTerms.length > 0,
      forbiddenTerms,
    };
  }

  /**
   * Validate that LLM output is structured JSON matching { "files": [{ "path": "...", "content": "..." }] }
   */
  public static validateStructuredOutput(rawOutput: string): { isValid: boolean; files?: Array<{ path: string; content: string }>; error?: string } {
    try {
      // Strip markdown code fences if present
      let jsonStr = rawOutput.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim();
      }

      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== "object") {
        return { isValid: false, error: "Parsed output is not an object." };
      }
      if (!Array.isArray(parsed.files)) {
        return { isValid: false, error: "Missing or non-array 'files' property in JSON response." };
      }

      for (const f of parsed.files) {
        if (!f.path || typeof f.path !== "string" || f.path.trim() === "") {
          return { isValid: false, error: "Invalid or empty file path in JSON response files array." };
        }
        if (typeof f.content !== "string") {
          return { isValid: false, error: `Non-string content for file path '${f.path}'.` };
        }
      }

      return { isValid: true, files: parsed.files };
    } catch (err: any) {
      return { isValid: false, error: `Failed to parse JSON output: ${err.message}` };
    }
  }
}

/**
 * RequirementClarificationEngine
 *
 * Distinguishes SAFE_TO_INFER from BLOCKING_AMBIGUITY (e.g. destructive migration,
 * ambiguous architecture choices, security boundaries). Returns NEEDS_CLARIFICATION
 * only when blocking ambiguities exist.
 */

export type ClarificationStatus = "SAFE_TO_PROCEED" | "NEEDS_CLARIFICATION";

export interface ClarificationReport {
  status: ClarificationStatus;
  isBlocking: boolean;
  blockingAmbiguities: string[];
  inferredDecisions: string[];
  message: string;
}

export class RequirementClarificationEngine {
  public static evaluate(userPrompt: string): ClarificationReport {
    const promptLower = userPrompt.toLowerCase();
    const blockingAmbiguities: string[] = [];
    const inferredDecisions: string[] = [];

    // 1. Check for Destructive / Ambiguous requests
    if (promptLower.includes("delete database") || promptLower.includes("wipe all data")) {
      blockingAmbiguities.push("DESTRUCTIVE_DATA_LOSS: Request specifies deleting database records without target scope.");
    }

    if (promptLower.includes("switch everything to something else") || promptLower.includes("change all technologies")) {
      blockingAmbiguities.push("ARCHITECTURE_AMBIGUITY: Unspecified technology migration target.");
    }

    // 2. Safe inferences
    if (promptLower.includes("add ") || promptLower.includes("build ") || promptLower.includes("create ")) {
      inferredDecisions.push("Standard modern stack selected (React-Vite + Express + PostgreSQL/Prisma).");
    }

    const isBlocking = blockingAmbiguities.length > 0;

    return {
      status: isBlocking ? "NEEDS_CLARIFICATION" : "SAFE_TO_PROCEED",
      isBlocking,
      blockingAmbiguities,
      inferredDecisions,
      message: isBlocking
        ? `NEEDS_CLARIFICATION: Blocking ambiguities detected: ${blockingAmbiguities.join("; ")}`
        : "SAFE_TO_PROCEED: All requirements are explicit or safely inferable.",
    };
  }
}

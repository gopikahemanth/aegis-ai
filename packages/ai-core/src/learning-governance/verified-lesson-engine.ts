/**
 * VerifiedLessonEngine
 *
 * Extracts reusable organizational lessons from real operational outcomes.
 * Hard Invariant: Rejects lessons derived solely from forecasts, simulations, or incomplete evidence.
 */

export interface LessonExtractionInput {
  decisionId: string;
  actionId: string;
  outcomeId: string;
  evidenceIds: string[];
  isEmpiricallyVerified: boolean;
  isSimulatedOnly: boolean;
  actualBenefitScore: number; // 0 to 100
  title: string;
  description: string;
  category: string;
  projects: string[];
  teams: string[];
  domains: string[];
}

export interface ExtractedLessonReport {
  isAccepted: boolean;
  lessonId?: string;
  confidence: number;
  verificationStatus: "VERIFIED" | "PROPOSED" | "REJECTED";
  rejectionReason?: string;
  reuseConditions: string[];
  summary: string;
}

export class VerifiedLessonEngine {
  public static extractLesson(input: LessonExtractionInput): ExtractedLessonReport {
    if (input.isSimulatedOnly) {
      return {
        isAccepted: false,
        confidence: 0,
        verificationStatus: "REJECTED",
        rejectionReason: "SIMULATION_NOT_PERMITTED_AS_VERIFIED_LESSON_SOURCE",
        reuseConditions: [],
        summary: `Lesson "${input.title}" rejected: Simulations alone cannot produce verified institutional lessons.`,
      };
    }

    if (!input.isEmpiricallyVerified || input.evidenceIds.length === 0) {
      return {
        isAccepted: false,
        confidence: 0.3,
        verificationStatus: "PROPOSED",
        rejectionReason: "INSUFFICIENT_EMPIRICAL_EVIDENCE",
        reuseConditions: [],
        summary: `Lesson "${input.title}" held in PROPOSED status: Empirical evidence verification required.`,
      };
    }

    const confidence = input.evidenceIds.length >= 2 ? 0.96 : 0.88;

    return {
      isAccepted: true,
      lessonId: `vles_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      confidence,
      verificationStatus: "VERIFIED",
      reuseConditions: [
        "Project shares identical database ORM architecture (Prisma/PostgreSQL)",
        "Runtime telemetry monitoring is actively enabled",
      ],
      summary: `Lesson "${input.title}" verified and accepted into institutional learning repository (confidence: ${confidence}).`,
    };
  }
}

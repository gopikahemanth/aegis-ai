/**
 * InstitutionalLearningRegistry
 *
 * Canonical registry for verified enterprise lessons extracted from operational outcomes.
 * Hard Invariant: LESSON != VERIFIED FACT. Only verified evidence may promote a lesson to VERIFIED.
 */

export type LessonLifecycleStatus =
  | "PROPOSED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "ACTIVE"
  | "AGING"
  | "EXPIRED"
  | "REVALIDATION_REQUIRED";

export interface OrganizationalLesson {
  lessonId: string;
  sourceActionId: string;
  sourceDecisionId: string;
  sourceOutcomeId: string;
  evidenceReferences: string[];
  lessonCategory: string;
  title: string;
  description: string;
  confidence: number;
  verificationStatus: LessonLifecycleStatus;
  affectedProjects: string[];
  affectedTeams: string[];
  affectedDomains: string[];
  createdAt: string;
  lastValidatedAt: string;
  expirationTimestamp: string;
}

export class InstitutionalLearningRegistry {
  private static lessons: Map<string, OrganizationalLesson> = new Map();

  public static registerLesson(
    lesson: Omit<OrganizationalLesson, "lessonId" | "createdAt" | "lastValidatedAt" | "expirationTimestamp">
  ): OrganizationalLesson {
    const now = new Date();
    const expiry = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

    const record: OrganizationalLesson = {
      ...lesson,
      lessonId: `les_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now.toISOString(),
      lastValidatedAt: now.toISOString(),
      expirationTimestamp: expiry.toISOString(),
    };

    this.lessons.set(record.lessonId, record);
    return record;
  }

  public static getLesson(lessonId: string): OrganizationalLesson | undefined {
    return this.lessons.get(lessonId);
  }

  public static getAllLessons(): OrganizationalLesson[] {
    return Array.from(this.lessons.values());
  }

  public static updateStatus(lessonId: string, status: LessonLifecycleStatus): boolean {
    const l = this.lessons.get(lessonId);
    if (!l) return false;
    l.verificationStatus = status;
    l.lastValidatedAt = new Date().toISOString();
    return true;
  }

  public static reset(): void {
    this.lessons.clear();
  }
}

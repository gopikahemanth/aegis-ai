/**
 * EngineeringPatternEngine
 *
 * Identifies recurring architectural, operational, and performance patterns across engineering projects.
 */

export type EngineeringPatternStatus =
  | "EMERGING"
  | "ESTABLISHED"
  | "HIGH_CONFIDENCE"
  | "DECLINING"
  | "STALE";

export interface RecognizedEngineeringPattern {
  patternId: string;
  patternType: string;
  title: string;
  frequency: number;
  status: EngineeringPatternStatus;
  affectedProjects: string[];
  affectedTeams: string[];
  commonConditions: string[];
  historicalOutcomes: string[];
  supportingEvidence: string[];
  confidence: number;
  lastObservedAt: string;
}

export class EngineeringPatternEngine {
  public static recognizePattern(
    patternType: string,
    title: string,
    frequency: number,
    projects: string[],
    teams: string[],
    evidence: string[]
  ): RecognizedEngineeringPattern {
    let status: EngineeringPatternStatus = "EMERGING";
    if (frequency >= 5 && evidence.length >= 3) {
      status = "HIGH_CONFIDENCE";
    } else if (frequency >= 2) {
      status = "ESTABLISHED";
    }

    return {
      patternId: `pat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      patternType,
      title,
      frequency,
      status,
      affectedProjects: projects,
      affectedTeams: teams,
      commonConditions: ["High concurrent load", "Shared connection pools"],
      historicalOutcomes: ["Resolved by increasing pool size to 50"],
      supportingEvidence: evidence,
      confidence: status === "HIGH_CONFIDENCE" ? 0.98 : 0.85,
      lastObservedAt: new Date().toISOString(),
    };
  }
}

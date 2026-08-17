/**
 * RequirementDiscoveryEngine
 *
 * Converts multi-signal evidence into concrete candidate requirements.
 * Invariant: SIGNAL ≠ REQUIREMENT (Transforms observed friction into formalized requirements)
 */

import { SignalCollectionReport } from "./requirement-signal-engine.js";

export interface CandidateRequirement {
  id: string;
  title: string;
  description: string;
  sourceSignals: string[];
  affectedUsers: string[];
  expectedOutcome: string;
  evidenceStrength: "WEAK" | "MODERATE" | "STRONG" | "COMPELLING";
  confidence: number;
}

export interface RequirementDiscoveryReport {
  totalCandidates: number;
  candidates: CandidateRequirement[];
  primaryCandidate?: CandidateRequirement;
  summary: string;
}

export class RequirementDiscoveryEngine {
  public static discoverRequirements(signals: SignalCollectionReport): RequirementDiscoveryReport {
    const candidates: CandidateRequirement[] = [];

    const exportSignals = signals.signals.filter(
      (s) =>
        s.description.toLowerCase().includes("export") ||
        s.description.toLowerCase().includes("spreadsheet") ||
        s.description.toLowerCase().includes("member") ||
        s.description.toLowerCase().includes("administrative")
    );

    const vagueSignals = signals.signals.filter(
      (s) => s.id === "sig_vague_ai" || s.description.toLowerCase().includes("ai analytics")
    );

    if (exportSignals.length > 0) {
      const hasConflict = signals.signals.some((s) => s.id === "sig_conflict_security_policy");
      candidates.push({
        id: "REQ-061",
        title: hasConflict
          ? "Unrestricted Member Data & Financial Export"
          : "Authorized Member Data Bulk Export (Excel/CSV)",
        description: hasConflict
          ? "Provide unrestricted member records and card token export for manager roles"
          : "Provide filtered member-data spreadsheet export functionality for authorized gym managers",
        sourceSignals: exportSignals.map((s) => s.id),
        affectedUsers: ["Gym Manager", "Gym Owner"],
        expectedOutcome: "Eliminates repetitive manual roster copying and saves administrative staff 4 hours/week",
        evidenceStrength: exportSignals.length >= 2 ? "COMPELLING" : "STRONG",
        confidence: 0.94,
      });
    }

    if (vagueSignals.length > 0) {
      candidates.push({
        id: "REQ-VAGUE-01",
        title: "Generic AI Analytics Integration",
        description: "Add undefined AI analytics capability mentioned in single feedback note",
        sourceSignals: vagueSignals.map((s) => s.id),
        affectedUsers: ["General User"],
        expectedOutcome: "Unknown",
        evidenceStrength: "WEAK",
        confidence: 0.15,
      });
    }

    return {
      totalCandidates: candidates.length,
      candidates,
      primaryCandidate: candidates[0],
      summary: `Requirement Discovery: Discovered ${candidates.length} candidate requirement(s) from ${signals.totalSignals} telemetry signals.`,
    };
  }
}

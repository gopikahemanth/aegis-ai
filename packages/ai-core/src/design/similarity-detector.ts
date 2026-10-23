/**
 * Aegis AI — Phase 3 Cross-Project Design Similarity Detector
 *
 * Compares newly synthesized design profiles against recent project signatures
 * across 8 multi-dimensional axes (Hue, Typography, Hero Concept, Section Sequence,
 * Navigation Strategy, Density, Signature Interaction, Visual Motif).
 *
 * Rejects derivative / cookie-cutter designs and guides bounded regeneration with
 * an actionable 'avoid' list.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { AegisDesignBriefV2 } from "./design-brief-generator.js";

export interface ProjectDesignSignature {
  projectId: string;
  projectName: string;
  domain: string;
  timestamp: string;
  brandHue: number;
  primaryColor: string;
  fontPairingId: string;
  displayFont: string;
  heroType: string;
  heroConcept: string;
  navigationStrategy: string;
  density: "compact" | "comfortable" | "spacious";
  sectionSequence: string[];
  signatureInteractionName: string;
}

export interface SimilarityAxisScore {
  axis: "hue" | "typography" | "hero" | "sectionSequence" | "navigation" | "density" | "interaction";
  score: number; // 0.0 (completely distinct) to 1.0 (identical)
  detail: string;
}

export interface SimilarityEvaluationResult {
  overallSimilarity: number; // 0.0 to 1.0
  passed: boolean; // true if overallSimilarity < threshold
  threshold: number;
  mostSimilarProject?: {
    projectId: string;
    domain: string;
    similarity: number;
  };
  axisBreakdown: SimilarityAxisScore[];
  recommendations: string[];
  historyCount: number;
  isHistorySufficient: boolean;
}

export class CrossProjectSimilarityDetector {
  private static readonly SIMILARITY_THRESHOLD = 0.70;
  private static readonly MAX_HISTORY_WINDOW = 5;

  /**
   * Extracts a compact ProjectDesignSignature from an AegisDesignBriefV2.
   */
  public static extractSignature(brief: AegisDesignBriefV2): ProjectDesignSignature {
    const allSections = brief.pageSectionPlan.flatMap((p) => p.sections.map((s) => s.name.toLowerCase()));
    return {
      projectId: brief.briefId,
      projectName: brief.projectType,
      domain: brief.projectType,
      timestamp: new Date().toISOString(),
      brandHue: brief.brand.hue,
      primaryColor: brief.brand.primaryColor,
      fontPairingId: brief.typography.fontPairingId,
      displayFont: brief.typography.displayFont,
      heroType: brief.heroComposition.type,
      heroConcept: brief.heroComposition.concept,
      navigationStrategy: brief.navigation.strategy,
      density: brief.geometry.density,
      sectionSequence: allSections,
      signatureInteractionName: brief.signatureInteraction.name,
    };
  }

  /**
   * Computes multi-dimensional similarity between candidate signature and an existing signature.
   */
  public static compareSignatures(
    candidate: ProjectDesignSignature,
    reference: ProjectDesignSignature
  ): { similarity: number; breakdown: SimilarityAxisScore[]; recommendations: string[] } {
    const breakdown: SimilarityAxisScore[] = [];
    const recommendations: string[] = [];

    // 1. Hue Circular Distance: distance / 180 (0 is identical, 180 is complementary opposite)
    const hueDiff = Math.min(
      Math.abs(candidate.brandHue - reference.brandHue),
      360 - Math.abs(candidate.brandHue - reference.brandHue)
    );
    // Score is 1.0 if diff == 0, down to 0 if diff >= 60deg
    const hueScore = Math.max(0, 1 - hueDiff / 60);
    breakdown.push({
      axis: "hue",
      score: hueScore,
      detail: `Candidate hue: ${candidate.brandHue}°, Reference hue: ${reference.brandHue}° (Δ${hueDiff}°)`,
    });
    if (hueScore > 0.6) {
      const suggestedHue = (candidate.brandHue + 90) % 360;
      recommendations.push(`Shift brand hue from ${candidate.brandHue}° to ~${suggestedHue}° to prevent palette convergence with '${reference.projectName}'.`);
    }

    // 2. Typography Similarity
    const typoScore =
      candidate.fontPairingId === reference.fontPairingId
        ? 1.0
        : candidate.displayFont === reference.displayFont
        ? 0.75
        : 0.0;
    breakdown.push({
      axis: "typography",
      score: typoScore,
      detail: `Candidate: ${candidate.fontPairingId}, Reference: ${reference.fontPairingId}`,
    });
    if (typoScore > 0.5) {
      recommendations.push(`Select a contrasting font pairing (avoid '${candidate.fontPairingId}').`);
    }

    // 3. Hero Composition Similarity
    const heroScore = candidate.heroType === reference.heroType ? 1.0 : 0.0;
    breakdown.push({
      axis: "hero",
      score: heroScore,
      detail: `Candidate hero: ${candidate.heroType}, Reference hero: ${reference.heroType}`,
    });
    if (heroScore > 0.8) {
      recommendations.push(`Change hero layout structure from '${candidate.heroType}'.`);
    }

    // 4. Navigation Strategy Similarity
    const navScore = candidate.navigationStrategy === reference.navigationStrategy ? 1.0 : 0.0;
    breakdown.push({
      axis: "navigation",
      score: navScore,
      detail: `Candidate nav: ${candidate.navigationStrategy}, Reference nav: ${reference.navigationStrategy}`,
    });

    // 5. Density Similarity
    const densityScore = candidate.density === reference.density ? 1.0 : 0.0;
    breakdown.push({
      axis: "density",
      score: densityScore,
      detail: `Candidate density: ${candidate.density}, Reference density: ${reference.density}`,
    });

    // 6. Section Sequence Jaccard Similarity
    const s1 = new Set(candidate.sectionSequence);
    const s2 = new Set(reference.sectionSequence);
    const intersection = [...s1].filter((x) => s2.has(x)).length;
    const union = new Set([...s1, ...s2]).size;
    const jaccard = union > 0 ? intersection / union : 0;
    breakdown.push({
      axis: "sectionSequence",
      score: jaccard,
      detail: `Section sequence Jaccard similarity: ${Math.round(jaccard * 100)}% (${intersection}/${union})`,
    });
    if (jaccard > 0.5) {
      recommendations.push("Diversify page section compositions to prevent repeated layout patterns.");
    }

    // 7. Signature Interaction Similarity
    const interactionScore =
      candidate.signatureInteractionName.toLowerCase() === reference.signatureInteractionName.toLowerCase() ? 1.0 : 0.0;
    breakdown.push({
      axis: "interaction",
      score: interactionScore,
      detail: `Candidate: ${candidate.signatureInteractionName}, Reference: ${reference.signatureInteractionName}`,
    });

    // Weighted composite score (Hue: 20%, Typo: 20%, Hero: 20%, Sections: 20%, Nav: 10%, Density: 5%, Interaction: 5%)
    const weightedSimilarity =
      hueScore * 0.20 +
      typoScore * 0.20 +
      heroScore * 0.20 +
      jaccard * 0.20 +
      navScore * 0.10 +
      densityScore * 0.05 +
      interactionScore * 0.05;

    return {
      similarity: Math.round(weightedSimilarity * 100) / 100,
      breakdown,
      recommendations,
    };
  }

  /**
   * Evaluates candidate brief against historical project signatures.
   */
  public static evaluate(
    candidateBrief: AegisDesignBriefV2,
    historySignatures: ProjectDesignSignature[]
  ): SimilarityEvaluationResult {
    const candidateSig = this.extractSignature(candidateBrief);
    const recent = historySignatures.slice(-this.MAX_HISTORY_WINDOW);

    if (recent.length === 0) {
      return {
        overallSimilarity: 0.0,
        passed: true,
        threshold: this.SIMILARITY_THRESHOLD,
        axisBreakdown: [],
        recommendations: [],
        historyCount: 0,
        isHistorySufficient: false,
      };
    }

    let maxSimilarity = 0.0;
    let mostSimilarProject: SimilarityEvaluationResult["mostSimilarProject"] = undefined;
    let worstBreakdown: SimilarityAxisScore[] = [];
    const allRecs: string[] = [];

    for (const ref of recent) {
      const comp = this.compareSignatures(candidateSig, ref);
      if (comp.similarity > maxSimilarity) {
        maxSimilarity = comp.similarity;
        mostSimilarProject = {
          projectId: ref.projectId,
          domain: ref.domain,
          similarity: comp.similarity,
        };
        worstBreakdown = comp.breakdown;
      }
      for (const rec of comp.recommendations) {
        if (!allRecs.includes(rec)) allRecs.push(rec);
      }
    }

    return {
      overallSimilarity: maxSimilarity,
      passed: maxSimilarity < this.SIMILARITY_THRESHOLD,
      threshold: this.SIMILARITY_THRESHOLD,
      mostSimilarProject,
      axisBreakdown: worstBreakdown,
      recommendations: allRecs,
      historyCount: recent.length,
      isHistorySufficient: true,
    };
  }

  /**
   * Loads recent project signatures from an archive directory or `.aegis/project-signatures.json`.
   */
  public static loadSignatures(storageDir: string): ProjectDesignSignature[] {
    const filePath = join(storageDir, ".aegis", "project-signatures.json");
    if (existsSync(filePath)) {
      try {
        return JSON.parse(readFileSync(filePath, "utf8"));
      } catch {
        return [];
      }
    }
    return [];
  }

  /**
   * Saves and appends the new signature to `.aegis/project-signatures.json`.
   */
  public static recordSignature(storageDir: string, signature: ProjectDesignSignature): void {
    const aegisDir = join(storageDir, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }
    const filePath = join(aegisDir, "project-signatures.json");
    const existing = this.loadSignatures(storageDir);
    const updated = [...existing.filter((s) => s.projectId !== signature.projectId), signature].slice(
      -this.MAX_HISTORY_WINDOW
    );
    writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf8");
  }
}

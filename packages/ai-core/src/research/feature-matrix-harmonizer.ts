/**
 * Aegis AI — Phase 4 Feature Matrix Harmonizer
 *
 * Harmonizes requirements from three distinct sources into the single authoritative FeatureMatrix:
 * 1. User Prompt (Explicit must-haves: inviolable, never dropped, never downgraded).
 * 2. Domain Standards (Baseline operational necessities for the domain).
 * 3. Reference Research (Discovered features, real-world UX patterns, workflows).
 *
 * Invariants:
 * - Deterministic, stable IDs (F01..Fn).
 * - Multi-source attribution and confidence tracking.
 * - Deduplication that enriches rather than clobbers user requirements.
 * - Relevance filtering preventing feature bloat.
 * - Every must-have feature includes valid acceptance test references.
 */

import {
  FeatureMatrixManager,
  type FeatureDefinition,
  type FeatureMatrix,
  type FeaturePriority,
} from "../contracts/feature-matrix.js";
import type { DiscoveredFeature } from "./reference-research-types.js";

export interface HarmonizationInput {
  projectName: string;
  domainName: string;
  userPrompt: string;
  explicitFeatures: Array<Partial<FeatureDefinition> & { title: string; description: string }>;
  domainStandardFeatures?: Array<Partial<FeatureDefinition> & { title: string; description: string }>;
  discoveredFeatures?: DiscoveredFeature[];
  projectRoot?: string;
}

export class FeatureMatrixHarmonizer {
  /**
   * Harmonizes all requirement streams into a single authoritative FeatureMatrix.
   */
  public static harmonize(input: HarmonizationInput): FeatureMatrix {
    const {
      projectName,
      domainName,
      userPrompt,
      explicitFeatures,
      domainStandardFeatures = [],
      discoveredFeatures = [],
      projectRoot,
    } = input;

    const consolidatedFeatures: Array<Omit<FeatureDefinition, "id">> = [];
    const seenTitles = new Set<string>();

    // 1. Process Explicit User Requirements (INVIOLABLE AUTHORITY)
    for (const explicit of explicitFeatures) {
      const normalizedTitle = explicit.title.trim();
      const lower = normalizedTitle.toLowerCase();
      seenTitles.add(lower);

      const routes = explicit.routes && explicit.routes.length > 0 ? explicit.routes : ["/"];
      const components = explicit.components && explicit.components.length > 0 ? explicit.components : ["PrimaryWorkspace"];
      const acceptanceTests = explicit.acceptanceTests && explicit.acceptanceTests.length > 0
        ? explicit.acceptanceTests
        : [
            {
              testId: `test_${lower.replace(/[^a-z0-9]/g, "_")}_workflow`,
              strategy: "browser" as const,
              description: `Verify ${normalizedTitle} renders cleanly and satisfies user requirements.`,
            },
          ];

      consolidatedFeatures.push({
        title: normalizedTitle,
        description: explicit.description,
        priority: "must-have", // Explicit user requests are ALWAYS must-have
        expectedBehavior: explicit.expectedBehavior || `User can actively use ${normalizedTitle} without error.`,
        routes,
        components,
        apiEndpoints: explicit.apiEndpoints || [],
        dataModels: explicit.dataModels || [],
        validationRules: explicit.validationRules || ["Mandatory requirement from user prompt."],
        acceptanceTests,
        verificationStatus: "UNVERIFIED",
        source: "user-request",
        confidence: 1.0,
        sourceAttribution: "User Prompt",
        userValue: `Directly requested in user prompt: "${userPrompt.slice(0, 100)}"`,
      });
    }

    // 2. Process Domain Standard Features
    for (const standard of domainStandardFeatures) {
      const normalizedTitle = standard.title.trim();
      const lower = normalizedTitle.toLowerCase();

      // Check if already covered by an explicit user requirement
      const existing = consolidatedFeatures.find(
        (f) => f.title.toLowerCase() === lower || this.isSemanticOverlap(f.title, normalizedTitle)
      );

      if (existing) {
        // Enrich existing without overwriting user priority
        if (standard.components) {
          existing.components = Array.from(new Set([...existing.components, ...standard.components]));
        }
        if (standard.dataModels) {
          existing.dataModels = [...existing.dataModels, ...standard.dataModels];
        }
        continue;
      }

      seenTitles.add(lower);
      const priority: FeaturePriority = standard.priority || "should-have";
      const acceptanceTests = standard.acceptanceTests && standard.acceptanceTests.length > 0
        ? standard.acceptanceTests
        : [
            {
              testId: `test_std_${lower.replace(/[^a-z0-9]/g, "_")}`,
              strategy: "unit" as const,
              description: `Verify ${normalizedTitle} baseline operational requirements.`,
            },
          ];

      consolidatedFeatures.push({
        title: normalizedTitle,
        description: standard.description,
        priority,
        expectedBehavior: standard.expectedBehavior || `Provides domain standard ${normalizedTitle}.`,
        routes: standard.routes || ["/"],
        components: standard.components || ["StandardWidget"],
        apiEndpoints: standard.apiEndpoints || [],
        dataModels: standard.dataModels || [],
        validationRules: standard.validationRules || ["Enforces domain operational baseline."],
        acceptanceTests,
        verificationStatus: "UNVERIFIED",
        source: "domain-convention",
        confidence: 0.9,
        sourceAttribution: `Domain Convention: ${domainName}`,
        userValue: `Industry operational expectation for ${domainName}`,
      });
    }

    // 3. Process Reference Research Discoveries
    for (const disc of discoveredFeatures) {
      // Relevance Gate: Filter out low relevance (< 0.60)
      if (disc.relevanceScore < 0.60) {
        continue;
      }

      const normalizedTitle = disc.name.trim();
      const lower = normalizedTitle.toLowerCase();

      // Check deduplication / semantic overlap with existing features
      const existing = consolidatedFeatures.find(
        (f) => f.title.toLowerCase() === lower || this.isSemanticOverlap(f.title, normalizedTitle)
      );

      if (existing) {
        // Enrich existing requirement with reference intelligence
        if (disc.suggestedComponents) {
          existing.components = Array.from(new Set([...existing.components, ...disc.suggestedComponents]));
        }
        if (disc.targetRoutes) {
          existing.routes = Array.from(new Set([...existing.routes, ...disc.targetRoutes]));
        }
        existing.evidenceNotes = `Enriched by reference observation from ${disc.sourceUrl}`;
        continue;
      }

      seenTitles.add(lower);
      const priority: FeaturePriority = disc.recommendedPriority === "must-have" ? "should-have" : disc.recommendedPriority;
      const acceptanceTests = [
        {
          testId: `test_ref_${lower.replace(/[^a-z0-9]/g, "_")}`,
          strategy: "browser" as const,
          description: `Validate research-discovered workflow for ${normalizedTitle}.`,
        },
      ];

      consolidatedFeatures.push({
        title: normalizedTitle,
        description: disc.description,
        priority,
        expectedBehavior: `User can execute ${normalizedTitle} as observed in production reference platforms.`,
        routes: disc.targetRoutes && disc.targetRoutes.length > 0 ? disc.targetRoutes : ["/"],
        components: disc.suggestedComponents && disc.suggestedComponents.length > 0 ? disc.suggestedComponents : ["DiscoveryWidget"],
        apiEndpoints: [],
        dataModels: (disc.suggestedModels || []).map((m) => ({ model: m, fields: ["id", "createdAt"] })),
        validationRules: [disc.inclusionRationale],
        acceptanceTests,
        verificationStatus: "UNVERIFIED",
        source: "reference-research",
        confidence: disc.confidence || 0.85,
        sourceAttribution: disc.sourceUrl,
        userValue: disc.userValue,
      });
    }

    // Create validated FeatureMatrix with deterministic IDs
    const matrix = FeatureMatrixManager.createMatrix(
      projectName,
      domainName,
      consolidatedFeatures
    );

    if (projectRoot) {
      FeatureMatrixManager.saveToProject(projectRoot, matrix);
    }

    return matrix;
  }

  /**
   * Helper to detect semantic similarity between feature titles (e.g. "Order Online" and "Online Ordering").
   */
  private static isSemanticOverlap(titleA: string, titleB: string): boolean {
    const wordsA = new Set(titleA.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
    const wordsB = new Set(titleB.toLowerCase().split(/\s+/).filter((w) => w.length > 3));

    let common = 0;
    for (const w of wordsA) {
      if (wordsB.has(w)) common++;
    }

    const minSize = Math.min(wordsA.size, wordsB.size);
    return minSize > 0 && common / minSize >= 0.65;
  }
}

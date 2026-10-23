/**
 * Aegis AI — Phase 4 Reference Research Types
 *
 * Strongly-typed definitions for reference research, real website inspection,
 * observed UI/UX patterns, discovered features, copyright safeguards,
 * and machine-readable research artifacts persisted to `.aegis/reference-research.json`.
 */

export type ResearchStatus = "SUCCESS" | "PARTIAL" | "BLOCKED" | "NOT_PERFORMED";

export interface ReferenceSource {
  id: string;
  url: string;
  domainName: string;
  category: string;
  title?: string;
  status: "ACCESSIBLE" | "INACCESSIBLE" | "PARTIAL" | "BLOCKED";
  statusCode?: number;
  inspectedAt?: string;
  pagesInspected: string[];
  confidence: number; // 0.0 to 1.0
  failureReason?: string;
}

export interface ObservedUIPattern {
  id: string;
  category:
    | "navigation"
    | "hero"
    | "workflow"
    | "forms"
    | "filtering"
    | "discovery"
    | "state"
    | "responsive"
    | "interaction";
  observedAtUrl: string;
  description: string;
  /** True if directly extracted from DOM elements or CSS properties; false if inferred */
  isDirectObservation: boolean;
  confidence: number;
}

export interface DiscoveredFeature {
  name: string;
  description: string;
  userValue: string;
  sourceUrl: string;
  sourceCategory: string;
  relevanceScore: number; // 0.0 to 1.0
  recommendedPriority: "must-have" | "should-have" | "optional";
  targetRoutes: string[];
  suggestedComponents: string[];
  suggestedModels?: string[];
  inclusionRationale: string;
  confidence: number;
}

export interface RejectedFeature {
  name: string;
  sourceUrl: string;
  rejectionReason:
    | "out-of-scope"
    | "excessive-complexity"
    | "bloat"
    | "unsupported-dependency"
    | "security-risk";
  rationale: string;
}

export interface PageInspectionResult {
  url: string;
  status: "SUCCESS" | "FAILED" | "TIMEOUT" | "BLOCKED";
  statusCode?: number;
  title?: string;
  headings: string[];
  navLinks: Array<{ text: string; href: string }>;
  callToActions: string[];
  formControls: Array<{ name?: string; type?: string; label?: string }>;
  filterControls: string[];
  interactiveElements: string[];
  hasSearch: boolean;
  hasPagination: boolean;
  viewportBehavior?: string;
  durationMs: number;
  error?: string;
}

export interface CopyrightSafeguards {
  noProprietaryCodeCopied: boolean;
  noProprietaryTextCloned: boolean;
  noLogosOrProtectedAssetsUsed: boolean;
  structuralPatternsOnly: boolean;
  safeguardAttestation: string;
}

export interface AegisReferenceResearchV1 {
  version: "1.0.0";
  researchId: string;
  timestamp: string;
  domain: string;
  researchObjective: string;
  originalUserRequirements: string[];
  overallStatus: ResearchStatus;
  statusRationale: string;
  totalDurationMs: number;
  sources: ReferenceSource[];
  observedPatterns: ObservedUIPattern[];
  relevantFeatures: DiscoveredFeature[];
  irrelevantFeatures: RejectedFeature[];
  uncertainties: string[];
  proposedDifferentiators: string[];
  copyrightSafeguards: CopyrightSafeguards;
}

export interface ResearchEngineOptions {
  maxSources?: number; // default 4 (between 3 and 5)
  maxPagesPerSource?: number; // default 2
  timeoutPerUrlMs?: number; // default 6000ms
  totalBudgetMs?: number; // default 25000ms
  enableBrowserAutomation?: boolean; // default true (falls back to HTTP fetch if headless/executable unavailable)
  cacheDirectory?: string;
}

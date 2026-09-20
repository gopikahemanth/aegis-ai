/**
 * FrontendExperienceContract
 *
 * An immutable contract that defines the complete expected frontend experience
 * BEFORE code generation begins. Once locked, the CoderAgent must satisfy
 * every page, feature, and interaction defined here.
 *
 * This contract is derived from:
 *   ProductUnderstanding → CapabilityPlanner → DesignDirector
 *
 * It is written to .aegis/frontend-experience-contract.json before the
 * CoderAgent runs, and verified after Chromium review.
 *
 * The contract hash is embedded in the frontend approval record so that
 * post-approval mutations to the frontend can be detected.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// ── Contract sub-types ────────────────────────────────────────────────────────

export interface FrontendPageContract {
  /** Route path, e.g. "/" or "/configurator" */
  route: string;
  /** Human-readable page name */
  name: string;
  /** Expected composition description */
  composition: string;
  /** Required vocabulary that must appear in the rendered page */
  requiredVocabulary: string[];
  /** Must the page contain interactive controls? */
  requiresInteraction: boolean;
}

export interface FrontendFeatureContract {
  /** Feature identifier matching CapabilityPlanner output */
  id: string;
  /** Display name */
  name: string;
  /** Which page(s) this feature lives on */
  pages: string[];
  /** Controls that must be rendered and functional */
  requiredControls: string[];
  /** Vocabulary that must appear */
  evidenceVocabulary: string[];
  /**
   * Whether this feature must produce a computed/calculated result visible
   * without any backend call.
   */
  requiresLocalComputation: boolean;
}

export interface FrontendInteractionContract {
  /** e.g. "fixture-dimension-slider" */
  id: string;
  /** Human description */
  description: string;
  /** The UI component / control that triggers it */
  trigger: string;
  /** Observable state change that proves it works */
  observableEffect: string;
  /** Must this interaction work without backend? */
  backendIndependent: boolean;
}

export interface NavigationContract {
  type: "sidebar" | "topnav" | "tabs" | "combined";
  primaryRoutes: string[];
  requiresActiveState: boolean;
  requiresMobileMenu: boolean;
}

export interface MockDataContract {
  /** How many seed records to show per entity */
  seedRecordCounts: Record<string, number>;
  /**
   * Sample values that must appear in the rendered product.
   * These are used by Chromium verification to confirm realistic content.
   */
  requiredSampleValues: string[];
}

export interface FrontendExperienceContract {
  /** Unique generation ID this contract belongs to */
  generationId: string;

  product: {
    name: string;
    description: string;
    audience: string;
    primaryActivity: string;
    experiencePattern: string;
    emotionalTone: string;
  };

  pages: FrontendPageContract[];

  features: FrontendFeatureContract[];

  interactions: FrontendInteractionContract[];

  navigation: NavigationContract;

  visualIdentity: {
    artDirectionName: string;
    primaryColor: string;
    surfaceColor: string;
    backgroundColor: string;
    fontFamily: string;
  };

  mockData: MockDataContract;

  /**
   * Patterns explicitly forbidden in the generated frontend.
   * Used by Chromium verifier and CoderAgent prompt.
   */
  forbiddenPatterns: string[];

  provenance: {
    promptHash: string;
    designBriefId: string;
    designBriefHash: string;
    productContractHash: string;
    lockedAt: string;
  };
}

// ── Contract manager ──────────────────────────────────────────────────────────

export class FrontendExperienceContractManager {
  private static getPath(outputDirectory: string): string {
    return join(outputDirectory, ".aegis", "frontend-experience-contract.json");
  }

  /** Compute a stable SHA-256 hash of the contract (excluding the hash itself). */
  static hash(contract: Omit<FrontendExperienceContract, never>): string {
    // Exclude any previously computed hash fields so hash is stable
    const forHashing = JSON.stringify(contract, null, 0);
    return createHash("sha256").update(forHashing).digest("hex").slice(0, 16);
  }

  /** Write the contract to .aegis/frontend-experience-contract.json */
  static save(outputDirectory: string, contract: FrontendExperienceContract): void {
    const aegisDir = join(outputDirectory, ".aegis");
    if (!existsSync(aegisDir)) {
      mkdirSync(aegisDir, { recursive: true });
    }
    writeFileSync(
      this.getPath(outputDirectory),
      JSON.stringify(contract, null, 2),
      "utf8"
    );
    console.log(
      `[FrontendExperienceContract] ✓ Locked contract for "${contract.product.name}" ` +
      `(${contract.features.length} features, ${contract.pages.length} pages, ` +
      `${contract.interactions.length} interactions).`
    );
  }

  /** Load the contract from disk. Returns null if it does not exist. */
  static load(outputDirectory: string): FrontendExperienceContract | null {
    const path = this.getPath(outputDirectory);
    if (!existsSync(path)) return null;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as FrontendExperienceContract;
    } catch {
      return null;
    }
  }

  /**
   * Build a FrontendExperienceContract from existing design artifacts.
   * Called by the orchestrator after DesignDirector completes and before
   * CoderAgent is dispatched.
   */
  static buildFromDesignBrief(
    designBrief: any,
    specification: any,
    rawPrompt: string,
    generationId: string,
    resolvedContract: any
  ): FrontendExperienceContract {
    const productName = specification?.name || "Generated Application";
    const primaryActivity = designBrief?.productActivity || rawPrompt.slice(0, 80);
    const experiencePattern = designBrief?.experiencePattern || "workspace";

    // Build pages from design brief information architecture
    const pages: FrontendPageContract[] = [];
    const ia = designBrief?.informationArchitecture;
    if (ia && Array.isArray(ia.pages)) {
      for (const page of ia.pages) {
        pages.push({
          route: page.route || `/${(page.name || "page").toLowerCase().replace(/\s+/g, "-")}`,
          name: page.name || "Page",
          composition: page.layout || "standard",
          requiredVocabulary: page.keywords || [],
          requiresInteraction: true,
        });
      }
    }
    // Always ensure a home route exists
    if (!pages.some((p) => p.route === "/")) {
      pages.unshift({
        route: "/",
        name: "Home",
        composition: "hero or workspace entry",
        requiredVocabulary: [productName],
        requiresInteraction: true,
      });
    }

    // Build features from capabilities
    const features: FrontendFeatureContract[] = [];
    const capabilities = designBrief?.requiredCapabilities || specification?.features || [];
    for (const cap of capabilities) {
      const name = typeof cap === "string" ? cap : (cap.name || "Feature");
      features.push({
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        pages: ["/"],
        requiredControls: cap.controlsRequired || ["button", "input"],
        evidenceVocabulary: cap.evidenceVocabulary || [name],
        requiresLocalComputation: true,
      });
    }

    // Build interactions
    const interactions: FrontendInteractionContract[] = features.map((f) => ({
      id: `interact-${f.id}`,
      description: `User interacts with ${f.name}`,
      trigger: f.requiredControls[0] || "button",
      observableEffect: `${f.name} state updates visibly`,
      backendIndependent: true,
    }));

    // Navigation
    const navType = experiencePattern.includes("dashboard") ? "sidebar" : "topnav";
    const navigation: NavigationContract = {
      type: navType as NavigationContract["type"],
      primaryRoutes: pages.map((p) => p.route),
      requiresActiveState: true,
      requiresMobileMenu: true,
    };

    // Visual identity from design brief
    const palette = designBrief?.palette || {};
    const typography = designBrief?.typography || {};
    const visualIdentity = {
      artDirectionName: designBrief?.artDirectionName || "default",
      primaryColor: palette.primary || "#3b82f6",
      surfaceColor: palette.surface || "#ffffff",
      backgroundColor: palette.background || "#f8fafc",
      fontFamily: typeof typography === "string" ? typography : (typography.fontFamily || "Inter"),
    };

    // Mock data
    const mockData: MockDataContract = {
      seedRecordCounts: Object.fromEntries(
        (resolvedContract?.requiredModels || []).map((m: string) => [m, 4])
      ),
      requiredSampleValues: features.flatMap((f) => f.evidenceVocabulary.slice(0, 2)),
    };

    // Provenance
    const promptHash = createHash("sha256").update(rawPrompt).digest("hex").slice(0, 12);
    const designBriefHash = createHash("sha256")
      .update(JSON.stringify(designBrief || {}))
      .digest("hex")
      .slice(0, 12);
    const productContractHash = createHash("sha256")
      .update(JSON.stringify(specification || {}))
      .digest("hex")
      .slice(0, 12);

    const contract: FrontendExperienceContract = {
      generationId,
      product: {
        name: productName,
        description: rawPrompt.slice(0, 200),
        audience: (specification as any)?.audience || "end users",
        primaryActivity,
        experiencePattern,
        emotionalTone: designBrief?.emotionalTone?.primary || "professional",
      },
      pages,
      features,
      interactions,
      navigation,
      visualIdentity,
      mockData,
      forbiddenPatterns: [
        "Generic dashboard",
        "Welcome to your dashboard",
        "Record 1",
        "Item 1",
        "Lorem ipsum",
        "TODO",
        "Placeholder",
      ],
      provenance: {
        promptHash,
        designBriefId: designBrief?.briefId || "unknown",
        designBriefHash,
        productContractHash,
        lockedAt: new Date().toISOString(),
      },
    };

    return contract;
  }

  /**
   * Generate a hash of the current frontend source files on disk.
   * Used to detect if the approved frontend was mutated post-approval.
   */
  static hashFrontendSource(outputDirectory: string): string {
    try {
      const { readdirSync, statSync, readFileSync: readFS } = require("node:fs");
      const { join: joinPath, relative } = require("node:path");

      const srcDir = joinPath(outputDirectory, "src");
      if (!existsSync(srcDir)) return "no-src";

      const hash = createHash("sha256");
      const collectFiles = (dir: string): void => {
        for (const entry of readdirSync(dir)) {
          const fullPath = joinPath(dir, entry);
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            collectFiles(fullPath);
          } else if (/\.(ts|tsx|js|jsx|css)$/.test(entry)) {
            const rel = relative(outputDirectory, fullPath);
            hash.update(rel);
            hash.update(readFS(fullPath, "utf8"));
          }
        }
      };
      collectFiles(srcDir);
      return hash.digest("hex").slice(0, 16);
    } catch {
      return "hash-error";
    }
  }
}

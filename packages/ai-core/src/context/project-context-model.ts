/**
 * Aegis AI — Authoritative Project Context Model
 *
 * Provides a single, authoritative context model representing the entire project:
 * - User objectives & constraints
 * - Discovered domain, industry, and audience
 * - User personas & core workflows
 * - Reference research findings and observed UX patterns
 * - Authoritative feature registry (must-have, should-have, differentiators)
 * - Domain vocabulary, legitimate terminology, and allowed locations
 * - Brand identity, design decisions, and component archetypes
 * - Approved visual assets and their licensing provenance
 *
 * Used across all validators (TemplateContaminationChecker, DomainConsistencyValidator,
 * FinalSuccessGate) to replace keyword-based blocking with true contextual understanding.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { FeatureMatrix, FeatureDefinition } from "../contracts/feature-matrix.js";
import type { AegisReferenceResearchV1 } from "../research/reference-research-types.js";
import type { AssetManifest } from "../design/asset-types.js";

export interface PersonaGoal {
  name: string;
  role: string;
  primaryGoal: string;
}

export interface WorkflowSummary {
  name: string;
  steps: string[];
}

export interface ProjectContextModel {
  prompt: string;
  projectName: string;
  domainCategory: string;
  industry: string;
  personas: PersonaGoal[];
  workflows: WorkflowSummary[];
  research: {
    sources: Array<{ name: string; url: string; category?: string }>;
    observedPatterns: string[];
    discoveredFeatures: string[];
    suggestedTerminology: string[];
  };
  features: Array<{
    id: string;
    title: string;
    description: string;
    priority: string;
    routes: string[];
    components: string[];
  }>;
  domainVocabulary: {
    allowedTerms: Set<string>;
    allowedLocations: Set<string>;
    industryNouns: Set<string>;
    technicalTerms: Set<string>;
  };
  brandIdentity: {
    name: string;
    tagline?: string;
    artDirection?: string;
  };
  designDecisions: {
    typography?: { headings?: string; body?: string };
    navigationModel?: string;
    colorPalette?: string[];
    componentArchetypes?: string[];
  };
  pages: Array<{ route: string; title?: string; component?: string }>;
  approvedAssets: Array<{
    id: string;
    category: string;
    sourceUrl: string;
    license: string;
    altText: string;
  }>;
  technicalConventions: Set<string>;
}

export class ProjectContextModelLoader {
  /**
   * Constructs the authoritative ProjectContextModel by inspecting the project root,
   * reading all available .aegis contracts, site content, and source files.
   */
  public static loadFromProject(projectRoot: string, fallbackPrompt = ""): ProjectContextModel {
    const aegisDir = join(projectRoot, ".aegis");

    let prompt = fallbackPrompt;
    let projectName = "AegisApp";
    let domainCategory = "general-application";
    let industry = "general";

    // 1. Load Architecture / Canonical Contract
    for (const contractFile of ["architecture-contract.json", "canonical-contract.json", "canonical-architecture.json"]) {
      const contractPath = join(aegisDir, contractFile);
      if (existsSync(contractPath)) {
        try {
          const raw = JSON.parse(readFileSync(contractPath, "utf8"));
          if (raw.prompt && !prompt) prompt = raw.prompt;
          if (raw.name) projectName = raw.name;
          if (raw.domainCategory) domainCategory = raw.domainCategory;
          if (raw.applicationType) industry = raw.applicationType;
          break;
        } catch {}
      }
    }

    // 2. Load Feature Matrix
    const features: ProjectContextModel["features"] = [];
    const fmPath = join(aegisDir, "feature-matrix.json");
    if (existsSync(fmPath)) {
      try {
        const fm: FeatureMatrix = JSON.parse(readFileSync(fmPath, "utf8"));
        if (fm.projectName) projectName = fm.projectName;
        if (fm.domainName) domainCategory = fm.domainName;
        for (const f of fm.features || []) {
          features.push({
            id: f.id,
            title: f.title,
            description: f.description,
            priority: f.priority,
            routes: f.routes || [],
            components: f.components || [],
          });
        }
      } catch {}
    }

    // 3. Load Reference Research
    const research: ProjectContextModel["research"] = {
      sources: [],
      observedPatterns: [],
      discoveredFeatures: [],
      suggestedTerminology: [],
    };
    const resPath = join(aegisDir, "reference-research.json");
    if (existsSync(resPath)) {
      try {
        const rr: AegisReferenceResearchV1 = JSON.parse(readFileSync(resPath, "utf8"));
        if (rr.domain && domainCategory === "general-application") domainCategory = rr.domain;
        for (const s of rr.sources || []) {
          research.sources.push({ name: s.domainName, url: s.url, category: s.category });
        }
        for (const p of rr.observedPatterns || []) {
          research.observedPatterns.push(p.description);
        }
        for (const f of rr.relevantFeatures || []) {
          research.discoveredFeatures.push(f.name);
          research.suggestedTerminology.push(f.name.toLowerCase());
          if (f.description) {
            research.suggestedTerminology.push(...f.description.toLowerCase().split(/\s+/).filter(w => w.length > 4));
          }
        }
      } catch {}
    }

    // 4. Load Design Brief
    let brandName = projectName;
    let tagline: string | undefined;
    let artDirection: string | undefined;
    let typography: { headings?: string; body?: string } | undefined;
    let navigationModel: string | undefined;
    let colorPalette: string[] | undefined;
    const dbPath = join(aegisDir, "design-brief.json");
    if (existsSync(dbPath)) {
      try {
        const db = JSON.parse(readFileSync(dbPath, "utf8"));
        if (db.brandName) brandName = db.brandName;
        if (db.tagline) tagline = db.tagline;
        if (db.artDirectionName) artDirection = db.artDirectionName;
        if (db.typography) typography = { headings: db.typography.headingFont, body: db.typography.bodyFont };
        if (db.navigation) navigationModel = db.navigation.model;
        if (db.colorSystem?.palette) colorPalette = Object.values(db.colorSystem.palette);
      } catch {}
    }

    // 5. Load Asset Manifest
    const approvedAssets: ProjectContextModel["approvedAssets"] = [];
    const amPath = join(aegisDir, "asset-manifest.json");
    if (existsSync(amPath)) {
      try {
        const am: AssetManifest = JSON.parse(readFileSync(amPath, "utf8"));
        for (const a of am.assets || []) {
          approvedAssets.push({
            id: a.id,
            category: a.category,
            sourceUrl: a.resolvedUrl || "",
            license: a.license || "",
            altText: a.altText || "",
          });
        }
      } catch {}
    }

    // 6. Inspect Site Content
    const allowedTerms = new Set<string>();
    const allowedLocations = new Set<string>();
    const industryNouns = new Set<string>();
    const technicalTerms = new Set<string>([
      "id", "uuid", "createdat", "updatedat", "timestamp", "status", "active", "pending", "completed",
      "filter", "search", "query", "sort", "pagination", "page", "limit", "offset", "error", "loading",
      "success", "modal", "drawer", "toast", "notification", "badge", "button", "input", "select",
      "card", "grid", "flex", "header", "footer", "navbar", "sidebar", "layout", "container",
    ]);

    // Feed prompt words into allowed terms
    for (const w of prompt.toLowerCase().split(/[^a-z0-9]+/)) {
      if (w.length >= 2) allowedTerms.add(w);
    }

    // Feed project / brand names
    allowedTerms.add(projectName.toLowerCase());
    allowedTerms.add(brandName.toLowerCase());

    // Extract legitimate location mentions from prompt if any
    const locationMatches = prompt.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s+([A-Z][a-z]+|[A-Z]{2})\b/g);
    if (locationMatches) {
      for (const loc of locationMatches) {
        allowedLocations.add(loc.toLowerCase().trim());
      }
    }

    // Read site-content files if they exist
    for (const scRel of ["src/content/site-content.ts", "src/content/site-content.tsx", "src/content/site-content.json"]) {
      const scPath = join(projectRoot, scRel);
      if (existsSync(scPath)) {
        try {
          const content = readFileSync(scPath, "utf8");
          // Extract strings
          const stringLiterals = content.match(/["']([^"']{2,80})["']/g) || [];
          for (const rawLit of stringLiterals) {
            const lit = rawLit.slice(1, -1).trim();
            allowedTerms.add(lit.toLowerCase());
            for (const word of lit.toLowerCase().split(/\s+/)) {
              if (word.length >= 3) allowedTerms.add(word);
            }
            // Check if site content explicitly defines an address / location
            if (/^[A-Za-z\s'-]+,\s+[A-Za-z\s'-]+$/.test(lit)) {
              allowedLocations.add(lit.toLowerCase().trim());
            }
          }
        } catch {}
      }
    }

    // Incorporate features into allowed terms
    for (const f of features) {
      allowedTerms.add(f.title.toLowerCase());
      for (const word of f.title.toLowerCase().split(/\s+/)) {
        if (word.length >= 3) allowedTerms.add(word);
      }
    }

    // Incorporate research discovered features and sources
    for (const df of research.discoveredFeatures) {
      allowedTerms.add(df.toLowerCase());
      for (const word of df.toLowerCase().split(/\s+/)) {
        if (word.length >= 3) allowedTerms.add(word);
      }
    }

    // Pages
    const pages: ProjectContextModel["pages"] = [];
    const srcPagesDir = join(projectRoot, "src", "pages");
    if (existsSync(srcPagesDir)) {
      try {
        const pageFiles = readdirSync(srcPagesDir).filter(f => /\.(tsx|jsx)$/.test(f));
        for (const pf of pageFiles) {
          const comp = pf.replace(/\.(tsx|jsx)$/, "");
          pages.push({
            route: comp === "Home" ? "/" : `/${comp.toLowerCase()}`,
            title: comp,
            component: comp,
          });
          allowedTerms.add(comp.toLowerCase());
        }
      } catch {}
    }

    return {
      prompt,
      projectName,
      domainCategory,
      industry,
      personas: [
        { name: "Primary Customer", role: "End User", primaryGoal: "Engage with core services" },
        { name: "Operations Lead", role: "Administrator", primaryGoal: "Manage workflows and records" },
      ],
      workflows: [
        { name: "Discovery", steps: ["Search", "Filter", "Inspect Detail"] },
        { name: "Fulfillment", steps: ["Select Option", "Confirm Details", "Submit Request"] },
      ],
      research,
      features,
      domainVocabulary: {
        allowedTerms,
        allowedLocations,
        industryNouns,
        technicalTerms,
      },
      brandIdentity: {
        name: brandName,
        tagline,
        artDirection,
      },
      designDecisions: {
        typography,
        navigationModel,
        colorPalette,
      },
      pages,
      approvedAssets,
      technicalConventions: technicalTerms,
    };
  }

  /**
   * Evaluates if a given phrase or token is legitimate within the project context
   * versus an unrelated foreign template leak.
   */
  public static evaluatePhraseContext(
    phrase: string,
    model: ProjectContextModel
  ): {
    isLegitimate: boolean;
    reason: string;
    category: "DOMAIN_VOCABULARY" | "RESEARCH_DERIVED" | "FEATURE_LABEL" | "UI_INTERACTION" | "TECHNICAL" | "FOREIGN_CONTAMINATION";
  } {
    const pLower = phrase.toLowerCase().trim();
    if (!pLower || pLower.length < 2) {
      return { isLegitimate: true, reason: "Single short token", category: "TECHNICAL" };
    }

    // 1. Check if explicitly in allowed terms / prompt / brand
    if (model.domainVocabulary.allowedTerms.has(pLower)) {
      return { isLegitimate: true, reason: "Matches verified project term", category: "DOMAIN_VOCABULARY" };
    }

    // 2. Check if it matches a discovered feature or research finding
    if (model.research.suggestedTerminology.includes(pLower) || model.research.discoveredFeatures.some(f => f.toLowerCase() === pLower)) {
      return { isLegitimate: true, reason: "Derived from authoritative reference research", category: "RESEARCH_DERIVED" };
    }

    // 3. Technical identifier or standard UI pattern
    if (model.domainVocabulary.technicalTerms.has(pLower) || /^(review submitted|changes saved|message sent|item added|form submitted)$/i.test(pLower)) {
      return { isLegitimate: true, reason: "Standard technical or UI interaction state", category: "UI_INTERACTION" };
    }

    // 4. Geographic location check: A "City, Country" or "City, State" string is ONLY legitimate
    // if the project has recorded provenance for that location (e.g. explicitly in prompt or site-content).
    // An arbitrary location like "Kyoto, Japan" in an unrelated architecture or pet sanctuary is FOREIGN CONTAMINATION.
    const isLocationPattern = /^[a-z\s'-]+,\s+[a-z\s'-]+$/i.test(pLower);
    if (isLocationPattern) {
      if (model.domainVocabulary.allowedLocations.has(pLower)) {
        return { isLegitimate: true, reason: "Geographic location verified by project provenance", category: "DOMAIN_VOCABULARY" };
      }
      return {
        isLegitimate: false,
        reason: `Geographic location "${phrase}" has no provenance in user prompt, brand identity, or site content. Unrelated template remnant.`,
        category: "FOREIGN_CONTAMINATION",
      };
    }

    // 5. Generic starter-template indicators / banners
    if (/^(application platform|welcome to the application platform|grid stability index|avionics flight deck|renewable energy generation & operational command console)$/i.test(pLower)) {
      return {
        isLegitimate: false,
        reason: `Phrase "${phrase}" is an unrelated starter-template indicator or banner.`,
        category: "FOREIGN_CONTAMINATION",
      };
    }

    // 6. Professional domain care/service terms: "Specialized Care", "Preventive Care", "Critical Care"
    // are legitimate in healthcare, animal sanctuary, wellness, and medical contexts
    const isCareContext = /\b(care|wellness|clinic|health|medical|sanctuary|pet|animal|hospital|therapy)\b/i.test(`${model.domainCategory} ${model.prompt}`);
    if (isCareContext && /\b(specialized|preventive|primary|specialist|critical|intensive|compassionate|holistic|integrative|rehabilitation)\s+care\b/i.test(pLower)) {
      return { isLegitimate: true, reason: "Legitimate professional care terminology for domain", category: "DOMAIN_VOCABULARY" };
    }

    // 7. Legitimate section labels (e.g. "Gallery" when gallery is discovered or requested)
    if (pLower === "gallery" || pLower === "galleries") {
      const wantsGallery = model.prompt.toLowerCase().includes("gallery") ||
                           model.features.some(f => f.title.toLowerCase().includes("gallery")) ||
                           model.research.discoveredFeatures.some(f => f.toLowerCase().includes("gallery"));
      if (wantsGallery) {
        return { isLegitimate: true, reason: "Gallery is an approved project feature/page", category: "FEATURE_LABEL" };
      }
    }

    // 8. Word-level semantic decomposition:
    // If all significant words (length >= 3) in the multi-word phrase exist in the allowed corpus,
    // it is considered legitimate combined vocabulary.
    const words = pLower.split(/\s+/).filter(w => w.length >= 3);
    if (words.length > 0 && words.every(w => model.domainVocabulary.allowedTerms.has(w))) {
      return { isLegitimate: true, reason: "All constituent words exist in project domain corpus", category: "DOMAIN_VOCABULARY" };
    }

    // Default to foreign contamination if it matched an active template blocklist candidate
    return {
      isLegitimate: false,
      reason: `Phrase "${phrase}" not grounded in project context, research, or approved features.`,
      category: "FOREIGN_CONTAMINATION",
    };
  }
}

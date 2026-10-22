/**
 * TemplateContaminationChecker — Aegis V2.3 Phase 6.1
 *
 * Verifies that a generated application contains ONLY components, routes,
 * and UI text belonging to the requested domain, with ZERO remnants from
 * unrelated starter templates (e.g., Art Gallery, Expense Tracker, Fitness).
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PromptConstraints } from "../governance/prompt-constraints.js";

export interface TemplateContaminationViolation {
  file: string;
  issueType: "CONTAMINATED_FILE" | "FORBIDDEN_KEYWORD" | "SOURCE_PATH_LEAK" | "UNRELATED_ROUTE" | "PLACEHOLDER_STUB" | "TEMPLATE_PHRASE_LEAK";
  description: string;
  token?: string;
  expectedDomain?: string;
}

export interface TemplateContaminationReport {
  status: "PASS" | "FAIL";
  clean: boolean;
  violations: TemplateContaminationViolation[];
  summary: string;
  leakedPhrases?: string[];
  repairPrompt?: string;
}

export class TemplateContaminationChecker {
  private readonly projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot.replace(/\\/g, "/");
  }

  /**
   * Audits the generated project against cross-domain template contamination,
   * source path leaks, placeholder stubs, and dead routes.
   */
  public audit(domainCategory?: string, contract?: any): TemplateContaminationReport {
    const violations: TemplateContaminationViolation[] = [];
    const srcDir = join(this.projectRoot, "src");

    if (!existsSync(srcDir)) {
      return {
        status: "PASS",
        clean: true,
        violations: [],
        summary: "No src directory found to audit.",
      };
    }

    let contractToUse = contract;
    if (!contractToUse) {
      try {
        const contractPath = join(this.projectRoot, ".aegis", "architecture-contract.json");
        if (existsSync(contractPath)) {
          contractToUse = JSON.parse(readFileSync(contractPath, "utf8"));
        }
      } catch {}
    }

    const domain = (domainCategory || "").toLowerCase();
    const prompt = (contractToUse?.prompt || "").toLowerCase();
    const features: string[] = [
      ...(contractToUse?.requiredFeatures || []),
      ...(contractToUse?.suggestedFeatures || []),
      ...(contractToUse?.requiredModels || []),
    ].map((f: any) => String(f).toLowerCase());

    const hasGalleryFeature = features.some((f) =>
      f.includes("gallery") || f.includes("photo") || f.includes("artwork") || f.includes("artist") || f.includes("museum") || f.includes("exhibit")
    );
    const isPhotoOrArchDomain =
      domain.includes("art") ||
      domain.includes("gallery") ||
      domain.includes("photo") ||
      domain.includes("museum") ||
      domain.includes("architecture") ||
      domain.includes("monograph") ||
      domain.includes("journal") ||
      domain.includes("editorial") ||
      prompt.includes("photography") ||
      prompt.includes("gallery") ||
      prompt.includes("exhibition") ||
      prompt.includes("monograph") ||
      prompt.includes("architecture") ||
      prompt.includes("museum") ||
      prompt.includes("artwork") ||
      prompt.includes("artist") ||
      hasGalleryFeature;

    const isArtGallery =
      domain.includes("art") ||
      domain.includes("gallery") ||
      domain.includes("museum") ||
      prompt.includes("museum") ||
      prompt.includes("art gallery") ||
      prompt.includes("artwork");
    const allowsGallery = isArtGallery || isPhotoOrArchDomain;
    const isFitness = domain.includes("fitness") || domain.includes("workout") || domain.includes("gym") || prompt.includes("fitness") || prompt.includes("workout");
    const isExpense = domain.includes("expense") || domain.includes("budget") || domain.includes("finance") || prompt.includes("expense");
    const isTask = domain.includes("task") || domain.includes("kanban") || domain.includes("todo");
    const isStudent = domain.includes("student") || domain.includes("school") || domain.includes("academic");
    const isLibrary = domain.includes("library") || domain.includes("book");

    // Foreign domain permission flags
    const cleanPrompt = PromptConstraints.stripNegativeConstraints(prompt || "");
    const isMarineDomain = /\b(underwater|marine|ocean|submersible|bathymetr|benthic|abyss|hydrophone|hadal trench|hydrothermal)\b/i.test(cleanPrompt + " " + domain);
    const isFantasyDomain = /\b(kazzoo|fantasy|claymation|whimsical|realm|fairy)\b/i.test(cleanPrompt + " " + domain);
    const isFurnitureDomain = /\b(furniture|chair|sofa|cabinet|table|woodwork|joinery|oakhaven)\b/i.test(cleanPrompt + " " + domain);
    const isCulinaryDomain = !PromptConstraints.isForbiddenByPrompt(prompt, "culinary") && /\b(culinary|recipe|savorline|gastronom|dining|cuisine|terroir|chef|food journey)\b/i.test(cleanPrompt + " " + domain);
    const isHotelDomain = !PromptConstraints.isForbiddenByPrompt(prompt, "hotel") && !PromptConstraints.isForbiddenByPrompt(prompt, "hospitality") && /\b(hotel|boutique hotel|resort|hospitality|luxury stay|luxury suites|villa resort)\b/i.test(cleanPrompt + " " + domain);

    const files = this.collectSourceFiles(srcDir);

    for (const filePath of files) {
      const relPath = relative(this.projectRoot, filePath).replace(/\\/g, "/");
      const lowerRel = relPath.toLowerCase();

      // 1. File Name Checks
      if (!allowsGallery) {
        if (
          lowerRel.includes("artwork") ||
          lowerRel.includes("gallery") ||
          lowerRel.includes("artstats") ||
          lowerRel.includes("exhibition") ||
          lowerRel.includes("painting")
        ) {
          violations.push({
            file: relPath,
            issueType: "CONTAMINATED_FILE",
            token: "artwork/gallery",
            expectedDomain: domain || "non-art",
            description: `File "${relPath}" belongs to an unrelated Art Gallery template (active domain "${domain || 'non-art'}" does not permit art/gallery artifacts).`,
          });
        }
      }

      if (!isFitness && !isStudent && !isLibrary) {
        if (lowerRel.includes("workoutplan") || lowerRel.includes("exercisecard")) {
          violations.push({
            file: relPath,
            issueType: "CONTAMINATED_FILE",
            token: "workoutplan/exercisecard",
            expectedDomain: domain || "general",
            description: `File "${relPath}" belongs to an unrelated Fitness template.`,
          });
        }
      }

      // 2. File Content Checks (UI text, headings, source path leaks, stubs)
      if (lowerRel.endsWith(".tsx") || lowerRel.endsWith(".jsx") || lowerRel.endsWith(".html")) {
        try {
          const content = readFileSync(filePath, "utf8");
          const lowerContent = content.toLowerCase();

          // Check for Art Gallery phrases in non-art projects
          if (!allowsGallery) {
            const forbiddenArtPhrases = [
              "artworkstats",
              "artworkdashboard",
              "starry horizon",
              "vincent van gogh",
              "oil painting",
              "canvas portfolio",
              "recent additions (art)",
              "gallery overview",
              "curated exhibitions",
            ];
            for (const phrase of forbiddenArtPhrases) {
              if (lowerContent.includes(phrase)) {
                violations.push({
                  file: relPath,
                  issueType: "FORBIDDEN_KEYWORD",
                  token: phrase,
                  expectedDomain: domain || "general",
                  description: `Found unrelated Art Gallery template phrase "${phrase}" in ${relPath}.`,
                });
              }
            }
          }

          // Check for foreign Marine / Underwater phrases in non-marine projects
          if (!isMarineDomain) {
            const forbiddenMarinePhrases = [
              "hydrophone acoustic array",
              "marine resonance console",
              "hydrophone",
              "marine resonance",
              "deep hydrophone hum",
              "whale acoustics",
              "hadal pressure echo",
              "pelagic leviathan call",
              "thermal vent rumble",
              "sub-surface tectonic pressure",
              "bathymetric depth layers",
              "hadal trench chasm",
              "mesopelagic twilight",
              "epipelagic sunlit realm",
              "benthic",
              "bathymetry",
            ];
            for (const phrase of forbiddenMarinePhrases) {
              if (lowerContent.includes(phrase)) {
                violations.push({
                  file: relPath,
                  issueType: "FORBIDDEN_KEYWORD",
                  token: phrase,
                  expectedDomain: domain || "general",
                  description: `Foreign domain contamination: Found marine/underwater phrase "${phrase}" in ${relPath} (not provenanced by domain "${domain || 'non-marine'}").`,
                });
              }
            }
          }

          // Check for foreign Fantasy / Kazzoo phrases in non-fantasy projects
          if (!isFantasyDomain) {
            const forbiddenFantasyPhrases = [
              "kazzoo fantasy adventure",
              "pip the mossling",
              "grumble the stone snail",
              "archive of unwritten songs",
              "crossing of luminous shallows",
              "cloud spire",
              "moss drum",
            ];
            for (const phrase of forbiddenFantasyPhrases) {
              if (lowerContent.includes(phrase)) {
                violations.push({
                  file: relPath,
                  issueType: "FORBIDDEN_KEYWORD",
                  token: phrase,
                  expectedDomain: domain || "general",
                  description: `Foreign domain contamination: Found Kazzoo fantasy phrase "${phrase}" in ${relPath} (not provenanced by domain "${domain || 'non-fantasy'}").`,
                });
              }
            }
          }

          // Check for foreign Furniture / Oakhaven phrases in non-furniture projects
          if (!isFurnitureDomain) {
            const forbiddenFurniturePhrases = [
              "mortise & tenon joinery",
              "hand-rubbed oil finissage",
              "the living timber selection",
              "ergonomic contour sculpting",
              "tenon joinery atelier",
              "oakhaven atelier",
            ];
            for (const phrase of forbiddenFurniturePhrases) {
              if (lowerContent.includes(phrase)) {
                violations.push({
                  file: relPath,
                  issueType: "FORBIDDEN_KEYWORD",
                  token: phrase,
                  expectedDomain: domain || "general",
                  description: `Foreign domain contamination: Found furniture phrase "${phrase}" in ${relPath} (not provenanced by domain "${domain || 'non-furniture'}").`,
                });
              }
            }
          }

          // Check for foreign Savorline / Culinary phrases in non-culinary projects
          if (!isCulinaryDomain) {
            const forbiddenCulinaryPhrases = [
              "savorline",
              "terroir awakening",
              "ancestral techniques & wood-fire kilns",
              "the chef monograph & flavor architecture",
              "the ephemeral table & feasting ledger",
              "nordic fermented chanterelle",
            ];
            for (const phrase of forbiddenCulinaryPhrases) {
              if (lowerContent.includes(phrase)) {
                violations.push({
                  file: relPath,
                  issueType: "FORBIDDEN_KEYWORD",
                  token: phrase,
                  expectedDomain: domain || "general",
                  description: `Foreign domain contamination: Found culinary/Savorline phrase "${phrase}" in ${relPath} (not provenanced by domain "${domain || 'non-culinary'}").`,
                });
              }
            }
          }

          // Check for foreign Velora House / Hotel phrases in non-hotel projects
          if (!isHotelDomain) {
            const forbiddenHotelPhrases = [
              "velora house",
              "luxury boutique hotel & sanctuary",
              "sanctuary suites & curated residences",
              "reserve a suite",
              "guest preferences & bespoke itinerary",
            ];
            for (const phrase of forbiddenHotelPhrases) {
              if (lowerContent.includes(phrase)) {
                violations.push({
                  file: relPath,
                  issueType: "FORBIDDEN_KEYWORD",
                  token: phrase,
                  expectedDomain: domain || "general",
                  description: `Foreign domain contamination: Found hotel/Velora phrase "${phrase}" in ${relPath} (not provenanced by domain "${domain || 'non-hotel'}").`,
                });
              }
            }
          }

          // Check for Generic "Operations Nexus" and REC-101 fallback phrases in all non-explicitly-operations projects
          const isExplicitTelemetry = domain.includes("telemetry") || domain.includes("industrial-scada");
          if (!isExplicitTelemetry) {
            const forbiddenGenericPhrases = [
              "operations nexus",
              "operational records",
              "rec-101",
              "rec-102",
              "rec-103",
              "rec-104",
              "primary master workspace",
              "secondary workflow cluster",
              "telemetry feed ingestion",
              "maintenance & inspection cycle",
              "standard asset",
              "code / reference id",
              "primary metric",
            ];
            for (const phrase of forbiddenGenericPhrases) {
              if (lowerContent.includes(phrase)) {
                violations.push({
                  file: relPath,
                  issueType: "FORBIDDEN_KEYWORD",
                  token: phrase,
                  expectedDomain: domain || "general",
                  description: `Found generic fallback template phrase "${phrase}" in ${relPath}.`,
                });
              }
            }
          }

          // Check for source file path leaks rendered into JSX
          if (
            content.includes("C:\\Users\\") ||
            content.includes("c:/users/") ||
            content.includes("/projects/aegis-ai/") ||
            content.includes("font-mono mb-1\">src/") ||
            content.includes("font-mono mb-1\">server/")
          ) {
            violations.push({
              file: relPath,
              issueType: "SOURCE_PATH_LEAK",
              token: "absolute_path",
              expectedDomain: domain || "general",
              description: `Source path leak detected rendered in visible code of ${relPath}.`,
            });
          }

          // Check for empty debug stubs
          if (
            content.includes("Auto-created missing component") ||
            content.includes("Placeholder Component Stub")
          ) {
            violations.push({
              file: relPath,
              issueType: "PLACEHOLDER_STUB",
              token: "placeholder_stub",
              expectedDomain: domain || "general",
              description: `Placeholder stub detected in ${relPath}.`,
            });
          }
        } catch {}
      }
    }

    // 3. Route Integrity Verification
    const routesFile = join(srcDir, "routes.tsx");
    if (existsSync(routesFile)) {
      try {
        const routesContent = readFileSync(routesFile, "utf8");
        // Scan for imported components in routes.tsx
        const importMatches = routesContent.matchAll(/import\s+(?:\{[^}]+\}|\w+)\s+from\s+["']([^"']+)["']/g);
        for (const match of importMatches) {
          const importTarget = match[1];
          if (importTarget.startsWith(".")) {
            const resolvedTarget = join(srcDir, importTarget).replace(/\\/g, "/");
            const possibleExts = ["", ".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts"];
            const exists = possibleExts.some((ext) => existsSync(resolvedTarget + ext));
            if (!exists) {
              violations.push({
                file: "src/routes.tsx",
                issueType: "UNRELATED_ROUTE",
                token: importTarget,
                expectedDomain: domain || "general",
                description: `Route imports non-existent module: "${importTarget}".`,
              });
            }
          }
        }
      } catch {}
    }

    // 4. Template Blocklist & Phrase Leak Audit (Real Template-Contamination Check)
    const allowedCorpusParts: string[] = [];
    if (contractToUse?.prompt) allowedCorpusParts.push(String(contractToUse.prompt));
    if (prompt) allowedCorpusParts.push(prompt);
    if (domainCategory) allowedCorpusParts.push(domainCategory);

    if (contractToUse?.featureDescriptions) {
      if (Array.isArray(contractToUse.featureDescriptions)) {
        allowedCorpusParts.push(...contractToUse.featureDescriptions.map(String));
      } else if (typeof contractToUse.featureDescriptions === "object") {
        allowedCorpusParts.push(...Object.values(contractToUse.featureDescriptions).map(String));
      } else {
        allowedCorpusParts.push(String(contractToUse.featureDescriptions));
      }
    }

    for (const key of ["requiredFeatures", "suggestedFeatures", "requiredModels", "features"]) {
      if (Array.isArray(contractToUse?.[key])) {
        allowedCorpusParts.push(...contractToUse[key].map(String));
      }
    }

    if (contractToUse?.domainVocabulary) {
      if (typeof contractToUse.domainVocabulary === "object") {
        allowedCorpusParts.push(JSON.stringify(contractToUse.domainVocabulary));
      } else {
        allowedCorpusParts.push(String(contractToUse.domainVocabulary));
      }
    }

    const aegisDir = join(this.projectRoot, ".aegis");
    if (existsSync(aegisDir)) {
      for (const fn of [
        "feature-descriptions.json",
        "product-discovery.json",
        "features.json",
        "domain-vocabulary.json",
        "spec.json",
        "canonical-spec.json",
        "product-experience-plan.json",
      ]) {
        const fp = join(aegisDir, fn);
        if (existsSync(fp)) {
          try {
            allowedCorpusParts.push(readFileSync(fp, "utf8"));
          } catch {}
        }
      }
    }

    const siteContentParts: string[] = [];
    for (const scPath of [
      join(srcDir, "content", "site-content.ts"),
      join(srcDir, "content", "site-content.tsx"),
      join(srcDir, "content", "site-content.json"),
      join(srcDir, "site-content.ts"),
      join(srcDir, "site-content.tsx"),
    ]) {
      if (existsSync(scPath)) {
        try {
          const sc = readFileSync(scPath, "utf8");
          siteContentParts.push(sc);
          allowedCorpusParts.push(sc);
        } catch {}
      }
    }

    const allowedCorpusLower = allowedCorpusParts.join(" ").toLowerCase();
    const promptVocabLower = allowedCorpusParts.filter(p => !siteContentParts.includes(p)).join(" ").toLowerCase();

    const hardFlaggedPhrases = [
      "Day 21",
      "Practical Execution",
      "Grid Stability Index",
      "Renewable",
      "Avionics Flight Deck",
      "Telemetry & Operations Console",
    ];

    const blocklist = TemplateContaminationChecker.loadBlocklist();
    const candidatePhrases = Array.from(new Set([...hardFlaggedPhrases, ...blocklist]));

    const disallowedPhrases = candidatePhrases.filter(phrase => {
      const pLower = phrase.toLowerCase().trim();
      if (!pLower || pLower.length < 2) return false;
      const isHardFlagged = hardFlaggedPhrases.some(hf => hf.toLowerCase() === pLower);
      if (isHardFlagged) {
        // Hard-flagged phrases are only allowed if explicitly in prompt, featureDescriptions, or domainVocabulary
        return !promptVocabLower.includes(pLower);
      }
      return !allowedCorpusLower.includes(pLower);
    });

    const sourceCodeFiles = files.filter(f => f.endsWith(".ts") || f.endsWith(".tsx"));
    const leakedPhrasesSet = new Set<string>();

    for (const filePath of sourceCodeFiles) {
      const relPath = relative(this.projectRoot, filePath).replace(/\\/g, "/");
      try {
        const fileContent = readFileSync(filePath, "utf8");
        const lowerFileContent = fileContent.toLowerCase();

        for (const phrase of disallowedPhrases) {
          const phraseLower = phrase.toLowerCase();
          let matched = false;

          if (!phrase.includes(" ")) {
            const regex = new RegExp(`\\b${phraseLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
            matched = regex.test(fileContent);
          } else {
            matched = lowerFileContent.includes(phraseLower);
          }

          if (matched) {
            leakedPhrasesSet.add(phrase);
            violations.push({
              file: relPath,
              issueType: "TEMPLATE_PHRASE_LEAK",
              token: phrase,
              expectedDomain: domain || "active-domain",
              description: `Template phrase leak detected in ${relPath}: "${phrase}" (not in prompt, features, domain vocabulary, or site-content).`,
            });
          }
        }
      } catch {}
    }

    const leakedPhrases = Array.from(leakedPhrasesSet);
    const repairPrompt = leakedPhrases.length > 0
      ? `rewrite using domain vocabulary: ${leakedPhrases.map(p => `"${p}"`).join(", ")}`
      : undefined;

    const clean = violations.length === 0;
    const summary = clean
      ? "No template contamination detected. Project is cleanly domain-scoped."
      : `Detected ${violations.length} template contamination violation(s):\n` +
        violations.map(v => `  - [${v.issueType}] ${v.file}: ${v.description}`).join("\n");

    return {
      status: clean ? "PASS" : "FAIL",
      clean,
      violations,
      summary,
      leakedPhrases,
      repairPrompt,
    };
  }

  private static cachedBlocklist: string[] | null = null;

  public static loadBlocklist(): string[] {
    if (this.cachedBlocklist) return this.cachedBlocklist;
    const candidates = [
      join(dirname(fileURLToPath(import.meta.url)), "template-blocklist.generated.json"),
      join(process.cwd(), "packages", "ai-core", "src", "validation", "template-blocklist.generated.json"),
      join(process.cwd(), "packages", "ai-core", "dist", "validation", "template-blocklist.generated.json"),
      join(process.cwd(), "src", "validation", "template-blocklist.generated.json"),
    ];
    for (const c of candidates) {
      if (existsSync(c)) {
        try {
          const parsed = JSON.parse(readFileSync(c, "utf8"));
          if (Array.isArray(parsed)) {
            this.cachedBlocklist = parsed;
            return parsed;
          }
        } catch {}
      }
    }
    return [];
  }

  private collectSourceFiles(dir: string): string[] {
    const results: string[] = [];
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const st = statSync(fullPath);
        if (st.isDirectory()) {
          results.push(...this.collectSourceFiles(fullPath));
        } else {
          results.push(fullPath);
        }
      }
    } catch {}
    return results;
  }
}

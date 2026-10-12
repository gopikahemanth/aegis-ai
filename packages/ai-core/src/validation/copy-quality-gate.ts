/**
 * CopyQualityGate
 *
 * Enforces high-fidelity copy correctness and layout rendering standards
 * before frontend visual approval.
 *
 * CHECKS:
 * 1. COPY_CORRECTNESS:
 *    - Common spelling mistakes & typos
 *    - Accidental developer terminology (TODO, undefined, null, NaN, mockRecord, lorem ipsum)
 *    - Raw prompt instructions leaked as titles ("Create an independent fa...", "Build a website...")
 *    - Duplicated adjacent words ("the the", "with with")
 *    - Stale or leaked foreign domain vocabulary in visible navigation
 *    - Raw PascalCase or camelCase component names rendered as navigation labels
 * 2. COPY_RENDERING:
 *    - Visual truncation & clipping in browser rendering (scrollWidth > clientWidth)
 *    - Text overlapping controls
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

export interface CopyViolation {
  type:
    | "SPELLING"
    | "TRUNCATION"
    | "RAW_PROMPT_LEAK"
    | "DEV_TERMINOLOGY"
    | "DUPLICATED_WORD"
    | "STALE_VOCABULARY"
    | "RAW_COMPONENT_NAME"
    | "STRAY_CSS_CLASS"
    | "CLIPPING";
  file: string;
  line?: number;
  text: string;
  suggestion?: string;
  severity: "error" | "warning";
}

export interface CopyQualityReport {
  status: "PASS" | "FAIL";
  passed: boolean;
  correctnessPassed: boolean;
  renderingPassed: boolean;
  violations: CopyViolation[];
  summary: string;
}

export class CopyQualityGate {
  private static readonly COMMON_TYPOS: Record<string, string> = {
    photgrapher: "photographer",
    photgraphy: "photography",
    adventuree: "adventure",
    charaters: "characters",
    charater: "character",
    exlore: "explore",
    exlorer: "explorer",
    interative: "interactive",
    luxery: "luxury",
    luxuriouss: "luxurious",
    catlog: "catalog",
    dashbaord: "dashboard",
    analytcs: "analytics",
    monogrpah: "monograph",
    monogragh: "monograph",
    fragrnace: "fragrance",
    ingrediant: "ingredient",
    ingrediants: "ingredients",
    portfoilo: "portfolio",
    subcription: "subscription",
    calender: "calendar",
    occured: "occurred",
    recieved: "received",
    seperate: "separate",
    definately: "definitely",
    architechture: "architecture",
    buildling: "building",
    timpiece: "timepiece",
    materal: "material",
    experiance: "experience",
    tyopgraphy: "typography",
    unconvential: "unconventional",
  };

  private static readonly FORBIDDEN_DEV_TERMS = [
    /\bTODO\b/,
    /\bFIXME\b/,
    /\[object Object\]/,
    /\bundefined\b(?!\s*:\s*boolean|\s*:\s*string|\s*:\s*number)/,
    /\bNaN\b/,
    /\bmockRecord\b/i,
    /\blorem ipsum\b/i,
    /\bdummy text\b/i,
    /\bplaceholder data\b/i,
  ];

  /**
   * Extracts valid proper nouns and domain terms to avoid false-positive spell checks.
   */
  public static extractProductVocabulary(projectRoot: string, domainContract?: any): Set<string> {
    const vocab = new Set<string>();
    const checkText = (text: string) => {
      const words = text.match(/\b[A-Za-z0-9_-]{2,}\b/g) || [];
      for (const w of words) vocab.add(w.toLowerCase());
    };

    // 1. Contract & prompt
    if (domainContract?.name) checkText(domainContract.name);
    if (domainContract?.prompt) checkText(domainContract.prompt);
    if (domainContract?.requiredModels) domainContract.requiredModels.forEach((m: string) => checkText(m));
    if (domainContract?.requiredFeatures) domainContract.requiredFeatures.forEach((f: string) => checkText(f));

    // 2. Site content file
    const siteContentPath = join(projectRoot, "src", "content", "site-content.ts");
    if (existsSync(siteContentPath)) {
      try {
        const content = readFileSync(siteContentPath, "utf8");
        checkText(content);
      } catch {}
    }

    // 3. Plan & Identity
    const planPath = join(projectRoot, ".aegis", "product-experience-plan.json");
    if (existsSync(planPath)) {
      try {
        const plan = JSON.parse(readFileSync(planPath, "utf8"));
        if (plan.primaryActivity) checkText(plan.primaryActivity);
        (plan.requiredCapabilities || []).forEach((c: any) => {
          checkText(c.name);
          (c.evidenceVocabulary || []).forEach((v: string) => checkText(v));
        });
      } catch {}
    }

    return vocab;
  }

  public static audit(
    projectRoot: string,
    domainContract?: any,
    renderMetrics?: { clippedElements?: Array<{ selector: string; text: string }> }
  ): CopyQualityReport {
    const violations: CopyViolation[] = [];
    const srcDir = join(projectRoot, "src");

    if (!existsSync(srcDir)) {
      return {
        status: "PASS",
        passed: true,
        correctnessPassed: true,
        renderingPassed: true,
        violations: [],
        summary: "No src directory found to audit.",
      };
    }

    const files = this.collectSourceFiles(srcDir);
    const domainName = (domainContract?.name || "").toLowerCase();
    const isEditorial = domainName.includes("magazine") || domainName.includes("editorial") || domainName.includes("photography");
    const isPerfume = domainName.includes("perfume") || domainName.includes("fragrance") || domainName.includes("flacon");
    const isFantasy = domainName.includes("kazzoo") || domainName.includes("fantasy") || domainName.includes("adventure");
    const productVocab = this.extractProductVocabulary(projectRoot, domainContract);

    for (const filePath of files) {
      const relPath = filePath.replace(projectRoot, "").replace(/^[/\\]/, "");
      let content = "";
      try {
        content = readFileSync(filePath, "utf8");
      } catch {
        continue;
      }

      const lines = content.split(/\r?\n/);
      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        const lineNum = lineIdx + 1;

        // Skip import lines, comments, and pure CSS
        if (/^\s*(import\s|export\s+type|\/\/|\/\*|\*)/.test(line)) continue;

        // 1. Raw prompt instruction leak (e.g. "Create a luxury perfume...", "Create an independent fa...")
        const rawPromptMatch = line.match(/(?:title|brand|header|heading|name|children|label)[^=]*=\s*["'`](Create\s+(?:an?|the)\s+[^"'`]{3,}|Build\s+(?:an?|the)\s+[^"'`]{3,})/i) ||
          line.match(/<h[12][^>]*>\s*(Create\s+(?:an?|the)\s+[^<]{3,}|Build\s+(?:an?|the)\s+[^<]{3,})/i);
        if (rawPromptMatch) {
          violations.push({
            type: "RAW_PROMPT_LEAK",
            file: relPath,
            line: lineNum,
            text: rawPromptMatch[1].trim(),
            suggestion: "Use a curated brand name or domain headline instead of raw prompt instructions.",
            severity: "error",
          });
        }

        // 2. Truncated copy / ellipsis clipping in text literals or JSX tags (skip input placeholders and dynamic progress states)
        const isInputPlaceholder = line.includes("placeholder=") || /<(?:input|textarea)\b/i.test(line);
        const isProgressState = /\b(?:loading|calculating|recalculating|processing|updating|syncing|saving|submitting|pending)\b/i.test(line);
        if (!isInputPlaceholder && !isProgressState) {
          const truncationMatch =
            line.match(/(?:brand|title|headline|label)["'`:]+\s*["'`]([^"'`]*?\b[a-z]{1,2}\.\.\.)/) ||
            line.match(/>\s*([^<]*?\b[a-z]{1,2}\.\.\.)\s*</) ||
            line.match(/["'`]([^"'`]*?\b[a-z]{1,2}\.\.\.)["']/);
          if (truncationMatch) {
            violations.push({
              type: "TRUNCATION",
              file: relPath,
              line: lineNum,
              text: truncationMatch[1].trim(),
              suggestion: "Remove artificial truncation ellipsis; provide complete authoritative copy.",
              severity: "error",
            });
          }
        }

        const isCodeLogic = /typeof\s+|!==|===|:\s*(?:string|boolean|number|any|undefined)|\bconst\b|\blet\b|\bvar\b|\breturn\b|=>/.test(line);

        // 2b. Stray CSS utility class leaked as naked JSX text node
        if (
          !isCodeLogic &&
          !/className=|class=|style=|import\s|from\s|<[a-zA-Z0-9]+|\/>|<\/[a-zA-Z0-9]+>/.test(line) &&
          /^\s*(?:lg:|md:|sm:|xl:|2xl:|grid-cols-|col-span-|space-[xy]-)[a-zA-Z0-9\-\s/:]+$/.test(line)
        ) {
          violations.push({
            type: "STRAY_CSS_CLASS",
            file: relPath,
            line: lineNum,
            text: line.trim(),
            suggestion: "Remove raw CSS class string appearing as naked text node outside of JSX tags.",
            severity: "error",
          });
        }

        // 3. Common spelling mistakes in string literals
        for (const [typo, correction] of Object.entries(this.COMMON_TYPOS)) {
          const typoRegex = new RegExp(`(?<=["'\`>\\s])${typo}(?=[<"'\`\\s,.!?:;])`, "i");
          if (typoRegex.test(line)) {
            violations.push({
              type: "SPELLING",
              file: relPath,
              line: lineNum,
              text: typo,
              suggestion: correction,
              severity: "error",
            });
          }
        }

        // 4. Accidental developer terminology in visible UI
        for (const pattern of this.FORBIDDEN_DEV_TERMS) {
          const match = line.match(pattern);
          if (match && !/console\.|logger\.|eslint|@ts-/.test(line)) {
            // For undefined / NaN, only flag if it appears inside JSX text or user-facing string properties
            if (pattern.source.includes("undefined") || pattern.source.includes("NaN")) {
              if (isCodeLogic) continue;
              const isUserVisible = />[^<]*\b(?:undefined|NaN)\b[^<]*</.test(line) ||
                /(?:title|headline|label|name|children|caption|quote)["'`:]+\s*["'`][^"'`]*\b(?:undefined|NaN)\b/i.test(line);
              if (!isUserVisible) continue;
            }
            violations.push({
              type: "DEV_TERMINOLOGY",
              file: relPath,
              line: lineNum,
              text: match[0],
              suggestion: "Remove developer artifact from user-visible production copy.",
              severity: "error",
            });
          }
        }

        // 5. Duplicated adjacent words in user copy
        const dupMatch = line.match(/(?:>|:\s*["'`])([^<"'`]*\b(the|a|an|in|on|with|for|to|of|and|is|are|it)\s+\2\b[^<"'`]*)(?:<|["'`])/i);
        if (dupMatch && dupMatch[1]) {
          violations.push({
            type: "DUPLICATED_WORD",
            file: relPath,
            line: lineNum,
            text: dupMatch[1].trim(),
            suggestion: "Remove accidental duplicate word.",
            severity: "warning",
          });
        }

        // 6. Raw component / PascalCase names leaking into visible navigation labels or links
        if (relPath.includes("Navbar") || relPath.includes("Header") || relPath.includes("Nav")) {
          const rawPascalLabel =
            line.match(/label:\s*["']([A-Z][a-z]+(?:[A-Z][a-z]+)+)["']/) ||
            line.match(/<(?:a|Link|NavLink|span|button)[^>]*>\s*([A-Z][a-z]+(?:[A-Z][a-z]+)+)\s*<\/(?:a|Link|NavLink|span|button)>/);
          if (rawPascalLabel && !["Portfolio", "Monograph", "Soundboard"].includes(rawPascalLabel[1])) {
            violations.push({
              type: "RAW_COMPONENT_NAME",
              file: relPath,
              line: lineNum,
              text: rawPascalLabel[1],
              suggestion: "Convert PascalCase code identifier into curated human product vocabulary.",
              severity: "error",
            });
          }

          // 7. Stale foreign domain vocabulary in navigation
          if (isEditorial && /\b(Dashboard|Primary Workspace|Manage Records|ATS Score|Candidate)\b/i.test(line)) {
            violations.push({
              type: "STALE_VOCABULARY",
              file: relPath,
              line: lineNum,
              text: line.trim(),
              suggestion: "Editorial magazine must not contain SaaS/admin navigation vocabulary.",
              severity: "error",
            });
          } else if (isFantasy && /\b(Portfolio Item|Candidate|ATS|Resume|Reports)\b/i.test(line)) {
            violations.push({
              type: "STALE_VOCABULARY",
              file: relPath,
              line: lineNum,
              text: line.trim(),
              suggestion: "Fantasy world must not contain HR/portfolio vocabulary.",
              severity: "error",
            });
          }
        }

        // 8. Typography and label length sizing (prevent awkward wrapping or clipping)
        const buttonLabelMatch = line.match(/<button[^>]*>\s*([A-Za-z0-9\s-]{50,})\s*<\/button>/);
        if (buttonLabelMatch) {
          violations.push({
            type: "TRUNCATION",
            file: relPath,
            line: lineNum,
            text: buttonLabelMatch[1].trim(),
            suggestion: "Button label is excessively long (>50 chars) and will cause visual layout clipping. Use concise action text.",
            severity: "warning",
          });
        }
      }
    }

    // 8. Visual rendering clipping check (from headless Chromium DOM metrics)
    if (renderMetrics?.clippedElements && renderMetrics.clippedElements.length > 0) {
      for (const el of renderMetrics.clippedElements) {
        violations.push({
          type: "CLIPPING",
          file: "browser-render",
          text: `${el.selector}: "${el.text}"`,
          suggestion: "Fix CSS flex/overflow/wrapping to prevent visual text clipping.",
          severity: "error",
        });
      }
    }

    const errors = violations.filter(v => v.severity === "error");
    const correctnessPassed = errors.filter(e => e.type !== "CLIPPING").length === 0;
    const renderingPassed = errors.filter(e => e.type === "CLIPPING").length === 0;
    const passed = errors.length === 0;

    const summary = passed
      ? `✓ CopyQualityGate passed: Zero spelling mistakes, prompt leaks, or layout clippings detected.`
      : `🔴 CopyQualityGate failed with ${errors.length} error(s): ${errors.map(e => `[${e.type}] ${e.text} (${e.file}${e.line ? `:${e.line}` : ""})`).join(" | ")}`;

    return {
      status: passed ? "PASS" : "FAIL",
      passed,
      correctnessPassed,
      renderingPassed,
      violations,
      summary,
    };
  }

  private static collectSourceFiles(dir: string): string[] {
    const results: string[] = [];
    if (!existsSync(dir)) return results;

    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        if (!entry.startsWith(".") && entry !== "node_modules" && entry !== "dist") {
          results.push(...this.collectSourceFiles(fullPath));
        }
      } else if (stat.isFile()) {
        const ext = extname(entry).toLowerCase();
        if (
          (ext === ".ts" || ext === ".tsx" || ext === ".js" || ext === ".jsx") &&
          !entry.includes(".test.") &&
          !entry.includes(".spec.") &&
          !entry.endsWith(".d.ts")
        ) {
          results.push(fullPath);
        }
      }
    }
    return results;
  }
}

/**
 * DesignIntentGate
 *
 * Source-level verification: did the generated code actually implement the brief?
 * Scans .tsx/.ts files against the locked ProductDesignBrief.
 * Runs BEFORE the VisualQualityGate (which uses real Chromium rendering).
 *
 * Ten checks, two severity levels:
 *  CRITICAL → 15 points deducted — causes repair loop
 *  WARNING  →  5 points deducted — fed to VisualQualityGate as context
 *
 * Score ≥ 80 → pass
 * Score 60–79 → pass with warnings → VisualQualityGate gets violation context
 * Score < 60  → fail → violations appended to healingContext
 */

import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";
import type { ProductDesignBrief } from "../design/design-director.js";

// ─── Public types ─────────────────────────────────────────────────────────────

export type ViolationSeverity = "CRITICAL" | "WARNING";

export interface DesignViolation {
  check: string;
  severity: ViolationSeverity;
  expected: string;
  found: string;
  file?: string;
  line?: number;
}

export interface DesignIntentReport {
  passed: boolean;
  score: number;             // 0–100
  criticalCount: number;
  warningCount: number;
  violations: DesignViolation[];
  /** Formatted string for VisualQualityGate or repair loop context */
  summaryText: string;
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

// Native recursive walk — no external glob dependency
function walkDir(dir: string, exts: string[], ignore: string[]): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      // Skip ignored directories / patterns
      if (ignore.some(ig => entry === ig || dir.includes(ig))) continue;
      const fullPath = join(dir, entry);
      const s = statSync(fullPath);
      if (s.isDirectory()) {
        results.push(...walkDir(fullPath, exts, ignore));
      } else if (exts.some(ext => fullPath.endsWith(ext))) {
        // Skip test/spec files
        if (fullPath.includes(".test.") || fullPath.includes(".spec.")) continue;
        results.push(fullPath);
      }
    }
  } catch { /* ignore permission errors */ }
  return results;
}

async function collectSourceFiles(outputDirectory: string): Promise<string[]> {
  const srcDir = join(outputDirectory, "src");
  if (!existsSync(srcDir)) return [];
  try {
    return walkDir(srcDir, [".tsx", ".ts", ".jsx"], ["node_modules", "design-system"]);
  } catch {
    return [];
  }
}

function readAllSource(files: string[]): string {
  return files.map(f => {
    try { return readFileSync(f, "utf8"); }
    catch { return ""; }
  }).join("\n");
}

function findInFiles(pattern: RegExp, files: string[]): Array<{ file: string; line: number; match: string }> {
  const results: Array<{ file: string; line: number; match: string }> = [];
  for (const file of files) {
    let content: string;
    try { content = readFileSync(file, "utf8"); }
    catch { continue; }
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      const m = line.match(pattern);
      if (m) results.push({ file, line: idx + 1, match: m[0] });
    });
  }
  return results;
}

/** Detects approximate HSL hue bucket (0–11, each 30°) for clustering */
function hueOf(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  let h = 0;
  const d = max - min;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
    case g: h = ((b - r) / d + 2) * 60; break;
    case b: h = ((r - g) / d + 4) * 60; break;
  }
  return Math.round(h / 30) % 12;
}

// ─── The 10 checks ────────────────────────────────────────────────────────────

/**
 * CHECK 1 — Forbidden vocabulary
 * Severity: CRITICAL
 * Scans JSX text content (inside > ... < or in string props) for forbidden terms.
 */
function checkForbiddenVocabulary(
  brief: ProductDesignBrief,
  files: string[],
): DesignViolation[] {
  const violations: DesignViolation[] = [];
  const forbidden = brief.vocabularyContract.forbidden;

  for (const term of forbidden) {
    // Match JSX text nodes and common string props (label, placeholder, children, aria-label)
    const pattern = new RegExp(
      `[>'"](${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})[<'"]`,
      "gi"
    );
    const hits = findInFiles(pattern, files);
    if (hits.length > 0) {
      violations.push({
        check: "forbidden-vocabulary",
        severity: "CRITICAL",
        expected: `Forbidden term "${term}" must not appear in any JSX text, label, heading, or placeholder`,
        found: `Found "${term}" in ${hits.length} location(s)`,
        file: hits[0].file,
        line: hits[0].line,
      });
    }
  }

  return violations;
}

/**
 * CHECK 2 — Required vocabulary
 * Severity: WARNING
 * Checks that core product nouns appear at least once across the full app.
 */
function checkRequiredVocabulary(
  brief: ProductDesignBrief,
  allSource: string,
): DesignViolation[] {
  const violations: DesignViolation[] = [];
  const required = brief.vocabularyContract.required;

  for (const term of required) {
    const pattern = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (!pattern.test(allSource)) {
      violations.push({
        check: "required-vocabulary",
        severity: "WARNING",
        expected: `Required term "${term}" must appear at least once in the app`,
        found: `"${term}" not found in any source file`,
      });
    }
  }

  return violations;
}

/**
 * CHECK 3 — Experience pattern match
 * Severity: CRITICAL
 * For personal-tracker: homepage hero must NOT be a generic admin table or KPI grid.
 * For operations-dashboard: homepage must have metric/data content.
 */
function checkExperiencePatternMatch(
  brief: ProductDesignBrief,
  files: string[],
): DesignViolation[] {
  const violations: DesignViolation[] = [];
  const pattern = brief.productCharacteristics.experiencePattern;

  // Find the home/index route file
  const homeFiles = files.filter(f => {
    const normalized = f.replace(/\\/g, "/");
    return normalized.includes("/pages/Home") ||
           normalized.includes("/pages/Index") ||
           normalized.includes("/App.tsx") ||
           normalized.includes("/routes/index");
  });

  if (homeFiles.length === 0) return violations; // can't check without home file

  const homeSource = homeFiles.map(f => {
    try { return readFileSync(f, "utf8"); } catch { return ""; }
  }).join("\n");

  if (pattern === "personal-tracker") {
    // Homepage should NOT open with a KPI grid as the first major element
    const forbiddenHeroPatterns = [
      /<table\b/i,
      /<MetricGrid\b/i,
      /className=".*grid.*grid-cols-[3-9]/,
      /className=".*grid.*col-span/,
    ];
    for (const p of forbiddenHeroPatterns) {
      if (p.test(homeSource.slice(0, 3000))) { // first ~3000 chars = first rendered element
        violations.push({
          check: "experience-pattern-match",
          severity: "CRITICAL",
          expected: `personal-tracker homepage hero must be a large interaction or progress visualization`,
          found: `Homepage appears to open with an admin table or KPI grid — forbidden for personal-tracker`,
          file: homeFiles[0],
        });
        break;
      }
    }
  }

  if (pattern === "operations-dashboard") {
    // Homepage should have some metrics/data elements
    const hasMetrics = /<MetricCard|MetricGrid|TelemetryGrid|StatsCard|KPICard/i.test(homeSource);
    if (!hasMetrics) {
      violations.push({
        check: "experience-pattern-match",
        severity: "WARNING",
        expected: `operations-dashboard homepage must include metric or KPI components`,
        found: `No MetricCard, MetricGrid, TelemetryGrid, or StatsCard found on homepage`,
        file: homeFiles[0],
      });
    }
  }

  return violations;
}

/**
 * CHECK 4 — Primary nav item count
 * Severity: CRITICAL
 * Navigation must not exceed brief.navigation.maxPrimaryItems (hard cap ≤ 5).
 */
function checkNavSize(
  brief: ProductDesignBrief,
  files: string[],
): DesignViolation[] {
  const violations: DesignViolation[] = [];
  const maxItems = brief.navigation.maxPrimaryItems;

  const navFiles = files.filter(f => {
    const normalized = f.replace(/\\/g, "/").toLowerCase();
    return normalized.includes("nav") || normalized.includes("sidebar") ||
           normalized.includes("bottomtab") || normalized.includes("topbar") ||
           normalized.includes("layout");
  });

  for (const navFile of navFiles) {
    let source: string;
    try { source = readFileSync(navFile, "utf8"); } catch { continue; }

    // Count distinct navigation route destinations in the navigation container
    const navMatch = source.match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/i);
    const navContent = navMatch ? navMatch[1] : source;

    const destMatches = Array.from(navContent.matchAll(/(?:to|href)=["']([^"']+)["']/g))
      .map(m => m[1])
      .filter(path => path.startsWith("/") && path !== "/login" && path !== "/register");

    const uniqueDestinations = new Set(destMatches);
    const primaryCount = uniqueDestinations.size > 0
      ? uniqueDestinations.size
      : (source.match(/<NavLink|<Link\b|<Tab\b/gi) || []).length;

    if (primaryCount > maxItems + 2) { // +2 tolerance for sub-routes / utilities
      violations.push({
        check: "nav-size",
        severity: "CRITICAL",
        expected: `Navigation must have ≤ ${maxItems} primary items (brief.navigation.maxPrimaryItems)`,
        found: `Found approximately ${primaryCount} nav link/item occurrences in ${navFile.split(/[/\\]/).pop()}`,
        file: navFile,
      });
      break; // one violation per file is enough
    }
  }

  return violations;
}

/**
 * CHECK 5 — Composition diversity
 * Severity: WARNING
 * More than 2 consecutive pages with the same compositionFamily + heroElement is forbidden.
 */
function checkCompositionDiversity(
  brief: ProductDesignBrief,
  files: string[],
): DesignViolation[] {
  const violations: DesignViolation[] = [];
  const compositions = brief.pageCompositions;

  // Check for 3+ consecutive pages with same heroElement type
  for (let i = 2; i < compositions.length; i++) {
    if (
      compositions[i].compositionFamily === compositions[i - 1].compositionFamily &&
      compositions[i].heroElement === compositions[i - 1].heroElement &&
      compositions[i].compositionFamily === compositions[i - 2].compositionFamily &&
      compositions[i].heroElement === compositions[i - 2].heroElement
    ) {
      violations.push({
        check: "composition-diversity",
        severity: "WARNING",
        expected: `≤ 2 consecutive pages may share the same compositionFamily + heroElement`,
        found: `Pages ${compositions[i - 2].name}, ${compositions[i - 1].name}, and ${compositions[i].name} all share ${compositions[i].compositionFamily} / ${compositions[i].heroElement}`,
      });
    }
  }

  return violations;
}

/**
 * CHECK 6 — Chart palette diversity
 * Severity: CRITICAL
 * Charts must use ≥ 3 distinct hue buckets (±30° HSL) across the app.
 */
function checkChartPaletteDiversity(
  brief: ProductDesignBrief,
  allSource: string,
): DesignViolation[] {
  const violations: DesignViolation[] = [];
  const chartPalette = brief.colorSystem.chartPalette;

  // Only validate chart palette diversity if the application actually renders charts
  const hasCharts = /recharts|chart\.js|BarChart|LineChart|AreaChart|PieChart|DonutChart|VictoryChart|ResponsiveContainer/i.test(allSource);
  if (!hasCharts) {
    return [];
  }

  // Find which palette colors are referenced in the source
  const usedHueBuckets = new Set<number>();
  for (const color of chartPalette) {
    if (allSource.toLowerCase().includes(color.toLowerCase())) {
      usedHueBuckets.add(hueOf(color));
    }
  }

  if (usedHueBuckets.size < 3 && chartPalette.length >= 4) {
    violations.push({
      check: "chart-palette-diversity",
      severity: "CRITICAL",
      expected: `Charts must use ≥ 3 distinct hue buckets from the 6-color chartPalette`,
      found: `Only ${usedHueBuckets.size} distinct hue bucket(s) referenced. chartPalette: [${chartPalette.join(", ")}]`,
    });
  }

  return violations;
}

/**
 * CHECK 7 — Component monotony
 * Severity: WARNING
 * Any single component type appearing > 8× on one page indicates a card-grid spam pattern.
 */
function checkComponentMonotony(
  brief: ProductDesignBrief,
  files: string[],
): DesignViolation[] {
  const violations: DesignViolation[] = [];
  const MONOTONY_THRESHOLD = 8;

  const pageFiles = files.filter(f => {
    const normalized = f.replace(/\\/g, "/").toLowerCase();
    return normalized.includes("/pages/") || normalized.includes("/views/");
  });

  for (const pageFile of pageFiles) {
    let source: string;
    try { source = readFileSync(pageFile, "utf8"); } catch { continue; }

    // Count repetitions of common components (case-sensitive for React components to avoid matching native HTML tags)
    const componentPatterns: Array<{ name: string; pattern: RegExp }> = [
      { name: "GlassCard / card div", pattern: /<GlassCard\b|className="[^"]*\bcard\b/gi },
      { name: "MetricCard",           pattern: /<MetricCard\b/g },
      { name: "Badge",                pattern: /<Badge\b/g },
      { name: "Button",               pattern: /<Button\b/g },
    ];

    for (const { name, pattern } of componentPatterns) {
      const matches = source.match(pattern);
      if (matches && matches.length > MONOTONY_THRESHOLD) {
        violations.push({
          check: "component-monotony",
          severity: "WARNING",
          expected: `No component type should appear > ${MONOTONY_THRESHOLD}× on a single page`,
          found: `${name} appears ${matches.length}× in ${pageFile.split(/[/\\]/).pop()}`,
          file: pageFile,
        });
      }
    }
  }

  return violations;
}

/**
 * CHECK 8 — Visual hierarchy
 * Severity: WARNING
 * Each page should have exactly 1 h1. Pages with 0 or > 3 h1 tags, or all same font-size, fail.
 */
function checkVisualHierarchy(
  brief: ProductDesignBrief,
  files: string[],
): DesignViolation[] {
  const violations: DesignViolation[] = [];

  const pageFiles = files.filter(f => {
    const normalized = f.replace(/\\/g, "/").toLowerCase();
    return normalized.includes("/pages/") || normalized.includes("/views/");
  });

  for (const pageFile of pageFiles) {
    let source: string;
    try { source = readFileSync(pageFile, "utf8"); } catch { continue; }

    const h1Count = (source.match(/<h1\b/gi) || []).length;

    if (h1Count === 0) {
      violations.push({
        check: "visual-hierarchy",
        severity: "WARNING",
        expected: `Each page component should contain exactly 1 <h1>`,
        found: `No <h1> found in ${pageFile.split(/[/\\]/).pop()}`,
        file: pageFile,
      });
    } else if (h1Count > 3) {
      violations.push({
        check: "visual-hierarchy",
        severity: "WARNING",
        expected: `Each page component should have 1 primary <h1>`,
        found: `${h1Count} <h1> elements found in ${pageFile.split(/[/\\]/).pop()} — creates no visual hierarchy`,
        file: pageFile,
      });
    }
  }

  return violations;
}

/**
 * CHECK 9 — Hero element presence
 * Severity: CRITICAL
 * Each page's heroElement type (from brief.pageCompositions) must exist as a meaningful
 * first child or early section in the corresponding page file.
 */
function checkHeroElementPresence(
  brief: ProductDesignBrief,
  files: string[],
): DesignViolation[] {
  const violations: DesignViolation[] = [];

  // Hero → expected JSX patterns
  const heroPatterns: Record<string, RegExp[]> = {
    "large-interaction": [/CheckIn|DailyLog|QuickAdd|LogEntry|MoodLogger|HabitLogger|PrimaryAction|hero.*button|button.*hero|btn-primary|button|Book|Reserve|Inquiry|Commission|Discover|Action/i],
    "progress-visualization": [/ProgressRing|StreakCard|ProgressBar|GoalProgress|CompletionRing/i],
    "timeline-scroll": [/Timeline|HistoryList|LogList|EntryList|ActivityFeed|ScrollList|Schedule|Firing|Workflow|EventList|Feed|Activities|Recent|Monograph|Dispatch|Alerts/i],
    "showcase-grid": [/ShowcaseGrid|GalleryGrid|PortfolioGrid|CatalogGrid|ImageGrid|ProductGrid|Collection|Masterwork|Masterpiece/i],
    "metric-cluster": [/MetricCard|MetricGrid|KPICard|StatsRow|TelemetryGrid|DashboardHeader|Highlights|Stat/i],
    "map-visualization": [/MapView|LeafletMap|GoogleMap|MapContainer|MapViewer/i],
    "form-flow": [/BookingForm|CheckoutForm|ReservationForm|ContactForm|WizardForm|MultiStepForm|form\b/i],
    "editorial-hero": [/HeroSection|EditorialHero|HeroBanner|HeroImage|hero.*img|img.*hero|display-title|body-lead|editorial/i],
    "calendar": [/CalendarView|WeekView|MonthView|ScheduleGrid|FullCalendar|BigCalendar/i],
  };

  // Only scan real component page files (exclude types, services, utils, hooks, styles, router, nested components)
  const candidatePageFiles = files.filter(f => {
    const normalized = f.replace(/\\/g, "/").toLowerCase();
    return (normalized.endsWith(".tsx") || normalized.endsWith(".jsx")) &&
           !normalized.endsWith(".d.ts") &&
           !normalized.includes("/types/") &&
           !normalized.includes("/services/") &&
           !normalized.includes("/utils/") &&
           !normalized.includes("/hooks/") &&
           !normalized.includes("/design-system/") &&
           !normalized.includes("/components/") &&
           !normalized.endsWith("/app.tsx") &&
           !normalized.endsWith("/main.tsx") &&
           !normalized.endsWith("/routes.tsx") &&
           !normalized.endsWith("/routes/index.tsx");
  });

  for (const composition of brief.pageCompositions) {
    const routeSlug = composition.route.replace(/[/:]/g, "").toLowerCase() || "home";
    const expectedHero = composition.heroElement;
    const patterns = heroPatterns[expectedHero] || [];
    if (patterns.length === 0) continue;

    // Find the corresponding page file
    const pageFile = candidatePageFiles.find(f => {
      const normalized = f.replace(/\\/g, "/").toLowerCase();
      if (routeSlug === "home") {
        return normalized.includes("/dashboardpage") ||
               normalized.includes("/homepage") ||
               normalized.includes("/indexpage") ||
               (normalized.includes("/pages/") && normalized.endsWith("dashboard.tsx")) ||
               (normalized.includes("/pages/") && normalized.endsWith("home.tsx"));
      }
      return normalized.includes(routeSlug);
    });

    if (!pageFile) continue;

    let source: string;
    try { source = readFileSync(pageFile, "utf8"); } catch { continue; }

    // Find the rendered JSX return block so we inspect UI elements rather than preamble JS state hooks
    const returnIdx = source.search(/\breturn\s*[\(\<]/);
    const renderedBlock = returnIdx !== -1 ? source.slice(returnIdx, returnIdx + 5000) : source.slice(0, 5000);

    const hasHero = patterns.some(p => p.test(renderedBlock) || p.test(source)) ||
                    /HeroSection|EditorialHero|HeroBanner|display-title|body-lead/i.test(renderedBlock);
    if (!hasHero) {
      violations.push({
        check: "hero-element-presence",
        severity: "CRITICAL",
        expected: `Page "${composition.name}" (${composition.route}) must open with a ${expectedHero} as the primary hero element`,
        found: `No ${expectedHero} pattern found in the rendered JSX of ${pageFile.split(/[/\\]/).pop()}`,
        file: pageFile,
      });
    }
  }

  return violations;
}

/**
 * CHECK 10 — Contextual empty states
 * Severity: WARNING
 * Empty states must not use generic text like "No data", "Nothing here", "No results".
 */
function checkContextualEmptyStates(
  brief: ProductDesignBrief,
  files: string[],
): DesignViolation[] {
  const violations: DesignViolation[] = [];
  const genericEmptyPhrases = [
    "No data",
    "Nothing here",
    "No results",
    "No results found",
    "Nothing to show",
    "No items",
    "Empty",
  ];

  for (const phrase of genericEmptyPhrases) {
    const pattern = new RegExp(
      `[>'"](${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})[<'"]`,
      "gi"
    );
    const hits = findInFiles(pattern, files);
    if (hits.length > 0) {
      violations.push({
        check: "contextual-empty-states",
        severity: "WARNING",
        expected: `Empty states must use contextual copy from brief.componentLanguage.emptyStateCopy, not "${phrase}"`,
        found: `Found generic empty state "${phrase}" in ${hits.length} location(s)`,
        file: hits[0].file,
        line: hits[0].line,
      });
    }
  }

  return violations;
}

// ─── Main gate ────────────────────────────────────────────────────────────────

export class DesignIntentGate {
  /**
   * Runs all 10 design intent checks against the generated source files.
   *
   * @param brief           The locked ProductDesignBrief
   * @param outputDirectory The project output directory (contains src/)
   */
  static async verify(
    brief: ProductDesignBrief,
    outputDirectory: string,
  ): Promise<DesignIntentReport> {
    const files = await collectSourceFiles(outputDirectory);
    const allSource = readAllSource(files);

    const allViolations: DesignViolation[] = [];

    // Run all 10 checks
    allViolations.push(
      ...checkForbiddenVocabulary(brief, files),
      ...checkRequiredVocabulary(brief, allSource),
      ...checkExperiencePatternMatch(brief, files),
      ...checkNavSize(brief, files),
      ...checkCompositionDiversity(brief, files),
      ...checkChartPaletteDiversity(brief, allSource),
      ...checkComponentMonotony(brief, files),
      ...checkVisualHierarchy(brief, files),
      ...checkHeroElementPresence(brief, files),
      ...checkContextualEmptyStates(brief, files),
    );

    const criticalCount = allViolations.filter(v => v.severity === "CRITICAL").length;
    const warningCount  = allViolations.filter(v => v.severity === "WARNING").length;
    const score         = Math.max(0, 100 - (criticalCount * 15) - (warningCount * 5));
    const passed        = score >= 60; // < 60 → fail; 60–79 → pass with warnings; ≥ 80 → pass

    const summaryText = [
      `DesignIntentGate: score=${score}/100 | critical=${criticalCount} | warnings=${warningCount} | ${passed ? "PASS" : "FAIL"}`,
      `Brief: ${brief.briefId} | Pattern: ${brief.productCharacteristics.experiencePattern} | Direction: ${brief.artDirectionName}`,
      ...allViolations.map(v =>
        `[${v.severity}] ${v.check}: ${v.expected}\n  → Found: ${v.found}${v.file ? `\n  → File: ${v.file}${v.line ? `:${v.line}` : ""}` : ""}`
      ),
    ].join("\n\n");

    return {
      passed,
      score,
      criticalCount,
      warningCount,
      violations: allViolations,
      summaryText,
    };
  }
}

/**
 * PageExperienceQualityGate
 *
 * Route-by-route frontend reality & intentionality gate.
 *
 * Enforces the core Aegis invariant:
 * EVERY ROUTE IS A FIRST-CLASS DESIGN TARGET.
 *
 * Validates that every individual route adheres to its PageExperiencePlan
 * and has not collapsed into generic cards, search/filter bars, or simple CRUD tables.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import type { ProductExperiencePlan } from "../design/product-experience-plan.js";
import type { PageExperiencePlan } from "../design/page-experience-plan.js";

export interface RouteAuditChecklist {
  fileFound: boolean;
  focalElementPresent: boolean;
  noForbiddenTemplates: boolean;
  meaningfulInteraction: boolean;
  notAccidentalStub: boolean;
  specializedCapabilityPresent: boolean;
}

export interface RouteAuditResult {
  route: string;
  pageRole: string;
  status: "PASS" | "FAIL";
  filePath?: string;
  checks: RouteAuditChecklist;
  violations: string[];
}

export interface PageExperienceQualityReport {
  status: "PASS" | "FAIL";
  passed: boolean;
  routesEvaluated: number;
  routesPassed: number;
  routeResults: RouteAuditResult[];
  summary: string;
}

export class PageExperienceQualityGate {
  /**
   * Audits every route in the project against its locked PageExperiencePlan.
   */
  public static audit(
    projectRoot: string,
    plan?: ProductExperiencePlan | null
  ): PageExperienceQualityReport {
    const srcDir = join(projectRoot, "src");
    if (!existsSync(srcDir) || !plan?.pagePlans || plan.pagePlans.length === 0) {
      return {
        status: "PASS",
        passed: true,
        routesEvaluated: 0,
        routesPassed: 0,
        routeResults: [],
        summary: "No page plans or src directory found to audit.",
      };
    }

    const allFiles = this.collectSourceFiles(srcDir);
    const routeResults: RouteAuditResult[] = [];

    for (const pagePlan of plan.pagePlans) {
      const result = this.auditRoute(projectRoot, allFiles, pagePlan, plan);
      routeResults.push(result);
    }

    const passedCount = routeResults.filter(r => r.status === "PASS").length;
    const allPassed = passedCount === routeResults.length;

    const tableRows = routeResults.map(r => {
      const routeCol = r.route.padEnd(20);
      const roleCol = (r.pageRole.length > 36 ? r.pageRole.slice(0, 33) + "..." : r.pageRole).padEnd(38);
      const statusCol = r.status === "PASS" ? "✓ PASS" : "✗ FAIL";
      return `│ ${routeCol} │ ${roleCol} │ ${statusCol} │`;
    });

    const summary = [
      `┌──────────────────────┬────────────────────────────────────────┬────────┐`,
      `│ ROUTE                │ PAGE EXPERIENCE ROLE                   │ STATUS │`,
      `├──────────────────────┼────────────────────────────────────────┼────────┤`,
      ...tableRows,
      `└──────────────────────┴────────────────────────────────────────┴────────┘`,
      `Result: ${passedCount}/${routeResults.length} routes satisfied first-class experience quality criteria.`,
    ].join("\n");

    return {
      status: allPassed ? "PASS" : "FAIL",
      passed: allPassed,
      routesEvaluated: routeResults.length,
      routesPassed: passedCount,
      routeResults,
      summary,
    };
  }

  private static auditRoute(
    projectRoot: string,
    files: string[],
    pagePlan: PageExperiencePlan,
    plan: ProductExperiencePlan
  ): RouteAuditResult {
    const targetFile = this.resolveRouteFile(projectRoot, files, pagePlan.route);
    const violations: string[] = [];

    // Domain-Specific Experience Planning: Reject inappropriate editorial roles for operational domains
    const isOperational =
      plan?.experienceIdentity?.genre === "HIGH_DENSITY_CONSOLE" ||
      plan?.experiencePattern === "realtime-console" ||
      (plan?.primaryActivity && /telemetry|avionics|flight|aerospace|radar|drone/i.test(plan.primaryActivity));

    if (isOperational && /monograph|folio archive|curatorial|opening essay/i.test(pagePlan.pageRole)) {
      violations.push(
        `DOMAIN_ROLE_MISMATCH: Route '${pagePlan.route}' was assigned editorial page role '${pagePlan.pageRole}' in an operational/aerospace product domain.`
      );
    }

    if (!targetFile) {
      return {
        route: pagePlan.route,
        pageRole: pagePlan.pageRole,
        status: "FAIL",
        checks: {
          fileFound: false,
          focalElementPresent: false,
          noForbiddenTemplates: false,
          meaningfulInteraction: false,
          notAccidentalStub: false,
          specializedCapabilityPresent: false,
        },
        violations: [`Missing route file: No component found implementing route '${pagePlan.route}'.`],
      };
    }

    let content = "";
    try {
      content = readFileSync(targetFile, "utf8");
    } catch {
      return {
        route: pagePlan.route,
        pageRole: pagePlan.pageRole,
        status: "FAIL",
        filePath: targetFile,
        checks: {
          fileFound: true,
          focalElementPresent: false,
          noForbiddenTemplates: false,
          meaningfulInteraction: false,
          notAccidentalStub: false,
          specializedCapabilityPresent: false,
        },
        violations: [`Unreadable route file: Could not read content of ${targetFile}.`],
      };
    }

    const relPath = relative(projectRoot, targetFile).replace(/\\/g, "/");

    // If the file is a delegating proxy component (e.g. `return <RecipeCollectionPage />;`), follow the delegate
    if (content.length < 600 && /return\s+<([A-Za-z0-9]+)/.test(content)) {
      const match = content.match(/return\s+<([A-Za-z0-9]+)/);
      if (match && match[1]) {
        const delegateName = match[1];
        const importMatch = content.match(new RegExp(`import\\s+(?:\\*\\s+as\\s+)?(?:${delegateName}|\\{[^}]*\\b${delegateName}\\b[^}]*\\})\\s+from\\s+["']([^"']+)["']`, "i"));
        if (importMatch && importMatch[1]) {
          const importPath = importMatch[1];
          const dir = dirname(targetFile);
          const candidates = [
            join(dir, `${importPath}.tsx`),
            join(dir, `${importPath}.jsx`),
            join(dir, `${importPath}.ts`),
            join(dir, `${importPath}.js`),
            join(dir, importPath, "index.tsx"),
            join(dir, importPath, "index.jsx"),
          ];
          for (const cand of candidates) {
            if (existsSync(cand)) {
              try {
                content += "\n" + readFileSync(cand, "utf8");
                break;
              } catch {}
            }
          }
        }
      }
    }

    // 1. Accidental stub detection
    const isAccidentalStub =
      (content.length < 150 && !content.includes("data-workspace")) ||
      content.includes("Loading module interface...") ||
      /SafeFallback|TODO|Coming soon/i.test(content) ||
      (content.includes("<textarea") && content.includes("Enter details for"));

    if (isAccidentalStub) {
      violations.push(`ACCIDENTAL_STUB_DETECTED: Route '${pagePlan.route}' (${relPath}) is a placeholder stub or fallback mock rather than an implemented experience.`);
    }

    // 2. Forbidden template / Generic secondary page collapse detection
    let hasForbiddenPattern = false;
    for (const forbidden of pagePlan.forbiddenPatterns) {
      if (forbidden === "search bar" || forbidden === "search input") {
        if (/<input[^>]*\b(?:search|placeholder=[^>]*search)[^>]*>/i.test(content) || /searchQuery|searchTerm|setSearchQuery|setSearchTerm/i.test(content)) {
          hasForbiddenPattern = true;
          violations.push(`FORBIDDEN_PATTERN: Route '${pagePlan.route}' collapsed into a search bar, which is forbidden for '${pagePlan.pageRole}'.`);
        }
      }
      if (forbidden === "filter chips" || forbidden === "filter buttons") {
        if (/statusFilter|setStatusFilter|filter(?:Term|State|Category|Mat)?\s*===|set(?:Material)?Filter|activeFilter|filter-(?:btn|button|pill)|filter-buttons/i.test(content)) {
          hasForbiddenPattern = true;
          violations.push(`FORBIDDEN_PATTERN: Route '${pagePlan.route}' collapsed into filter buttons, which is forbidden for '${pagePlan.pageRole}'.`);
        }
      }
      if (forbidden === "card grid" || forbidden === "generic card directory") {
        const isMasterDetail = /col-span-\d/i.test(content) && /selected[A-Za-z]|active[A-Za-z]/i.test(content);
        const cardContainers = (content.match(/<(?:div|article)[^>]*\b(?:card|rounded-2xl|rounded-xl|border-amber|shadow-md)[^>]*>/gi) || []).length;
        const hasGrid = /grid-cols-2|grid-cols-3|grid-cols-4|card-grid|grid-cards/i.test(content);
        if (hasGrid && cardContainers >= 4 && !isMasterDetail) {
          hasForbiddenPattern = true;
          violations.push(`FORBIDDEN_PATTERN: Route '${pagePlan.route}' collapsed into a generic card grid, which is forbidden for '${pagePlan.pageRole}'.`);
        }
      }
      if (forbidden === "crud forms") {
        const isRichConsole =
          (/telemetry|inspector|avionics|flight|radar|hud|cockpit|gauge|stream|airframe/i.test(content) && content.length > 2000) ||
          (/col-span-\d/i.test(content) && /selected[A-Za-z]|active[A-Za-z]/i.test(content));

        if (!isRichConsole && /<form[^>]*onSubmit/i.test(content) && /newTitle|newAuthor|newContent|newName|newRecord|Add\s+(?:Record|Entry|Row|Item|Post|Article)\b/i.test(content)) {
          hasForbiddenPattern = true;
          violations.push(`FORBIDDEN_PATTERN: Route '${pagePlan.route}' rendered a generic CRUD creation form, which is forbidden for '${pagePlan.pageRole}'.`);
        }
      }
    }

    // 3. Meaningful interaction check
    const hasMeaningfulInteraction =
      /onClick|onChange|onSelect|set[A-Z]\w+|useRef|useState|useEffect/i.test(content);
    if (!hasMeaningfulInteraction) {
      violations.push(`MISSING_INTERACTION: Route '${pagePlan.route}' contains zero interactive hooks, state variables, or event handlers.`);
    }

    // 4. Specialized capability requirement
    let specializedPresent = true;
    for (const reqCap of pagePlan.requiredCapabilities) {
      if (reqCap === "3d-webgl-canvas" || reqCap === "3d-model-rotator" || reqCap === "3d-avatar-stage") {
        if (!/<canvas|WebGL|Three|__AEGIS_EXPERIENCE__|turntable|companion-plinth|avatar-stage|avatar-turntable|character-stage/i.test(content)) {
          // If it's a character stage with active companion selector and voice clips, accept it
          if (reqCap === "3d-avatar-stage" && /selectedCharacter|activeAvatar/i.test(content) && /voice|audio|commune|audition/i.test(content)) {
            // Satisfies character spotlight contract
          } else {
            specializedPresent = false;
            violations.push(`MISSING_CAPABILITY: Route '${pagePlan.route}' requires '${reqCap}' but no WebGL canvas or 3D controller was detected.`);
          }
        }
      }
      if (reqCap === "interactive-map-canvas") {
        if (!/<canvas|<svg|leaflet|mapbox|waypoint|spatial-map|cartographic|world-map|biome-map/i.test(content)) {
          specializedPresent = false;
          violations.push(`MISSING_CAPABILITY: Route '${pagePlan.route}' requires '${reqCap}' but no interactive map canvas or vector terrain was detected.`);
        }
      }
      if (reqCap === "web-audio-synth" || reqCap === "audio-visualizer-canvas") {
        if (!/AudioContext|audio|sound|play|synth|frequency|oscillator|__AEGIS_EXPERIENCE__/i.test(content)) {
          specializedPresent = false;
          violations.push(`MISSING_CAPABILITY: Route '${pagePlan.route}' requires '${reqCap}' but no audio controller or synthesis logic was detected.`);
        }
      }
      if (reqCap === "scroll-chapter-controller" || reqCap === "scroll-driven-storytelling") {
        if (!/scroll|data-scene|data-chapter|progress|parallax|__AEGIS_EXPERIENCE__/i.test(content)) {
          specializedPresent = false;
          violations.push(`MISSING_CAPABILITY: Route '${pagePlan.route}' requires '${reqCap}' but no scroll-linked narrative state was detected.`);
        }
      }
      if (reqCap === "destination-explorer" || reqCap === "regional-guide-drawer") {
        if (!/destination|region|terroir|atlas|market|dining|producer/i.test(content)) {
          specializedPresent = false;
          violations.push(`MISSING_CAPABILITY: Route '${pagePlan.route}' requires '${reqCap}' but no regional destination exploration logic was detected.`);
        }
      }
      if (reqCap === "recipe-scaler" || reqCap === "cooking-mode-stepper") {
        if (!/servings|scale|serving|multiplier|ingredients|recipe|step|cooking/i.test(content)) {
          specializedPresent = false;
          violations.push(`MISSING_CAPABILITY: Route '${pagePlan.route}' requires '${reqCap}' but no recipe scaling or cooking mode logic was detected.`);
        }
      }
      if (reqCap === "collection-folder-manager" || reqCap === "discovery-bookmark-hub") {
        if (!/folder|collection|saved|bookmark|favorite/i.test(content)) {
          specializedPresent = false;
          violations.push(`MISSING_CAPABILITY: Route '${pagePlan.route}' requires '${reqCap}' but no collection folder or bookmark hub logic was detected.`);
        }
      }
      if (reqCap === "interactive-itinerary-builder" || reqCap === "day-schedule-timeline") {
        if (!/itinerary|schedule|stop|timeline|day|journey/i.test(content)) {
          specializedPresent = false;
          violations.push(`MISSING_CAPABILITY: Route '${pagePlan.route}' requires '${reqCap}' but no itinerary builder or day timeline logic was detected.`);
        }
      }
      if (reqCap === "suite-showcase" || reqCap === "room-storytelling" || reqCap === "cinematic-hero") {
        if (!/suite|room|villa|amenit|photo|stay|capacity|sqft|sqm|price|night|hero|luxury|velora|curat/i.test(content)) {
          specializedPresent = false;
          violations.push(`MISSING_CAPABILITY: Route '${pagePlan.route}' requires '${reqCap}' but no suite showcase or room storytelling logic was detected.`);
        }
      }
      if (reqCap === "interactive-booking" || reqCap === "availability-calendar") {
        if (!/booking|reserve|check-in|check-out|availability|date|guest|stay|calendar|rate|price/i.test(content)) {
          specializedPresent = false;
          violations.push(`MISSING_CAPABILITY: Route '${pagePlan.route}' requires '${reqCap}' but no interactive room availability or reservation logic was detected.`);
        }
      }
      if (reqCap === "stay-planner" || reqCap === "itinerary-timeline") {
        if (!/itinerary|planner|stay|day|schedule|timeline|stop|dining|spa|excursion/i.test(content)) {
          specializedPresent = false;
          violations.push(`MISSING_CAPABILITY: Route '${pagePlan.route}' requires '${reqCap}' but no stay planner or itinerary timeline logic was detected.`);
        }
      }
      if (reqCap === "guest-preferences" || reqCap === "in-suite-curator") {
        if (!/preference|pillow|temperature|beverage|dietary|in-suite|stocking|fragrance|lighting/i.test(content)) {
          specializedPresent = false;
          violations.push(`MISSING_CAPABILITY: Route '${pagePlan.route}' requires '${reqCap}' but no guest preferences or in-suite curation logic was detected.`);
        }
      }
      if (reqCap === "amenity-showcase" || reqCap === "spa-menu") {
        if (!/amenit|spa|wellness|treatment|pool|thermal|sanctuary|facility/i.test(content)) {
          specializedPresent = false;
          violations.push(`MISSING_CAPABILITY: Route '${pagePlan.route}' requires '${reqCap}' but no property amenity or spa menu logic was detected.`);
        }
      }
      if (reqCap === "dining-showcase" || reqCap === "culinary-menu") {
        if (!/dining|restaurant|menu|chef|culinary|gastronomy|sommelier|table/i.test(content)) {
          specializedPresent = false;
          violations.push(`MISSING_CAPABILITY: Route '${pagePlan.route}' requires '${reqCap}' but no fine dining or culinary menu logic was detected.`);
        }
      }
      if (reqCap === "experience-curator" || reqCap === "concierge-guide") {
        if (!/experience|excursion|local|activity|charter|guide|tour|concierge/i.test(content)) {
          specializedPresent = false;
          violations.push(`MISSING_CAPABILITY: Route '${pagePlan.route}' requires '${reqCap}' but no local experience or concierge guide logic was detected.`);
        }
      }
      if (reqCap === "concierge-chat" || reqCap === "guest-services") {
        if (!/concierge|chat|message|assistant|request|service/i.test(content)) {
          specializedPresent = false;
          violations.push(`MISSING_CAPABILITY: Route '${pagePlan.route}' requires '${reqCap}' but no virtual concierge chat logic was detected.`);
        }
      }
    }

    const checks: RouteAuditChecklist = {
      fileFound: true,
      focalElementPresent: !isAccidentalStub,
      noForbiddenTemplates: !hasForbiddenPattern,
      meaningfulInteraction: hasMeaningfulInteraction,
      notAccidentalStub: !isAccidentalStub,
      specializedCapabilityPresent: specializedPresent,
    };

    const status = violations.length === 0 ? "PASS" : "FAIL";

    return {
      route: pagePlan.route,
      pageRole: pagePlan.pageRole,
      status,
      filePath: relPath,
      checks,
      violations,
    };
  }

  private static resolveRouteFile(projectRoot: string, files: string[], route: string): string | null {
    const cleanRoute = route === "/" ? "home" : route.replace(/^\//, "").toLowerCase();
    const routeParts = cleanRoute.split(/[-_/]+/);

    // 1. Direct exact match by file name in pages/ (e.g. JourneyProgressScrollPage for /journey-progress-scroll)
    for (const f of files) {
      const base = f.toLowerCase();
      if (!base.includes("/pages/") && !base.includes("\\pages\\") && !base.includes("/features/") && !base.includes("\\features\\")) {
        continue;
      }
      if (route === "/" && (base.includes("homepage") || base.includes("home.") || base.includes("journalentriespage") || base.includes("worldstage"))) {
        return f;
      }
      if (cleanRoute.length > 2 && base.includes(cleanRoute)) {
        return f;
      }
    }

    // 2. Authoritative check in routes.tsx mapping (prioritize routes.tsx over App.tsx)
    const routesFile =
      files.find(f => f.replace(/\\/g, "/").endsWith("/routes.tsx") || f.replace(/\\/g, "/").endsWith("/routes.jsx")) ||
      files.find(f => f.replace(/\\/g, "/").endsWith("/App.tsx"));
    if (routesFile) {
      try {
        const routesContent = readFileSync(routesFile, "utf8");
        // Look for path="..." element={<Comp />}
        const routeRegex = new RegExp(`path=["']${route}["'][^>]*element={<([A-Za-z0-9]+)`, "i");
        const match = routesContent.match(routeRegex);
        if (match && match[1]) {
          const compIdentifier = match[1];
          const compName = compIdentifier.toLowerCase();
          const cleanComp = compName.replace(/page$/, "");

          // Check direct import path in routesFile (e.g., import * as QuestPageModule from "./features/quest/index")
          const importMatch = routesContent.match(new RegExp(`import\\s+(?:\\*\\s+as\\s+)?(?:${compIdentifier}|${compIdentifier}Module)\\s+from\\s+["']([^"']+)["']`, "i"));
          if (importMatch && importMatch[1]) {
            const rawImport = importMatch[1].replace(/^\.\//, "").replace(/\.[jt]sx?$/, "").toLowerCase();
            const targetByImport = files.find(f => f.replace(/\\/g, "/").toLowerCase().includes(rawImport));
            if (targetByImport) return targetByImport;
          }

          const target = files.find(f => {
            const norm = f.replace(/\\/g, "/").toLowerCase();
            return norm.includes(compName) || (cleanComp.length > 2 && (norm.includes("/" + cleanComp + "/") || norm.includes("/" + cleanComp + ".")));
          });
          if (target) return target;
        }
      } catch {}
    }

    // 3. Fallback: significant token match (e.g. "characters", "soundboard", "quest")
    const candidates: Array<{ file: string; score: number }> = [];
    for (const f of files) {
      const base = f.toLowerCase();
      if (!base.includes("/pages/") && !base.includes("\\pages\\") && !base.includes("/features/") && !base.includes("\\features\\")) {
        continue;
      }
      let score = 0;
      for (const part of routeParts) {
        if (part.length > 3 && base.includes(part)) {
          score += part.length;
        }
      }
      if (score > 0) {
        // Boost page components and penalize index CRUD forms
        if (base.endsWith("page.tsx") || base.endsWith("page.jsx")) score += 20;
        if (base.includes("/pages/") || base.includes("\\pages\\")) score += 15;
        if (base.endsWith("/index.tsx") || base.endsWith("\\index.tsx")) score -= 10;
        candidates.push({ file: f, score });
      }
    }
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      return candidates[0].file;
    }


    return null;
  }

  private static collectSourceFiles(dir: string): string[] {
    const results: string[] = [];
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        if (entry !== "node_modules" && entry !== "dist" && entry !== ".git" && entry !== "__tests__") {
          results.push(...this.collectSourceFiles(fullPath));
        }
      } else if (
        (entry.endsWith(".tsx") || entry.endsWith(".jsx") || entry.endsWith(".ts")) &&
        !entry.endsWith(".d.ts") &&
        !entry.endsWith(".test.tsx") &&
        !entry.endsWith(".test.ts")
      ) {
        results.push(fullPath);
      }
    }
    return results;
  }
}

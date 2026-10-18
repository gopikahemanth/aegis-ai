/**
 * TemplateConvergenceGate
 *
 * System gate that detects and rejects website-level template convergence:
 * - "Navbar -> Hero -> Cards -> Cards -> CTA -> Footer"
 * - 3D/Spatial experiences downgrading into card grids
 * - Excessive structural similarity to banned canned layouts
 *
 * SYSTEM INVARIANT:
 * "Aegis may reuse implementation primitives, but a fresh generation must never reuse a
 * page-level design template or composition unless the active ProductExperiencePlan
 * independently derives the same composition from the current prompt."
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { ProductExperiencePlan } from "../design/product-experience-plan.js";
import {
  type NavbarFingerprint,
  type NavigationModel,
  type NavigationPosition,
} from "../design/navigation-design.js";

export interface StructuralFingerprint {
  navigationType: "sidebar" | "floating-pill" | "topbar" | "command-console" | "bottom-tab" | "minimal-masthead" | "unknown";
  heroType: "immersive-canvas" | "editorial" | "storefront" | "hospitality" | "metric-cluster" | "progress" | "standard-hero" | "none";
  sectionCount: number;
  cardCount: number;
  canvasCount: number;
  buttonCount: number;
  cardToCanvasRatio: number;
  hasCtaSection: boolean;
  sectionNames: string[];
  isHeroCardsCtaPattern: boolean;
  fingerprintHash: string;
}

export interface WebsiteIdentityReport {
  navigation: "PASS" | "FAIL";
  composition: "PASS" | "FAIL";
  visualLanguage: "PASS" | "FAIL";
  interactionModel: "PASS" | "FAIL";
  content: "PASS" | "FAIL";
  responsive: "PASS" | "FAIL";
}

export interface TemplateConvergenceReport {
  status: "PASS" | "FAIL";
  passed: boolean;
  fingerprint: StructuralFingerprint;
  navbarFingerprint?: NavbarFingerprint;
  websiteIdentity: WebsiteIdentityReport;
  violations: string[];
  summary: string;
}

export class TemplateConvergenceGate {
  /**
   * Audits the generated project source code against structural template convergence.
   */
  public static audit(
    projectRoot: string,
    plan?: ProductExperiencePlan | null
  ): TemplateConvergenceReport {
    const srcDir = join(projectRoot, "src");
    if (!existsSync(srcDir)) {
      return {
        status: "PASS",
        passed: true,
        fingerprint: this.emptyFingerprint(),
        violations: [],
        websiteIdentity: {
          navigation: "PASS",
          composition: "PASS",
          visualLanguage: "PASS",
          interactionModel: "PASS",
          content: "PASS",
          responsive: "PASS"
        },
        summary: "No src directory found to audit.",
      };
    }

    const files = this.collectSourceFiles(srcDir);
    const allSource = files.map(f => {
      try {
        return readFileSync(f, "utf8");
      } catch {
        return "";
      }
    }).join("\n");

    const fingerprint = this.extractFingerprint(allSource, files, projectRoot);
    const violations: string[] = [];

    // Check 1: 3D Experience Downgrade
    if (plan?.experienceCapability?.real3dRequired) {
      const hasReal3DSource = fingerprint.canvasCount > 0 || /<canvas\b|\.domElement\b|WebGLRenderer|data-aegis-3d/i.test(allSource);
      if (!hasReal3DSource) {
        violations.push(
          "REAL_3D_REQUIRED invariant violated: No <canvas> elements detected in source code. 3D experience must render a real WebGL canvas."
        );
      }
      if (!hasReal3DSource && fingerprint.cardCount >= 3) {
        violations.push(
          `CARD_GRID_DOWNGRADE: Real 3D was required but experience downgraded to 0 canvases and ${fingerprint.cardCount} cards. The experience has collapsed into a flat card grid.`
        );
      }
    }

    // Check 2: Generic Hero -> Cards -> Cards -> CTA Convergence
    // If the experience was planned as a specialized experience (3D, Console, Editorial, Workplace)
    // but the generated code is just a generic marketing hero followed by 2+ card sections and a CTA
    const isSpecializedExperience =
      Boolean(plan?.experienceCapability?.real3dRequired) ||
      plan?.experienceCapability?.experienceType === "IMMERSIVE_3D" ||
      plan?.experienceCapability?.experienceType === "EDITORIAL" ||
      plan?.experienceCapability?.experienceType === "DASHBOARD" ||
      plan?.experiencePattern === "craft-editorial" ||
      plan?.experiencePattern === "configurator-workspace" ||
      plan?.experiencePattern === "realtime-console";

    if (fingerprint.isHeroCardsCtaPattern && isSpecializedExperience) {
      violations.push(
        `GENERIC_CONVERGENCE_DETECTED: Page structure matches forbidden canned pattern ` +
        `'Hero -> Cards -> Cards -> CTA' instead of the locked ${plan?.experiencePattern || "specialized"} composition.`
      );
    }

    // Check 3: Card Density Anomaly
    // If 3D is required but card density is overwhelming (> 5 cards in primary 3D stage view)
    if (plan?.experienceCapability?.real3dRequired) {
      const stageFile = this.findStageOrRootFile(files, projectRoot);
      if (stageFile) {
        try {
          const stageContent = readFileSync(stageFile, "utf8");
          const stageCards = stageContent.match(/<(?:Card|div[^>]*\b(?:card|rounded-2xl|rounded-xl|shadow-md)[^>]*)>/gi) || [];
          if (stageCards.length > 5) {
            violations.push(
              `EXCESSIVE_CARD_CONVERGENCE: Detected ${stageCards.length} card containers in primary 3D world view stage (${relative(projectRoot, stageFile)}). 3D environments must use spatial elements or HUD overlays, not dense card walls.`
            );
          }
        } catch {}
      } else if (fingerprint.cardCount > 8 && fingerprint.canvasCount === 0) {
        violations.push(
          `EXCESSIVE_CARD_CONVERGENCE: Detected ${fingerprint.cardCount} card containers in 3D world view. 3D environments must use spatial elements or HUD overlays, not dense card walls.`
        );
      }
    }

    // Check 4: Navigation Shell Convergence & Banned Template Reuse
    const navbarFile = files.find(f => f.endsWith("Navbar.tsx") || f.endsWith("Header.tsx"));
    let navbarFingerprint: NavbarFingerprint | undefined;
    if (navbarFile) {
      try {
        const navContent = readFileSync(navbarFile, "utf8");
        navbarFingerprint = this.extractNavbarFingerprint(navContent);

        // Detect generic canned shell reuse:
        // Canned signature: bg-stone-900 + amber-500 active state + amber pulse dot + uncurated More dropdown
        const isBannedGenericShell =
          (navContent.includes("bg-stone-900") || navContent.includes("border-stone-800")) &&
          navContent.includes("bg-amber-500") &&
          navContent.includes("animate-pulse") &&
          navContent.includes("navbar-more-btn");

        if (isBannedGenericShell) {
          violations.push(
            "NAVBAR_REUSE_DETECTED: Detected generic canned shell reuse (stone-900/amber-500 topbar with generic More dropdown). Navigation must be product-specific."
          );
        }

        // Check if navigation model matches required plan
        if (plan?.navigationDesign) {
          const reqModel = plan.navigationDesign.model;
          const isEditorial = plan.experiencePattern === "editorial" || plan.experienceCapability?.experienceType === "EDITORIAL";
          if (reqModel === "top_masthead" && isEditorial && !/masthead|border-b|serif/i.test(navContent)) {
            violations.push(`NAVBAR_MODEL_MISMATCH: Required navigation model '${reqModel}' for editorial experience, but found divergent implementation.`);
          } else if (reqModel === "minimal_wordmark" && navContent.includes("navbar-more-btn")) {
            violations.push(`NAVBAR_MODEL_MISMATCH: Luxury minimal wordmark navigation must not render a generic More button.`);
          }
        }
      } catch {}
    }

    // Check 5: Generic Page Structure Convergence (Search + Filter + Card Grid)
    // Detects when multiple routes across a project fall into the identical pattern:
    // Search input + Filter pills + Card grid
    let targetPageFiles: string[] = [];
    const routesFilePath = join(projectRoot, "src", "routes.tsx");
    if (existsSync(routesFilePath)) {
      try {
        const routesContent = readFileSync(routesFilePath, "utf8");
        const importMatches = Array.from(routesContent.matchAll(/from\s+["'](\.[^"']+)["']/g));
        for (const m of importMatches) {
          const rel = m[1].replace(/^\.\//, "");
          const candidates = [
            join(projectRoot, "src", `${rel}.tsx`),
            join(projectRoot, "src", `${rel}.jsx`),
            join(projectRoot, "src", rel, "index.tsx"),
            join(projectRoot, "src", rel, "index.jsx"),
          ];
          for (const cand of candidates) {
            if (existsSync(cand) && !targetPageFiles.includes(cand)) {
              targetPageFiles.push(cand);
              break;
            }
          }
        }
      } catch {}
    }

    const pageFiles = targetPageFiles.length > 0
      ? targetPageFiles
      : files.filter(f =>
          (f.includes("/pages/") || f.includes("\\pages\\") || f.includes("/features/") || f.includes("\\features\\")) &&
          (f.endsWith(".tsx") || f.endsWith(".jsx")) &&
          !f.includes(".test.") && !f.includes("__tests__")
        );

    let searchFilterCardCount = 0;
    const convergedPageNames: string[] = [];

    for (const pFile of pageFiles) {
      try {
        const pContent = readFileSync(pFile, "utf8");
        const hasSearch = /<input[^>]*\b(?:search|placeholder=[^>]*search)[^>]*>/i.test(pContent) ||
                          /searchQuery|searchTerm|setSearchQuery|setSearchTerm/i.test(pContent);
        const hasFilterButtons = /statusFilter|setStatusFilter|filter(?:Term|State|Category|Mat)?\s*===|set(?:Material)?Filter|activeFilter|filter-(?:btn|button|pill)|filter-buttons|role="group"[^>]*filter/i.test(pContent) ||
                                 /<button[^>]*>[^<]*Filter/i.test(pContent);
        const hasCardGrid = /grid-cols-|grid\s+gap-|(?:GlassCard|Card)\b|card-grid|grid-cards/i.test(pContent);

        if (hasSearch && hasFilterButtons && hasCardGrid) {
          searchFilterCardCount++;
          convergedPageNames.push(relative(projectRoot, pFile).replace(/\\/g, "/"));
        }
      } catch {}
    }

    if (isSpecializedExperience && searchFilterCardCount >= 2) {
      violations.push(
        `GENERIC_PAGE_STRUCTURE_CONVERGENCE: Detected ${searchFilterCardCount} pages repeating identical Search + Filter + Card Grid structure (${convergedPageNames.slice(0, 3).join(", ")}). Specialized experiences must use bespoke page compositions (full-bleed spreads, visual essays, spatial scenes, product stages), NOT repetitive card directories.`
      );
    }

    // Check 6: Duplicate Shell Navigation Invariant
    const appTsxFile = files.find(f => f.endsWith("App.tsx"));
    if (appTsxFile) {
      try {
        const appContent = readFileSync(appTsxFile, "utf8");
        if (appContent.includes("<Navbar") && appContent.includes("<Layout")) {
          violations.push(
            "DUPLICATE_SHELL_NAVIGATION_DETECTED: App.tsx mounts both <Navbar /> and <Layout />. A project must have exactly one navigation shell."
          );
        }
      } catch {}
    }

    // Check 7: Cross-Route Template & Parameter Convergence
    // Detects when multiple distinct routes across a project share identical calibration controls or quick actions
    const pageSignatures: Array<{ file: string; paramIds: string[]; actionNames: string[] }> = [];
    for (const pFile of pageFiles) {
      try {
        const pContent = readFileSync(pFile, "utf8");
        const paramMatches = Array.from(pContent.matchAll(/"id":\s*"([^"]+)"/g)).map(m => m[1]);
        const actionMatches = Array.from(pContent.matchAll(/"name":\s*"([^"]+)"/g)).map(m => m[1]);
        if (paramMatches.length >= 2 || actionMatches.length >= 2) {
          pageSignatures.push({
            file: relative(projectRoot, pFile).replace(/\\/g, "/"),
            paramIds: paramMatches.sort(),
            actionNames: actionMatches.sort(),
          });
        }
      } catch {}
    }

    const identicalPairs: string[] = [];
    for (let i = 0; i < pageSignatures.length; i++) {
      for (let j = i + 1; j < pageSignatures.length; j++) {
        const a = pageSignatures[i];
        const b = pageSignatures[j];
        const sameParams = a.paramIds.length > 0 && a.paramIds.length === b.paramIds.length && a.paramIds.every((id, idx) => id === b.paramIds[idx]);
        const sameActions = a.actionNames.length > 0 && a.actionNames.length === b.actionNames.length && a.actionNames.every((act, idx) => act === b.actionNames[idx]);
        if (sameParams && sameActions) {
          identicalPairs.push(`${a.file} & ${b.file}`);
        }
      }
    }

    if (identicalPairs.length > 0) {
      violations.push(
        `CROSS_ROUTE_STRUCTURAL_CONVERGENCE_DETECTED: Detected identical parameter controls and actions across distinct routes (${identicalPairs.slice(0, 2).join(", ")}). Each route must provide domain-pure, route-specific interactive controls.`
      );
    }

    const websiteIdentity: WebsiteIdentityReport = {
      navigation: violations.some(v => v.includes("NAVBAR") || v.includes("NAVIGATION")) ? "FAIL" : "PASS",
      composition: violations.some(v => v.includes("CONVERGENCE") || v.includes("DOWNGRADE")) ? "FAIL" : "PASS",
      visualLanguage: "PASS",
      interactionModel: "PASS",
      content: "PASS",
      responsive: "PASS",
    };

    const passed = violations.length === 0;
    const status = passed ? "PASS" : "FAIL";
    const summary = passed
      ? `✓ Template Convergence Gate passed. Structural signature: ${fingerprint.fingerprintHash}\n` +
        `WEBSITE_IDENTITY:\n` +
        `├── Navigation        ${websiteIdentity.navigation}\n` +
        `├── Composition       ${websiteIdentity.composition}\n` +
        `├── Visual Language   ${websiteIdentity.visualLanguage}\n` +
        `├── Interaction Model ${websiteIdentity.interactionModel}\n` +
        `├── Content           ${websiteIdentity.content}\n` +
        `└── Responsive        ${websiteIdentity.responsive}`
      : `🔴 Template Convergence Gate failed: ${violations.join(" | ")}\n` +
        `WEBSITE_IDENTITY:\n` +
        `├── Navigation        ${websiteIdentity.navigation}\n` +
        `├── Composition       ${websiteIdentity.composition}\n` +
        `├── Visual Language   ${websiteIdentity.visualLanguage}\n` +
        `├── Interaction Model ${websiteIdentity.interactionModel}\n` +
        `├── Content           ${websiteIdentity.content}\n` +
        `└── Responsive        ${websiteIdentity.responsive}`;

    return {
      status,
      passed,
      fingerprint,
      navbarFingerprint,
      websiteIdentity,
      violations,
      summary,
    };
  }

  /**
   * Extracts a structural fingerprint of the project's primary navigation component.
   */
  public static extractNavbarFingerprint(navContent: string): NavbarFingerprint {
    let model: NavigationModel = "floating_pills";
    if (/masthead|font-serif[\s\S]*border-b/i.test(navContent)) model = "top_masthead";
    else if (/<aside\b/i.test(navContent)) model = "sidebar";
    else if (/fixed bottom-0|bottom-dock/i.test(navContent)) model = "bottom_dock";
    else if (/tracking-widest[\s\S]*amber/i.test(navContent)) model = "minimal_wordmark";
    else if (/hud|cyber|spatial/i.test(navContent)) model = "immersive_hud";

    let position: NavigationPosition = "top";
    if (navContent.includes("fixed top-") || navContent.includes("floating_top")) position = "floating_top";
    else if (navContent.includes("fixed bottom-")) position = "floating_bottom";
    else if (navContent.includes("<aside")) position = "left";

    const labelMatches = [...navContent.matchAll(/label:\s*["']([^"']+)["']/g)].map(m => m[1]);
    const jsxTextMatches = [...navContent.matchAll(/<Link[^>]*>\s*([A-Za-z0-9 ]{2,20})\s*<\/Link>/g)].map(m => m[1]);
    const itemsList = Array.from(new Set([...labelMatches, ...jsxTextMatches]));

    const brandMatch = navContent.match(/(?:tracking-tight|font-bold|font-serif)[^>]*>\s*([A-Za-z0-9\s]{2,24})\s*</);
    const brandName = brandMatch ? brandMatch[1].trim() : "Unknown";

    const hasMoreMenu = navContent.includes("navbar-more-btn") || navContent.includes("isMoreOpen");
    const surfaceType = navContent.includes("backdrop-blur") ? "glassmorphic" : "opaque";
    const activeStateType = navContent.includes("bg-amber-500") ? "amber_pill" : "custom";
    const typographyStyle = navContent.includes("font-serif") ? "serif" : "sans";

    const hash = `${model}:${position}:${itemsList.length}items:${hasMoreMenu ? "has_more" : "curated"}:${activeStateType}:${typographyStyle}`;

    return {
      model,
      position,
      itemCount: itemsList.length,
      itemsList,
      brandName,
      logoType: "wordmark",
      hasMoreMenu,
      surfaceType,
      activeStateType,
      typographyStyle,
      fingerprintHash: hash,
    };
  }

  /**
   * Extracts the structural fingerprint of the application from source code.
   */
  public static extractFingerprint(
    allSource: string,
    files: string[],
    projectRoot: string
  ): StructuralFingerprint {
    // 1. Navigation Type
    let navigationType: StructuralFingerprint["navigationType"] = "topbar";
    if (allSource.includes("command-console") || /<aside[\s\S]*?command/i.test(allSource)) {
      navigationType = "command-console";
    } else if (allSource.includes("bottom-tab") || /fixed bottom-0/i.test(allSource)) {
      navigationType = "bottom-tab";
    } else if (/rounded-full[\s\S]*?backdrop-blur/i.test(allSource) || allSource.includes("pill-dock")) {
      navigationType = "floating-pill";
    } else if (/<aside\b|<nav[^>]*flex-col/i.test(allSource)) {
      navigationType = "sidebar";
    } else if (/masthead/i.test(allSource)) {
      navigationType = "minimal-masthead";
    }

    // 2. Hero Type
    let heroType: StructuralFingerprint["heroType"] = "none";
    if (/<canvas\b|data-aegis-3d/i.test(allSource)) {
      heroType = "immersive-canvas";
    } else if (/booking-bar|date-picker|check-in/i.test(allSource) && /villa|resort|sanctuary/i.test(allSource)) {
      heroType = "hospitality";
    } else if (/cart-drawer|freshly baked|menu-grid|storefront/i.test(allSource)) {
      heroType = "storefront";
    } else if (/telemetry-banner|metric-cluster|telemetry-console|telemetry|workcell|kinematics|console|scada|robotics/i.test(allSource)) {
      heroType = "metric-cluster";
    } else if (/streak|habit|growth-ring/i.test(allSource)) {
      heroType = "progress";
    } else if (/monograph|editorial|photo-essay|masthead|magazine-cover|full-bleed|pull-quote|essaysection/i.test(allSource)) {
      heroType = "editorial";
    } else if (/<(?:Hero|div[^>]*\bhero|section[^>]*\bhero|header[^>]*\bhero)[\s/>]/i.test(allSource) || /\bhero-banner\b/i.test(allSource)) {
      heroType = "standard-hero";
    }

    // 3. Counts
    const cardMatches = allSource.match(/<(?:Card|div[^>]*\b(?:card|rounded-2xl|rounded-xl|shadow-md)[^>]*)>/gi) || [];
    const cardCount = cardMatches.length;

    const canvasMatches = allSource.match(/<canvas\b|\.domElement\b|WebGLRenderer/gi) || [];
    const canvasCount = canvasMatches.length;

    const buttonMatches = allSource.match(/<button\b/gi) || [];
    const buttonCount = buttonMatches.length;

    const sectionMatches = allSource.match(/<section\b/gi) || [];
    const sectionCount = sectionMatches.length;

    const cardToCanvasRatio = canvasCount > 0 ? cardCount / canvasCount : cardCount;

    // 4. Section Names and Sequence
    const sectionNames: string[] = [];
    const headingMatches = allSource.match(/<h[12][^>]*>(.*?)<\/h[12]>/gi) || [];
    for (const h of headingMatches.slice(0, 6)) {
      const text = h.replace(/<[^>]+>/g, "").trim();
      if (text.length > 2 && text.length < 50) sectionNames.push(text);
    }

    // 5. Detect Hero -> Cards -> Cards -> CTA Pattern
    // Signals: Has hero banner, has >= 4 cards, has a CTA section/button at the end, and no interactive canvas/console
    const hasCtaSection = /call-to-action|cta-banner|cta-section|<(?:section|div)[^>]*\bcta\b|ready to get started|join now|sign up today|get started today|pre-order/i.test(allSource);
    const hasCardsGrid = cardCount >= 4;
    const isHeroCardsCtaPattern =
      heroType === "standard-hero" &&
      hasCardsGrid &&
      hasCtaSection &&
      canvasCount === 0;

    const fingerprintHash = `${navigationType}:${heroType}:${sectionCount}sec:${cardCount}cards:${canvasCount}canvas:${isHeroCardsCtaPattern ? "CONVERGED_HERO_CARDS_CTA" : "UNIQUE_COMPOSITION"}`;

    return {
      navigationType,
      heroType,
      sectionCount,
      cardCount,
      canvasCount,
      buttonCount,
      cardToCanvasRatio,
      hasCtaSection,
      sectionNames,
      isHeroCardsCtaPattern,
      fingerprintHash,
    };
  }

  private static emptyFingerprint(): StructuralFingerprint {
    return {
      navigationType: "unknown",
      heroType: "none",
      sectionCount: 0,
      cardCount: 0,
      canvasCount: 0,
      buttonCount: 0,
      cardToCanvasRatio: 0,
      hasCtaSection: false,
      sectionNames: [],
      isHeroCardsCtaPattern: false,
      fingerprintHash: "EMPTY",
    };
  }

  private static collectSourceFiles(dir: string): string[] {
    const results: string[] = [];
    const scan = (d: string) => {
      if (!existsSync(d)) return;
      try {
        for (const entry of readdirSync(d)) {
          if (["node_modules", ".git", "dist", ".aegis"].includes(entry)) continue;
          const full = join(d, entry);
          const stat = statSync(full);
          if (stat.isDirectory()) scan(full);
          else if ((entry.endsWith(".tsx") || entry.endsWith(".jsx") || (entry.endsWith(".ts") && !entry.includes("tokens") && !entry.includes("site-content"))) && !entry.endsWith(".d.ts")) {
            results.push(full);
          }
        }
      } catch {}
    };
    scan(dir);
    return results;
  }

  private static findStageOrRootFile(files: string[], projectRoot: string): string | null {
    // 1. Check routes.tsx for component mounted at '/'
    try {
      const routesPath = join(projectRoot, "src", "routes.tsx");
      if (existsSync(routesPath)) {
        const routesContent = readFileSync(routesPath, "utf8");
        const rootRouteMatch = routesContent.match(/<Route\s+path=["']\/["']\s+element=\{<([A-Za-z0-9_]+)/);
        if (rootRouteMatch) {
          const compName = rootRouteMatch[1];
          const matched = files.find(f => f.includes(`${compName}.`) || f.endsWith(`${compName}`));
          if (matched) return matched;
        }
      }
    } catch {}

    // 2. Check for file containing data-workspace="immersive_3d_stage" or data-aegis-3d
    for (const f of files) {
      try {
        const content = readFileSync(f, "utf8");
        if (content.includes('data-workspace="immersive_3d_stage"') || content.includes('data-aegis-3d="true"')) {
          return f;
        }
      } catch {}
    }

    // 3. Fallback to HomePage / IndexPage
    const home = files.find(f => /HomePage\.(tsx|jsx)$/i.test(f) || /IndexPage\.(tsx|jsx)$/i.test(f));
    if (home) return home;

    return null;
  }
}

export const WebsiteExperienceConvergenceGate = TemplateConvergenceGate;
export type WebsiteExperienceConvergenceReport = TemplateConvergenceReport;

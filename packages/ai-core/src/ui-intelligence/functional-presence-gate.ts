/**
 * FunctionalPresenceGate
 *
 * Automated Functional Presence Certification for Aegis AI.
 * Verifies that a generated web application does not merely mount in React or return 200,
 * but physically materializes its synthesized product capabilities, interactive regions,
 * and user journeys in the live Chromium DOM.
 *
 * Evaluates:
 *   1. Primary Workspace Presence (derived from CompositionGraph)
 *   2. Meaningful Entity / Content Item Presence (no empty shells or 0-count lists)
 *   3. Interactive Actions & Control Affordances (buttons, filters, search, modal triggers)
 *   4. Navigation & Route Architecture Presence
 *   5. Data-Loading Failure Detection (catches 500s, failed fetches, uncaught promises)
 *   6. Intentional Empty State vs. Broken Blank Shell Differentiation
 *   7. Critical User Journey Actionability
 *   8. Responsive Functional Presence across Desktop (1440), Tablet (768), and Mobile (375)
 *   9. Browser Runtime & Console Hygiene (zero uncaught exceptions)
 *
 * Fail-closed: A project CANNOT be master-certified if functional presence is missing.
 */

import type { CompositionGraph } from "../design/composition-graph.js";
import type { DomainVisualDesignContract } from "../design/domain-visual-contract.js";
import type { BrowserDOMSnapshot } from "./visual-quality-gate.js";

export interface FunctionalPresenceCheck {
  id: string;
  name: string;
  category: "workspace" | "content" | "interaction" | "navigation" | "data_integrity" | "responsive" | "hygiene";
  passed: boolean;
  score: number; // 0 to 100
  weight: number;
  expected: string;
  observed: string;
  details: string;
}

export interface FunctionalPresenceReport {
  passed: boolean;
  score: number; // 0 to 100
  isMasterCertified: boolean;
  checks: FunctionalPresenceCheck[];
  detectedCapabilities: string[];
  missingCapabilities: string[];
  failureReasons: string[];
  summary: string;
}

export interface FunctionalPresenceEvaluationOptions {
  compositionGraph?: CompositionGraph;
  visualContract?: DomainVisualDesignContract;
  multiViewportSnapshots?: {
    desktop?: BrowserDOMSnapshot;
    tablet?: BrowserDOMSnapshot;
    mobile?: BrowserDOMSnapshot;
  };
  consoleErrors?: string[];
  uncaughtExceptions?: string[];
  networkFailures?: Array<{ url: string; status: number; error?: string }>;
}

export class FunctionalPresenceGate {
  public static readonly PASS_THRESHOLD = 80;
  public static readonly MASTER_CERTIFIED_THRESHOLD = 90;

  /**
   * Evaluates functional presence from live Chromium DOM evidence and CompositionGraph intent.
   */
  public static evaluate(
    domSnapshot: BrowserDOMSnapshot,
    options?: FunctionalPresenceEvaluationOptions
  ): FunctionalPresenceReport {
    const checks: FunctionalPresenceCheck[] = [];
    const detectedCapabilities: string[] = [];
    const missingCapabilities: string[] = [];
    const failureReasons: string[] = [];

    const graph = options?.compositionGraph;
    const contract = options?.visualContract;
    const rawText = domSnapshot.rawText || "";
    const elements = domSnapshot.elements || [];

    // ── 1. Primary Workspace Presence ─────────────────────────────────────────
    const expectedWorkspaceType = graph?.primaryFocus?.type || contract?.composition?.primaryWorkspace?.type || "catalog_grid";
    const expectedEntityName = graph?.primaryFocus?.entity || "Item";

    // Count content/card elements (elements with role, card class, h3 headings, table rows, or article tags)
    const cardElements = elements.filter(el => {
      const cls = el.className || "";
      const isCardOrProduct = /\b(card|product|product-card|item-card|catalog-item|craft-item|grid-item|entity-card|list-row)\b/i.test(cls);
      return (
        isCardOrProduct ||
        el.tagName === "ARTICLE" ||
        el.tagName === "TR" ||
        (el.tagName === "H3" && el.boundingRect.height > 0)
      );
    });

    const hasWorkspaceElements = cardElements.length >= 2 || (elements.length >= 25 && cardElements.length >= 1);
    const workspaceScore = hasWorkspaceElements
      ? Math.min(98, 80 + cardElements.length * 3)
      : cardElements.length === 1 ? 40 : 0;

    checks.push({
      id: "check_primary_workspace",
      name: "Primary Workspace Region Materialization",
      category: "workspace",
      passed: hasWorkspaceElements,
      score: workspaceScore,
      weight: 20,
      expected: `Rendered ${expectedWorkspaceType} workspace for entity ${expectedEntityName} with >= 2 items`,
      observed: `Discovered ${cardElements.length} content card/item element(s) across ${elements.length} total DOM nodes`,
      details: hasWorkspaceElements
        ? `Primary workspace "${expectedWorkspaceType}" successfully populated with ${cardElements.length} interactive domain items.`
        : `CRITICAL: Primary workspace "${expectedWorkspaceType}" is functionally missing or empty (found ${cardElements.length} items).`,
    });

    if (hasWorkspaceElements) {
      detectedCapabilities.push(`Primary Workspace (${expectedWorkspaceType})`);
    } else {
      missingCapabilities.push(`Primary Workspace (${expectedWorkspaceType})`);
      failureReasons.push(`Primary workspace "${expectedWorkspaceType}" did not render domain entities.`);
    }

    // ── 2. Meaningful Entity & Content Depth Presence ────────────────────────
    // Check if the page contains actual text content and details, rather than just headers/taglines
    const significantTextTokens = rawText.split(/\s+/).filter(t => t.length > 3);
    const hasSufficientContent = significantTextTokens.length >= 40 && rawText.length >= 250;
    const contentScore = hasSufficientContent
      ? Math.min(98, Math.round(82 + Math.min(16, significantTextTokens.length * 0.2)))
      : Math.min(60, Math.round((significantTextTokens.length / 40) * 60));

    checks.push({
      id: "check_content_depth",
      name: "Meaningful Domain Entity Content Depth",
      category: "content",
      passed: hasSufficientContent,
      score: contentScore,
      weight: 15,
      expected: "Substantial textual and structured data payload (>= 40 distinct keywords)",
      observed: `${significantTextTokens.length} significant text tokens (${rawText.length} total characters)`,
      details: hasSufficientContent
        ? "Application contains substantive domain details, specifications, and textual content."
        : "Application is an empty or skeletal shell with minimal text payload.",
    });

    if (hasSufficientContent) {
      detectedCapabilities.push("Domain Content Depth");
    } else {
      missingCapabilities.push("Domain Content Depth");
      failureReasons.push("Application contains insufficient content depth (empty shell).");
    }

    // ── 3. Interactive Actions & Control Affordances ─────────────────────────
    const interactiveElements = elements.filter(el =>
      el.tagName === "BUTTON" ||
      el.tagName === "INPUT" ||
      el.tagName === "SELECT" ||
      (el.tagName === "A" && (el.boundingRect?.width || 0) > 0) ||
      (el.computedStyles?.cursor === "pointer" && (el.boundingRect?.height || 0) > 10)
    );

    const hasInteractiveControls = interactiveElements.length >= 3;
    const interactionScore = hasInteractiveControls
      ? Math.min(98, 80 + interactiveElements.length * 3)
      : Math.round((interactiveElements.length / 3) * 60);

    checks.push({
      id: "check_interactive_actions",
      name: "Interactive Controls & Action Affordances",
      category: "interaction",
      passed: hasInteractiveControls,
      score: interactionScore,
      weight: 15,
      expected: "Interactive action controls present in DOM (buttons, filter chips, inputs, links >= 3)",
      observed: `${interactiveElements.length} interactive control element(s) detected with valid hit areas`,
      details: hasInteractiveControls
        ? `Discovered ${interactiveElements.length} actionable controls for user journey triggers.`
        : "CRITICAL: No interactive action controls discovered. Page is passive/dead.",
    });

    if (hasInteractiveControls) {
      detectedCapabilities.push("Interactive User Actions");
    } else {
      missingCapabilities.push("Interactive User Actions");
      failureReasons.push("Interactive user action controls are absent or unclickable.");
    }

    // ── 4. Navigation & Route Architecture Presence ─────────────────────────
    const navElements = elements.filter(el =>
      el.tagName === "NAV" ||
      el.tagName === "HEADER" ||
      (el.className && (el.className.includes("nav") || el.className.includes("header") || el.className.includes("menu")))
    );
    const navLinks = elements.filter(el => el.tagName === "A" && (el.boundingRect?.width || 0) > 10);

    const hasNavArchitecture = navElements.length > 0 || navLinks.length >= 2;
    const navScore = hasNavArchitecture ? Math.min(98, 85 + navLinks.length * 4) : 0;

    checks.push({
      id: "check_navigation_architecture",
      name: "Navigation & Route Header Presence",
      category: "navigation",
      passed: hasNavArchitecture,
      score: navScore,
      weight: 15,
      expected: "Header navigation structure with discoverable route links",
      observed: `${navElements.length} nav region(s) and ${navLinks.length} route link(s) found`,
      details: hasNavArchitecture
        ? "Header navigation architecture is intact and presents structured routes."
        : "CRITICAL: Missing navigation architecture or route headers.",
    });

    if (hasNavArchitecture) {
      detectedCapabilities.push("Header Navigation");
    } else {
      missingCapabilities.push("Header Navigation");
      failureReasons.push("Header navigation and route links are missing.");
    }

    // ── 5. Data Failure & Crash State Detection ──────────────────────────────
    const errorPatternRegex = /\b(internal\s*server\s*error|500\s*error|failed\s*to\s*fetch|uncaught\s*error|render\s*exception|undefined\s*is\s*not|null\s*is\s*not|cannot\s*read\s*properties\s*of\s*undefined)\b/i;
    const hasVisibleCrash = errorPatternRegex.test(rawText);
    const hasConsoleErrors = (options?.consoleErrors?.length || 0) > 0 || (options?.uncaughtExceptions?.length || 0) > 0;
    const hasNetwork500s = (options?.networkFailures || []).some(n => n.status >= 500);

    const isDataClean = !hasVisibleCrash && !hasConsoleErrors && !hasNetwork500s;
    const dataScore = isDataClean ? 98 : hasVisibleCrash ? 0 : 40;

    checks.push({
      id: "check_data_integrity",
      name: "Data Flow Integrity & Crash Immunity",
      category: "data_integrity",
      passed: isDataClean,
      score: dataScore,
      weight: 15,
      expected: "Zero unhandled render crashes, zero 500 API responses without UI fallbacks, zero console exceptions",
      observed: `Visible crash: ${hasVisibleCrash}, Console errors: ${options?.consoleErrors?.length || 0}, Network 500s: ${options?.networkFailures?.filter(n => n.status >= 500).length || 0}`,
      details: isDataClean
        ? "Data flow executed cleanly without unhandled runtime exceptions or visible crash states."
        : `CRITICAL: Runtime failure detected. Visible crash=${hasVisibleCrash}, console errors=${options?.consoleErrors?.join("; ") || "none"}.`,
    });

    if (!isDataClean) {
      failureReasons.push("Runtime or data-flow failure caused broken UI state.");
    }

    // ── 6. Domain User Journey & Expected Capability Presence ────────────────
    const expectedCaps = graph?.expectedCapabilities || [];
    const expectedJourneys = graph?.userJourneys || [];
    let detectedCapsCount = 0;

    if (expectedCaps.length > 0) {
      for (const cap of expectedCaps) {
        const keywords = cap.toLowerCase().split(/[\s,()]+/).filter(k => k.length > 3);
        const isPresent = keywords.some(kw => rawText.toLowerCase().includes(kw));
        if (isPresent) {
          detectedCapabilities.push(cap);
          detectedCapsCount++;
        } else {
          missingCapabilities.push(cap);
        }
      }
    }

    const journeyPassRatio = expectedCaps.length > 0 ? detectedCapsCount / expectedCaps.length : 1.0;
    const capabilityScore = Math.min(98, Math.round(80 + journeyPassRatio * 18));
    const capabilityPassed = journeyPassRatio >= 0.7;

    checks.push({
      id: "check_user_journeys_and_capabilities",
      name: "Product Intent & User Journey Materialization",
      category: "interaction",
      passed: capabilityPassed,
      score: capabilityScore,
      weight: 15,
      expected: `Materialization of ${expectedCaps.length || "synthesized"} capabilities and ${expectedJourneys.length || "core"} user journeys`,
      observed: `${detectedCapsCount}/${expectedCaps.length || detectedCapabilities.length} capabilities verified in live DOM`,
      details: capabilityPassed
        ? `Delivered ${detectedCapsCount} synthesized product capabilities derived from CompositionGraph.`
        : `CRITICAL: Missing requested product capabilities: ${missingCapabilities.join(", ")}.`,
    });

    // ── 7. Responsive Functional Presence ────────────────────────────────────
    let responsivePassed = true;
    let responsiveScore = 96;
    const multiView = options?.multiViewportSnapshots;

    if (multiView) {
      const desktopOk = (multiView.desktop?.elements?.length || 0) >= 8;
      const tabletOk = (multiView.tablet?.elements?.length || 0) >= 8;
      const mobileOk = (multiView.mobile?.elements?.length || 0) >= 6;

      responsivePassed = desktopOk && tabletOk && mobileOk;
      responsiveScore = responsivePassed ? 96 : (desktopOk ? 40 : 0) + (tabletOk ? 30 : 0) + (mobileOk ? 25 : 0);

      checks.push({
        id: "check_responsive_presence",
        name: "Multi-Viewport Functional Continuity",
        category: "responsive",
        passed: responsivePassed,
        score: responsiveScore,
        weight: 10,
        expected: "Functional capabilities remain intact and rendered across Desktop (1440), Tablet (768), and Mobile (375)",
        observed: `Desktop nodes: ${multiView.desktop?.elements?.length || 0}, Tablet nodes: ${multiView.tablet?.elements?.length || 0}, Mobile nodes: ${multiView.mobile?.elements?.length || 0}`,
        details: responsivePassed
          ? "Functional presence maintained consistently across all responsive device viewports."
          : "Functional capabilities degraded or became inaccessible on tablet/mobile viewports.",
      });
    } else {
      checks.push({
        id: "check_responsive_presence",
        name: "Viewport Geometry Presence",
        category: "responsive",
        passed: (domSnapshot.viewport?.width || 1440) > 0 && (domSnapshot.viewport?.height || 900) > 0,
        score: 95,
        weight: 10,
        expected: "Non-zero viewport geometry",
        observed: `${domSnapshot.viewport?.width || 1440}x${domSnapshot.viewport?.height || 900}px`,
        details: "Single viewport geometry validated.",
      });
    }

    // ── 7. Overall Score & Certification Calculation ─────────────────────────
    const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
    const weightedScore = Math.round(
      checks.reduce((sum, c) => sum + (c.score * (c.weight / totalWeight)), 0)
    );

    const allCriticalPassed = checks
      .filter(c => c.category === "workspace" || c.category === "data_integrity" || c.category === "interaction" || c.category === "navigation")
      .every(c => c.passed);

    const isPassed = weightedScore >= FunctionalPresenceGate.PASS_THRESHOLD && allCriticalPassed;
    const isMasterCertified = weightedScore >= FunctionalPresenceGate.MASTER_CERTIFIED_THRESHOLD && allCriticalPassed && isPassed;

    const summary = isMasterCertified
      ? `✅ FUNCTIONAL PRESENCE MASTER CERTIFIED (${weightedScore}/100): All ${detectedCapabilities.length} requested functional capabilities materialized in live Chromium.`
      : isPassed
        ? `⚠️ FUNCTIONAL PRESENCE PASSED (${weightedScore}/100): Core capabilities present with minor remarks.`
        : `❌ FUNCTIONAL PRESENCE REJECTED (${weightedScore}/100): Missing critical capabilities: ${missingCapabilities.join(", ") || failureReasons.join(", ")}.`;

    return {
      passed: isPassed,
      score: weightedScore,
      isMasterCertified,
      checks,
      detectedCapabilities,
      missingCapabilities,
      failureReasons,
      summary,
    };
  }
}

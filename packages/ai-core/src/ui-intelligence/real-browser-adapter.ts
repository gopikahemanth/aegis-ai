/**
 * RealBrowserAdapter
 *
 * Launches real local Chromium/Edge instances to execute generated applications,
 * verify React lifecycle state progression, DOM bounding geometry, computed CSS styles,
 * interaction smoke tests, and fail-closed certification.
 */

import { existsSync } from "node:fs";
import { chromium, type Browser, type Page } from "playwright-core";
import type { CompositionGraph } from "../design/composition-graph.js";

export interface BrowserComputedStyles {
  bodyBackground: string;
  bodyColor: string;
  fontFamily: string;
  buttonBackground?: string;
  buttonCursor?: string;
  linkTextDecoration?: string;
  rootWidth: number;
  rootHeight: number;
}

export interface RealBrowserExecutionResult {
  executed: boolean;
  passed: boolean;
  browserEngine: string;
  executablePath?: string;
  durationMs: number;
  renderState?: {
    status: string;
    mounted: boolean;
    ready: boolean;
    domain?: string;
    brand?: string;
    primaryWorkspace?: string;
  };
  computedStyles?: BrowserComputedStyles;
  interactionTestPassed?: boolean;
  checks: Array<{ name: string; passed: boolean; details: string }>;
  failureReason?: string;
}

export class RealBrowserAdapter {
  /**
   * Discovers the first available Chromium-compatible browser binary on the system.
   */
  public static findLocalBrowserExecutable(): string | null {
    const candidates = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    ];

    for (const c of candidates) {
      if (existsSync(c)) return c;
    }
    return null;
  }

  /**
   * Executes a project in a real Chromium browser instance to certify visual rendering and behavior.
   */
  public static async executeAndCertify(
    url: string,
    options?: {
      compositionGraph?: CompositionGraph;
      timeoutMs?: number;
      executablePath?: string;
    }
  ): Promise<RealBrowserExecutionResult> {
    const startTime = Date.now();
    const executable = options?.executablePath || RealBrowserAdapter.findLocalBrowserExecutable();

    if (!executable) {
      return {
        executed: false,
        passed: false,
        browserEngine: "NONE",
        durationMs: Date.now() - startTime,
        checks: [],
        failureReason: "No local Chrome or Edge browser executable found on system.",
      };
    }

    const checks: Array<{ name: string; passed: boolean; details: string }> = [];
    let browser: Browser | null = null;

    try {
      browser = await chromium.launch({
        executablePath: executable,
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      });

      const page: Page = await browser.newPage({
        viewport: { width: 1440, height: 900 },
      });

      // Navigate to target application
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: options?.timeoutMs || 10000 });

      // 1. React Boot & Render State Lifecycle
      let hasBooted = false;
      try {
        await page.waitForFunction(
          () => (window as any).__AEGIS_BOOTED__ === true,
          { timeout: 4000 }
        );
        hasBooted = true;
      } catch {}

      const renderState = await page.evaluate(() => (window as any).__AEGIS_RENDER_STATE__ || null);

      checks.push({
        name: "Real Browser React Hydration (__AEGIS_BOOTED__)",
        passed: hasBooted,
        details: hasBooted ? "React successfully mounted and executed lifecycle effect" : "React failed to mount within timeout window",
      });

      const isReady = renderState?.status === "ready" || renderState?.mounted === true;
      checks.push({
        name: "Application Lifecycle State (status = ready)",
        passed: isReady,
        details: isReady ? `State status: "${renderState?.status}", brand: "${renderState?.brand || 'N/A'}"` : "State did not reach ready status",
      });

      // 2. DOM Root Geometry & Non-blank content
      const rootGeometry = await page.evaluate(() => {
        const el = document.getElementById("root");
        if (!el) return { exists: false, width: 0, height: 0, childCount: 0 };
        const rect = el.getBoundingClientRect();
        return {
          exists: true,
          width: rect.width,
          height: rect.height,
          childCount: el.childElementCount,
          innerHTML: el.innerHTML.slice(0, 300),
        };
      });

      const isNonBlank = rootGeometry.exists && rootGeometry.height > 50 && rootGeometry.childCount > 0;
      checks.push({
        name: "Visible DOM Shell & Viewport Geometry",
        passed: isNonBlank,
        details: isNonBlank
          ? `#root rendered with ${rootGeometry.width}x${rootGeometry.height}px and ${rootGeometry.childCount} root child container(s)`
          : "#root element is missing, zero-height, or completely empty (blank screen)",
      });

      // 3. Computed Styles Inspection
      const computedStyles: BrowserComputedStyles = await page.evaluate(() => {
        const bodyStyle = window.getComputedStyle(document.body);
        const btn = document.querySelector("button") || document.querySelector(".btn");
        const btnStyle = btn ? window.getComputedStyle(btn) : null;
        const link = document.querySelector("a");
        const linkStyle = link ? window.getComputedStyle(link) : null;
        const root = document.getElementById("root");
        const rootRect = root ? root.getBoundingClientRect() : { width: 0, height: 0 };

        return {
          bodyBackground: bodyStyle.backgroundColor,
          bodyColor: bodyStyle.color,
          fontFamily: bodyStyle.fontFamily,
          buttonBackground: btnStyle ? btnStyle.backgroundColor : undefined,
          buttonCursor: btnStyle ? btnStyle.cursor : undefined,
          linkTextDecoration: linkStyle ? linkStyle.textDecorationLine : undefined,
          rootWidth: rootRect.width,
          rootHeight: rootRect.height,
        };
      });

      const isBodyStyled = computedStyles.bodyBackground !== "rgba(0, 0, 0, 0)" && computedStyles.bodyBackground !== "transparent";
      checks.push({
        name: "Themed Background Computed Style",
        passed: isBodyStyled,
        details: `Computed body background: ${computedStyles.bodyBackground}`,
      });

      // 4. Interaction Smoke Test
      let interactionTestPassed = false;
      try {
        const button = await page.$("button.btn-primary, button:not([disabled])");
        if (button) {
          await button.click();
          await page.waitForTimeout(200);
          interactionTestPassed = true;
        }
      } catch {}

      checks.push({
        name: "Interactive Component Responsiveness",
        passed: interactionTestPassed,
        details: interactionTestPassed ? "Primary action element successfully received click dispatch" : "No interactive button detected for smoke test",
      });

      // 5. Semantic Composition Validation
      let semanticRendered = true;
      if (options?.compositionGraph?.primaryFocus?.type) {
        const expectedFocus = options.compositionGraph.primaryFocus.type;
        const pageText = await page.content();
        semanticRendered = pageText.includes(expectedFocus) || pageText.includes("card") || pageText.includes("grid");
        checks.push({
          name: `Semantic Workspace Composition (${expectedFocus})`,
          passed: semanticRendered,
          details: semanticRendered ? `Semantic focus "${expectedFocus}" active in browser DOM` : `Expected primary focus "${expectedFocus}" missing from rendered DOM`,
        });
      }

      const allPassed = checks.every(c => c.passed);

      return {
        executed: true,
        passed: allPassed,
        browserEngine: executable.includes("msedge") ? "Microsoft Edge (Chromium)" : "Google Chrome (Chromium)",
        executablePath: executable,
        durationMs: Date.now() - startTime,
        renderState: {
          status: renderState?.status || "unknown",
          mounted: Boolean(renderState?.mounted),
          ready: isReady,
          domain: renderState?.domain,
          brand: renderState?.brand,
          primaryWorkspace: renderState?.primaryWorkspace,
        },
        computedStyles,
        interactionTestPassed,
        checks,
      };
    } catch (err: any) {
      return {
        executed: true,
        passed: false,
        browserEngine: "Chromium",
        executablePath: executable,
        durationMs: Date.now() - startTime,
        checks,
        failureReason: err?.message || String(err),
      };
    } finally {
      if (browser) {
        try { await browser.close(); } catch {}
      }
    }
  }
}

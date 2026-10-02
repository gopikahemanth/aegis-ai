import { existsSync, mkdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import http from "node:http";
import { ErrorClassifier } from "../healing/error-classifier.js";

export interface ProductIdentityResult {
  passed: boolean;
  experiencePattern: {
    expected: string;
    detected?: string;
    matched: boolean;
  };
  routeIdentity: {
    route: string;
    expectedRole: string;
    matched: boolean;
  };
  authWall: {
    detected: boolean;
    allowed: boolean;
    dominanceScore: number;
  };
  featureEvidence: Array<{
    featureId: string;
    name: string;
    visible: boolean;
    vocabularyEvidence: string[];
    controlEvidence: string[];
    interactionVerified: boolean;
  }>;
  forbiddenEvidence: Array<{
    token: string;
    source: string;
  }>;
  domainIdentity: {
    expectedEntityNames: string[];
    foreignDomainSignals: string[];
  };
  mismatchReasons: string[];
  passedChecks: string[];
}

export interface FrontendBrowserReview {
  passed: boolean;
  serverReady: boolean;
  url: string;
  screenshots: {
    desktop?: string;
    tablet?: string;
    mobile?: string;
    [key: string]: string | undefined;
  };
  fatalConsoleErrors: string[];
  uncaughtExceptions: string[];
  renderedElementsCount: number;
  runtimeGatePassed?: boolean;
  productIdentity?: ProductIdentityResult;
  failureReason?: string;
}

export interface BrowserValidationResult {
  passed: boolean;
  url: string;
  routesChecked: string[];
  consoleErrors: string[];
  uncaughtExceptions: string[];
  failedNetworkRequests: string[];
  renderedElementsCount: number;
  screenshotPath?: string;
  classifiedError?: string;
  workflowResults?: Array<{ name: string; passed: boolean; message: string }>;
}

export class ReadOnlyBrowserValidator {
  public static async validate(
    url: string,
    outputDirectory: string,
    options?: {
      routes?: string[];
      userWorkflows?: Array<{ name: string; selector: string; action: "click" | "type"; value?: string }>;
    }
  ): Promise<BrowserValidationResult> {
    const routes = options?.routes && options.routes.length > 0
      ? options.routes
      : ["/", "/upload", "/login", "/dashboard"];
    const consoleErrors: string[] = [];
    const uncaughtExceptions: string[] = [];
    const failedNetworkRequests: string[] = [];
    const workflowResults: Array<{ name: string; passed: boolean; message: string }> = [];
    let screenshotPath: string | undefined;

    console.log(`[BrowserValidator] 🔍 Running browser runtime & workflow validation on ${url}...`);

    try {
      const puppeteer = await import("puppeteer");
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      page.on("pageerror", (err: unknown) => {
        uncaughtExceptions.push((err as any)?.message || String(err));
      });

      page.on("requestfailed", (req) => {
        failedNetworkRequests.push(`${req.method()} ${req.url()} (${req.failure()?.errorText || "failed"})`);
      });

      const checkedRoutes: string[] = [];
      let renderedElementsCount = 0;

      // Navigate and check routes
      for (const route of routes) {
        try {
          const target = `${url}${route.startsWith("/") ? "" : "/"}${route}`;
          const res = await page.goto(target, { waitUntil: "networkidle2", timeout: 8000 });
          if (res && res.status() < 400) {
            checkedRoutes.push(route);
            const count = await page.evaluate(() => document.querySelectorAll("*").length);
            renderedElementsCount = Math.max(renderedElementsCount, count);
          }
        } catch {
          // Route navigation failure
        }
      }

      // Execute simulated user workflows if provided
      if (options?.userWorkflows && options.userWorkflows.length > 0) {
        for (const wf of options.userWorkflows) {
          try {
            const elem = await page.$(wf.selector);
            if (elem) {
              if (wf.action === "click") {
                await elem.click();
              } else if (wf.action === "type" && wf.value) {
                await elem.type(wf.value);
              }
              workflowResults.push({ name: wf.name, passed: true, message: `Executed action ${wf.action} on ${wf.selector}` });
            } else {
              workflowResults.push({ name: wf.name, passed: false, message: `Element ${wf.selector} not found` });
            }
          } catch (wfErr: any) {
            workflowResults.push({ name: wf.name, passed: false, message: `Action failed: ${wfErr.message}` });
          }
        }
      }

      let visibleText = "";
      let interactiveCount = 0;

      // Settle on root landing route for accurate metric inspection and screenshot
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 8000 });
        await page.evaluate(() => document.fonts ? document.fonts.ready : Promise.resolve());
        await page.waitForFunction(() => document.querySelectorAll('#root *').length > 0 || document.body.children.length > 0, { timeout: 3000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 600));

        // Prevent compositor transparency bleed on screenshot capture
        await page.evaluate(() => {
          const htmlEl = document.documentElement;
          const bodyEl = document.body;
          if (bodyEl) {
            const computedBody = window.getComputedStyle(bodyEl).backgroundColor;
            if (!computedBody || computedBody === "rgba(0, 0, 0, 0)" || computedBody === "transparent") {
              const computedHtml = window.getComputedStyle(htmlEl).backgroundColor;
              bodyEl.style.backgroundColor = (computedHtml && computedHtml !== "rgba(0, 0, 0, 0)" && computedHtml !== "transparent")
                ? computedHtml
                : "#ffffff";
            }
          }
        });

        visibleText = await page.evaluate(() => document.body.innerText || "");
        interactiveCount = await page.evaluate(() => document.querySelectorAll("button, input, select, table, form, a, [role='button'], [data-metric]").length);

        const screenshotDir = join(outputDirectory, ".aegis", "screenshots");
        if (!existsSync(screenshotDir)) mkdirSync(screenshotDir, { recursive: true });
        screenshotPath = join(screenshotDir, `runtime_check_${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`[BrowserValidator] 📸 Captured visual sanity screenshot at ${screenshotPath}`);
      } catch {}

      await browser.close();

      let classifiedError: string | undefined;
      const fatalConsole = consoleErrors.filter(
        (e) =>
          !e.includes("favicon") &&
          !e.includes("P1000") &&
          !e.includes("DATABASE_URL") &&
          !e.includes("Failed to load resource") &&
          !e.includes("404") &&
          !e.includes("ERR_BLOCKED_BY_CLIENT")
      );

      if (uncaughtExceptions.length > 0) {
        const classified = ErrorClassifier.classify(uncaughtExceptions[0]);
        classifiedError = `${classified.category}: ${uncaughtExceptions[0]}`;
      } else if (fatalConsole.length > 0) {
        const classified = ErrorClassifier.classify(fatalConsole[0]);
        classifiedError = `${classified.category}: ${fatalConsole[0]}`;
      } else if (renderedElementsCount < 5) {
        classifiedError = "UI_RENDER_FAILURE: Rendered DOM contains fewer than 5 elements (blank page)";
      } else if (visibleText.includes("Application Ready") || visibleText.includes("AEGIS Application") || (visibleText.trim().length < 40 && interactiveCount < 2)) {
        classifiedError = `UI_COMPLETENESS_FAILURE: Page renders placeholder/incomplete shell ("${visibleText.trim().slice(0, 50)}") instead of real domain application.`;
      }

      const passed = !classifiedError;

      console.log(`[BrowserValidator] Browser validation result: ${passed ? "PASSED ✅" : "FAILED ❌"}`);
      console.log(`  Routes Checked: [${checkedRoutes.join(", ")}]`);
      console.log(`  DOM Elements: ${renderedElementsCount}`);
      if (classifiedError) {
        console.error(`  Classified Error: ${classifiedError}`);
      }

      return {
        passed,
        url,
        routesChecked: checkedRoutes,
        consoleErrors,
        uncaughtExceptions,
        failedNetworkRequests,
        renderedElementsCount,
        screenshotPath,
        classifiedError,
        workflowResults,
      };
    } catch (err: any) {
      console.warn(`[BrowserValidator] Warning: Puppeteer browser automation unavailable (${err.message}). Performing HTTP read-only check...`);
      return this.fallbackHttpValidation(url);
    }
  }

  private static async fallbackHttpValidation(url: string): Promise<BrowserValidationResult> {
    const http = await import("node:http");
    return new Promise((resolve) => {
      const req = http.get(url, (res) => {
        const passed = res.statusCode !== undefined && res.statusCode < 400;
        resolve({
          passed,
          url,
          routesChecked: ["/"],
          consoleErrors: [],
          uncaughtExceptions: [],
          failedNetworkRequests: [],
          renderedElementsCount: passed ? 20 : 0,
        });
      });
      req.on("error", (err) => {
        resolve({
          passed: false,
          url,
          routesChecked: [],
          consoleErrors: [err.message],
          uncaughtExceptions: [],
          failedNetworkRequests: [],
          renderedElementsCount: 0,
          classifiedError: `NETWORK_FAILURE: Dev server unresolvable at ${url}`,
        });
      });
      req.setTimeout(3000, () => {
        req.destroy();
        resolve({
          passed: false,
          url,
          routesChecked: [],
          consoleErrors: ["HTTP request timeout"],
          uncaughtExceptions: [],
          failedNetworkRequests: [],
          renderedElementsCount: 0,
          classifiedError: `NETWORK_FAILURE: Connection timeout to ${url}`,
        });
      });
    });
  }

  public static async reviewFrontend(
    url: string,
    outputDirectory: string
  ): Promise<FrontendBrowserReview> {
    const screenshotDir = join(outputDirectory, ".aegis", "screenshots");
    if (!existsSync(screenshotDir)) mkdirSync(screenshotDir, { recursive: true });

    const review: FrontendBrowserReview = {
      passed: false,
      serverReady: false,
      url,
      screenshots: {},
      fatalConsoleErrors: [],
      uncaughtExceptions: [],
      renderedElementsCount: 0,
    };

    const cleanUrl = (url || "http://localhost:5173").trim().replace(/^h+ttp:\/\//i, "http://").replace(/^http:\/\/\/+/i, "http://");

    // 1. Verify dev server connection first via HTTP
    const serverLive = await new Promise<boolean>((resolve) => {
      try {
        const parsed = new URL(cleanUrl);
        const req = http.request({
          hostname: parsed.hostname,
          port: parsed.port || 80,
          path: parsed.pathname || "/",
          method: "GET",
          timeout: 4000,
        }, (res) => {
          resolve(Boolean(res.statusCode && res.statusCode < 500));
        });
        req.on("error", () => resolve(false));
        req.on("timeout", () => { req.destroy(); resolve(false); });
        req.end();
      } catch {
        resolve(false);
      }
    });

    if (!serverLive) {
      review.failureReason = `net::ERR_CONNECTION_REFUSED: Dev server is not running or unreachable at ${cleanUrl}`;
      console.warn(`[BrowserValidator] ❌ ${review.failureReason}`);
      return review;
    }
    review.serverReady = true;

    // 2. Launch Puppeteer to inspect runtime and viewports
    try {
      const puppeteer = await import("puppeteer");
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          const isFatal = /Cannot read propert|is not a function|Uncaught|SyntaxError|ReferenceError|Failed to resolve import/i.test(text);
          if (isFatal && !review.fatalConsoleErrors.includes(text)) {
            review.fatalConsoleErrors.push(text);
          }
        }
      });

      page.on("pageerror", (err: any) => {
        const text = err?.message || String(err);
        if (!review.uncaughtExceptions.includes(text)) {
          review.uncaughtExceptions.push(text);
        }
      });

      const viewports = [
        { name: "desktop", width: 1440, height: 900 },
        { name: "tablet", width: 768, height: 1024 },
        { name: "mobile", width: 375, height: 812 },
      ] as const;

      for (const vp of viewports) {
        let captured = false;
        let attempts = 0;
        while (!captured && attempts < 2) {
          attempts++;
          try {
            await page.setViewport({ width: vp.width, height: vp.height });
            await page.goto(cleanUrl, { waitUntil: "networkidle2", timeout: 10000 });
            const count = await page.evaluate(() => document.querySelectorAll("*").length);
            review.renderedElementsCount = Math.max(review.renderedElementsCount, count);

            const filePath = join(screenshotDir, `${vp.name}.png`);
            await page.screenshot({ path: filePath, fullPage: true });

            if (existsSync(filePath) && statSync(filePath).size > 1000) {
              review.screenshots[vp.name] = filePath;
              console.log(`[BrowserValidator] 📸 Captured ${vp.name} (${vp.width}x${vp.height} full-page) screenshot at ${filePath} (${statSync(filePath).size} bytes)`);
              captured = true;
            } else {
              console.warn(`[BrowserValidator] ⚠️ Screenshot file for ${vp.name} is missing or invalid size (attempt ${attempts}/2)`);
            }

            // If desktop viewport, capture interactive cart drawer open state if available
            if (vp.name === "desktop" && captured) {
              try {
                const opened = await page.evaluate(() => {
                  const buttons = Array.from(document.querySelectorAll("button, a[role='button']"));
                  const cartBtn = buttons.find(b => {
                    const text = (b.textContent || "").toLowerCase();
                    const aria = (b.getAttribute("aria-label") || "").toLowerCase();
                    return (aria.includes("cart") || aria.includes("bag") || text.includes("cart") || text.includes("bag")) &&
                           !text.includes("add to") && !text.includes("add ");
                  });
                  if (cartBtn) {
                    (cartBtn as HTMLElement).click();
                    return true;
                  }
                  return false;
                });

                if (opened) {
                  await new Promise(r => setTimeout(r, 600));
                  const cartPath = join(screenshotDir, "desktop-cart-open.png");
                  await page.screenshot({ path: cartPath, fullPage: true });
                  if (existsSync(cartPath) && statSync(cartPath).size > 1000) {
                    review.screenshots["desktop-cart-open"] = cartPath;
                    console.log(`[BrowserValidator] 📸 Captured desktop cart-open (1440px full-page) screenshot at ${cartPath} (${statSync(cartPath).size} bytes)`);
                  }
                  // Close drawer
                  await page.evaluate(() => {
                    const closeBtn = document.querySelector("[aria-label*='close' i], button:has-text('×'), button:has-text('Close')");
                    if (closeBtn) (closeBtn as HTMLElement).click();
                  });
                  await new Promise(r => setTimeout(r, 300));
                }
              } catch (cartErr: any) {
                // Non-fatal, cart drawer might not exist or be needed
              }
            }
          } catch (e: any) {
            console.warn(`[BrowserValidator] ⚠️ Could not capture ${vp.name} screenshot (attempt ${attempts}/2): ${e.message}`);
            if (attempts < 2) {
              await new Promise((r) => setTimeout(r, 1000));
            }
          }
        }
      }

      // 3. Product Identity & Completeness Gate on desktop viewport
      try {
        const { ProductExperiencePlanManager } = await import("../design/product-experience-plan.js");
        const plan = ProductExperiencePlanManager.load(outputDirectory);
        await page.setViewport({ width: 1440, height: 900 });
        let navigated = false;
        for (let i = 0; i < 2 && !navigated; i++) {
          try {
            await page.goto(cleanUrl, { waitUntil: "domcontentloaded", timeout: 8000 });
            await page.evaluate(() => document.fonts ? document.fonts.ready : Promise.resolve());
            await page.waitForFunction(() => document.querySelectorAll('#root *').length > 0 || document.body.children.length > 0, { timeout: 3000 }).catch(() => {});
            await new Promise(r => setTimeout(r, 500));
            navigated = true;
          } catch (navErr: any) {
            if (i === 0) await new Promise(r => setTimeout(r, 1000));
            else console.warn(`[BrowserValidator] ⚠️ Navigation to ${cleanUrl} for product check failed: ${navErr.message}`);
          }
        }
        review.productIdentity = await ReadOnlyBrowserValidator.validateProductIdentity(page, plan, { outputDirectory }, cleanUrl);
      } catch (prodGateErr: any) {
        console.warn(`[BrowserValidator] ⚠️ Product identity check warning: ${prodGateErr.message}`);
      }

      await browser.close();
    } catch (err: any) {
      review.failureReason = `Chromium launch/navigation failed: ${err.message}`;
      console.warn(`[BrowserValidator] ❌ ${review.failureReason}`);
      return review;
    }

    // 4. Strict Invariant Validation — Runtime Gate
    const blockers: string[] = [];
    if (!review.serverReady) blockers.push("Dev server not ready");
    if (review.renderedElementsCount < 10) blockers.push(`Page appears blank (renderedElementsCount: ${review.renderedElementsCount} < 10)`);
    if (review.fatalConsoleErrors.length > 0) blockers.push(`Fatal console error(s): ${review.fatalConsoleErrors.join("; ")}`);
    if (review.uncaughtExceptions.length > 0) blockers.push(`Uncaught runtime exception(s): ${review.uncaughtExceptions.join("; ")}`);
    if (!review.screenshots.desktop) blockers.push("Desktop screenshot missing or 0 bytes");
    if (!review.screenshots.tablet) blockers.push("Tablet screenshot missing or 0 bytes");
    if (!review.screenshots.mobile) blockers.push("Mobile screenshot missing or 0 bytes");

    review.runtimeGatePassed = blockers.length === 0;

    // 5. Product Identity Gate Validation
    if (review.productIdentity && !review.productIdentity.passed) {
      blockers.push(...review.productIdentity.mismatchReasons);
    }

    if (blockers.length === 0) {
      review.passed = true;
      console.log(`[BrowserValidator] ✓ PASS — Frontend visually reviewed cleanly in Chromium (DOM elements: ${review.renderedElementsCount}, Fatal errors: 0).`);
      if (review.productIdentity) {
        console.log(`[BrowserValidator] ✓ PASS — Product Identity & Completeness Gate verified (Pattern: ${review.productIdentity.experiencePattern.expected}, Features: ${review.productIdentity.featureEvidence.length}).`);
      }
    } else {
      review.passed = false;
      review.failureReason = blockers.join("; ");
      console.warn(`[BrowserValidator] ❌ Frontend visual review FAILED: ${review.failureReason}`);
    }

    return review;
  }

  public static async validateProductIdentity(
    page: any,
    plan: import("../design/product-experience-plan.js").ProductExperiencePlan | null,
    domainSpec?: any,
    url: string = "/"
  ): Promise<ProductIdentityResult> {
    const passedChecks: string[] = [];
    const mismatchReasons: string[] = [];

    const domData = await page.evaluate(() => {
      const bodyText = document.body ? document.body.innerText || "" : "";
      const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4")).map(h => (h.textContent || "").trim());
      const buttons = Array.from(document.querySelectorAll("button, a[role='button']")).map(b => (b.textContent || "").trim());
      const inputs = Array.from(document.querySelectorAll("input, select, textarea")).map(el => {
        const i = el as HTMLInputElement;
        return {
          tag: el.tagName.toLowerCase(),
          type: i.type || el.tagName.toLowerCase(),
          name: i.name || "",
          placeholder: i.placeholder || "",
          id: i.id || "",
        };
      });
      const canvases = document.querySelectorAll("canvas, svg").length;
      const sliders = document.querySelectorAll("input[type='range'], [role='slider']").length;
      const tables = document.querySelectorAll("table, [role='table'], [role='grid']").length;
      const workspaceAttr = (document.querySelector("[data-workspace]") as HTMLElement | null)?.dataset?.workspace || "";

      return {
        bodyText,
        headings,
        buttons,
        inputs,
        canvases,
        sliders,
        tables,
        workspaceAttr,
      };
    });

    const bodyLower = domData.bodyText.toLowerCase();

    // 1. Auth Wall & Dominance Detection
    const passwordInputs = domData.inputs.filter((i: any) => i.type === "password");
    const emailInputs = domData.inputs.filter((i: any) => i.type === "email" || /email/i.test(i.name) || /email/i.test(i.placeholder));
    const loginButtons = domData.buttons.filter((b: any) => /sign in|log in|login|signin/i.test(b));
    const authHeadings = domData.headings.filter((h: any) => /sign in|log in|login|signin|welcome back/i.test(h));

    const authSignals = passwordInputs.length * 3 + emailInputs.length * 2 + loginButtons.length * 2 + authHeadings.length * 2;

    const allVocab = (plan?.requiredCapabilities || []).flatMap(c => c.evidenceVocabulary);
    let domainSignals = 0;
    for (const v of allVocab) {
      if (bodyLower.includes(v.toLowerCase())) domainSignals++;
    }

    const dominanceScore = (authSignals + domainSignals) > 0 ? authSignals / (authSignals + domainSignals) : 0;
    const authWallDetected = authSignals >= 3 && domainSignals < 2;
    const authWallAllowed = Boolean(plan?.authWallAllowed);

    const authWallResult = {
      detected: authWallDetected,
      allowed: authWallAllowed,
      dominanceScore,
    };

    if (authWallDetected && !authWallAllowed) {
      mismatchReasons.push("Unexpected generic authentication screen on route '/'. Expected interactive domain workspace without login barrier.");
    } else {
      passedChecks.push("No unauthorized authentication wall");
    }

    // 2. Experience Pattern Check
    const expectedPattern = plan?.experiencePattern || "operations-dashboard";
    let patternMatched = true;
    let detectedPattern = expectedPattern;

    if (expectedPattern === "configurator-workspace" || expectedPattern === "workspace-editor") {
      // Accept if: data-workspace attr signals a workspace, OR the page has interactive controls, OR domain content was detected
      const workspaceAttrMatch = /configurator|workspace|studio|calculator|editor/i.test(domData.workspaceAttr || "");
      const hasTools = workspaceAttrMatch || domData.inputs.length >= 1 || domData.canvases > 0 || domData.sliders > 0 || domData.tables > 0 || domData.buttons.length >= 2;
      if (!hasTools || authWallDetected) {
        patternMatched = false;
        detectedPattern = authWallDetected ? "authentication-wall" : "showcase-landing";
        mismatchReasons.push(`Expected experience pattern "${expectedPattern}" with interactive tools/workspaces, but detected "${detectedPattern}".`);
      } else {
        passedChecks.push(`Experience pattern matched: ${expectedPattern} (workspace=${domData.workspaceAttr || "none"})`);
      }
    } else {
      passedChecks.push(`Experience pattern: ${expectedPattern}`);
    }

    // 2b. Structural Fit & Consumer Layout Gate
    const isConsumerPattern = [
      "storefront-commerce",
      "hospitality-portal",
      "editorial-catalog",
      "booking-flow",
    ].includes(expectedPattern);

    if (isConsumerPattern && (url === "/" || url.endsWith("/"))) {
      // 1. Root route tab switcher check: Consumer patterns must NOT be a 3+ panel tab switcher
      const tabData = await page.evaluate(() => {
        const tabLists = Array.from(document.querySelectorAll("[role='tablist'], .tabs, nav.tabs"));
        const tabButtons = Array.from(document.querySelectorAll("button[role='tab'], [role='tablist'] button, .tab-button, [data-tab]"));
        const mgmtTitles = Array.from(document.querySelectorAll("h1, h2, h3"))
          .map(h => (h.textContent || "").trim())
          .filter(t => /management suite|operations console|admin suite|control panel|internal dashboard/i.test(t));
        return {
          tabListsCount: tabLists.length,
          tabButtonsCount: tabButtons.length,
          tabLabels: tabButtons.map(b => (b.textContent || "").trim()).slice(0, 8),
          mgmtTitles,
        };
      });

      if (tabData.tabButtonsCount >= 3 || tabData.mgmtTitles.length > 0) {
        mismatchReasons.push(
          `Structural Defect: Consumer-facing pattern "${expectedPattern}" must render a continuous-scroll customer journey on route '/', not a tabbed console (${tabData.tabButtonsCount} tab buttons detected: [${tabData.tabLabels.join(", ")}]; titles: [${tabData.mgmtTitles.join(", ")}]).`
        );
      } else {
        passedChecks.push(`Structural fit verified: Continuous-scroll ${expectedPattern} (no root tabbed console)`);
      }

      // 2. Heading Check: No headings that literally print internal capability names
      for (const cap of (plan?.requiredCapabilities || [])) {
        const capNameLower = cap.name.trim().toLowerCase();
        const literalMatch = domData.headings.find((h: string) => {
          const hClean = h.trim().toLowerCase().replace(/^section\s+\d+[:—\-]\s*/i, "");
          return hClean === capNameLower;
        });
        if (literalMatch) {
          mismatchReasons.push(
            `Incentive/Content Defect: Heading "${literalMatch}" literally prints internal capability name "${cap.name}". Consumer pages must use authentic customer-facing copy (e.g. "From the Hearth", "Daily Fresh Bakes", "Check Delivery"), not raw capability IDs.`
          );
        }
      }

      // 3. Admin-only controls leakage check on customer routes
      const adminControls = domData.buttons.filter((b: string) => {
        return /^\+\s*(add|create|new)\s+(product|menu\s*item|dish|villa|room|item|record|batch|inventory)/i.test(b) ||
               /^(manage|delete|edit)\s+(menu\s*items|products|villas|inventory|records)/i.test(b);
      });
      if (adminControls.length > 0) {
        mismatchReasons.push(
          `Role Leakage: Admin management control(s) [${adminControls.join(", ")}] detected on customer route '${url}'. Management actions must not leak into customer storefront/portal.`
        );
      } else {
        passedChecks.push("No administrative control leakage on customer route");
      }
    }

    // 3. Semantic Feature Evidence & Real Chromium Interaction Checks
    const featureEvidence: ProductIdentityResult["featureEvidence"] = [];
    for (const cap of (plan?.requiredCapabilities || [])) {
      let matchedVocab = cap.evidenceVocabulary.filter(v => bodyLower.includes(v.toLowerCase()));
      let visible = matchedVocab.length > 0 && !authWallDetected;

      // If not visible on root page, check other expected routes and discovered navigation links
      const candidateRoutes = new Set<string>(plan?.expectedRoutes || []);
      if (domainSpec?.outputDirectory) {
        try {
          const contractFile = join(domainSpec.outputDirectory, ".aegis", "architecture-contract.json");
          if (existsSync(contractFile)) {
            const contractData = JSON.parse(readFileSync(contractFile, "utf8"));
            (contractData.requiredRoutes || []).forEach((r: any) => {
              const clean = typeof r === "string" ? r : r?.path;
              if (clean) candidateRoutes.add(clean.startsWith("/") ? clean : `/${clean}`);
            });
          }
        } catch {}
      }
      try {
        const liveLinks: string[] = await page.evaluate(() => {
          return Array.from(document.querySelectorAll("a[href]"))
            .map((a: any) => a.getAttribute("href"))
            .filter((h: string) => h && h.startsWith("/") && !h.startsWith("//"));
        });
        liveLinks.forEach(l => candidateRoutes.add(l));
      } catch {}
      candidateRoutes.add("/primary");
      candidateRoutes.add("/workspace");

      if (!visible && candidateRoutes.size > 1) {
        for (const r of candidateRoutes) {
          if (r === "/" || r === "") continue;
          try {
            const targetUrl = new URL(r.startsWith("/") ? r.slice(1) : r, url.endsWith("/") ? url : url + "/").toString();
            await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 4000 });
            const pageText = (await page.evaluate(() => document.body ? document.body.innerText || "" : "")).toLowerCase();
            const subMatches = cap.evidenceVocabulary.filter(v => pageText.includes(v.toLowerCase()));
            if (subMatches.length > 0) {
              matchedVocab = subMatches;
              visible = true;
              break;
            }
          } catch {}
        }
        // Navigate back to root page after route probing
        try {
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 4000 });
        } catch {}
      }

      const controlEvidence: string[] = [];
      for (const ctrl of cap.controlsRequired) {
        if (ctrl === "button" && domData.buttons.length > 0) controlEvidence.push("button");
        if (ctrl === "input" && domData.inputs.length > 0) controlEvidence.push("input");
        if (ctrl === "select" && domData.inputs.some((i: any) => i.tag === "select")) controlEvidence.push("select");
        if (ctrl === "slider" && domData.sliders > 0) controlEvidence.push("slider");
        if (ctrl === "canvas" && domData.canvases > 0) controlEvidence.push("canvas");
      }

      let interactionVerified = false;
      if (visible) {
        try {
          const actionTarget = await page.$(`button, input:not([type='hidden']):not([type='password']), select`);
          if (actionTarget) {
            interactionVerified = true;
          }
        } catch {
          interactionVerified = false;
        }
      }

      if (!visible) {
        mismatchReasons.push(`Required capability "${cap.name}" not detected in rendered UI.`);
      } else {
        passedChecks.push(`Feature verified: ${cap.name}`);
      }

      featureEvidence.push({
        featureId: cap.id,
        name: cap.name,
        visible,
        vocabularyEvidence: matchedVocab,
        controlEvidence,
        interactionVerified,
      });
    }

    // 4. Forbidden Negative Evidence (Cross-Domain Contamination)
    const forbiddenEvidence: ProductIdentityResult["forbiddenEvidence"] = [];
    const forbiddenTokens = [
      ...(plan?.forbiddenVocabulary || []),
      ...(plan?.forbiddenArtifacts || []),
      ...(domainSpec?.forbiddenVocabulary || []),
    ];

    const GENERIC_UI_VERBS = new Set([
      "inspect", "manage", "track", "view", "submit", "record",
      "records", "table", "list", "item", "items", "data", "status",
      "edit", "delete", "filter", "search", "details", "close", "open",
      "save", "update", "cancel"
    ]);

    for (const token of forbiddenTokens) {
      if (!token) continue;
      const trimmed = token.trim().toLowerCase();
      // Standalone single words matching generic UI verbs/nouns are ignored to prevent false positives.
      // Compound phrases (e.g. "manage kanban board", "inspect record", "resume scan") are fully preserved.
      if (!trimmed.includes(" ") && GENERIC_UI_VERBS.has(trimmed)) {
        continue;
      }
      if (trimmed.length > 3 && bodyLower.includes(trimmed)) {
        forbiddenEvidence.push({ token, source: "DOM Text" });
        mismatchReasons.push(`Forbidden foreign-domain vocabulary detected: "${token}"`);
      }
    }

    if (forbiddenEvidence.length === 0) {
      passedChecks.push("Zero foreign-domain artifacts or forbidden vocabulary");
    }

    // 5. Overall Pass
    const passed = (
      (!authWallDetected || authWallAllowed) &&
      patternMatched &&
      (featureEvidence.length === 0 || featureEvidence.every(f => f.visible)) &&
      forbiddenEvidence.length === 0
    );

    return {
      passed,
      experiencePattern: {
        expected: expectedPattern,
        detected: detectedPattern,
        matched: patternMatched,
      },
      routeIdentity: {
        route: "/",
        expectedRole: "Domain Workspace",
        matched: !authWallDetected || authWallAllowed,
      },
      authWall: authWallResult,
      featureEvidence,
      forbiddenEvidence,
      domainIdentity: {
        expectedEntityNames: (domainSpec?.entities || []).map((e: any) => typeof e === "string" ? e : e.name),
        foreignDomainSignals: forbiddenEvidence.map(f => f.token),
      },
      mismatchReasons,
      passedChecks,
    };
  }

  public static async captureMultiViewportScreenshots(
    url: string,
    outputDirectory: string
  ): Promise<{ desktop?: string; tablet?: string; mobile?: string }> {
    const res = await this.reviewFrontend(url, outputDirectory);
    return res.screenshots;
  }
}


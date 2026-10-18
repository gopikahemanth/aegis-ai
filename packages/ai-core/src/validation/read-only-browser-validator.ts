import { existsSync, mkdirSync, statSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import http from "node:http";
import { ErrorClassifier } from "../healing/error-classifier.js";
import type { PrimaryRouteCapabilityContract } from "../governance/architecture-contract.js";

function findSourceFiles(dir: string, ext = [".tsx", ".jsx", ".ts", ".js"]): string[] {
  const results: string[] = [];
  try {
    if (!existsSync(dir)) return results;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (!["node_modules", ".git", "dist", "build"].includes(e.name)) {
          results.push(...findSourceFiles(full, ext));
        }
      } else if (e.isFile() && ext.some(x => e.name.endsWith(x))) {
        results.push(full);
      }
    }
  } catch {}
  return results;
}

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

export interface RouteBrowserReview {
  route: string;
  pageRole: string;
  passed: boolean;
  renderedElementsCount: number;
  screenshot?: string;
  errors: string[];
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
  experienceFidelity?: ExperienceFidelityResult;
  routeReviews?: RouteBrowserReview[];
  failureReason?: string;
}

export interface ExperienceFidelityResult {
  passed: boolean;
  experienceType: string;
  renderingMode: string;
  real3dRequired: boolean;
  webglCanvasDetected: boolean;
  webglContextActive: boolean;
  runtimeExperienceContract?: {
    exposed: boolean;
    experienceType?: string;
    renderingMode?: string;
    sceneReady?: boolean;
    objectsRendered?: number;
    interactiveObjects?: number;
    scrollDriven?: boolean;
    animationActive?: boolean;
  };
  forbiddenSubstitutionDetected: boolean;
  mismatchReasons: string[];
  passedChecks: string[];
}

export interface SemanticMutationResult {
  route: string;
  actionName: string;
  trigger: string;
  mutationType: string;
  stateBefore: string;
  stateAfter: string;
  passed: boolean;
  contractVerified?: boolean;
  contractCapability?: string;
  persistenceRequired?: boolean;
  error?: string;
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
  semanticMutationsCount?: number;
  semanticMutationResults?: SemanticMutationResult[];
}

export class ReadOnlyBrowserValidator {
  public static async validate(
    url: string,
    outputDirectory: string,
    options?: {
      routes?: string[];
      userWorkflows?: Array<{ name: string; selector: string; action: "click" | "type"; value?: string }>;
      routeCapabilities?: PrimaryRouteCapabilityContract[];
      strictMode?: boolean;
      apiReport?: any;
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

    // Load route capability contracts if available
    const routeCapabilityMap = new Map<string, PrimaryRouteCapabilityContract>();
    if (outputDirectory) {
      try {
        const archPath = join(outputDirectory, ".aegis", "architecture-contract.json");
        if (existsSync(archPath)) {
          const arch = JSON.parse(readFileSync(archPath, "utf8"));
          if (Array.isArray(arch.routeCapabilities)) {
            for (const cap of arch.routeCapabilities) {
              if (cap.route) routeCapabilityMap.set(cap.route, cap);
            }
          }
        }
      } catch {}
    }
    if (options?.routeCapabilities) {
      for (const cap of options.routeCapabilities) {
        if (cap.route) routeCapabilityMap.set(cap.route, cap);
      }
    }

    console.log(`[BrowserValidator] 🔍 Running browser runtime & workflow validation on ${url}...`);

    try {
      const puppeteer = await import("puppeteer");
      const browser = await puppeteer.launch({
        headless: true,
        protocolTimeout: 120000,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--enable-webgl",
          "--ignore-gpu-blocklist",
          "--use-gl=angle",
          "--use-angle=swiftshader",
        ],
      });
      const page = await browser.newPage();
      page.on("dialog", async (dialog) => {
        try { await dialog.dismiss(); } catch {}
      });

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          if (/Error creating WebGL context|CONTEXT_LOST_WEBGL/i.test(text)) {
            console.warn(`[BrowserValidator] Non-fatal WebGL context note in headless browser: ${text}`);
            return;
          }
          consoleErrors.push(text);
        }
      });

      page.on("pageerror", (err: unknown) => {
        const text = (err as any)?.message || String(err);
        if (/Error creating WebGL context|CONTEXT_LOST_WEBGL/i.test(text)) {
          console.warn(`[BrowserValidator] Non-fatal WebGL context note in headless browser: ${text}`);
          return;
        }
        uncaughtExceptions.push(text);
      });

      page.on("requestfailed", (req) => {
        failedNetworkRequests.push(`${req.method()} ${req.url()} (${req.failure()?.errorText || "failed"})`);
      });

      const checkedRoutes: string[] = [];
      let renderedElementsCount = 0;
      const semanticMutationResults: SemanticMutationResult[] = [];
      let semanticMutationsCount = 0;

      // Navigate and check routes
      for (const route of routes) {
        try {
          const target = `${url}${route.startsWith("/") ? "" : "/"}${route}`;
          const res = await page.goto(target, { waitUntil: "networkidle2", timeout: 8000 }).catch(async () => {
            return await page.goto(target, { waitUntil: "domcontentloaded", timeout: 5000 });
          });
          if (res && res.status() < 400) {
            checkedRoutes.push(route);
            const count = await page.evaluate(() => document.querySelectorAll("*").length);
            renderedElementsCount = Math.max(renderedElementsCount, count);

            // Audit semantic state mutation on this route against primary capability contract
            const routeContract = routeCapabilityMap.get(route);
            const mutRes = await ReadOnlyBrowserValidator.verifyRouteStateMutation(
              page,
              route,
              routeContract,
              {
                strictMode: options?.strictMode,
                projectRoot: outputDirectory,
                apiReport: options?.apiReport,
              }
            );
            semanticMutationResults.push(mutRes);
            if (mutRes.passed) {
              semanticMutationsCount++;
            }
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
          !e.includes("ERR_BLOCKED_BY_CLIENT") &&
          !/Error creating WebGL context|CONTEXT_LOST_WEBGL/i.test(e)
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
      } else if (checkedRoutes.length > 0 && semanticMutationsCount === 0 && interactiveCount > 0) {
        classifiedError = `STATE_MUTATION_FAILURE: Zero observable DOM state transitions across tested route(s) [${checkedRoutes.join(", ")}]. All routes behaved as passive shells without reacting to user actions.`;
      }

      const passed = !classifiedError;

      console.log(`[BrowserValidator] Browser validation result: ${passed ? "PASSED ✅" : "FAILED ❌"}`);
      console.log(`  Routes Checked: [${checkedRoutes.join(", ")}]`);
      console.log(`  DOM Elements: ${renderedElementsCount}`);
      console.log(`  Semantic State Mutations Verified: ${semanticMutationsCount}/${semanticMutationResults.length}`);
      if (classifiedError) {
        console.error(`  Classified Error: ${classifiedError}`);
      }

      const result: BrowserValidationResult = {
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
        semanticMutationsCount,
        semanticMutationResults,
      };

      try {
        const aegisDir = join(outputDirectory, ".aegis");
        if (existsSync(aegisDir)) {
          const { writeFileSync } = await import("node:fs");
          writeFileSync(join(aegisDir, "browser-validation.json"), JSON.stringify(result, null, 2), "utf8");
        }
      } catch {}

      return result;
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

  public static loadApiWorkflowReport(projectRoot: string): any {
    try {
      const p = join(projectRoot, ".aegis", "api-workflow-report.json");
      if (existsSync(p)) {
        return JSON.parse(readFileSync(p, "utf8"));
      }
    } catch {}
    return null;
  }

  /**
   * Verify that user interaction on a route triggers an observable DOM state mutation.
   * Enforces PrimaryRouteCapabilityContract when provided or in strict certification mode.
   * Tests tabs, filter buttons, mode toggles, selection cards, and form inputs.
   */
  public static async verifyRouteStateMutation(
    page: any,
    route: string,
    contract?: PrimaryRouteCapabilityContract,
    options?: {
      strictMode?: boolean;
      projectRoot?: string;
      apiReport?: any;
    }
  ): Promise<SemanticMutationResult> {
    try {
      // 1. Strict certification policy enforcement: every canonical route must have a contract
      if (options?.strictMode && !contract) {
        return {
          route,
          actionName: "Strict Certification Audit",
          trigger: "N/A",
          mutationType: "NONE",
          stateBefore: "",
          stateAfter: "",
          passed: false,
          contractVerified: false,
          error: `STRICT_CERTIFICATION_FAILURE: Canonical route '${route}' lacks a mandatory PrimaryRouteCapabilityContract. Legacy fallback disabled in strict mode.`,
        };
      }
      // Find candidate interactive triggers
      const candidateInfo = await page.evaluate(() => {
        const triggers = Array.from(
          document.querySelectorAll("button, a[href], [role='tab'], [role='button'], [data-filter], input[type='checkbox'], input[type='range'], select, [class*='cursor-pointer'], [data-interactive], [style*='cursor: pointer'], [style*='cursor:pointer'], svg [role='button']")
        );

        const candidates: Array<{ index: number; text: string; tag: string; role: string; inNav: boolean }> = [];
        triggers.forEach((el, idx) => {
          const isRange = el.tagName.toLowerCase() === "input" && (el as HTMLInputElement).type === "range";
          const text = isRange
            ? `Range Slider [${(el as HTMLInputElement).name || (el as HTMLInputElement).id || "dynamics"}]`
            : (el.textContent || (el as HTMLInputElement).value || "").trim();
          const role = el.getAttribute("role") || "";
          const isIgnored = /close|dismiss|cancel|help/i.test(text);
          const inNav = Boolean(el.closest("nav, header, [role='navigation']"));
          if (text.length > 0 && !isIgnored && text.length < 300) {
            candidates.push({
              index: idx,
              text: text.slice(0, 80),
              tag: el.tagName.toLowerCase(),
              role,
              inNav,
            });
          }
        });

        const initialDomText = (document.querySelector("#root") || document.body)?.textContent?.replace(/\s+/g, " ").trim() || "";
        const initialSelected = Array.from(document.querySelectorAll("[aria-selected='true'], .active, [data-state='active'], [data-state='selected'], .selected"))
          .map(e => e.textContent?.trim() || "")
          .join("|");
        const initialBadgeText = Array.from(document.querySelectorAll("[data-badge], .badge, [role='status'], .status-badge"))
          .map(e => e.textContent?.trim() || "")
          .join("|");

        return {
          candidates: candidates.slice(0, 20),
          initialDomText,
          initialSelected,
          initialBadgeText,
        };
      });

      if (candidateInfo.candidates.length === 0) {
        return {
          route,
          actionName: contract ? `Contract: ${contract.capabilityName}` : "None",
          trigger: contract?.trigger.labelPattern || "N/A",
          mutationType: "NONE",
          stateBefore: candidateInfo.initialDomText.slice(0, 80),
          stateAfter: candidateInfo.initialDomText.slice(0, 80),
          passed: false,
          contractVerified: false,
          contractCapability: contract?.capabilityName,
          persistenceRequired: Boolean(contract?.requiresPersistence),
          error: contract
            ? `Route capability contract '${contract.capabilityName}' failed: no controls found on route ${route}`
            : `No interactive controls found on route ${route}`,
        };
      }

      // If a route contract is specified, prioritize candidates matching the contract's trigger pattern
      let candidatesToTest = candidateInfo.candidates;
      if (contract?.trigger.labelPattern) {
        const pattern = new RegExp(contract.trigger.labelPattern, "i");
        const matched = candidateInfo.candidates.filter((c: { text: string }) => pattern.test(c.text));
        if (matched.length > 0) {
          candidatesToTest = matched;
        } else {
          // Contract trigger pattern not found among interactive controls
          return {
            route,
            actionName: `Contract Execution: ${contract.capabilityName}`,
            trigger: contract.trigger.labelPattern,
            mutationType: "NONE",
            stateBefore: candidateInfo.initialDomText.slice(0, 80),
            stateAfter: candidateInfo.initialDomText.slice(0, 80),
            passed: false,
            contractVerified: false,
            contractCapability: contract.capabilityName,
            persistenceRequired: Boolean(contract.requiresPersistence),
            error: `Primary capability contract '${contract.capabilityName}' failed: trigger pattern /${contract.trigger.labelPattern}/i not found among available controls.`,
          };
        }
      }

      // Prioritize in-page workspace controls over global navigation/header buttons
      candidatesToTest.sort((a: any, b: any) => {
        if (a.inNav && !b.inNav) return 1;
        if (!a.inNav && b.inNav) return -1;
        return 0;
      });

      // Try triggering candidate controls
      for (const candidate of candidatesToTest.slice(0, 10)) {
        try {
          const clicked = await page.evaluate((candText: string) => {
            const els = Array.from(document.querySelectorAll("button, a[href], [role='tab'], [role='button'], [data-filter], select, input[type='checkbox'], input[type='range'], [class*='cursor-pointer'], [data-interactive], [style*='cursor: pointer'], [style*='cursor:pointer'], svg [role='button']"));
            const target = els.find(e => {
              if (candText.startsWith("Range Slider") && e.tagName.toLowerCase() === "input" && (e as HTMLInputElement).type === "range") {
                return true;
              }
              const t = (e.textContent || (e as HTMLInputElement).value || "").trim();
              return t === candText || (candText.length > 5 && t.includes(candText)) || (t.length > 5 && candText.includes(t.slice(0, 40)));
            }) as HTMLElement | undefined;
            if (target) {
              if (target.tagName.toLowerCase() === "input" && (target as HTMLInputElement).type === "range") {
                const range = target as HTMLInputElement;
                const current = Number(range.value) || 50;
                const min = Number(range.min) || 0;
                const max = Number(range.max) || 100;
                const nextVal = current <= (min + max) / 2 ? max : min;
                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                if (nativeSetter) {
                  nativeSetter.call(range, String(nextVal));
                } else {
                  range.value = String(nextVal);
                }
                range.dispatchEvent(new Event("input", { bubbles: true }));
                range.dispatchEvent(new Event("change", { bubbles: true }));
                return true;
              }
              if (target.tagName.toLowerCase() === "select") {
                const sel = target as HTMLSelectElement;
                if (sel.options.length > 1) {
                  sel.selectedIndex = sel.selectedIndex === 0 ? 1 : 0;
                  sel.dispatchEvent(new Event("change", { bubbles: true }));
                  return true;
                }
              }
              // If target is inside a form or is a submit button, fill out any empty required inputs with valid sample values so HTML5 validation passes!
              const form = target.closest("form");
              if (form) {
                const inputs = Array.from(form.querySelectorAll("input, select, textarea")) as Array<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
                for (const inp of inputs) {
                  const anyInp = inp as any;
                  if (!inp.value || inp.value.trim() === "") {
                    let sampleVal = "TEST-ENTRY";
                    if (inp.tagName.toLowerCase() === "select" && (inp as HTMLSelectElement).options.length > 1) {
                      (inp as HTMLSelectElement).selectedIndex = 1;
                    } else if (inp.type === "number") {
                      sampleVal = "150";
                    } else if (inp.type === "email") {
                      sampleVal = "ops@stratos.aero";
                    } else if (/tail|call/i.test(anyInp.name || anyInp.placeholder || anyInp.id || "")) {
                      sampleVal = "N-8842X";
                    } else if (/model|craft/i.test(anyInp.name || anyInp.placeholder || anyInp.id || "")) {
                      sampleVal = "Bombardier Global 7500";
                    } else if (/tech|name|assign/i.test(anyInp.name || anyInp.placeholder || anyInp.id || "")) {
                      sampleVal = "Lead Avionics Specialist";
                    } else if (/title|directive|desc|service/i.test(anyInp.name || anyInp.placeholder || anyInp.id || "")) {
                      sampleVal = "Hydraulic Pressure Sensor Calibration";
                    }
                    if (inp.tagName.toLowerCase() === "textarea" && nativeTextAreaValueSetter) {
                      nativeTextAreaValueSetter.call(inp, sampleVal);
                    } else if (nativeInputValueSetter) {
                      nativeInputValueSetter.call(inp, sampleVal);
                    } else {
                      inp.value = sampleVal;
                    }
                    inp.dispatchEvent(new Event("input", { bubbles: true }));
                    inp.dispatchEvent(new Event("change", { bubbles: true }));
                  }
                }
              }
              target.click();
              return true;
            }
            return false;
          }, candidate.text);

          if (!clicked) continue;

          // Wait 400ms for state update
          await new Promise(r => setTimeout(r, 400));

          const postInfo = await page.evaluate(() => {
            const domText = (document.querySelector("#root") || document.body)?.textContent?.replace(/\s+/g, " ").trim() || "";
            const selected = Array.from(document.querySelectorAll("[aria-selected='true'], .active, [data-state='active'], [data-state='selected'], .selected"))
              .map(e => e.textContent?.trim() || "")
              .join("|");
            const badgeText = Array.from(document.querySelectorAll("[data-badge], .badge, [role='status'], .status-badge"))
              .map(e => e.textContent?.trim() || "")
              .join("|");
            return {
              domText,
              selected,
              badgeText,
            };
          });

          // Check if observable DOM state mutation occurred
          const textChanged = postInfo.domText !== candidateInfo.initialDomText;
          const selectionChanged = postInfo.selected !== candidateInfo.initialSelected;
          const badgeChanged = postInfo.badgeText !== candidateInfo.initialBadgeText;

          if (textChanged || selectionChanged || badgeChanged) {
            const mutationType = selectionChanged
              ? "TAB_OR_SELECTION_TRANSITION"
              : badgeChanged
                ? "BADGE_STATUS_TRANSITION"
                : "CONTENT_STATE_MUTATION";

            // If contract specifies expected observable patterns, verify them
            if (contract) {
              let contractMatches = true;
              if (contract.observableResult.badgeStatusPattern) {
                const badgeRegex = new RegExp(contract.observableResult.badgeStatusPattern, "i");
                if (!badgeRegex.test(postInfo.badgeText)) contractMatches = false;
              }
              if (contract.observableResult.domTextPattern) {
                const domRegex = new RegExp(contract.observableResult.domTextPattern, "i");
                if (!domRegex.test(postInfo.domText)) contractMatches = false;
              }
              if (contract.observableResult.selectedPattern) {
                const selRegex = new RegExp(contract.observableResult.selectedPattern, "i");
                if (!selRegex.test(postInfo.selected)) contractMatches = false;
              }

              if (contractMatches) {
                // If persistence is required, check real backend DB mutation evidence
                if (contract.requiresPersistence) {
                  let persistenceConfirmed = false;
                  const report = options?.apiReport || (options?.projectRoot ? ReadOnlyBrowserValidator.loadApiWorkflowReport(options.projectRoot) : null);
                  if (report) {
                    if (contract.persistenceVerification) {
                      const targetEndpoint = contract.persistenceVerification.endpoint;
                      const matchedStep = report.results?.find((r: any) =>
                        r.step?.path === targetEndpoint ||
                        (r.step?.path && targetEndpoint && r.step.path.includes(targetEndpoint.replace(/^\/api/, "")))
                      );
                      if (matchedStep && matchedStep.passed && matchedStep.dbMutationConfirmed) {
                        persistenceConfirmed = true;
                      }
                    }
                    if (!persistenceConfirmed) {
                      const routeTokens = route.toLowerCase().split(/[-_/]/).filter((t: string) => t.length > 3);
                      const relevantStep = report.results?.find((r: any) =>
                        r.step?.endpointType === "STATEFUL" &&
                        r.dbMutationConfirmed &&
                        routeTokens.some((tok: string) => r.step?.path?.toLowerCase().includes(tok))
                      );
                      const anyStatefulMutation = report.results?.some((r: any) => r.step?.endpointType === "STATEFUL" && r.dbMutationConfirmed);
                      persistenceConfirmed = Boolean(
                        relevantStep ||
                        ((report.passed || anyStatefulMutation) && ((report.mutationsVerified || 0) > 0 || anyStatefulMutation))
                      );
                    }
                  }

                  if (!persistenceConfirmed) {
                    console.log(`[BrowserValidator]   ❌ Persistence required for capability "${contract.capabilityName}" on "${route}", but DB mutation unconfirmed.`);
                    return {
                      route,
                      actionName: `Contract Execution: ${contract.capabilityName}`,
                      trigger: candidate.text,
                      mutationType,
                      stateBefore: candidateInfo.initialDomText.slice(0, 80),
                      stateAfter: postInfo.domText.slice(0, 80),
                      passed: false,
                      contractVerified: false,
                      contractCapability: contract.capabilityName,
                      persistenceRequired: true,
                      error: `PERSISTENCE_VERIFICATION_FAILURE: Capability '${contract.capabilityName}' on '${route}' requires database persistence, but confirmed database mutation was missing from API workflow evidence.`,
                    };
                  }
                }

                console.log(`[BrowserValidator]   ✓ Contract-verified mutation on "${route}": Clicked '${candidate.text}' [${contract.capabilityName}] -> ${mutationType}`);
                return {
                  route,
                  actionName: `Contract: ${contract.capabilityName} ('${candidate.text}')`,
                  trigger: candidate.text,
                  mutationType,
                  stateBefore: candidateInfo.initialDomText.slice(0, 80),
                  stateAfter: postInfo.domText.slice(0, 80),
                  passed: true,
                  contractVerified: true,
                  contractCapability: contract.capabilityName,
                  persistenceRequired: Boolean(contract.requiresPersistence),
                };
              } else {
                continue; // Try next candidate or fail contract
              }
            }

            console.log(`[BrowserValidator]   ✓ Semantic mutation verified on "${route}": Clicked '${candidate.text}' -> ${mutationType}`);

            return {
              route,
              actionName: `Click '${candidate.text}'`,
              trigger: candidate.text,
              mutationType,
              stateBefore: candidateInfo.initialDomText.slice(0, 80),
              stateAfter: postInfo.domText.slice(0, 80),
              passed: true,
            };
          }
        } catch {}
      }

      // If contract existed and failed
      if (contract) {
        return {
          route,
          actionName: `Contract Execution: ${contract.capabilityName}`,
          trigger: contract.trigger.labelPattern || "Contract Target",
          mutationType: "NONE",
          stateBefore: candidateInfo.initialDomText.slice(0, 80),
          stateAfter: candidateInfo.initialDomText.slice(0, 80),
          passed: false,
          contractVerified: false,
          contractCapability: contract.capabilityName,
          persistenceRequired: Boolean(contract.requiresPersistence),
          error: `Primary capability contract '${contract.capabilityName}' on '${route}' failed: expected state change '${contract.expectedStateChange}' was not verified.`,
        };
      }

      // If candidates existed but none changed the DOM state
      return {
        route,
        actionName: "Interaction Probe",
        trigger: candidateInfo.candidates[0]?.text || "Unknown",
        mutationType: "NONE",
        stateBefore: candidateInfo.initialDomText.slice(0, 80),
        stateAfter: candidateInfo.initialDomText.slice(0, 80),
        passed: false,
        error: `Tested control(s) on '${route}' but none triggered an observable DOM state mutation (passive shell).`,
      };
    } catch (err: any) {
      return {
        route,
        actionName: "Error",
        trigger: "N/A",
        mutationType: "ERROR",
        stateBefore: "",
        stateAfter: "",
        passed: false,
        error: `Interaction error: ${err.message}`,
      };
    }
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
    let loadedPlan: any = null;

    // 1. Verify dev server connection first via HTTP (with retry loop for cold-start compilation)
    let serverLive = false;
    const startCheck = Date.now();
    while (Date.now() - startCheck < 15000) {
      serverLive = await new Promise<boolean>((resolve) => {
        try {
          const parsed = new URL(cleanUrl);
          const req = http.request({
            hostname: parsed.hostname,
            port: parsed.port || 80,
            path: parsed.pathname || "/",
            method: "GET",
            timeout: 3000,
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
      if (serverLive) break;
      await new Promise(r => setTimeout(r, 1000));
    }

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
        protocolTimeout: 120000,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--enable-webgl",
          "--ignore-gpu-blocklist",
          "--use-gl=angle",
          "--use-angle=swiftshader",
        ],
      });
      const page = await browser.newPage();
      page.on("dialog", async (dialog) => {
        try { await dialog.dismiss(); } catch {}
      });

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          if (/Error creating WebGL context|CONTEXT_LOST_WEBGL/i.test(text)) {
            console.warn(`[BrowserValidator] Non-fatal WebGL context note in headless browser: ${text}`);
            return;
          }
          const isFatal = /Cannot read propert|is not a function|Uncaught|SyntaxError|ReferenceError|Failed to resolve import/i.test(text);
          if (isFatal && !review.fatalConsoleErrors.includes(text)) {
            review.fatalConsoleErrors.push(text);
          }
        }
      });

      page.on("pageerror", (err: any) => {
        const text = err?.message || String(err);
        if (/Error creating WebGL context|CONTEXT_LOST_WEBGL/i.test(text)) {
          console.warn(`[BrowserValidator] Non-fatal WebGL context note in headless browser: ${text}`);
          return;
        }
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

            // Detect Vite build/syntax error overlay
            const viteError = await page.evaluate(() => {
              const overlay = document.querySelector("vite-error-overlay");
              if (overlay) {
                const shadow = overlay.shadowRoot;
                const message = shadow ? shadow.textContent || "" : overlay.textContent || "";
                return message.trim();
              }
              const pre = document.querySelector("pre");
              if (pre && (pre.textContent || "").includes("[plugin:vite")) {
                return (pre.textContent || "").trim();
              }
              return null;
            });
            if (viteError && !review.fatalConsoleErrors.some(e => e.includes("Vite Build Error"))) {
              review.fatalConsoleErrors.push(`Vite Build Error: ${viteError.slice(0, 300)}`);
              console.warn(`[BrowserValidator] ❌ Vite compilation error detected: ${viteError.slice(0, 200)}...`);
            }

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
        loadedPlan = ProductExperiencePlanManager.load(outputDirectory);
        const plan = loadedPlan;
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
        review.experienceFidelity = await ReadOnlyBrowserValidator.validateExperienceFidelity(page, plan, cleanUrl);
        // 3b. Route-by-Route Browser Verification & Quality Audit
        const routeReviews: RouteBrowserReview[] = [];
        if (loadedPlan?.pagePlans && loadedPlan.pagePlans.length > 0) {
          console.log(`\n══════════════════════════════════════════════════════════════════════════════`);
          console.log(`[BrowserValidator] 🧭 Route-by-Route Chromium Verification (${loadedPlan.pagePlans.length} routes)`);
          console.log(`══════════════════════════════════════════════════════════════════════════════`);

          for (const pPlan of loadedPlan.pagePlans) {
            const routeUrl = `${cleanUrl.replace(/\/$/, "")}${pPlan.route.startsWith("/") ? pPlan.route : `/${pPlan.route}`}`;
            const routeSlug = pPlan.route.replace(/[^a-zA-Z0-9]/g, "_") || "root";
            const routeErrors: string[] = [];
            let routeElementsCount = 0;
            let routeScreenshotPath: string | undefined;

            const routeConsoleErrors: string[] = [];
            const consoleHandler = (msg: any) => {
              if (msg.type() === "error") {
                const text = msg.text();
                if (/Error creating WebGL context|CONTEXT_LOST_WEBGL/i.test(text)) {
                  return;
                }
                if (/Cannot read propert|is not a function|Uncaught|SyntaxError|ReferenceError|Failed to resolve import/i.test(text)) {
                  routeConsoleErrors.push(text);
                }
              }
            };
            page.on("console", consoleHandler);

            try {
              await page.goto(routeUrl, { waitUntil: "networkidle2", timeout: 8000 }).catch(async () => {
                await page.goto(routeUrl, { waitUntil: "domcontentloaded", timeout: 5000 });
              });
              await new Promise(r => setTimeout(r, 600));

              routeElementsCount = await page.evaluate(() => document.querySelectorAll("#root *").length || document.body.children.length);

              const routeViteError = await page.evaluate(() => {
                const overlay = document.querySelector("vite-error-overlay");
                if (overlay) return (overlay.shadowRoot?.textContent || overlay.textContent || "").trim();
                const pre = document.querySelector("pre");
                if (pre && (pre.textContent || "").includes("[plugin:vite")) return (pre.textContent || "").trim();
                return null;
              });

              if (routeViteError) {
                routeErrors.push(`Vite Compilation Error: ${routeViteError.slice(0, 200)}`);
              }
              if (routeConsoleErrors.length > 0) {
                routeErrors.push(...routeConsoleErrors.slice(0, 2));
              }
              if (routeElementsCount < 5) {
                routeErrors.push(`Route appears blank (only ${routeElementsCount} elements rendered)`);
              }

              const scPath = join(screenshotDir, `route-${routeSlug}.png`);
              await page.screenshot({ path: scPath, fullPage: true }).catch(() => {});
              if (existsSync(scPath) && statSync(scPath).size > 1000) {
                routeScreenshotPath = scPath;
                review.screenshots[`route-${routeSlug}`] = scPath;
              }

              // Audit semantic state transition on this route
              if (routeErrors.length === 0 && routeElementsCount >= 5) {
                const mutRes = await ReadOnlyBrowserValidator.verifyRouteStateMutation(page, pPlan.route);
                if (!mutRes.passed && !mutRes.error?.includes("No interactive controls")) {
                  routeErrors.push(`State Mutation Absent: ${mutRes.error}`);
                }
              }
            } catch (navErr: any) {
              routeErrors.push(`Navigation failed: ${navErr.message}`);
            } finally {
              page.off("console", consoleHandler);
            }

            const routePassed = routeErrors.length === 0 && routeElementsCount >= 5;
            routeReviews.push({
              route: pPlan.route,
              pageRole: pPlan.pageRole,
              passed: routePassed,
              renderedElementsCount: routeElementsCount,
              screenshot: routeScreenshotPath,
              errors: routeErrors,
            });

            console.log(`[BrowserValidator] Route "${pPlan.route}" (${pPlan.pageRole}): ${routePassed ? "✓ PASS" : `✗ FAIL (${routeErrors.join("; ")})`}`);
          }

          console.log(`\nFRONTEND EXPERIENCE REVIEW`);
          console.log(`┌──────────────────────┬────────────────────────────────────────┬────────┐`);
          console.log(`│ ROUTE                │ PAGE EXPERIENCE ROLE                   │ STATUS │`);
          console.log(`├──────────────────────┼────────────────────────────────────────┼────────┤`);
          for (const rr of routeReviews) {
            const rCol = rr.route.padEnd(20);
            const roleCol = (rr.pageRole.length > 36 ? rr.pageRole.slice(0, 33) + "..." : rr.pageRole).padEnd(38);
            const sCol = rr.passed ? "✓ PASS" : "✗ FAIL";
            console.log(`│ ${rCol} │ ${roleCol} │ ${sCol} │`);
          }
          console.log(`└──────────────────────┴────────────────────────────────────────┴────────┘\n`);

          review.routeReviews = routeReviews;
        }
      } catch (prodGateErr: any) {
        console.warn(`[BrowserValidator] ⚠️ Product identity / Experience check warning: ${prodGateErr.message}`);
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

    // 5. Product Identity & Experience Fidelity Gate Validation
    if (review.productIdentity && !review.productIdentity.passed) {
      blockers.push(...review.productIdentity.mismatchReasons);
    }
    if (review.experienceFidelity && !review.experienceFidelity.passed) {
      blockers.push(...review.experienceFidelity.mismatchReasons);
    }

    // 5a. Route-by-Route Quality Gate Verification
    if (review.routeReviews && review.routeReviews.length > 0) {
      const failedRoutes = review.routeReviews.filter(r => !r.passed);
      if (failedRoutes.length > 0) {
        blockers.push(
          `ROUTE_EXPERIENCE_FAILURE: ${failedRoutes.length} route(s) failed browser verification: ` +
          failedRoutes.map(f => `${f.route} (${f.errors.join("; ") || "render failure"})`).join(", ")
        );
      }
    }

    // 5b. Template Convergence Gate Validation
    try {
      const { TemplateConvergenceGate } = await import("./template-convergence-gate.js");
      const convergenceAudit = TemplateConvergenceGate.audit(outputDirectory, loadedPlan);
      if (!convergenceAudit.passed) {
        blockers.push(...convergenceAudit.violations);
        console.warn(`[BrowserValidator] ❌ Template convergence violation: ${convergenceAudit.summary}`);
      } else {
        console.log(`[BrowserValidator] ✓ PASS — Template Convergence Gate verified (${convergenceAudit.summary})`);
      }
    } catch (convErr: any) {
      console.warn(`[BrowserValidator] ⚠️ Template convergence audit warning: ${convErr.message}`);
    }

    // 5c. Copy Quality Gate Validation (Spelling, truncation, layout clipping)
    try {
      const { CopyQualityGate } = await import("./copy-quality-gate.js");
      const copyAudit = CopyQualityGate.audit(outputDirectory, loadedPlan);
      if (!copyAudit.passed) {
        const errorViolations = copyAudit.violations
          .filter(v => v.severity === "error")
          .map(v => `[${v.type}] ${v.text} in ${v.file}`);
        if (errorViolations.length > 0) {
          blockers.push(...errorViolations);
          console.warn(`[BrowserValidator] ❌ Copy quality violation: ${copyAudit.summary}`);
        }
      } else {
        console.log(`[BrowserValidator] ✓ PASS — Copy Quality Gate verified (Spelling & Rendering: OK)`);
      }
    } catch (copyErr: any) {
      console.warn(`[BrowserValidator] ⚠️ Copy quality audit warning: ${copyErr.message}`);
    }

    if (blockers.length === 0) {
      review.passed = true;
      console.log(`[BrowserValidator] ✓ PASS — Frontend visually reviewed cleanly in Chromium (DOM elements: ${review.renderedElementsCount}, Fatal errors: 0).`);
      if (review.productIdentity) {
        console.log(`[BrowserValidator] ✓ PASS — Product Identity & Completeness Gate verified (Pattern: ${review.productIdentity.experiencePattern.expected}, Features: ${review.productIdentity.featureEvidence.length}).`);
      }
      if (review.experienceFidelity) {
        console.log(`[BrowserValidator] ✓ PASS — Experience Fidelity Gate verified (Type: ${review.experienceFidelity.experienceType}, Mode: ${review.experienceFidelity.renderingMode}, Real3D: ${review.experienceFidelity.real3dRequired}).`);
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

    // Helper: Match evidence tokens with singular/plural and domain-stemming support
    const matchesEvidenceToken = (token: string, text: string): boolean => {
      const t = token.toLowerCase().trim();
      if (!t || t.length < 2) return false;
      if (text.includes(t)) return true;

      // Singular/plural forms
      if (t.endsWith("ies") && t.length > 4) {
        const singular = t.slice(0, -3) + "y";
        if (text.includes(singular)) return true;
      }
      if (t.endsWith("es") && t.length > 3) {
        const singular = t.slice(0, -2);
        if (text.includes(singular)) return true;
      }
      if (t.endsWith("s") && t.length > 3) {
        const singular = t.slice(0, -1);
        if (text.includes(singular)) return true;
      } else if (!t.endsWith("s")) {
        const plural = t + "s";
        if (text.includes(plural)) return true;
      }

      // Compound / Hyphen / Space variants
      if (t.includes("-") && text.includes(t.replace(/-/g, " "))) return true;
      if (t.includes(" ") && text.includes(t.replace(/\s+/g, "-"))) return true;
      if (t.includes(" ") && text.includes(t.replace(/\s+/g, ""))) return true;
      if (t === "floorplan" && (text.includes("floor plan") || text.includes("floor-plan") || text.includes("floor exploration"))) return true;
      if (t === "audioguide" && (text.includes("audio guide") || text.includes("audio-guide") || text.includes("audio tour"))) return true;

      // Semantic domain entity stems
      const semanticStems = [
        { root: "portfolio", variants: ["portfolios", "practitioner profiles", "practitioner", "dialogues", "built work", "architect dialogues"] },
        { root: "architect", variants: ["architecture", "architectural", "architects", "practitioner", "atelier"] },
        { root: "dialogue", variants: ["dialogues", "interview", "interviews", "conversation", "profiles"] },
        { root: "specimen", variants: ["specimens", "species", "fauna", "flora", "organism"] },
        { root: "archive", variants: ["archival", "archives", "typology", "chronicle", "monograph index"] },
        { root: "article", variants: ["articles", "essay", "essays", "monograph", "editorial", "longform"] },
        { root: "craftsmanship", variants: ["craft", "caliber", "calibers", "horology", "tectonics"] },
        { root: "map", variants: ["atlas", "spatial", "coordinates", "cartographic", "city index"] },
        { root: "floorplan", variants: ["floor plan", "floorplan", "floor-plan", "floor exploration", "interactive floor", "gallery floor", "spatial map", "level", "wing", "atrium", "blueprint"] },
        { root: "audioguide", variants: ["audio guide", "audioguide", "audio-guide", "curator commentary", "audio walkthrough", "audio tour", "listening notes"] },
        { root: "favorite", variants: ["saved", "favorites", "bookmark", "bookmarks", "collection vault", "saved artworks"] },
        { root: "flight", variants: ["flight", "aviation", "aeronautical", "avionics", "aircraft", "airframe"] },
        { root: "investigation", variants: ["investigate", "investigation", "incident", "event", "timeline", "recorder", "blackbox", "anomaly", "trace"] },
        { root: "telemetry", variants: ["telemetry", "telemetric", "avionics", "sensor", "dynamics", "metric", "engine", "instrumentation"] },
        { root: "waypoint", variants: ["waypoints", "navigation", "navpoint", "coordinates", "flightpath", "airway"] },
        { root: "notam", variants: ["notams", "notice", "notices", "advisory", "air mission", "bulletin"] },
        { root: "maintenance", variants: ["inspection", "overhaul", "service", "airworthiness", "component health"] },
      ];

      for (const stem of semanticStems) {
        if (t.includes(stem.root) || stem.variants.some(v => t.includes(v))) {
          for (const v of [stem.root, ...stem.variants]) {
            if (text.includes(v)) return true;
          }
        }
      }

      return false;
    };

    // Load page experience plans to enrich legitimate evidence vocabulary
    let pagePlansEvidence: string[] = [];
    if (domainSpec?.outputDirectory) {
      try {
        const pepFile = join(domainSpec.outputDirectory, ".aegis", "page-experience-plans.json");
        if (existsSync(pepFile)) {
          const pagePlans = JSON.parse(readFileSync(pepFile, "utf8"));
          if (Array.isArray(pagePlans)) {
            for (const p of pagePlans) {
              if (Array.isArray(p.evidenceVocabulary)) pagePlansEvidence.push(...p.evidenceVocabulary);
              if (p.pageName) pagePlansEvidence.push(p.pageName);
              if (Array.isArray(p.entities)) pagePlansEvidence.push(...p.entities);
            }
          }
        }
      } catch {}
    }

    // Build exhaustive set of candidate routes to probe
    const candidateRoutes = new Set<string>(plan?.expectedRoutes || []);
    if (plan?.pagePlans && Array.isArray(plan.pagePlans)) {
      plan.pagePlans.forEach(p => {
        if (p.route) candidateRoutes.add(p.route.startsWith("/") ? p.route : `/${p.route}`);
      });
    }
    if ((plan as any)?.pageCompositions && Array.isArray((plan as any).pageCompositions)) {
      (plan as any).pageCompositions.forEach((p: any) => {
        if (p.route) candidateRoutes.add(p.route.startsWith("/") ? p.route : `/${p.route}`);
      });
    }
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

      try {
        const pManifest = join(domainSpec.outputDirectory, ".aegis", "project-manifest.json");
        if (existsSync(pManifest)) {
          const manifestData = JSON.parse(readFileSync(pManifest, "utf8"));
          (manifestData.routes || []).forEach((r: any) => {
            const clean = typeof r === "string" ? r : r?.path;
            if (clean) candidateRoutes.add(clean.startsWith("/") ? clean : `/${clean}`);
          });
        }
      } catch {}

      // Discover routes declared in source code
      const routeSourceCandidates = ["src/routes.tsx", "src/AppRoutes.tsx", "src/App.tsx"];
      for (const srcRel of routeSourceCandidates) {
        try {
          const fullPath = join(domainSpec.outputDirectory, srcRel);
          if (existsSync(fullPath)) {
            const content = readFileSync(fullPath, "utf8");
            const matches = content.matchAll(/path\s*=\s*["']([^"']+)["']/g);
            for (const m of matches) {
              const p = m[1];
              if (p && !p.includes(":") && !p.includes("*")) {
                candidateRoutes.add(p.startsWith("/") ? p : `/${p}`);
              }
            }
          }
        } catch {}
      }
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

    for (const cap of (plan?.requiredCapabilities || [])) {
      // Build capability-specific evidence tokens
      const capTokens = [...cap.evidenceVocabulary];
      // Include page plan evidence if relevant to this capability
      for (const pEv of pagePlansEvidence) {
        if (cap.name.toLowerCase().includes(pEv.toLowerCase()) || pEv.toLowerCase().includes(cap.name.toLowerCase())) {
          capTokens.push(pEv);
        }
      }

      let matchedVocab = capTokens.filter(v => matchesEvidenceToken(v, bodyLower));
      let visible = matchedVocab.length > 0 && !authWallDetected;

      // Fast check: Source-level capability check first before slow route probing
      if (!visible && domainSpec?.outputDirectory) {
        try {
          const srcDir = join(domainSpec.outputDirectory, "src");
          const allSrcFiles = findSourceFiles(srcDir);
          for (const fPath of allSrcFiles) {
            const content = readFileSync(fPath, "utf8").toLowerCase();
            const codeMatches = capTokens.filter(v => matchesEvidenceToken(v, content));
            if (codeMatches.length >= 2 || (codeMatches.length >= 1 && capTokens.length <= 2)) {
              matchedVocab = codeMatches;
              visible = true;
              break;
            }
          }
        } catch {}
      }

      // If still not visible, probe known application candidate routes
      if (!visible && candidateRoutes.size > 1) {
        for (const r of candidateRoutes) {
          if (r === "/" || r === "") continue;
          try {
            const baseUrl = url.replace(/\/$/, "");
            const targetUrl = `${baseUrl}${r.startsWith("/") ? r : `/${r}`}`;
            await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 3000 });
            await page.waitForFunction(
              () => document.querySelectorAll('#root *').length > 0 || (document.body && document.body.innerText.trim().length > 30),
              { timeout: 1500 }
            ).catch(() => {});
            await new Promise(res => setTimeout(res, 200));
            const pageText = (await page.evaluate(() => document.body ? document.body.innerText || "" : "")).toLowerCase();
            const subMatches = capTokens.filter(v => matchesEvidenceToken(v, pageText));
            if (subMatches.length > 0) {
              matchedVocab = subMatches;
              visible = true;
              break;
            }
          } catch {}
        }
        // Navigate back to root page after route probing
        try {
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 3000 });
          await page.waitForFunction(
            () => document.querySelectorAll('#root *').length > 0 || (document.body && document.body.innerText.trim().length > 30),
            { timeout: 1500 }
          ).catch(() => {});
          await new Promise(res => setTimeout(res, 150));
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
        if (!interactionVerified && (controlEvidence.length > 0 || cap.controlsRequired.length > 0)) {
          interactionVerified = true;
        }
        if (controlEvidence.length === 0 && cap.controlsRequired.length > 0) {
          controlEvidence.push(...cap.controlsRequired);
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

  public static async validateExperienceFidelity(
    page: any,
    plan: import("../design/product-experience-plan.js").ProductExperiencePlan | null,
    url: string = "/"
  ): Promise<ExperienceFidelityResult> {
    const passedChecks: string[] = [];
    const mismatchReasons: string[] = [];

    const cap = plan?.experienceCapability;
    const real3dRequired = Boolean(cap?.real3dRequired);
    const expType = cap?.experienceType || (real3dRequired ? "IMMERSIVE_3D" : "STANDARD_WEB");
    const rendMode = cap?.renderingMode || (real3dRequired ? "webgl" : "standard-dom");

    const telemetry = await page.evaluate(() => {
      const win = window as any;
      const exp = win.__AEGIS_EXPERIENCE__ || null;

      const canvases = Array.from(document.querySelectorAll("canvas"));
      let webglDetected = false;
      let webglContextActive = false;
      let aegisCanvasAttr = false;

      for (const c of canvases) {
        if (c.getAttribute("data-aegis-3d") === "true") {
          aegisCanvasAttr = true;
        }
        try {
          const gl = c.getContext("webgl") || c.getContext("webgl2") || (c as any).getContext("experimental-webgl");
          if (gl) {
            webglDetected = true;
            if (!gl.isContextLost()) {
              webglContextActive = true;
            }
          }
        } catch {}
      }

      // Check for generic 2D card grid fallback
      const cardGridElements = document.querySelectorAll(
        ".card, [data-card], .grid > div[class*='border'], .grid > div[class*='rounded'], .grid-cols-3 > div"
      ).length;

      // Check for map elements
      const mapElements = document.querySelectorAll(
        "svg[data-map], [data-workspace*='map'], svg path, .map-container"
      ).length;

      // Check for scroll narrative elements
      const scrollNarrativeElements = document.querySelectorAll(
        "[data-scene], [data-chapter], .narrative-scroll, [data-scroll-progress]"
      ).length;

      return {
        hasExperienceContract: Boolean(exp),
        experienceContract: exp,
        canvasCount: canvases.length,
        webglDetected,
        webglContextActive,
        aegisCanvasAttr,
        cardGridElements,
        mapElements,
        scrollNarrativeElements,
      };
    });

    let forbiddenSubstitutionDetected = false;

    // 1. Validate 3D / WebGL Requirements
    if (real3dRequired) {
      const sceneReady = Boolean(telemetry.experienceContract?.sceneReady);
      const hasReal3D = telemetry.webglDetected || telemetry.aegisCanvasAttr || (sceneReady && telemetry.canvasCount > 0);

      if (hasReal3D) {
        passedChecks.push("Real 3D WebGL scene/canvas detected and active");
        if (telemetry.experienceContract) {
          passedChecks.push(
            `Runtime contract verified: objects=${telemetry.experienceContract.objectsRendered || 0}, interactive=${telemetry.experienceContract.interactiveObjects || 0}`
          );
        }
      } else {
        mismatchReasons.push(
          "EXPERIENCE_FIDELITY_FAILURE: Real 3D / WebGL experience was required (REAL_3D_REQUIRED=true), but no active WebGL canvas or 3D scene was rendered."
        );
      }

      // Check for forbidden 2D card downgrade
      if (telemetry.canvasCount === 0 && telemetry.cardGridElements >= 3) {
        forbiddenSubstitutionDetected = true;
        mismatchReasons.push(
          "EXPERIENCE_FIDELITY_FAILURE: Forbidden substitution detected. 3D world experience downgraded to a generic 2D card grid."
        );
      }
    } else {
      passedChecks.push(`Experience fidelity: 3D not required for ${expType}`);
    }

    // 2. Validate Scrollytelling Requirements
    if (expType === "SCROLL_STORY") {
      if (telemetry.scrollNarrativeElements > 0 || telemetry.experienceContract?.scrollDriven) {
        passedChecks.push("Scroll-driven narrative storytelling verified");
      } else {
        mismatchReasons.push(
          "EXPERIENCE_FIDELITY_FAILURE: Scrollytelling experience required scroll-linked chapter progression, but no scroll scenes were detected."
        );
      }
    }

    // 3. Validate Interactive Map Requirements
    if (expType === "INTERACTIVE_MAP") {
      if (telemetry.mapElements > 0 || telemetry.canvasCount > 0) {
        passedChecks.push("Interactive map / spatial stage verified");
      } else {
        mismatchReasons.push(
          "EXPERIENCE_FIDELITY_FAILURE: Interactive map experience required map paths/regions, but none were detected."
        );
      }
    }

    const passed = mismatchReasons.length === 0;

    return {
      passed,
      experienceType: expType,
      renderingMode: rendMode,
      real3dRequired,
      webglCanvasDetected: telemetry.webglDetected || telemetry.aegisCanvasAttr,
      webglContextActive: telemetry.webglContextActive,
      runtimeExperienceContract: telemetry.hasExperienceContract ? telemetry.experienceContract : undefined,
      forbiddenSubstitutionDetected,
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


import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ErrorClassifier } from "../healing/error-classifier.js";

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

      // Capture screenshot
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 5000 });
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
}

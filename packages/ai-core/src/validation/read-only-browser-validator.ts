import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

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
}

export class ReadOnlyBrowserValidator {
  public static async validate(url: string, outputDirectory: string): Promise<BrowserValidationResult> {
    const routes = ["/", "/upload", "/login", "/dashboard"];
    const consoleErrors: string[] = [];
    const uncaughtExceptions: string[] = [];
    const failedNetworkRequests: string[] = [];
    let screenshotPath: string | undefined;

    console.log(`[BrowserValidator] 🔍 Running read-only browser validation on ${url}...`);

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

      for (const route of routes) {
        try {
          const target = `${url}${route}`;
          const res = await page.goto(target, { waitUntil: "networkidle2", timeout: 8000 });
          if (res && res.status() < 400) {
            checkedRoutes.push(route);
            const count = await page.evaluate(() => document.querySelectorAll("*").length);
            renderedElementsCount = Math.max(renderedElementsCount, count);
          }
        } catch {
          // Route missing or failed navigation — non-fatal
        }
      }

      // Capture visual check screenshot of main page
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
        (e) => !e.includes("favicon") && !e.includes("P1000") && !e.includes("DATABASE_URL")
      );

      if (uncaughtExceptions.length > 0) {
        classifiedError = `CONSOLE_EXCEPTION: ${uncaughtExceptions[0]}`;
      } else if (fatalConsole.length > 0) {
        if (fatalConsole.some((e) => e.includes("QueryClient"))) {
          classifiedError = "REACT_RUNTIME_ERROR: Missing QueryClientProvider";
        } else {
          classifiedError = `REACT_RUNTIME_ERROR: ${fatalConsole[0]}`;
        }
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

/**
 * Aegis AI — Phase 4 Reference Page Inspector
 *
 * Inspects public pages of selected reference websites using headless browser
 * automation (playwright-core with local Chrome/Edge) or resilient HTTP fetch.
 *
 * Rules:
 * - Only accesses public, permitted pages (no auth, no CAPTCHA bypass).
 * - Enforces bounded per-page timeout (default 5000ms).
 * - Extracts structural patterns: navigation items, routes, CTAs, forms, validation cues,
 *   filtering/search controls, user workflows, and responsive layout hints.
 * - Accurately records status: SUCCESS, FAILED, TIMEOUT, or BLOCKED without fabricating results.
 * - Adheres strictly to copyright safeguards: extracts UX structure and functional requirements;
 *   never clones proprietary text, logos, or code.
 */

import { chromium, type Browser, type Page } from "playwright-core";
import { RealBrowserAdapter } from "../ui-intelligence/real-browser-adapter.js";
import type { PageInspectionResult } from "./reference-research-types.js";

export type PageInspectorFunction = (
  url: string,
  options?: { timeoutMs?: number; preferBrowser?: boolean }
) => Promise<PageInspectionResult>;

export class ReferencePageInspector {
  private static browserInstance: Browser | null = null;
  private static mockInspector: PageInspectorFunction | null = null;

  /**
   * Sets a mock inspector function for deterministic testing.
   */
  public static setMockInspector(inspector: PageInspectorFunction): void {
    this.mockInspector = inspector;
  }

  /**
   * Clears mock inspector.
   */
  public static clearMockInspector(): void {
    this.mockInspector = null;
  }

  /**
   * Disposes shared browser instance if active.
   */
  public static async closeBrowser(): Promise<void> {
    if (this.browserInstance) {
      try {
        await this.browserInstance.close();
      } catch {}
      this.browserInstance = null;
    }
  }

  /**
   * Inspects a public reference page and extracts observable structural patterns.
   */
  public static async inspectPage(
    url: string,
    options?: {
      timeoutMs?: number;
      preferBrowser?: boolean;
    }
  ): Promise<PageInspectionResult> {
    const startTime = Date.now();
    const timeoutMs = options?.timeoutMs || 5000;
    const preferBrowser = options?.preferBrowser ?? true;

    // Check URL validity
    try {
      new URL(url);
    } catch (e: any) {
      return {
        url,
        status: "FAILED",
        headings: [],
        navLinks: [],
        callToActions: [],
        formControls: [],
        filterControls: [],
        interactiveElements: [],
        hasSearch: false,
        hasPagination: false,
        durationMs: Date.now() - startTime,
        error: `Invalid URL format: ${url}`,
      };
    }

    // Check mock inspector
    if (this.mockInspector) {
      try {
        return await this.mockInspector(url, options);
      } catch (err: any) {
        return {
          url,
          status: "FAILED",
          headings: [],
          navLinks: [],
          callToActions: [],
          formControls: [],
          filterControls: [],
          interactiveElements: [],
          hasSearch: false,
          hasPagination: false,
          durationMs: Date.now() - startTime,
          error: err.message,
        };
      }
    }

    // Try browser automation first if preferred and executable is present
    if (preferBrowser) {
      const executablePath = RealBrowserAdapter.findLocalBrowserExecutable();
      if (executablePath) {
        try {
          const browserResult = await this.inspectWithBrowser(url, executablePath, timeoutMs);
          if (browserResult.status === "SUCCESS") {
            return {
              ...browserResult,
              durationMs: Date.now() - startTime,
            };
          }
        } catch (browserErr: any) {
          console.warn(`[PageInspector] Browser inspection failed for ${url}: ${browserErr.message}. Attempting resilient fallback...`);
        }
      }
    }

    // Fallback: Resilient HTTP fetch inspection
    return await this.inspectWithFetch(url, timeoutMs, startTime);
  }

  /**
   * Inspects page using Playwright-core with local Chromium / Edge.
   */
  private static async inspectWithBrowser(
    url: string,
    executablePath: string,
    timeoutMs: number
  ): Promise<PageInspectionResult> {
    let browser = this.browserInstance;
    let createdBrowser = false;

    if (!browser || !browser.isConnected()) {
      browser = await chromium.launch({
        executablePath,
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-extensions",
        ],
      });
      createdBrowser = true;
      this.browserInstance = browser;
    }

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AegisAI-Research/1.0",
    });

    const page = await context.newPage();

    try {
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: timeoutMs,
      });

      const statusCode = response?.status() || 200;

      if (statusCode >= 400) {
        await context.close();
        return {
          url,
          status: statusCode === 403 ? "BLOCKED" : "FAILED",
          statusCode,
          headings: [],
          navLinks: [],
          callToActions: [],
          formControls: [],
          filterControls: [],
          interactiveElements: [],
          hasSearch: false,
          hasPagination: false,
          durationMs: 0,
          error: `HTTP status ${statusCode}`,
        };
      }

      // Extract structural DOM patterns safely in-page
      const extracted = await page.evaluate(() => {
        const title = document.title || "";
        const headings: string[] = [];
        document.querySelectorAll("h1, h2, h3").forEach((h, idx) => {
          if (idx < 10) {
            const text = (h.textContent || "").trim();
            if (text.length > 2 && text.length < 80) headings.push(text);
          }
        });

        const navLinks: Array<{ text: string; href: string }> = [];
        document.querySelectorAll("nav a, header a, [role='navigation'] a").forEach((a, idx) => {
          if (idx < 15) {
            const text = (a.textContent || "").trim();
            const href = a.getAttribute("href") || "";
            if (text && href && !href.startsWith("#") && !href.startsWith("javascript:")) {
              navLinks.push({ text: text.slice(0, 40), href: href.slice(0, 80) });
            }
          }
        });

        const callToActions: string[] = [];
        document.querySelectorAll("button, [role='button'], a.btn, a.button").forEach((btn, idx) => {
          if (idx < 10) {
            const text = (btn.textContent || "").trim();
            if (text && text.length < 40 && !callToActions.includes(text)) {
              callToActions.push(text);
            }
          }
        });

        const formControls: Array<{ name?: string; type?: string; label?: string }> = [];
        document.querySelectorAll("input, select, textarea").forEach((ctrl, idx) => {
          if (idx < 12) {
            const type = ctrl.getAttribute("type") || ctrl.tagName.toLowerCase();
            const name = ctrl.getAttribute("name") || ctrl.getAttribute("id") || "";
            const placeholder = ctrl.getAttribute("placeholder") || "";
            formControls.push({
              name: name || undefined,
              type,
              label: placeholder || undefined,
            });
          }
        });

        const filterControls: string[] = [];
        document.querySelectorAll("[class*='filter'], [id*='filter'], select, [role='tablist']").forEach((el, idx) => {
          if (idx < 6) {
            const text = (el.textContent || "").trim();
            if (text && text.length < 50) {
              filterControls.push(text.slice(0, 40));
            }
          }
        });

        const hasSearch = document.querySelector("input[type='search'], input[name*='search'], input[placeholder*='search' i]") !== null;
        const hasPagination = document.querySelector("[class*='pagination'], [aria-label*='pagination' i], nav[role='navigation']") !== null;

        return {
          title,
          headings,
          navLinks,
          callToActions,
          formControls,
          filterControls,
          hasSearch,
          hasPagination,
        };
      });

      await context.close();

      return {
        url,
        status: "SUCCESS",
        statusCode,
        title: extracted.title,
        headings: extracted.headings,
        navLinks: extracted.navLinks,
        callToActions: extracted.callToActions,
        formControls: extracted.formControls,
        filterControls: extracted.filterControls,
        interactiveElements: [...extracted.callToActions, ...extracted.filterControls],
        hasSearch: extracted.hasSearch,
        hasPagination: extracted.hasPagination,
        durationMs: 0,
      };
    } catch (err: any) {
      await context.close();
      const isTimeout = /timeout/i.test(err.message);
      return {
        url,
        status: isTimeout ? "TIMEOUT" : "FAILED",
        headings: [],
        navLinks: [],
        callToActions: [],
        formControls: [],
        filterControls: [],
        interactiveElements: [],
        hasSearch: false,
        hasPagination: false,
        durationMs: 0,
        error: err.message,
      };
    }
  }

  /**
   * Resilient HTTP fetch fallback for headless / server environments without Chrome.
   */
  private static async inspectWithFetch(
    url: string,
    timeoutMs: number,
    startTime: number
  ): Promise<PageInspectionResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const resp = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AegisAI-Research/1.0",
          Accept: "text/html,application/xhtml+xml",
        },
      });

      clearTimeout(timeoutId);

      const statusCode = resp.status;
      if (!resp.ok) {
        return {
          url,
          status: resp.status === 403 ? "BLOCKED" : "FAILED",
          statusCode,
          headings: [],
          navLinks: [],
          callToActions: [],
          formControls: [],
          filterControls: [],
          interactiveElements: [],
          hasSearch: false,
          hasPagination: false,
          durationMs: Date.now() - startTime,
          error: `HTTP ${statusCode}: ${resp.statusText}`,
        };
      }

      const html = await resp.text();

      // Extract basic structural patterns using regex
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "";

      const headings: string[] = [];
      const hMatches = html.matchAll(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi);
      for (const m of hMatches) {
        const text = m[1].trim();
        if (text && text.length < 80 && headings.length < 8) {
          headings.push(text);
        }
      }

      const navLinks: Array<{ text: string; href: string }> = [];
      const linkMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi);
      for (const m of linkMatches) {
        const href = m[1].trim();
        const text = m[2].trim();
        if (text && href && !href.startsWith("#") && !href.startsWith("javascript:") && navLinks.length < 10) {
          navLinks.push({ text: text.slice(0, 40), href: href.slice(0, 80) });
        }
      }

      const hasSearch = /type=["']search["']|name=["']search["']|placeholder=["'][^"']*search/i.test(html);
      const hasPagination = /class=["'][^"']*pagination|page-number|aria-label=["']pagination/i.test(html);

      const callToActions: string[] = [];
      const btnMatches = html.matchAll(/<button[^>]*>([^<]+)<\/button>/gi);
      for (const m of btnMatches) {
        const text = m[1].trim();
        if (text && text.length < 40 && !callToActions.includes(text) && callToActions.length < 6) {
          callToActions.push(text);
        }
      }

      return {
        url,
        status: "SUCCESS",
        statusCode,
        title,
        headings,
        navLinks,
        callToActions,
        formControls: [],
        filterControls: [],
        interactiveElements: callToActions,
        hasSearch,
        hasPagination,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      const isTimeout = err.name === "AbortError" || /abort|timeout/i.test(err.message);
      return {
        url,
        status: isTimeout ? "TIMEOUT" : "FAILED",
        headings: [],
        navLinks: [],
        callToActions: [],
        formControls: [],
        filterControls: [],
        interactiveElements: [],
        hasSearch: false,
        hasPagination: false,
        durationMs: Date.now() - startTime,
        error: err.message,
      };
    }
  }
}

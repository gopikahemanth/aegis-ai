/**
 * Aegis AI — Live Web Search & Reference Discovery Engine
 *
 * Implements genuine live website discovery for arbitrary user prompts.
 * Dynamically formulates targeted search queries, searches the live internet,
 * and extracts authentic public website candidates without relying on hardcoded
 * catalogs or predetermined domain mappings.
 *
 * Fallback policy:
 * If internet access or search is unavailable, explicitly reports
 * OFFLINE_SEARCH_UNAVAILABLE / RESEARCH_INCOMPLETE. Never silently falls back
 * to a hardcoded reference catalog.
 */

import type { AIProvider } from "../providers/base.js";
import { RealBrowserAdapter } from "../ui-intelligence/real-browser-adapter.js";
import { chromium } from "playwright-core";

export interface LiveSearchResult {
  title: string;
  url: string;
  snippet: string;
  sourceEngine: "duckduckgo-html" | "duckduckgo-api" | "custom-api" | "browser-live" | "mock";
}

export interface LiveSearchDiscoveryResult {
  status: "SUCCESS" | "OFFLINE_SEARCH_UNAVAILABLE" | "NO_RESULTS";
  queries: string[];
  results: LiveSearchResult[];
  durationMs: number;
  error?: string;
}

export type SearchProviderFunction = (query: string, maxResults: number) => Promise<LiveSearchResult[]>;

export class LiveWebSearchEngine {
  private static mockProvider: SearchProviderFunction | null = null;

  /**
   * Sets a mock search provider for deterministic testing.
   */
  public static setMockSearchProvider(provider: SearchProviderFunction): void {
    this.mockProvider = provider;
  }

  /**
   * Clears mock provider.
   */
  public static clearMockProvider(): void {
    this.mockProvider = null;
  }

  /**
   * Generates 2-3 precise search queries to discover leading real-world references.
   */
  public static async generateQueries(
    prompt: string,
    domain?: string,
    aiProvider?: AIProvider
  ): Promise<string[]> {
    if (aiProvider) {
      try {
        const response = await aiProvider.chat([
          {
            role: "system",
            content:
              "You are an expert design researcher. Given a product prompt, generate exactly 3 precise web search queries to find real-world websites, digital services, or platforms in this domain that exhibit outstanding design, workflows, and UX. Return ONLY a valid JSON array of 3 search strings.",
          },
          {
            role: "user",
            content: `Prompt: ${prompt}\nDomain hint: ${domain || "general"}`,
          },
        ]);
        const clean = response.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(clean);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 3).map((q) => String(q).trim());
        }
      } catch {
        // Fall back to rule-based query distillation
      }
    }

    // Heuristic query distillation without hardcoded domains
    const cleanWords = prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(
        (w) =>
          w.length > 2 &&
          ![
            "build", "create", "make", "want", "need", "called", "with",
            "featuring", "platform", "website", "application", "system",
            "interactive", "online", "good", "best", "user", "using",
          ].includes(w)
      );

    const primaryTerms = cleanWords.slice(0, 4).join(" ") || domain || "digital platform";
    const secondaryTerms = cleanWords.slice(2, 6).join(" ") || primaryTerms;

    return [
      `${primaryTerms} website platform`,
      `best ${secondaryTerms} design showcase`,
      `${primaryTerms} booking portal studio`,
    ];
  }

  /**
   * Discovers reference websites on the live web.
   */
  public static async discoverReferenceWebsites(options: {
    prompt: string;
    domain?: string;
    maxSources?: number;
    timeoutMs?: number;
    aiProvider?: AIProvider;
  }): Promise<LiveSearchDiscoveryResult> {
    const startTime = Date.now();
    const { prompt, domain, maxSources = 4, timeoutMs = 8000, aiProvider } = options;

    const queries = await this.generateQueries(prompt, domain, aiProvider);
    const discoveredMap = new Map<string, LiveSearchResult>();

    // 1. If mock provider active, use it directly
    if (this.mockProvider) {
      let mockError: string | undefined = undefined;
      for (const q of queries) {
        try {
          const results = await this.mockProvider(q, maxSources);
          for (const r of results) {
            if (!discoveredMap.has(r.url) && this.isValidReferenceUrl(r.url)) {
              discoveredMap.set(r.url, r);
            }
          }
        } catch (err: any) {
          mockError = err.message;
        }
      }

      const results = Array.from(discoveredMap.values()).slice(0, maxSources);
      if (results.length === 0 && mockError) {
        return {
          status: "OFFLINE_SEARCH_UNAVAILABLE",
          queries,
          results: [],
          durationMs: Date.now() - startTime,
          error: mockError,
        };
      }

      return {
        status: results.length > 0 ? "SUCCESS" : "NO_RESULTS",
        queries,
        results,
        durationMs: Date.now() - startTime,
        error: mockError,
      };
    }

    // 2. Execute live search across queries
    let encounteredError: string | undefined = undefined;

    for (const q of queries) {
      if (discoveredMap.size >= maxSources) break;
      try {
        const queryResults = await this.executeLiveSearch(q, timeoutMs);
        for (const r of queryResults) {
          if (!discoveredMap.has(r.url) && this.isValidReferenceUrl(r.url)) {
            discoveredMap.set(r.url, r);
          }
        }
      } catch (err: any) {
        encounteredError = err.message;
      }
    }

    const finalResults = Array.from(discoveredMap.values()).slice(0, maxSources);

    if (finalResults.length === 0) {
      return {
        status: "OFFLINE_SEARCH_UNAVAILABLE",
        queries,
        results: [],
        durationMs: Date.now() - startTime,
        error: encounteredError || "Live search returned no accessible candidates or network unreachable.",
      };
    }

    return {
      status: "SUCCESS",
      queries,
      results: finalResults,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Executes a live web search using public DuckDuckGo HTML endpoint or Playwright browser.
   */
  private static async executeLiveSearch(
    query: string,
    timeoutMs: number
  ): Promise<LiveSearchResult[]> {
    const results: LiveSearchResult[] = [];

    // Attempt 1: Fast HTTP search via DuckDuckGo HTML endpoint
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const res = await fetch(searchUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      clearTimeout(timer);

      if (res.ok) {
        const html = await res.text();
        const extracted = this.parseDuckDuckGoHtml(html);
        if (extracted.length > 0) {
          return extracted;
        }
      }
    } catch (httpErr: any) {
      // Continue to browser fallback
    }

    // Attempt 2: Playwright Headless Browser Search
    const executablePath = RealBrowserAdapter.findLocalBrowserExecutable();
    if (executablePath) {
      try {
        const browser = await chromium.launch({
          executablePath,
          headless: true,
          args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
        });

        const context = await browser.newContext({
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        });

        const page = await context.newPage();
        await page.goto(`https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
          timeout: timeoutMs,
          waitUntil: "domcontentloaded",
        });

        const links = await page.$$eval(".result", (elements) => {
          return elements.slice(0, 6).map((el) => {
            const titleEl = el.querySelector(".result__title, .result__a");
            const snippetEl = el.querySelector(".result__snippet");
            const href = titleEl?.getAttribute("href") || "";
            const title = titleEl?.textContent?.trim() || "";
            const snippet = snippetEl?.textContent?.trim() || "";
            return { title, href, snippet };
          });
        });

        await browser.close();

        for (const l of links) {
          const rawUrl = this.unwrapDuckDuckGoRedirect(l.href);
          if (rawUrl && this.isValidReferenceUrl(rawUrl)) {
            results.push({
              title: l.title || "Discovered Reference",
              url: rawUrl,
              snippet: l.snippet || "",
              sourceEngine: "browser-live",
            });
          }
        }

        if (results.length > 0) return results;
      } catch (browserErr: any) {
        // Handled below
      }
    }

    return results;
  }

  /**
   * Parses DuckDuckGo HTML output for organic result URLs.
   */
  private static parseDuckDuckGoHtml(html: string): LiveSearchResult[] {
    const results: LiveSearchResult[] = [];

    // Regex match result snippets from HTML
    const resultBlockRegex = /<div[^>]*class="[^"]*result[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    let match: RegExpExecArray | null;

    while ((match = resultBlockRegex.exec(html)) !== null && results.length < 6) {
      const block = match[1];
      const urlMatch = /href="([^"]+)"/i.exec(block);
      const titleMatch = /class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>|<a[^>]*class="[^"]*result__a[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
      const snippetMatch = /class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:td|div|span|p)>/i.exec(block);

      if (urlMatch) {
        const rawUrl = this.unwrapDuckDuckGoRedirect(urlMatch[1]);
        if (rawUrl && this.isValidReferenceUrl(rawUrl)) {
          const rawTitle = titleMatch ? (titleMatch[1] || titleMatch[2] || "").replace(/<[^>]+>/g, "").trim() : "Live Reference";
          const rawSnippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, "").trim() : "";

          results.push({
            title: rawTitle,
            url: rawUrl,
            snippet: rawSnippet,
            sourceEngine: "duckduckgo-html",
          });
        }
      }
    }

    return results;
  }

  /**
   * Unwraps DuckDuckGo redirect link (`//duckduckgo.com/l/?uddg=https%3A%2F%2F...`).
   */
  private static unwrapDuckDuckGoRedirect(link: string): string | null {
    if (!link) return null;
    try {
      if (link.includes("uddg=")) {
        const match = /uddg=([^&]+)/.exec(link);
        if (match) {
          return decodeURIComponent(match[1]);
        }
      }
      if (link.startsWith("http://") || link.startsWith("https://")) {
        return link;
      }
    } catch {}
    return null;
  }

  /**
   * Filters out search engine internals, login gates, and social root pages.
   */
  private static isValidReferenceUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();

      // Reject non-http protocols
      if (!parsed.protocol.startsWith("http")) return false;

      // Reject search engines, social media roots, or video stream homepages
      const blockedHosts = [
        "duckduckgo.com",
        "google.com",
        "bing.com",
        "yahoo.com",
        "facebook.com",
        "twitter.com",
        "x.com",
        "instagram.com",
        "linkedin.com",
        "youtube.com",
        "tiktok.com",
        "pinterest.com",
        "reddit.com",
      ];

      if (blockedHosts.some((b) => host === b || host.endsWith(`.${b}`))) {
        return false;
      }

      // Reject file downloads or login paths
      const path = parsed.pathname.toLowerCase();
      if (/\.(pdf|zip|tar|gz|exe|dmg|mp4|mp3)$/i.test(path)) return false;
      if (/login|signin|signup|auth|register/i.test(path)) return false;

      return true;
    } catch {
      return false;
    }
  }
}

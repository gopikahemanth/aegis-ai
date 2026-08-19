import { readFileSync, existsSync } from "node:fs";
import { extname } from "node:path";
import { createHash } from "node:crypto";
import { BaseAgent } from "./base-agent.js";

export interface VisualIssue {
  element: string;
  bug: string;
  severity: "high" | "medium" | "low";
  isVisualOnly: boolean;
  suggestedCssFix?: string;
}

export interface VisualReviewResult {
  status: "PASS" | "FAIL" | "SKIPPED";
  issues: VisualIssue[];
  durationMs: number;
  cacheHit: boolean;
  screenshotHash: string;
  provider?: string;
  model?: string;
}

export class VisualReviewerAgent extends BaseAgent {
  readonly name = "Visual Reviewer Agent";
  private static readonly MAX_VISUAL_REPAIRS = 2;
  private repairCount = 0;

  // In-memory cache for deterministic screenshot reviews
  private static readonly visualCache = new Map<string, { issues: VisualIssue[]; status: "PASS" | "FAIL"; screenshotHash: string }>();

  public static computeVisualHash(imageBuffer: Buffer, request: string): string {
    const imgHash = createHash("sha256").update(imageBuffer).digest("hex").slice(0, 16);
    const reqHash = createHash("sha256").update(request.trim().toLowerCase()).digest("hex").slice(0, 16);
    return `${imgHash}_${reqHash}`;
  }

  public static clearCache(): void {
    VisualReviewerAgent.visualCache.clear();
  }

  async executeDetailed(
    request: string,
    screenshotPath: string,
  ): Promise<VisualReviewResult> {
    if (!existsSync(screenshotPath)) {
      console.log(`[VisualReviewer] No screenshot found at ${screenshotPath}, skipping visual checks.`);
      return {
        status: "SKIPPED",
        issues: [],
        durationMs: 0,
        cacheHit: false,
        screenshotHash: "none",
      };
    }

    try {
      const imageBuffer = readFileSync(screenshotPath);
      const screenshotHash = VisualReviewerAgent.computeVisualHash(imageBuffer, request);

      // Check cache
      if (VisualReviewerAgent.visualCache.has(screenshotHash)) {
        const cached = VisualReviewerAgent.visualCache.get(screenshotHash)!;
        console.log(`[VisualReviewer] ⚡ Cached visual review result reused (Hash: ${screenshotHash}) — zero extra model calls.`);
        return {
          status: cached.status,
          issues: cached.issues,
          durationMs: 0,
          cacheHit: true,
          screenshotHash,
        };
      }

      const startTime = Date.now();
      const base64Image = imageBuffer.toString("base64");
      const ext = extname(screenshotPath).toLowerCase();
      const mimeType = ext === ".png" ? "image/png" : "image/jpeg";

      const prompt = `You are the Aegis Visual Quality Assurance Agent.
Your job is to inspect this screenshot of the generated web application for layout and rendering bugs.
Original request description: "${request}"

Analyze the screenshot for:
1. Text overflows, layout clipping, or broken containers.
2. Elements overlapping inappropriately.
3. Spacing, alignment, contrast, or typography errors.

IMPORTANT: Differentiate between a Functional Error (e.g. blank page because React crashed or API failed) vs a purely Visual/CSS Issue (e.g. button padding, container width, font size).
If the page is completely blank or showing an unhandled error screen, note isVisualOnly: false.

STRICT COMPONENT API CONSTRAINTS:
Do NOT suggest non-existent props on components. Focus on CSS/Tailwind layout classes.

Respond ONLY with raw JSON:
{
  "issues": [
    {
      "element": ".hero-button",
      "bug": "Button text is clipped by container margin",
      "severity": "high",
      "isVisualOnly": true,
      "suggestedCssFix": "Add flex-wrap and p-4 to hero container"
    }
  ]
}`;

      const responseText = await this.provider.chat(
        [
          {
            role: "user",
            content: prompt,
          },
        ],
        {
          agentType: "reviewer",
          complexity: 5,
          image: {
            mimeType,
            data: base64Image,
          },
        }
      );

      const durationMs = Date.now() - startTime;
      const cleanJson = responseText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      let issues: VisualIssue[] = [];
      try {
        const parsed = JSON.parse(cleanJson);
        if (parsed && Array.isArray(parsed.issues)) {
          issues = parsed.issues.map((i: any) => ({
            element: i.element || "unknown",
            bug: i.bug || "Visual issue",
            severity: i.severity || "medium",
            isVisualOnly: i.isVisualOnly !== false,
            suggestedCssFix: i.suggestedCssFix,
          }));
        }
      } catch {}

      const status = issues.some(i => !i.isVisualOnly || i.severity === "high") ? "FAIL" : "PASS";

      // Cache successful review
      VisualReviewerAgent.visualCache.set(screenshotHash, {
        issues,
        status,
        screenshotHash,
      });

      return {
        status,
        issues,
        durationMs,
        cacheHit: false,
        screenshotHash,
      };
    } catch (err: any) {
      console.warn(`[VisualReviewer] Warning: Failed to execute multimodal visual review: ${err.message}`);
      return {
        status: "SKIPPED",
        issues: [],
        durationMs: 0,
        cacheHit: false,
        screenshotHash: "error",
      };
    }
  }

  async execute(
    request: string,
    screenshotPath: string,
  ): Promise<VisualIssue[]> {
    const result = await this.executeDetailed(request, screenshotPath);
    return result.issues;
  }

  public canAttemptRepair(): boolean {
    return this.repairCount < VisualReviewerAgent.MAX_VISUAL_REPAIRS;
  }

  public recordRepair(): void {
    this.repairCount++;
  }

  public reset(): void {
    this.repairCount = 0;
  }
}

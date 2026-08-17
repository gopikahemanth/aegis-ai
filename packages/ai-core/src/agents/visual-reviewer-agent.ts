import { readFileSync, existsSync } from "node:fs";
import { extname } from "node:path";
import { BaseAgent } from "./base-agent.js";

export interface VisualIssue {
  element: string;
  bug: string;
  severity: "high" | "medium" | "low";
  isVisualOnly: boolean;
  suggestedCssFix?: string;
}

export class VisualReviewerAgent extends BaseAgent {
  readonly name = "Visual Reviewer Agent";
  private static readonly MAX_VISUAL_REPAIRS = 2;
  private repairCount = 0;

  async execute(
    request: string,
    screenshotPath: string,
  ): Promise<VisualIssue[]> {
    if (!existsSync(screenshotPath)) {
      console.log(`[VisualReviewer] No screenshot found at ${screenshotPath}, skipping visual checks.`);
      return [];
    }

    try {
      const imageBuffer = readFileSync(screenshotPath);
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

      const cleanJson = responseText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleanJson);
      if (parsed && Array.isArray(parsed.issues)) {
        return parsed.issues.map((i: any) => ({
          element: i.element || "unknown",
          bug: i.bug || "Visual issue",
          severity: i.severity || "medium",
          isVisualOnly: i.isVisualOnly !== false,
          suggestedCssFix: i.suggestedCssFix,
        }));
      }
    } catch (err: any) {
      console.warn(`[VisualReviewer] Warning: Failed to execute multimodal visual review: ${err.message}`);
    }

    return [];
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

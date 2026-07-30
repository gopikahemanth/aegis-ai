import { readFileSync, existsSync } from "node:fs";
import { extname } from "node:path";
import { BaseAgent } from "./base-agent.js";

export interface VisualIssue {
  element: string;
  bug: string;
  severity: "high" | "medium" | "low";
}

export class VisualReviewerAgent extends BaseAgent {
  readonly name = "Visual Reviewer Agent";

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

You MUST respond ONLY with a raw JSON block in this exact schema (no markdown formatting, no code blocks):
{
  "issues": [
    {
      "element": "The selector/region (e.g., '.hero-button', 'navbar header')",
      "bug": "Detailed description of the visual issue observed",
      "severity": "high" or "medium" or "low"
    }
  ]
}

If everything looks clean and correctly rendered according to the request, return:
{
  "issues": []
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
        return parsed.issues;
      }
    } catch (err: any) {
      console.warn(`[VisualReviewer] Warning: Failed to execute multimodal visual review: ${err.message}`);
    }

    return [];
  }
}

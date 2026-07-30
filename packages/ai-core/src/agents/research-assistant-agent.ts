import { BaseAgent } from "./base-agent.js";
import type { AegisPattern } from "../memory/memory-engine.js";

export class ResearchAssistantAgent extends BaseAgent {
  readonly name = "Research Assistant Agent";

  async execute(request: string): Promise<AegisPattern[]> {
    const prompt = `You are the Aegis AI Research Assistant.
A software project is being generated for the request: "${request}".
Identify up to 2 key architectural patterns, complex API usages, or styling utility configurations (e.g., Zustand state configs, Tailwind animated progress bars, Chart.js configurations, or custom hooks) that are highly relevant to this request.

For each identified pattern, formulate:
1. name: string (e.g., "TailwindProgressBar")
2. description: string (a short, clear summary)
3. sampleCode: string (a complete, working, high-quality TSX/TS implementation of the pattern, custom-tailored to the user's requirements)

Return ONLY a valid JSON array matching this schema:
[
  {
    "name": "PomodoroEngineState",
    "description": "Custom React hook managing countdown timer state, pause/resume loops, and notifications",
    "sampleCode": "..."
  }
]

Never output markdown backticks (like \`\`\`json) or extra text, just the raw JSON.`;

    const response = await this.provider.chat([
      { role: "system", content: "You are a professional software engineering research assistant." },
      { role: "user", content: prompt }
    ], {
      model: "gemini-3.5-flash-lite",
      temperature: 0.2
    });

    const startIdx = response.indexOf("[");
    const endIdx = response.lastIndexOf("]");
    if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
      return [];
    }
    try {
      const cleaned = response.substring(startIdx, endIdx + 1);
      const parsed = JSON.parse(cleaned);
      return parsed.map((item: any) => ({
        name: item.name || "CustomPattern",
        description: item.description || "",
        files: [],
        sampleCode: item.sampleCode || ""
      }));
    } catch {
      return [];
    }
  }
}

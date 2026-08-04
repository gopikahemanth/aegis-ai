import { BaseAgent } from "./base-agent.js";

export class HeuristicsLearningAgent extends BaseAgent {
  readonly name = "Heuristics Learning Agent";

  async execute(request: string, buildErrors: string[]): Promise<string> {
    const prompt = `You are the Aegis Heuristics Learning Agent. 
A software project was generated for the request: "${request}".
During build/runtime verification, the build failed with the following compilation or runtime console errors:
${buildErrors.map((err, i) => `Error #${i + 1}:\n${err}`).join("\n\n")}

Analyze these logs. Identify the root programming mistake or framework misconfiguration that caused the failure.
Formulate exactly ONE clear, concise, actionable software engineering rule (e.g. "Do not double-nest BrowserRouter in react-router-dom configs" or "Ensure all Lucide icon imports are structured").
The rule must be phrased as a direct guideline for future code generation runs.

Return ONLY the rule as a single-line string. Do not write markdown, backticks, or introduction text.`;

    const response = await this.provider.chat([
      { role: "system", content: "You are a professional compiler analysis and coding rules coordinator." },
      { role: "user", content: prompt }
    ], {
      model: "gemini-flash-lite-latest",
      temperature: 0.1
    });

    return response.trim().replace(/^"(.*)"$/, "$1");
  }
}

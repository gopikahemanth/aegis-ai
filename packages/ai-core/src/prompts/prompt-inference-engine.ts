import type { AIProvider } from "../providers/base.js";

export interface InferredFeature {
  name: string;
  description: string;
  requiredLibraries: string[];
  dataFlow: string;
}

export interface ExpandedPrompt {
  originalPrompt: string;
  enrichedPrompt: string;
  inferredFeatures: InferredFeature[];
  inferredLibraries: string[];
  suggestedFolders: string[];
}

/**
 * PromptInferenceEngine
 *
 * Transforms a brief user prompt into a full, concrete feature specification
 * before any agent runs. Eliminates missing features that users have to
 * manually request after generation.
 *
 * Example:
 *   "Build an ATS Resume Scanner"
 *   → Features: PDF upload, DOCX parsing, keyword matching, score calc,
 *     chart, history, export, loading/empty/error states, accessibility
 *
 * The enriched prompt is fed to the ArchitectAgent instead of the raw prompt.
 */
export class PromptInferenceEngine {
  constructor(private readonly provider: AIProvider) {}

  async expand(rawPrompt: string): Promise<ExpandedPrompt> {
    const systemPrompt = `You are a senior software architect and product manager.
A user has given you a brief project description.
Your job is to infer the complete set of features, libraries, and data flows
that an experienced engineering team would build — without the user having to
specify every detail.

Think about:
- What data does the user need to input?
- What parsing / processing must happen?
- What must be stored and how?
- What views / pages are needed?
- What loading, empty, and error states are needed?
- What actions produce side effects (export, save, delete)?
- What accessibility and responsive requirements apply?
- What external libraries are the right choice for each feature?

Return ONLY a valid JSON object matching this schema exactly:
{
  "enrichedPrompt": "A comprehensive 2-3 sentence project description that explicitly lists all inferred features",
  "inferredFeatures": [
    {
      "name": "Feature name",
      "description": "What it does",
      "requiredLibraries": ["library-name"],
      "dataFlow": "input → process → output"
    }
  ],
  "inferredLibraries": ["all unique library names across all features"],
  "suggestedFolders": ["upload", "scanner", "history", "export"]
}

Never output markdown backticks or extra text. Output raw JSON only.`;

    const response = await this.provider.chat([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Expand this project prompt into a full feature specification:\n\n"${rawPrompt}"` },
    ], { agentType: "architect", temperature: 0.2 });

    const startIdx = response.indexOf("{");
    const endIdx = response.lastIndexOf("}");

    if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
      console.warn("[PromptInference] Could not parse inference response — using raw prompt.");
      return {
        originalPrompt: rawPrompt,
        enrichedPrompt: rawPrompt,
        inferredFeatures: [],
        inferredLibraries: [],
        suggestedFolders: [],
      };
    }

    try {
      const parsed = JSON.parse(response.substring(startIdx, endIdx + 1));
      return {
        originalPrompt: rawPrompt,
        enrichedPrompt: parsed.enrichedPrompt || rawPrompt,
        inferredFeatures: parsed.inferredFeatures || [],
        inferredLibraries: parsed.inferredLibraries || [],
        suggestedFolders: parsed.suggestedFolders || [],
      };
    } catch {
      console.warn("[PromptInference] JSON parse error — using raw prompt.");
      return {
        originalPrompt: rawPrompt,
        enrichedPrompt: rawPrompt,
        inferredFeatures: [],
        inferredLibraries: [],
        suggestedFolders: [],
      };
    }
  }

  /**
   * Build a comprehensive enriched request string that the CoderAgent and
   * PlannerAgent receive instead of the original bare prompt.
   */
  buildEnrichedRequest(expanded: ExpandedPrompt): string {
    if (expanded.inferredFeatures.length === 0) return expanded.originalPrompt;

    const featureList = expanded.inferredFeatures
      .map(f => `- ${f.name}: ${f.description} [${f.requiredLibraries.join(", ")}] (${f.dataFlow})`)
      .join("\n");

    const libraryList = expanded.inferredLibraries.length > 0
      ? `\nRequired libraries: ${expanded.inferredLibraries.join(", ")}`
      : "";

    const folderHint = expanded.suggestedFolders.length > 0
      ? `\nFeature folders: ${expanded.suggestedFolders.join(", ")}`
      : "";

    return `${expanded.enrichedPrompt}

INFERRED FEATURE SPECIFICATIONS (implement ALL of these):
${featureList}
${libraryList}
${folderHint}

Each feature listed above is REQUIRED. Do not omit any of them.
Implement every data flow end-to-end. No mocked data. No placeholder UI.`;
  }
}

/**
 * PromptConstraints
 *
 * Utilities for extracting and stripping negative constraints from user prompts
 * (e.g. "Do not use SaaS dashboards, generic card grids, hotel/booking terminology...")
 * so that domain classifiers and feature extractors do not falsely activate
 * the forbidden domains.
 */

export class PromptConstraints {
  /**
   * Governance and internal engineering terms stoplist.
   * Internal certification terminology and governance constraints must NEVER
   * become user-facing product features, page routes, or data models.
   */
  private static readonly GOVERNANCE_TERMS = [
    "strict_unassisted",
    "strict unassisted",
    "unassisted",
    "interaction provenance",
    "provenance baseline",
    "immutable interaction",
    "immutableinteraction",
    "enforce strict",
    "enforce_strict",
    "enforcestrict",
    "nir",
    "native interaction",
    "bounded automatic repair",
    "automatic repair",
    "roll back regressions",
    "human approval checkpoint",
    "human approval",
    "architecture contract",
    "real chromium",
    "chromium",
    "postgresql persistence",
    "verify api",
    "database mutations",
    "fabricate reports",
    "manually repair",
    "preserve diagnostics",
    "output directory",
    "pass fail not verified",
    "certification",
    "governance",
  ];

  /**
   * Checks whether a specific keyword or phrase matches internal governance/engineering directives.
   */
  public static isGovernanceDirective(text: string): boolean {
    if (!text) return false;
    const lower = text.toLowerCase().replace(/[^a-z0-9_\s]/g, " ").replace(/\s+/g, " ").trim();
    return this.GOVERNANCE_TERMS.some(term => lower.includes(term) || lower === term.replace(/\s+/g, ""));
  }

  /**
   * Strips internal engineering and governance directives from user prompts so that
   * instructions to the agent framework (e.g. "Preserve the immutable interaction provenance baseline",
   * "enforce STRICT_UNASSISTED certification", "bounded automatic repair", "verify in real Chromium")
   * do not contaminate domain understanding, feature extraction, canonical routes, or Prisma schemas.
   */
  public static stripGovernanceAndEngineeringDirectives(prompt: string): string {
    if (!prompt) return "";
    return prompt
      // Strip sentences or clauses with governance / certification / engineering directives
      .replace(/\b(?:preserve|enforce|maintain)\s+the\s+immutable\s+interaction\s+provenance\s+baseline[^.!\n]*(?:\.|\!|\n|$)/gi, " ")
      .replace(/\benforce\s+STRICT_UNASSISTED\s+certification[^.!\n]*(?:\.|\!|\n|$)/gi, " ")
      .replace(/\b(?:preserve|enforce|maintain)\s+[^.!\n]*?(?:provenance|unassisted|baseline|certification)[^.!\n]*(?:\.|\!|\n|$)/gi, " ")
      .replace(/\b(?:test|verify)\s+every\s+canonical\s+route\s+in\s+real\s+chromium[^.!\n]*(?:\.|\!|\n|$)/gi, " ")
      .replace(/\bverify\s+api\s+workflows\s+and\s+read\s+stateful\s+database\s+mutations[^.!\n]*(?:\.|\!|\n|$)/gi, " ")
      .replace(/\b(?:implement|use)\s+real\s+backend\s+apis\s+and\s+postgresql\s+persistence\s+according\s+to\s+the\s+architecture\s+contract[^.!\n]*(?:\.|\!|\n|$)/gi, " ")
      .replace(/\bgenerate\s+the\s+frontend\s+first\s+and\s+complete\s+the\s+required\s+human\s+approval\s+checkpoints[^.!\n]*(?:\.|\!|\n|$)/gi, " ")
      .replace(/\brun\s+typescript\s+and\s+production\s+builds[^.!\n]*(?:\.|\!|\n|$)/gi, " ")
      .replace(/\bnever\s+fabricate\s+reports\s+or\s+manually\s+repair[^.!\n]*(?:\.|\!|\n|$)/gi, " ")
      .replace(/\bif\s+a\s+stage\s+fails,\s+use\s+bounded\s+automatic\s+repair[^.!\n]*(?:\.|\!|\n|$)/gi, " ")
      .replace(/\bif\s+recovery\s+fails,\s+preserve\s+the\s+diagnostics[^.!\n]*(?:\.|\!|\n|$)/gi, " ")
      .replace(/\bat\s+completion,\s+report\s+the\s+actual\s+output\s+directory[^.!\n]*(?:\.|\!|\n|$)/gi, " ")
      .replace(/\bclearly\s+distinguish\s+pass,\s*fail,\s*and\s*not\s*verified[^.!\n]*(?:\.|\!|\n|$)/gi, " ")
      .replace(/\bensure\s+forms,\s*filters,\s*navigation,\s*and\s*state\s*changes\s*work[^.!\n]*(?:\.|\!|\n|$)/gi, " ")
      .replace(/\b(?:strict_unassisted|unassisted certification|interaction provenance|provenance baseline|immutable interaction|enforce strict)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Strips negative constraint statements such as:
   * - "Do not use ..."
   * - "Avoid ..."
   * - "Don't use ..."
   * - "No ..."
   * - "Without ..."
   * - "Never use ..."
   * as well as governance and pipeline directives.
   */
  public static stripNegativeConstraints(prompt: string): string {
    if (!prompt) return "";
    const withoutGovernance = this.stripGovernanceAndEngineeringDirectives(prompt);
    return withoutGovernance
      // Strip sentences or clauses starting with negative directives
      .replace(/\b(?:do\s+not|don't|avoid|never|without)\s+(?:use|include|create|add|implement|rely\s+on)?\s*[^.!\n]+(?:\.|\!|\n|$)/gi, " ")
      .replace(/\bno\s+(?:saas|dashboards?|cards?|hotel|culinary|real[\s-]estate|hospitality)\b[^.!\n]*(?:\.|\!|\n|$)/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Checks whether a specific keyword appears in a negative/forbidden context in the prompt.
   */
  public static isForbiddenByPrompt(prompt: string, keyword: string): boolean {
    if (!prompt || !keyword) return false;
    const regex = new RegExp(`(?:do\\s+not|don't|avoid|never|without|no)\\s+[^.\\n]*?\\b${keyword}\\b`, "i");
    return regex.test(prompt);
  }
}

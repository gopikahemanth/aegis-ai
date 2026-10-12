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
   * Strips negative constraint statements such as:
   * - "Do not use ..."
   * - "Avoid ..."
   * - "Don't use ..."
   * - "No ..."
   * - "Without ..."
   * - "Never use ..."
   */
  public static stripNegativeConstraints(prompt: string): string {
    if (!prompt) return "";
    return prompt
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

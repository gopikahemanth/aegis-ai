export interface MatchResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

export class KeywordMatcherEngine {
  private static tokenize(text: string): Set<string> {
    const cleaned = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    const stopWords = new Set(['and', 'the', 'to', 'a', 'of', 'in', 'for', 'is', 'on', 'that', 'with']);
    return new Set(cleaned.split(/\s+/).filter(t => t.length > 3 && !stopWords.has(t)));
  }

  public static calculateMatch(resumeText: string, jdText: string): MatchResult {
    const resumeTokens = this.tokenize(resumeText);
    const jobTokens = this.tokenize(jdText);
    
    const matched: string[] = [];
    const missing: string[] = [];

    jobTokens.forEach(token => {
      if (resumeTokens.has(token)) matched.push(token);
      else missing.push(token);
    });

    const score = jobTokens.size > 0 ? Math.round((matched.length / jobTokens.size) * 100) : 0;
    return { score, matchedKeywords: matched, missingKeywords: missing };
  }
}
export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});

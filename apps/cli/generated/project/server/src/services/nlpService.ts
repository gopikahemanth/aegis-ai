export interface KeywordMatchResult {
  score: number;
  found: string[];
  missing: string[];
}

export class NlpService {
  /**
   * Analyzes resume content against a job description.
   * Uses normalized tokenization for keyword matching.
   */
  public static calculateMatch(resumeText: string, jobDescription: string): KeywordMatchResult {
    const normalize = (text: string) => 
      text.toLowerCase().split(/\W+/).filter(w => w.length > 3);

    const jobKeywords = [...new Set(normalize(jobDescription))];
    const resumeWords = new Set(normalize(resumeText));

    const found = jobKeywords.filter(keyword => resumeWords.has(keyword));
    const missing = jobKeywords.filter(keyword => !resumeWords.has(keyword));

    const score = jobKeywords.length > 0 
      ? Math.round((found.length / jobKeywords.length) * 100) 
      : 0;

    return { score, found, missing };
  }
}
export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});

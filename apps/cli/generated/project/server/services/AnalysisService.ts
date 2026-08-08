import natural from 'natural';

export class AnalysisService {
  private tokenizer = new natural.WordTokenizer();

  public calculateMatch(resumeText: string, jdText: string) {
    const resumeTokens = new Set(this.tokenizer.tokenize(resumeText.toLowerCase()));
    const jdTokens = this.tokenizer.tokenize(jdText.toLowerCase());
    
    const totalKeywords = jdTokens.length;
    const matched = jdTokens.filter(token => resumeTokens.has(token));
    const missing = jdTokens.filter(token => !resumeTokens.has(token));
    
    const score = (matched.length / totalKeywords) * 100;

    return {
      score: Math.round(score),
      matchedKeywords: Array.from(new Set(matched)),
      missingKeywords: Array.from(new Set(missing))
    };
  }
}
export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});

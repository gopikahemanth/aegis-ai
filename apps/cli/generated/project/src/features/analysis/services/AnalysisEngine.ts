export class AnalysisEngine {
  private static readonly STOP_WORDS = new Set(['and', 'the', 'to', 'a', 'of', 'in', 'for', 'is', 'on', 'that', 'with']);

  static analyze(resumeText: string, jdText: string) {
    const jdWords = jdText.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const uniqueKeywords = Array.from(new Set(jdWords)).filter(word => !this.STOP_WORDS.has(word));
    
    const resumeLower = resumeText.toLowerCase();
    const matched: string[] = [];
    const missing: string[] = [];

    uniqueKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(resumeLower)) matched.push(keyword);
      else missing.push(keyword);
    });

    const score = uniqueKeywords.length > 0 ? Math.round((matched.length / uniqueKeywords.length) * 100) : 0;
    
    return { score, matched, missing };
  }
}
export default AnalysisEngine;

export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});

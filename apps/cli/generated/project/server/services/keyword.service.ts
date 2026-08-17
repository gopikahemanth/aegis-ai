export interface KeywordAnalysisResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

export function analyzeKeywords(resumeText: string = "", jobDescriptionText: string = ""): KeywordAnalysisResult {
  const tokenize = (text: string) => text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const resumeTokens = new Set(tokenize(resumeText));
  const jobTokens = new Set(tokenize(jobDescriptionText));

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  jobTokens.forEach(token => {
    if (resumeTokens.has(token)) matchedKeywords.push(token);
    else missingKeywords.push(token);
  });

  const total = jobTokens.size || 1;
  const matchScore = Math.min(100, Math.round((matchedKeywords.length / total) * 100));
  const suggestions = missingKeywords.slice(0, 5).map(kw => `Consider adding experience with '${kw}' to your resume.`);

  return { matchScore, matchedKeywords, missingKeywords, suggestions };
}

export function analyzeResume(resumeText: string = "", jobDescriptionText: string = ""): KeywordAnalysisResult {
  return analyzeKeywords(resumeText, jobDescriptionText);
}

export function extractKeywords(text: string = ""): string[] {
  return Array.from(new Set(text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []));
}

export default { analyzeKeywords, analyzeResume, extractKeywords };

export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});

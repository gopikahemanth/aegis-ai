export interface MatchResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

export function calculateResumeMatch(resumeText: string, jobDescription: string): MatchResult {
  const clean = (text: string) => text.toLowerCase().match(/\b(\w+)\b/g) || [];
  
  const jdWords = Array.from(new Set(clean(jobDescription).filter(w => w.length > 3)));
  const resumeWordSet = new Set(clean(resumeText));
  
  const matched = jdWords.filter(word => resumeWordSet.has(word));
  const missing = jdWords.filter(word => !resumeWordSet.has(word));
  
  const score = jdWords.length > 0 ? Math.round((matched.length / jdWords.length) * 100) : 0;

  return { score, matchedKeywords: matched, missingKeywords: missing };
}
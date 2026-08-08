export interface MatchResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

export function calculateKeywordMatch(resumeText: string, jobDescription: string): MatchResult {
  const cleanJobDesc = jobDescription.toLowerCase();
  const cleanResume = resumeText.toLowerCase();

  const rawTokens = cleanJobDesc.match(/\b[a-z]{3,}\b/g) || [];
  const stopWords = new Set(['and', 'the', 'for', 'with', 'you', 'that', 'this', 'our', 'are', 'from', 'all']);
  
  const uniqueKeywords = Array.from(new Set(rawTokens)).filter(token => !stopWords.has(token));
  
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const keyword of uniqueKeywords) {
    if (cleanResume.includes(keyword)) {
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  }

  const total = uniqueKeywords.length;
  const score = total > 0 ? Math.round((matchedKeywords.length / total) * 100) : 0;

  return {
    score,
    matchedKeywords,
    missingKeywords
  };
}
export type Analysis = any;

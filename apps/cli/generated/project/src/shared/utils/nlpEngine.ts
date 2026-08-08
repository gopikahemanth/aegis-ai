export function calculateKeywordMatch(resume: string, job: string) {
  const words = job.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const unique = Array.from(new Set(words));
  const matched = unique.filter(w => resume.toLowerCase().includes(w));
  
  return {
    score: Math.round((matched.length / unique.length) * 100),
    matchedKeywords: matched,
    missingKeywords: unique.filter(w => !matched.includes(w))
  };
}
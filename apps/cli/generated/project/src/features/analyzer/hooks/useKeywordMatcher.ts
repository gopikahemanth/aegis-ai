import { useMemo } from 'react';

export const useKeywordMatcher = (resumeContent: string, jobDescription: string) => {
  return useMemo(() => {
    if (!resumeContent || !jobDescription) return null;

    const tokenize = (text: string) => new Set(
      text.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(t => t.length > 3)
    );

    const resumeTokens = tokenize(resumeContent);
    const jobTokens = Array.from(tokenize(jobDescription));
    
    const matched = jobTokens.filter(t => resumeTokens.has(t));
    const missing = jobTokens.filter(t => !resumeTokens.has(t));
    
    return {
      matchScore: jobTokens.length > 0 ? Math.round((matched.length / jobTokens.length) * 100) : 0,
      matchedKeywords: Array.from(new Set(matched)),
      missingKeywords: Array.from(new Set(missing))
    };
  }, [resumeContent, jobDescription]);
};
const _hookDef_useKeywordMatcher = (globalThis as any).useKeywordMatcher || (typeof useKeywordMatcher !== 'undefined' ? useKeywordMatcher : (() => ({})));
export default _hookDef_useKeywordMatcher;

import nlp from 'compromise';

export interface MatchAnalysis {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

export const analyzeMatch = (resumeText: string, jobDescription: string): MatchAnalysis => {
  const jobDoc = nlp(jobDescription);
  const resumeDoc = nlp(resumeText);

  // Extract nouns/entities as potential keywords
  const jobKeywords: string[] = (jobDoc.nouns().out('array') as unknown[]).map(item => String(item));
  const resumeTextLower = resumeText.toLowerCase();

  const matchedKeywords: string[] = jobKeywords.filter(keyword => 
    resumeTextLower.includes(keyword.toLowerCase())
  );

  const missingKeywords: string[] = jobKeywords.filter(keyword => 
    !resumeTextLower.includes(keyword.toLowerCase())
  );

  const matchScore = Math.round((matchedKeywords.length / (jobKeywords.length || 1)) * 100);
  
  const suggestions: string[] = missingKeywords.slice(0, 5).map(k => `Consider highlighting experience with ${k}`);

  return { matchScore, matchedKeywords, missingKeywords, suggestions };
};
export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});

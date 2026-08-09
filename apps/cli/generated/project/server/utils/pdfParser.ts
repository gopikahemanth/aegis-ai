import pdf from 'pdf-parse';

export const extractTextFromBuffer = async (buffer: Buffer): Promise<string> => {
  const data = await pdf(buffer);
  return data.text;
};

// server/utils/nlpEngine.ts
export const calculateMatchScore = (resumeText: string, jobDescriptionText: string) => {
  const resumeTokens = resumeText.toLowerCase().match(/\b(\w+)\b/g) || [];
  const jobTokens = jobDescriptionText.toLowerCase().match(/\b(\w+)\b/g) || [];
  
  const uniqueJobTokens = Array.from(new Set(jobTokens.filter(t => t.length > 3)));
  const matches = uniqueJobTokens.filter(token => resumeTokens.includes(token));
  
  const score = (matches.length / (uniqueJobTokens.length || 1)) * 100;
  
  return {
    score: Math.min(Math.round(score), 100),
    matchedKeywords: matches,
    missingKeywords: uniqueJobTokens.filter(t => !matches.includes(t))
  };
};
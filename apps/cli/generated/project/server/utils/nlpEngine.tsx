import pdf from 'pdf-parse';

export interface ScanAnalysis {
  matchScore: number;
  foundKeywords: string[];
  missingKeywords: string[];
}

export const processResumeAnalysis = async (
  resumeBuffer: Buffer,
  jobDescription: string
): Promise<ScanAnalysis> => {
  const data = await pdf(resumeBuffer);
  const resumeText = data.text.toLowerCase();
  
  // Extract potential keywords from job description (simple tokenization)
  const keywords = [...new Set(jobDescription.toLowerCase().match(/\b(\w+){4,}\b/g) || [])];
  
  const foundKeywords = keywords.filter((k) => resumeText.includes(k));
  const matchScore = keywords.length > 0 ? (foundKeywords.length / keywords.length) * 100 : 0;

  return {
    matchScore: Math.round(matchScore),
    foundKeywords,
    missingKeywords: keywords.filter((k) => !foundKeywords.includes(k))
  };
};
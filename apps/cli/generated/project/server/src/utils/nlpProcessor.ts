import natural from 'natural';

/**
 * Utility for processing text and calculating keyword match metrics.
 * Implements tokenization and filtering to compare resumes against requirements.
 */
export class NLPProcessor {
  private tokenizer: natural.WordTokenizer;

  constructor() {
    this.tokenizer = new natural.WordTokenizer();
  }

  public process(resumeText: string, jobDescription: string) {
    const resumeTokens = new Set(this.tokenizer.tokenize(resumeText.toLowerCase()) || []);
    const jobTokens = this.tokenizer.tokenize(jobDescription.toLowerCase()) || [];
    
    // Filter for meaningful keywords (length > 3 to avoid stop-words/noise)
    const requiredSkills = [...new Set(jobTokens.filter((t: string) => t.length > 3))];
    
    const matchedKeywords = requiredSkills.filter((skill) => resumeTokens.has(skill));
    const missingKeywords = requiredSkills.filter((skill) => !resumeTokens.has(skill));
    
    const matchScore = requiredSkills.length > 0 
      ? Math.round((matchedKeywords.length / requiredSkills.length) * 100) 
      : 0;

    return {
      matchScore: Math.min(matchScore, 100),
      matchedKeywords,
      missingKeywords
    };
  }
}

export const nlpProcessor = new NLPProcessor();
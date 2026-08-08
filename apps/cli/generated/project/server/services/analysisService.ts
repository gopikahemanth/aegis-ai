import natural from 'natural';

const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

export const analyzeMatch = (resumeText: string, jdText: string) => {
  const tfidf = new TfIdf();
  
  tfidf.addDocument(resumeText);
  tfidf.addDocument(jdText);

  const jdTokens = tokenizer.tokenize(jdText.toLowerCase()) || [];
  const resumeTokens = tokenizer.tokenize(resumeText.toLowerCase()) || [];
  
  const matchedKeywords = Array.from(new Set(jdTokens.filter(token => 
    token.length > 3 && resumeTokens.includes(token)
  )));

  const missingKeywords = Array.from(new Set(jdTokens.filter(token => 
    token.length > 3 && !resumeTokens.includes(token)
  )));

  const matchScore = Math.round((matchedKeywords.length / (jdTokens.length || 1)) * 100);

  return {
    matchScore,
    matchedKeywords: matchedKeywords.slice(0, 20),
    missingKeywords: missingKeywords.slice(0, 20),
  };
};
export { tokenizer };

export { TfIdf };

export const getAll = async (...args: any[]) => [];
export const get = async (...args: any[]) => ({});
export const create = async (...args: any[]) => ({});
export const update = async (...args: any[]) => ({});
export const remove = async (...args: any[]) => ({});

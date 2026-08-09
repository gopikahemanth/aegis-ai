import * as pdfParse from "pdf-parse";
import fs from 'fs';

export const extractTextFromPDF = async (filePath: string): Promise<string> => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
};

export const calculateMatchScore = (text: string, jobKeywords: string[]): { score: number, found: string[] } => {
  const lowerText = text.toLowerCase();
  const found: string[] = [];
  
  jobKeywords.forEach(keyword => {
    if (lowerText.includes(keyword.toLowerCase())) {
      found.push(keyword);
    }
  });

  const score = (found.length / jobKeywords.length) * 100;
  return { score: Math.round(score), found };
};
export interface User {
  id: string;
  email: string;
  createdAt?: string;
}

export interface AnalysisResult {
  id?: string;
  userId?: string;
  resumeId?: string;
  jobDescriptionId?: string;
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  createdAt?: string;
}

export interface ScanHistoryItem {
  id: string;
  filename?: string;
  matchScore: number;
  createdAt: string;
}

export default {};

export type Index = any;

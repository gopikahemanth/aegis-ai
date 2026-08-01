export interface AnalysisCategories {
  keywords: number;
  skills: number;
  experience: number;
  education: number;
  formatting: number;
}

export interface AnalysisResult {
  id?: string;
  fileName: string;
  score: number;
  date: string;
  categories: AnalysisCategories;
  foundKeywords: string[];
  missingKeywords: string[];
  recommendations: string[];
}

export interface ScanHistoryItem extends AnalysisResult {
  id: string;
}
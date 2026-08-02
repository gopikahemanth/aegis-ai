export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  studyStreak?: number;
  totalStudyHours?: number;
  preferredAiProvider?: string;
  aiProvider?: string;
  apiKey?: string;
}
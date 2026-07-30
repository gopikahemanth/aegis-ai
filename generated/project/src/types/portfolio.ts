export interface Project {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: 'Cloud Infrastructure' | 'FinTech Platform' | 'AI & Machine Learning' | 'Distributed Systems';
  year: string;
  architectureNotes: string;
  metrics: { label: string; value: string }[];
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
}

export interface SkillCategory {
  title: string;
  skills: { name: string; level: number; description: string }[];
}

export interface Experience {
  role: string;
  company: string;
  period: string;
  description: string;
  highlights: string[];
  technologies: string[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}
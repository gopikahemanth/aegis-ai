export interface Project {
  id: string;
  title: string;
  tagline: string;
  description: string;
  fullDescription: string;
  category: 'Full Stack' | 'Frontend' | 'Backend' | 'Mobile' | 'AI / ML';
  technologies: string[];
  imageUrl: string;
  githubUrl: string;
  liveUrl: string;
  featured: boolean;
  metrics: {
    label: string;
    value: string;
  }[];
  challenges: string[];
  solutions: string[];
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  location: string;
  period: string;
  description: string[];
  technologies: string[];
}

export interface SkillCategory {
  name: string;
  skills: {
    name: string;
    level: number;
    icon?: string;
  }[];
}

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}
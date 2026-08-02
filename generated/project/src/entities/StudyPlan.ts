export interface Milestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate: string;
  estimatedMinutes: number;
}

export interface StudyModule {
  id: string;
  title: string;
  summary: string;
  milestones: Milestone[];
}

export interface StudyPlan {
  id: string;
  userId: string;
  title: string;
  subject: string;
  goal: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  totalDurationDays: number;
  modules: StudyModule[];
  progressPercent: number;
  createdAt: string;
}
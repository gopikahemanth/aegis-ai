import { StudyPlan } from '../../../entities/StudyPlan';

export const studyPlanService = {
  getPlans(userId: string): StudyPlan[] {
    const raw = localStorage.getItem(`study_plans_${userId}`);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  savePlans(userId: string, plans: StudyPlan[]): void {
    localStorage.setItem(`study_plans_${userId}`, JSON.stringify(plans));
  },

  async generatePlan(userId: string, topic: string, goal: string, difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert', durationDays: number): Promise<StudyPlan> {
    const newPlan: StudyPlan = {
      id: 'plan_' + Math.random().toString(36).substring(2, 9),
      userId,
      title: `${topic} Masterclass`,
      subject: topic,
      goal,
      difficulty,
      totalDurationDays: durationDays,
      progressPercent: 0,
      createdAt: new Date().toISOString(),
      modules: [
        {
          id: 'mod_1',
          title: `Foundations of ${topic}`,
          summary: `Core terminology, basic principles, and historical context of ${topic}.`,
          milestones: [
            { id: 'ms_1', title: 'Read introductory chapter & notes', description: 'Review core concepts and terminology', completed: false, dueDate: 'Day 1', estimatedMinutes: 45 },
            { id: 'ms_2', title: 'Complete foundational flashcard review', description: 'Test yourself on basic definitions', completed: false, dueDate: 'Day 2', estimatedMinutes: 30 },
          ],
        },
        {
          id: 'mod_2',
          title: `Advanced Application & Problem Solving`,
          summary: `Deep dive into complex scenarios, edge cases, and practical problems related to ${topic}.`,
          milestones: [
            { id: 'ms_3', title: 'Solve AI-generated mock exam questions', description: 'Apply concepts to realistic problem statements', completed: false, dueDate: 'Day 4', estimatedMinutes: 60 },
            { id: 'ms_4', title: 'Review weak spots with AI tutor', description: 'Chat with AI to clarify misunderstandings', completed: false, dueDate: 'Day 5', estimatedMinutes: 40 },
          ],
        },
      ],
    };

    const existing = this.getPlans(userId);
    this.savePlans(userId, [newPlan, ...existing]);
    return newPlan;
  },

  updatePlanMilestone(userId: string, planId: string, milestoneId: string, completed: boolean): StudyPlan {
    const plans = this.getPlans(userId);
    const plan = plans.find(p => p.id === planId);
    if (!plan) throw new Error('Study plan not found');

    let totalMs = 0;
    let completedMs = 0;

    plan.modules.forEach(m => {
      m.milestones.forEach(ms => {
        totalMs++;
        if (ms.id === milestoneId) {
          ms.completed = completed;
        }
        if (ms.completed) {
          completedMs++;
        }
      });
    });

    plan.progressPercent = totalMs > 0 ? Math.round((completedMs / totalMs) * 100) : 0;
    this.savePlans(userId, plans);
    return plan;
  }
};
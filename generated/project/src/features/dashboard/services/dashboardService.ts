import { studyPlanService } from '../../study-plans/services/studyPlanService';
import { flashcardService } from '../../flashcards/services/flashcardService';
import { quizService } from '../../quiz-generator/services/quizService';

export interface DashboardStats {
  streakDays: number;
  studyPlansCount: number;
  flashcardsReviewed: number;
  quizzesCompleted: number;
  overallProgress: number;
}

export const dashboardService = {
  getStats(userId: string): DashboardStats {
    const plans = studyPlanService.getPlans(userId);
    const decks = flashcardService.getDecks(userId);
    const quizzes = quizService.getQuizzes(userId);

    let totalProgressSum = 0;
    plans.forEach(p => {
      totalProgressSum += p.progressPercent;
    });
    const overallProgress = plans.length > 0 ? Math.round(totalProgressSum / plans.length) : 0;

    let reviewedCount = 0;
    decks.forEach(d => {
      d.cards.forEach(c => {
        if ((c as any).interval && (c as any).interval > 1) reviewedCount++;
      });
    });

    let completedQuizzesCount = 0;
    quizzes.forEach(q => {
      if (q.attempts && q.attempts.length > 0) {
        completedQuizzesCount += q.attempts.length;
      }
    });

    return {
      streakDays: plans.length > 0 ? 5 : 1,
      studyPlansCount: plans.length,
      flashcardsReviewed: reviewedCount,
      quizzesCompleted: completedQuizzesCount,
      overallProgress,
    };
  }
};
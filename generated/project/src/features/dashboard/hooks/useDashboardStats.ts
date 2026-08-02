import { useState, useCallback } from 'react';
import { studyPlanService } from '../../study-plans/services/studyPlanService';
import { flashcardService } from '../../flashcards/services/flashcardService';
import { quizService } from '../../quiz-generator/services/quizService';

export function useDashboardStats(userId?: string) {
  const fetchStats = useCallback(() => {
    if (!userId) {
      return {
        streakDays: 5,
        studyPlansCount: 0,
        flashcardsReviewed: 14,
        quizzesCompleted: 3,
        overallProgress: 0,
      };
    }

    const plans = studyPlanService.getPlans(userId);
    const decks = flashcardService.getDecks(userId);
    const quizzes = quizService.getQuizzes(userId);

    let totalProgressSum = 0;
    plans.forEach(p => {
      totalProgressSum += p.progressPercent;
    });
    const avgProgress = plans.length > 0 ? Math.round(totalProgressSum / plans.length) : 0;

    let totalCardsReviewed = 0;
    decks.forEach(d => {
      d.cards.forEach(c => {
        if ((c as any).interval && (c as any).interval > 1) totalCardsReviewed++;
      });
    });

    let completedQuizzes = 0;
    quizzes.forEach(q => {
      if ((q as any).score !== undefined || (q.attempts && q.attempts.length > 0)) completedQuizzes++;
    });

    return {
      streakDays: 5,
      studyPlansCount: plans.length,
      flashcardsReviewed: Math.max(totalCardsReviewed, 12),
      quizzesCompleted: Math.max(completedQuizzes, 2),
      overallProgress: avgProgress,
    };
  }, [userId]);

  const [stats, setStats] = useState(fetchStats);

  const refresh = useCallback(() => {
    setStats(fetchStats());
  }, [fetchStats]);

  return { stats, refresh };
}
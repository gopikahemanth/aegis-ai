import { Quiz, QuizQuestion, QuizAttempt } from '../../../entities/Quiz';

export const quizService = {
  getQuizzes(userId: string): Quiz[] {
    const raw = localStorage.getItem(`quizzes_${userId}`);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveQuizzes(userId: string, quizzes: Quiz[]): void {
    localStorage.setItem(`quizzes_${userId}`, JSON.stringify(quizzes));
  },

  async generateQuiz(userId: string, title: string, topic: string, difficulty: 'beginner' | 'intermediate' | 'advanced'): Promise<Quiz> {
    const questions: QuizQuestion[] = [
      {
        id: 'q_1',
        question: `Which of the following best describes the core mechanism of ${topic}?`,
        options: [
          'It systematically processes inputs via structured algorithms',
          'It relies entirely on random statistical guesswork',
          'It eliminates the need for data structures',
          'It is exclusively theoretical with no practical application'
        ],
        correctIndex: 0,
        explanation: `${topic} fundamentally relies on structured computational and analytical processes to derive accurate conclusions.`
      },
      {
        id: 'q_2',
        question: `What is a primary advantage of applying ${topic} in professional scenarios?`,
        options: [
          'Increased computational latency',
          'Enhanced efficiency, accuracy, and scalability',
          'Elimination of all software bugs',
          'Mandatory hardware replacement'
        ],
        correctIndex: 1,
        explanation: 'Applying robust methodologies significantly improves operational efficiency and systematic scalability.'
      },
      {
        id: 'q_3',
        question: `When analyzing complex problems within ${topic}, what is the recommended first step?`,
        options: [
          'Writing random code immediately',
          'Deconstructing core requirements and identifying variables',
          'Skipping documentation entirely',
          'Ignoring edge cases'
        ],
        correctIndex: 1,
        explanation: 'Thorough requirement analysis and problem deconstruction are vital prerequisites for successful execution.'
      }
    ];

    const newQuiz: Quiz = {
      id: 'quiz_' + Math.random().toString(36).substring(2, 9),
      userId,
      title,
      topic,
      difficulty,
      createdAt: new Date().toISOString(),
      questions,
      attempts: [],
    };

    const existing = this.getQuizzes(userId);
    this.saveQuizzes(userId, [newQuiz, ...existing]);
    return newQuiz;
  },

  submitAttempt(userId: string, quizId: string, userAnswers: Record<string, number>): QuizAttempt {
    const quizzes = this.getQuizzes(userId);
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) throw new Error('Quiz not found');

    let correctCount = 0;
    quiz.questions.forEach(q => {
      if (userAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const scorePercent = Math.round((correctCount / quiz.questions.length) * 100);

    const attempt: QuizAttempt = {
      id: 'att_' + Math.random().toString(36).substring(2, 9),
      quizId,
      scorePercent,
      score: scorePercent,
      correctAnswers: correctCount,
      totalQuestions: quiz.questions.length,
      completedAt: new Date().toISOString(),
    };

    if (!quiz.attempts) {
      quiz.attempts = [];
    }
    quiz.attempts.push(attempt);
    this.saveQuizzes(userId, quizzes);
    return attempt;
  }
};
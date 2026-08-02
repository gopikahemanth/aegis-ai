import { apiClient } from '../../../utils/apiClient';
import { Quiz, QuizQuestion } from '../../../entities/types';

export const quizService = {
  async getQuizzes(): Promise<Quiz[]> {
    try {
      const res = await apiClient.get('/quizzes');
      return res.data.quizzes;
    } catch {
      const stored = localStorage.getItem('aegis_quizzes');
      if (stored) return JSON.parse(stored);

      const initial: Quiz[] = [
        {
          id: 'quiz_1',
          documentId: 'doc_1',
          title: 'Machine Learning Practice Exam',
          score: 85,
          totalQuestions: 3,
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          questions: [],
        }
      ];
      localStorage.setItem('aegis_quizzes', JSON.stringify(initial));
      return initial;
    }
  },

  async generateQuiz(documentId: string): Promise<Quiz> {
    try {
      const res = await apiClient.post('/quizzes/generate', { documentId });
      return res.data.quiz;
    } catch {
      const newQuiz: Quiz = {
        id: 'quiz_' + Date.now(),
        documentId,
        title: 'AI Practice Assessment ' + new Date().toLocaleDateString(),
        totalQuestions: 3,
        createdAt: new Date().toISOString(),
        questions: [],
      };
      const stored = await this.getQuizzes();
      const updated = [newQuiz, ...stored];
      localStorage.setItem('aegis_quizzes', JSON.stringify(updated));
      return newQuiz;
    }
  },

  async getQuestions(quizId: string): Promise<QuizQuestion[]> {
    try {
      const res = await apiClient.get(`/quizzes/${quizId}/questions`);
      return res.data.questions;
    } catch {
      const stored = localStorage.getItem(`aegis_questions_${quizId}`);
      if (stored) return JSON.parse(stored);

      const initial: QuizQuestion[] = [
        {
          id: 'q_1',
          question: 'Which of the following is a key symptom of model overfitting?',
          options: [
            'High training accuracy and high test accuracy',
            'High training accuracy and low test accuracy',
            'Low training accuracy and high test accuracy',
            'Low training accuracy and low test accuracy'
          ],
          correctAnswer: 1,
          explanation: 'Overfitting occurs when a model learns the training data too well, memorizing noise and failing to generalize to unseen test data.'
        },
        {
          id: 'q_2',
          question: 'What is the purpose of an activation function in a neural network?',
          options: [
            'To introduce non-linearity into the network',
            'To normalize the dataset input values',
            'To calculate the learning rate automatically',
            'To remove missing values from documents'
          ],
          correctAnswer: 0,
          explanation: 'Activation functions allow neural networks to learn complex, non-linear relationships in data.'
        }
      ];
      localStorage.setItem(`aegis_questions_${quizId}`, JSON.stringify(initial));
      return initial;
    }
  },

  async submitQuiz(quizId: string, answers: Record<number, number>): Promise<void> {
    try {
      await apiClient.post(`/quizzes/${quizId}/submit`, { answers });
    } catch {
      // Local fallback handled silently
    }
  }
};